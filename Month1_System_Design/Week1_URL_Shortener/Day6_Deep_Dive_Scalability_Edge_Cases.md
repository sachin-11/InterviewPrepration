# Day 6 — Deep Dive: Scalability & Edge Cases

Aaj hum production-level problems solve karenge.
Ye woh topics hain jo senior engineers se pooche jaate hain interviews mein.

---

## 1. Distributed ID Generation

### Problem Recap (Day 4 se):
```
Multiple App Servers hain → sab apna ID generate karte hain → collision!

Server 1: ID = 1, 2, 3...
Server 2: ID = 1, 2, 3...  ← SAME IDs = PROBLEM
```

---

### Solution A: Ticket Server (Flickr ka approach)

```
Ek dedicated "Ticket Server" sirf IDs generate karta hai.
Baaki sab servers us se ID maangte hain.

Flow:
  App Server 1 → "mujhe ek ID do" → Ticket Server → "lo: 10523"
  App Server 2 → "mujhe ek ID do" → Ticket Server → "lo: 10524"
  App Server 3 → "mujhe ek ID do" → Ticket Server → "lo: 10525"
```

DB mein auto_increment use karte hain:
```sql
-- Ticket Server DB
CREATE TABLE tickets (
  id          BIGINT NOT NULL AUTO_INCREMENT,
  stub        CHAR(1) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY stub (stub)
);

-- ID lene ke liye:
REPLACE INTO tickets (stub) VALUES ('a');
SELECT LAST_INSERT_ID();
```

```
Pros:
  + Simple implement karna
  + Sequential IDs (Base62 encode ke liye perfect)

Cons:
  - Single Point of Failure (Ticket Server down = poora system down)
  - Fix: 2 Ticket Servers (odd/even IDs)
    Server 1: 1, 3, 5, 7...  (auto_increment by 2, start 1)
    Server 2: 2, 4, 6, 8...  (auto_increment by 2, start 2)
```

---

### Solution B: Snowflake ID (Twitter ka approach) ⭐ Best

```
64-bit unique ID generate karo — koi central server nahi chahiye!

Bit structure:
┌─────┬──────────────────────────┬────────────────┬──────────────────┐
│  1  │        41 bits           │    10 bits     │    12 bits       │
│sign │      timestamp           │  machine id    │   sequence       │
└─────┴──────────────────────────┴────────────────┴──────────────────┘

Sign bit    : Always 0 (positive number)
Timestamp   : Milliseconds since custom epoch (Jan 1, 2024)
              41 bits → 2^41 ms = ~69 years tak kaam karega
Machine ID  : 10 bits → 2^10 = 1024 unique machines
Sequence    : 12 bits → 2^12 = 4096 IDs per millisecond per machine
```

Example:
```
Timestamp  = 1710234567890 ms
Machine ID = 5
Sequence   = 0

Snowflake ID = (timestamp << 22) | (machineId << 12) | sequence
             = very large unique number
             → Base62 encode → short code
```

```python
import time

EPOCH = 1704067200000  # Jan 1, 2024 in ms
machine_id = 5
sequence = 0
last_timestamp = -1

def generate_snowflake_id():
    global sequence, last_timestamp
    
    timestamp = int(time.time() * 1000) - EPOCH
    
    if timestamp == last_timestamp:
        sequence = (sequence + 1) & 4095  # 12 bits max
        if sequence == 0:
            # Same millisecond mein 4096 IDs ban gayi, wait karo
            while timestamp <= last_timestamp:
                timestamp = int(time.time() * 1000) - EPOCH
    else:
        sequence = 0
    
    last_timestamp = timestamp
    
    return (timestamp << 22) | (machine_id << 12) | sequence
```

```
Pros:
  + No central coordination
  + 4096 IDs/ms per machine (bahut fast)
  + Time-sorted (recent URLs ke IDs bade honge)
  + 69 years tak unique

Cons:
  - Clock skew problem (server ka clock peeche ho jaaye)
  - Thoda complex implement karna
```

---

### Solution C: UUID v4

```python
import uuid
short_code = str(uuid.uuid4()).replace('-', '')[:8]
# "a3f8b2c1"
```

```
Pros:  Simple, no coordination
Cons:  Random (not sequential), longer, not URL-friendly
```

---

### Comparison:

```
Method          Unique?   Scalable?   Sequential?   Complex?
──────────────  ────────  ──────────  ────────────  ────────
Ticket Server   Yes       No (SPOF)   Yes           Low
Snowflake       Yes       Yes         Yes           Medium
UUID            Yes       Yes         No            Low
```

---

## 2. Custom Short URLs (Vanity URLs)

### Kya hota hai?
```
Normal:  https://short.ly/a3b4c5   (system generated)
Vanity:  https://short.ly/myshop   (user ne choose kiya)
```

Real examples:
```
bit.ly/coca-cola-offer
short.ly/iphone16-launch
```

### Implementation:

```
Flow:
  User POST /shorten with custom_code = "myshop"
       ↓
  Check karo "myshop" already exist karta hai?
       ↓ exists
  Error: "This custom URL is already taken"
       ↓ nahi exists
  DB mein insert karo with short_code = "myshop"
  Redis mein store karo
  Return "https://short.ly/myshop"
```

```sql
-- DB check:
SELECT id FROM urls WHERE short_code = 'myshop';

-- Agar nahi mila toh insert:
INSERT INTO urls (short_code, original_url, user_id)
VALUES ('myshop', 'https://myshop.com', 123);
```

### Edge Cases:
```
1. Reserved words block karo:
   "api", "admin", "login", "static" → ye short codes nahi banne chahiye
   
   RESERVED = {"api", "admin", "login", "static", "help", "about"}
   if custom_code in RESERVED:
       return error "This URL is reserved"

2. Length limit:
   Min: 4 characters
   Max: 16 characters

3. Allowed characters only:
   Regex: ^[a-zA-Z0-9_-]+$
   (alphanumeric + underscore + hyphen)

4. Case sensitivity:
   "MyShop" aur "myshop" same hai ya alag?
   Recommendation: lowercase mein store karo (case-insensitive)
```

---

## 3. URL Expiry Cleanup

### Two-Layer Expiry System:

#### Layer 1: Redis TTL (Fast)
```
Jab URL create karo, Redis mein TTL set karo:

SET "abc123" "https://example.com" EX 604800
                                       ↑
                                   604800 sec = 7 days

Redis automatically 7 din baad delete kar deta hai.
Expired URL pe request aaye → Redis mein nahi milega → DB check hoga
```

#### Layer 2: DB Background Job (Cleanup)
```
Redis se delete hone ke baad bhi DB mein record rehta hai.
Ek background job regularly expired records clean karta hai.
```

```python
# Background cleanup job — har raat 2 baje chale
import schedule
import time
from datetime import datetime

def cleanup_expired_urls():
    """Expired URLs DB se delete karo"""
    deleted = db.execute("""
        DELETE FROM urls 
        WHERE expires_at IS NOT NULL 
        AND expires_at < NOW()
        AND is_active = TRUE
        LIMIT 10000
    """)
    print(f"Cleaned up {deleted} expired URLs at {datetime.now()}")

# Har raat 2 baje run karo
schedule.every().day.at("02:00").do(cleanup_expired_urls)

while True:
    schedule.run_pending()
    time.sleep(60)
```

### Expired URL pe Request Aaye toh:
```
GET /abc123
     ↓
Redis mein nahi (TTL expire ho gaya)
     ↓
DB check karo
     ↓
expires_at < NOW() → expired hai
     ↓
410 Gone response bhejo (nahi 404, kyunki pehle exist karta tha)

Response:
HTTP/1.1 410 Gone
{
  "error": "url_expired",
  "message": "This short URL has expired"
}
```

### Soft Delete vs Hard Delete:
```
Hard Delete: Record DB se permanently remove karo
  + Storage free hoti hai
  - Analytics data bhi chala jaata hai

Soft Delete: is_active = FALSE karo, record rakho
  + Analytics data preserve hota hai
  - Storage thodi zyada lagti hai
  
Recommendation: Soft delete karo, hard delete 90 days baad
```

---

## 4. Abuse Prevention: Rate Limiting

### Kyu Zaroori Hai?
```
Without rate limiting:
  - Koi bhi bot 1 second mein 10,000 URLs create kar sakta hai
  - DB spam ho jaayega
  - Legitimate users slow experience paayenge
  - DDoS attack possible
```

### Rate Limiting Strategy:

#### Per IP Rate Limiting:
```
Rule: Ek IP se max 10 URL create/minute

Redis mein counter store karo:
  Key:   "rate_limit:ip:192.168.1.1:2024031510"  (IP + minute)
  Value: request count
  TTL:   60 seconds
```

```python
def check_rate_limit(ip_address):
    import time
    
    # Current minute ka key
    minute = int(time.time() / 60)
    key = f"rate_limit:ip:{ip_address}:{minute}"
    
    # Atomic increment
    count = redis.incr(key)
    
    if count == 1:
        redis.expire(key, 60)  # First request pe TTL set karo
    
    if count > 10:  # 10 requests/minute limit
        return False, "Rate limit exceeded. Try after 1 minute."
    
    return True, None

# API mein use:
@app.route('/api/v1/shorten', methods=['POST'])
def shorten_url():
    ip = request.remote_addr
    allowed, message = check_rate_limit(ip)
    
    if not allowed:
        return {"error": message}, 429  # Too Many Requests
    
    # Normal processing...
```

#### Per User Rate Limiting (Authenticated):
```
Anonymous user:  10 URLs/minute,  100 URLs/day
Free user:       50 URLs/minute,  1000 URLs/day
Pro user:        500 URLs/minute, unlimited/day
```

#### Response Headers:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710234620
Retry-After: 45
```

### Additional Abuse Prevention:
```
1. URL Validation:
   - Malicious URLs block karo (phishing, malware)
   - Google Safe Browsing API se check karo

2. CAPTCHA:
   - Suspicious behavior pe CAPTCHA show karo

3. Blacklist:
   - Known spam IPs block karo
   - Tor exit nodes block karo (optional)
```

---

## 5. Analytics: Async Click Tracking via Kafka

### Problem with Synchronous Analytics:
```
User GET /abc123 karta hai
     ↓
Redirect karo (fast hona chahiye — 2ms)
     ↓
Analytics save karo DB mein (slow — 10ms extra)

Total: 12ms — user ko delay feel hoga
Agar analytics fail ho → redirect bhi fail ho jaayega?
```

### Solution: Async via Message Queue (Kafka)

```
User GET /abc123 karta hai
     ↓
App Server:
  1. Redis se original_url fetch karo
  2. Kafka mein click event publish karo (non-blocking, ~1ms)
  3. 302 Redirect karo (fast!)
     ↓
Kafka Consumer (alag service):
  1. Click event consume karo
  2. Analytics DB mein save karo
  3. click_count update karo
```

```
Architecture:

Client → App Server → Redis → 302 Redirect (2ms total)
              ↓
           Kafka Topic: "url-clicks"
              ↓
         Analytics Consumer
              ↓
         Analytics DB (ClickHouse / Cassandra)
```

### Kafka Event Structure:
```json
{
  "event_type": "url_click",
  "short_code": "abc123",
  "original_url": "https://example.com",
  "timestamp": "2024-03-15T10:30:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "country": "India",
  "device": "mobile",
  "referrer": "https://twitter.com"
}
```

### Analytics Consumer (Python):
```python
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'url-clicks',
    bootstrap_servers=['kafka:9092'],
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

for message in consumer:
    event = message.value
    
    # Analytics DB mein save karo
    analytics_db.execute("""
        INSERT INTO url_clicks 
        (short_code, clicked_at, country, device, ip_address)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        event['short_code'],
        event['timestamp'],
        event['country'],
        event['device'],
        event['ip_address']
    ))
    
    # click_count update karo (batch mein better hai)
    redis.incr(f"clicks:{event['short_code']}")
```

### Kafka ke Fayde:
```
1. Decoupling:
   Analytics service down ho → redirect still works
   
2. Buffering:
   Traffic spike mein Kafka buffer karta hai
   Consumer apni speed se process karta hai

3. Replay:
   Koi bug tha analytics mein → purane events dobara process karo

4. Multiple Consumers:
   Same event → Analytics Consumer + Fraud Detection Consumer
```

---

## 6. Complete Production Architecture

```
                    ┌──────────────┐
                    │    Client    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼──┐   ┌─────▼──┐  ┌─────▼──┐
        │ App S1 │   │ App S2 │  │ App S3 │
        └─────┬──┘   └─────┬──┘  └─────┬──┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼──┐   ┌─────▼──┐  ┌─────▼──────┐
        │ Redis  │   │Primary │  │   Kafka    │
        │ Cache  │   │  DB    │  │  (events)  │
        └────────┘   └─────┬──┘  └─────┬──────┘
                           │            │
                    ┌──────▼──┐  ┌──────▼──────┐
                    │  Read   │  │  Analytics  │
                    │Replicas │  │  Consumer   │
                    └─────────┘  └──────┬──────┘
                                        │
                                 ┌──────▼──────┐
                                 │ Analytics DB│
                                 └─────────────┘
```

---

## 7. Practice Task (Aaj Karo)

1. Snowflake ID ka structure paper pe draw karo (41+10+12 bits)

2. Ye scenario solve karo:
   ```
   Ek user 1 minute mein 500 POST /shorten requests bhejta hai.
   Rate limit 10/minute hai.
   Kya hoga 11th request pe?
   Redis mein kya store hoga?
   ```

3. Kafka vs Direct DB write — kab kya use karoge? 2 points each.

---

Kal Day 7 — Revision + Mock Practice.
Poora URL Shortener ek blank paper pe draw karo aur explain karo.
