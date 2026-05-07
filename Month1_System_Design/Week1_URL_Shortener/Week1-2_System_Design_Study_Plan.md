# Week 1–2: System Design Basics — Day-wise Study Plan

---

## Week 1: URL Shortener

### Day 1 — Fundamentals & Requirements
- System design interview approach samjho (functional vs non-functional requirements)
- URL shortener kya hota hai, real-world examples (bit.ly, tinyurl)
- Functional requirements define karo:
  - Short URL generate karna
  - Redirect karna
  - Expiry, analytics (optional)
- Non-functional: high availability, low latency, scalability
- Resource: [Grokking the System Design Interview - URL Shortener](https://www.educative.io/courses/grokking-the-system-design-interview)

### Day 2 — Capacity Estimation
- DAU (Daily Active Users) estimate karna seekho
- Read/Write ratio calculate karo (e.g., 100:1 read heavy)
- Storage estimation: URL size × requests/day × retention period
- Bandwidth, memory (cache) estimation
- Practice: khud ek rough estimate banao on paper

### Day 3 — API Design & Database Schema
- REST API design karo:
  - `POST /shorten` → returns short URL
  - `GET /{shortCode}` → redirects to original
- Database schema:
  ```
  urls table: id, short_code, original_url, created_at, expires_at, user_id
  ```
- SQL vs NoSQL choice — kab kya use karein aur kyun

### Day 4 — Core Algorithm: Short Code Generation
- Hashing approach: MD5/SHA256 → first 6-7 chars (collision problem)
- Base62 encoding (a-z, A-Z, 0-9) → 62^6 = ~56 billion combinations
- Auto-increment ID + Base62 encode karna
- Counter-based approach with distributed systems problem
- Implement Base62 encode/decode khud likhke dekho

### Day 5 — High-Level Architecture
- Components draw karo:
  - Client → Load Balancer → App Servers → Cache (Redis) → DB
- Read path vs Write path alag samjho
- Cache strategy: cache popular URLs (80/20 rule)
- DB replication: primary for writes, replicas for reads

### Day 6 — Deep Dive: Scalability & Edge Cases
- Distributed ID generation: Snowflake ID, Ticket Server
- Custom short URLs (vanity URLs) handle karna
- URL expiry cleanup (TTL in Redis, background job in DB)
- Abuse prevention: rate limiting on POST endpoint
- Analytics: click tracking async via message queue (Kafka)

### Day 7 — Revision + Mock Practice
- Poora URL shortener design ek blank paper pe draw karo
- Kisi ko explain karo ya khud bol ke practice karo (rubber duck)
- Common interview questions:
  - "What if the DB goes down?"
  - "How do you handle 10x traffic spike?"
- Watch: [URL Shortener - System Design Interview](https://www.youtube.com/watch?v=JQDHz72OA3c) (Gaurav Sen / Alex Xu)

---

## Week 2: Rate Limiter

### Day 8 — What & Why of Rate Limiting
- Rate limiter kya solve karta hai (DDoS, abuse, fair usage)
- Real examples: Twitter API limits, GitHub API limits
- Types: per user, per IP, per endpoint
- Functional requirements:
  - Limit requests per time window
  - Return 429 Too Many Requests
- Where to place it: client side, server side, middleware, API gateway

### Day 9 — Algorithms (Part 1)
- Token Bucket algorithm:
  - Bucket mein tokens hain, har request ek token leta hai
  - Tokens refill hote hain at fixed rate
  - Burst traffic allow karta hai
- Leaky Bucket algorithm:
  - Queue ki tarah, fixed rate se process hota hai
  - Burst smooth out ho jaata hai
- Dono ka diagram banao aur compare karo

### Day 10 — Algorithms (Part 2)
- Fixed Window Counter:
  - Har window (e.g., 1 min) mein counter reset
  - Problem: boundary pe double traffic aa sakta hai
- Sliding Window Log:
  - Har request ka timestamp store karo
  - Accurate but memory expensive
- Sliding Window Counter:
  - Fixed window + previous window ka weighted average
  - Best balance of accuracy & memory
- Comparison table banao: pros/cons of each

### Day 11 — High-Level Design
- Single server mein rate limiter: in-memory counter
- Distributed system mein problem: multiple app servers
- Solution: centralized store — Redis
  - `INCR` command + `EXPIRE` for fixed window
  - Sorted sets for sliding window log
- Architecture: Client → API Gateway (rate limiter middleware) → App Servers

### Day 12 — Deep Dive: Distributed Rate Limiting
- Race condition problem in distributed counters
- Redis atomic operations: `INCR`, Lua scripts
- Synchronization strategies:
  - Sticky sessions (not great)
  - Centralized Redis (good)
  - Gossip protocol / eventual consistency (advanced)
- Rate limit headers return karna:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 45
  X-RateLimit-Reset: 1711234567
  ```

### Day 13 — Edge Cases & Rules
- Hard vs Soft rate limiting
- Rate limit by: IP, User ID, API Key — kab kya use karein
- Whitelisting/Blacklisting
- Multi-tier rate limiting (per second + per day)
- What happens when Redis is down? (fail open vs fail closed)

### Day 14 — Revision + Mock Practice
- Poora rate limiter design blank paper pe draw karo
- Mock interview practice: 45 min timer lagao, explain karo
- Common questions:
  - "Which algorithm would you use and why?"
  - "How do you handle Redis failure?"
- Watch: [Rate Limiter - System Design](https://www.youtube.com/watch?v=mhUQe4BKZXs)

---

## Resources (Overall)
- Book: "System Design Interview" by Alex Xu (Vol 1) — Chapter 1 (Scale) + Chapter 5 (URL Shortener) + Chapter 4 (Rate Limiter)
- YouTube: Gaurav Sen, ByteByteGo, Exponent
- Practice drawing diagrams daily — visualization bahut important hai
