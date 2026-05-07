# Day 3 — API Design & Database Schema

Aaj hum define karenge ki system ke saath kaise baat karein (API)
aur data kahan aur kaise store karein (Database Schema).

---

## 1. REST API Basics (Quick Recap)

REST = Representational State Transfer
HTTP methods use karta hai:

```
GET     → Data fetch karo (read)
POST    → Naya data create karo (write)
PUT     → Existing data update karo
DELETE  → Data delete karo
```

Response mein HTTP status codes aate hain:
```
200 OK              → Success
201 Created         → Naya resource ban gaya
301 Moved Permanently → Permanent redirect
302 Found           → Temporary redirect
400 Bad Request     → Client ne galat data bheja
404 Not Found       → Resource nahi mila
429 Too Many Req    → Rate limit exceed
500 Server Error    → Server side problem
```

---

## 2. URL Shortener ke APIs

### API 1: Short URL Create Karna

```
POST /api/v1/shorten
```

Request Body:
```json
{
  "original_url": "https://www.example.com/very/long/url/here",
  "custom_code": "mylink",        // optional
  "expires_at": "2025-12-31"      // optional
}
```

Response (201 Created):
```json
{
  "short_url": "https://short.ly/abc123",
  "short_code": "abc123",
  "original_url": "https://www.example.com/very/long/url/here",
  "created_at": "2024-03-15T10:30:00Z",
  "expires_at": "2025-12-31T00:00:00Z"
}
```

Error Response (400 Bad Request):
```json
{
  "error": "invalid_url",
  "message": "The provided URL is not valid"
}
```

---

### API 2: Redirect Karna

```
GET /{shortCode}
```

Example:
```
GET /abc123
```

Response (302 Found):
```
HTTP/1.1 302 Found
Location: https://www.example.com/very/long/url/here
```

Browser automatically original URL pe chala jaata hai.

Error Response (404 Not Found):
```json
{
  "error": "not_found",
  "message": "Short URL does not exist or has expired"
}
```

---

### API 3: URL Info Dekhna (Optional)

```
GET /api/v1/urls/{shortCode}
```

Response (200 OK):
```json
{
  "short_code": "abc123",
  "original_url": "https://www.example.com/very/long/url/here",
  "created_at": "2024-03-15T10:30:00Z",
  "expires_at": "2025-12-31T00:00:00Z",
  "click_count": 1523
}
```

---

### API 4: URL Delete Karna (Optional)

```
DELETE /api/v1/urls/{shortCode}
```

Response (200 OK):
```json
{
  "message": "URL deleted successfully"
}
```

---

### API 5: Analytics Dekhna (Optional)

```
GET /api/v1/urls/{shortCode}/analytics
```

Response (200 OK):
```json
{
  "short_code": "abc123",
  "total_clicks": 1523,
  "clicks_today": 45,
  "top_countries": ["India", "USA", "UK"],
  "top_devices": ["mobile", "desktop"]
}
```

---

## 3. API Design Best Practices

```
1. Versioning karo        → /api/v1/  (future changes ke liye)
2. Nouns use karo URLs mein → /urls  na ki /createUrl
3. Plural use karo        → /urls  na ki /url
4. HTTP methods sahi use karo → GET sirf read ke liye
5. Meaningful errors do   → sirf 500 mat do, reason batao
6. Authentication         → API Key ya JWT token header mein
```

Authentication header example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Database Schema

### Main Table: urls

```sql
CREATE TABLE urls (
  id            BIGINT        PRIMARY KEY AUTO_INCREMENT,
  short_code    VARCHAR(10)   NOT NULL UNIQUE,
  original_url  TEXT          NOT NULL,
  user_id       BIGINT,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP     NULL,
  is_active     BOOLEAN       DEFAULT TRUE,
  click_count   BIGINT        DEFAULT 0
);
```

### Field by Field Explanation:

```
id           → Unique identifier, auto increment (1, 2, 3...)
               BIGINT kyunki billions of records honge

short_code   → "abc123" — ye woh part hai jo URL mein dikhta hai
               UNIQUE constraint — duplicate nahi hona chahiye
               VARCHAR(10) — 6-7 characters kaafi hain

original_url → Full long URL store hoti hai
               TEXT use karo kyunki URLs bahut long ho sakti hain

user_id      → Kaun sa user ne banaya (NULL agar anonymous)
               Foreign key to users table

created_at   → Kab bana — auto set hota hai

expires_at   → Kab expire hoga — NULL means kabhi nahi

is_active    → Soft delete ke liye (record delete nahi karte, sirf false karte hain)

click_count  → Kitni baar click hua (analytics ke liye)
```

---

### Users Table (Optional):

```sql
CREATE TABLE users (
  id            BIGINT        PRIMARY KEY AUTO_INCREMENT,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  api_key       VARCHAR(64)   UNIQUE
);
```

---

### Analytics Table (Optional, separate):

```sql
CREATE TABLE url_clicks (
  id          BIGINT    PRIMARY KEY AUTO_INCREMENT,
  url_id      BIGINT    NOT NULL,
  clicked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  country     VARCHAR(50),
  device      VARCHAR(50),
  ip_address  VARCHAR(45)
);
```

Analytics alag table mein kyunki:
- Main urls table slow nahi honi chahiye
- Click data bahut zyada hoga (billions of rows)
- Alag scale kar sakte hain

---

### Indexes (Performance ke liye):

```sql
-- short_code pe index — ye sabse zyada query hoga
CREATE INDEX idx_short_code ON urls(short_code);

-- user_id pe index — user ke saare URLs dhundne ke liye
CREATE INDEX idx_user_id ON urls(user_id);

-- expires_at pe index — expired URLs cleanup ke liye
CREATE INDEX idx_expires_at ON urls(expires_at);
```

Index kya karta hai:
```
Without index: DB poori table scan karta hai (slow)
With index:    DB seedha record pe jump karta hai (fast)

10 million records mein:
  Without index: ~10 seconds
  With index:    ~1 millisecond
```

---

## 5. SQL vs NoSQL — Kab Kya Use Karein

### SQL (Relational DB) — MySQL, PostgreSQL

```
Kab use karo:
  ✓ Data structured hai (fixed schema)
  ✓ Relationships hain (users → urls)
  ✓ ACID transactions chahiye
  ✓ Complex queries chahiye (JOIN, GROUP BY)
  ✓ Data consistency critical hai

Examples: Banking, E-commerce orders, User accounts
```

### NoSQL — MongoDB, Cassandra, DynamoDB

```
Kab use karo:
  ✓ Data unstructured ya semi-structured hai
  ✓ Horizontal scaling chahiye (billions of records)
  ✓ High write throughput chahiye
  ✓ Schema flexible hona chahiye
  ✓ Simple key-value lookups hain

Examples: Social media posts, Logs, Real-time analytics
```

---

### URL Shortener ke liye kya choose karein?

```
Option 1: SQL (MySQL / PostgreSQL)
  + ACID compliance — data consistent rahega
  + Relationships handle kar sakta hai (users, urls)
  + Mature technology, easy to use
  - Horizontal scaling mushkil hai
  - Bahut zyada load pe slow ho sakta hai

Option 2: NoSQL (Cassandra / DynamoDB)
  + Horizontal scaling easy hai
  + High read/write throughput
  + short_code → original_url simple key-value lookup
  - Joins nahi hote
  - Eventual consistency (thodi der ke liye stale data)
```

### Recommendation:
```
Start with SQL (MySQL):
  - 2.4 TB data ek bade SQL server mein fit ho jaata hai
  - Read replicas se read load handle ho jaata hai
  - Simple aur reliable

Scale hone pe NoSQL add karo:
  - Redis cache sabse pehle (most reads cache se serve honge)
  - Agar cache bhi nahi kaafi toh Cassandra consider karo
```

---

## 6. Complete Flow (API + DB Together)

```
User POST /api/v1/shorten karta hai
         ↓
App server request receive karta hai
         ↓
original_url validate karo (valid URL hai?)
         ↓
short_code generate karo (Base62 — Day 4 mein)
         ↓
DB mein INSERT karo (urls table)
         ↓
Redis cache mein bhi store karo
         ↓
Response mein short_url return karo
         ↓
─────────────────────────────────────
User GET /abc123 karta hai
         ↓
Redis cache check karo (fast path)
         ↓ (cache hit)
302 redirect karo original URL pe
         ↓ (cache miss)
DB se original_url fetch karo
         ↓
Redis mein cache karo (next time fast)
         ↓
302 redirect karo
```

---

## 7. Practice Task (Aaj Karo)

1. Khud se poora urls table SQL mein likho (bina dekhke)
2. Ye APIs ke request/response JSON khud banao:
   - POST /shorten for "https://google.com"
   - GET /xyz789 response
3. Ek dost ko explain karo: SQL vs NoSQL mein kya fark hai

---

Kal Day 4 mein Short Code Generation algorithm dekhenge —
Base62 encoding kya hoti hai aur hashing se kaise alag hai.
