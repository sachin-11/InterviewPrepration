# Day 7 — Revision + Mock Practice: URL Shortener

Aaj poore week ka revision karenge aur mock interview practice karenge.
Blank paper pe design draw karo — ye sabse important exercise hai.

---

## 1. Week 1 Complete Recap

### Day 1 — Requirements:
```
Functional:
  ✓ Long URL → Short URL generate karo
  ✓ Short URL pe click → Original URL pe redirect
  ✓ URL expiry (optional)
  ✓ Analytics (optional)

Non-Functional:
  ✓ High Availability (99.9%)
  ✓ Low Latency (< 100ms redirect)
  ✓ Scalability (millions of users)
  ✓ Durability (data loss nahi)

301 vs 302:
  301 = Permanent (browser cache karta hai — analytics miss)
  302 = Temporary (har baar server hit — analytics track hoti hai)
```

### Day 2 — Capacity Estimation:
```
DAU:           100 million
Writes/day:    10 million  (10% create URLs)
Reads/day:     1 billion   (100:1 read/write ratio)
Write QPS:     ~116/sec
Read QPS:      ~11,574/sec
Storage:       ~2.4 TB (5 years)
Cache memory:  ~260 MB (20% hot URLs)
```

### Day 3 — API + DB Schema:
```
POST /api/v1/shorten    → Short URL create
GET  /{shortCode}       → Redirect
GET  /api/v1/urls/{id}  → URL info
DELETE /api/v1/urls/{id}→ Delete

DB Schema:
  urls(id, short_code, original_url, user_id, created_at, expires_at, is_active)
  Index on: short_code, user_id, expires_at
```

### Day 4 — Short Code Generation:
```
Best approach: Auto-increment ID + Base62 encoding
  ID = 100523 → Base62 → "q8X"
  62^6 = 56 billion combinations

Distributed: Snowflake ID
  [1 bit][41 bit timestamp][10 bit machine][12 bit sequence]
  4096 IDs/ms per machine, no coordination needed
```

### Day 5 — High-Level Architecture:
```
Client → Load Balancer → App Servers → Redis Cache → DB

Write path: App → Primary DB → Redis
Read path:  App → Redis (HIT 80%) → Read Replica (MISS 20%)

Cache: LRU, TTL = 1 day
DB: Primary (writes) + 2 Read Replicas
```

### Day 6 — Deep Dive:
```
Snowflake ID:     Distributed unique ID generation
Vanity URLs:      Reserved words block karo, uniqueness check
URL Expiry:       Redis TTL + background cleanup job
Rate Limiting:    Redis counter, 10 req/min per IP
Analytics:        Kafka async — redirect slow nahi hoga
```

---

## 2. Complete Architecture — Draw This

```
                    ┌─────────────┐
                    │   CLIENTS   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    CDN      │ ← Static assets
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Load     │
                    │  Balancer   │ ← Nginx / AWS ALB
                    └──┬──────┬───┘
                       │      │
              ┌────────▼──┐ ┌─▼────────┐
              │ App Server│ │App Server│ ← Stateless
              │     1     │ │    2     │
              └────┬───┬──┘ └──┬───┬───┘
                   │   │       │   │
            ┌──────▼───▼───────▼───▼──────┐
            │         REDIS CACHE          │ ← 260MB, LRU, TTL
            └──────────────┬───────────────┘
                           │ Cache MISS
            ┌──────────────▼───────────────┐
            │          DATABASE            │
            │  ┌──────────┐ ┌───────────┐  │
            │  │ Primary  │ │  Read     │  │
            │  │  (Write) │→│ Replica   │  │
            │  └──────────┘ └───────────┘  │
            └──────────────────────────────┘
                           │
            ┌──────────────▼───────────────┐
            │    KAFKA (Async Analytics)   │
            └──────────────┬───────────────┘
                           │
            ┌──────────────▼───────────────┐
            │      Analytics Service       │
            └──────────────────────────────┘
```

---

## 3. Mock Interview — Common Questions

### Q1: "What if the DB goes down?"
```
Answer structure: Detect → Handle → Recover

Primary DB down:
  - Read Replicas se reads continue honge
  - Writes fail honge (new URLs create nahi honge)
  - Redis cache se existing URLs serve honge
  - Standby primary promote karo (failover ~30 sec)
  - Alert system trigger hoga (PagerDuty)

Read Replica down:
  - Traffic dusre replicas pe shift ho jaayega
  - Load balancer health check detect karega
  - Auto-scaling se naya replica spin up hoga
  - User impact: minimal (thoda slow)

Both down:
  - Redis cache se serve karo (existing URLs)
  - New URL creation: queue mein store karo
  - Queue drain karo jab DB wapas aaye
```

### Q2: "How do you handle 10x traffic spike?"
```
Normal: 11,574 reads/sec
Spike:  115,740 reads/sec

Layer 1 — CDN:
  Static content CDN se serve karo
  Popular short URLs CDN pe cache karo
  CDN handles millions of req/sec

Layer 2 — Load Balancer:
  Auto-scaling trigger karo
  New app servers spin up (2 min)
  Health checks ensure traffic routing

Layer 3 — Redis Cache:
  Cache hit rate 80% → 80% requests DB tak nahi pahunchte
  Redis Cluster add karo (horizontal scale)
  Cache capacity badhao

Layer 4 — Database:
  Read Replicas add karo (2 → 5)
  Connection pooling
  Query optimization

Layer 5 — Rate Limiting:
  Aggressive rate limiting during spike
  Bot traffic block karo
  Priority queue for premium users
```

### Q3: "How do you prevent duplicate short codes?"
```
Approach 1: DB Unique Constraint
  short_code column pe UNIQUE constraint
  Collision pe retry karo
  Problem: Race condition possible

Approach 2: Snowflake ID
  Timestamp + Machine ID + Sequence
  Globally unique — no collision possible
  Best for distributed systems

Approach 3: Check before insert
  SELECT count(*) WHERE short_code = 'abc'
  Agar 0 → INSERT
  Problem: Race condition between check and insert
  Fix: DB transaction use karo
```

### Q4: "How do you scale to 1 billion users?"
```
Current design handles ~100M users.
1 billion ke liye:

1. Global Distribution:
   Multiple regions (US, EU, Asia)
   GeoDNS → nearest region pe route karo
   Each region ka apna DB cluster

2. Database Sharding:
   short_code ke first char se shard karo
   a-f → Shard 1, g-m → Shard 2, etc.
   Each shard independent scale kar sakta hai

3. Microservices:
   URL Service (create/read)
   Analytics Service (click tracking)
   User Service (authentication)
   Each independently deployable

4. Message Queue:
   Kafka for async processing
   Analytics, notifications, cleanup
```

### Q5: "How do you handle malicious URLs?"
```
1. URL Validation:
   Valid URL format check karo (regex)
   Domain blacklist check karo

2. Safe Browsing API:
   Google Safe Browsing API se check karo
   Phishing/malware URLs block karo
   Async check (don't slow down creation)

3. Rate Limiting:
   Per IP: 10 URLs/minute
   Per user: 1000 URLs/day
   Suspicious patterns detect karo

4. Reporting:
   Users report kare malicious URLs
   Manual review queue
   Auto-disable on multiple reports
```

### Q6: "SQL vs NoSQL for URL Shortener?"
```
SQL (MySQL/PostgreSQL) — Recommended:
  ✓ ACID transactions
  ✓ Strong consistency
  ✓ Complex queries (analytics)
  ✓ 2.4 TB fits in one server
  ✓ Read replicas for scaling

NoSQL (Cassandra) — When to switch:
  → 10+ billion URLs store karne ho
  → Multi-region writes chahiye
  → SQL scaling limit hit ho jaaye

Recommendation:
  Start with MySQL + Read Replicas
  Add Redis cache (handles 80% reads)
  Switch to Cassandra only if needed
```

---

## 4. System Design Interview Framework

```
Step 1 (5 min): Requirements clarify karo
  "Should I support custom URLs?"
  "What's the expected traffic?"
  "Do we need analytics?"

Step 2 (5 min): Capacity estimate karo
  DAU → Writes/Reads → Storage → Cache

Step 3 (10 min): High-level design
  Draw components on whiteboard
  Explain each component's role

Step 4 (15 min): Deep dive
  Interviewer jo pooche us pe focus karo
  Trade-offs discuss karo

Step 5 (5 min): Bottlenecks & improvements
  "What would you improve?"
  "How would you scale further?"
```

---

## 5. Self Quiz — Bina Dekhe Answer Karo

```
Q1. URL shortener ka read/write ratio kya hota hai?
Q2. Base62 mein 6 characters se kitne combinations?
Q3. 302 redirect kyun use karte hain 301 ki jagah?
Q4. Redis mein URL store karne ka kya faida hai?
Q5. Snowflake ID ke 3 parts kaunse hain?
Q6. Rate limiting ke liye Redis mein kya store karte hain?
Q7. Analytics async kyun karte hain?
Q8. DB replication mein primary ka kya role hai?
```

### Answers:
```
A1. 100:1 (read heavy)
A2. 62^6 = ~56 billion
A3. Analytics track karne ke liye (302 = browser cache nahi karta)
A4. DB hit avoid hota hai, ~1ms response (vs ~10ms DB)
A5. Timestamp (41 bit) + Machine ID (10 bit) + Sequence (12 bit)
A6. "rate_limit:ip:{ip}:{minute}" → counter with 60s TTL
A7. Redirect slow nahi hona chahiye analytics ki wajah se
A8. Sirf writes accept karta hai, replicas pe sync karta hai
```

---

## 6. Score Yourself

```
Quiz score:
  8/8 → Week 2 (Rate Limiter) ke liye ready
  6-7 → Weak areas ek baar review karo
  < 6 → Day 5-6 files dobara padho

Mock interview:
  Blank paper pe poora diagram draw kar sako?  Y/N
  5 min mein requirements explain kar sako?    Y/N
  DB down scenario confidently answer kar sako? Y/N
```

---

## 7. Resources

```
Videos:
  Gaurav Sen — URL Shortener:
  https://www.youtube.com/watch?v=JQDHz72OA3c

  ByteByteGo — URL Shortener:
  https://www.youtube.com/watch?v=fMZMm_0ZhK4

  Alex Xu — System Design Interview:
  Book: "System Design Interview Vol 1" Chapter 8

Practice:
  https://www.hellointerview.com
  https://systemdesign.one
```

---

Week 1 (URL Shortener) complete!
Week 2 mein Rate Limiter design karenge — Day 8 se shuru.
