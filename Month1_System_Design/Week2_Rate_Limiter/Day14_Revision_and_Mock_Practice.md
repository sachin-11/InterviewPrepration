# Day 14 — Revision + Mock Practice: Rate Limiter

Aaj poore Week 2 ka revision karenge aur mock interview practice karenge.
45 minute timer lagao aur blank paper pe design draw karo.

---

## 1. Week 2 Complete Recap

### Day 8 — What & Why:
```
Rate limiter solve karta hai:
  ✓ DDoS attacks
  ✓ API abuse
  ✓ Fair usage
  ✓ Brute force

Types: Per IP, Per User, Per API Key, Per Endpoint
Where: Client (UX only) → Load Balancer → API Gateway → App Server

Response: 429 Too Many Requests
Headers:  X-RateLimit-Limit, Remaining, Reset, Retry-After
```

### Day 9 — Token Bucket & Leaky Bucket:
```
Token Bucket:
  - Bucket mein tokens hain
  - Har request 1 token consume karta hai
  - Fixed rate pe refill
  - BURST ALLOW karta hai ← Key feature
  - Web APIs ke liye best

Leaky Bucket:
  - Queue mein requests store hoti hain
  - Fixed rate se process hoti hain
  - Burst SMOOTH OUT karta hai
  - Network traffic shaping ke liye
```

### Day 10 — Fixed Window & Sliding Window:
```
Fixed Window Counter:
  - Time window mein counter increment karo
  - Window end pe reset
  - Simple, fast
  - Problem: Boundary pe double traffic

Sliding Window Log:
  - Har request ka timestamp store karo
  - Last N seconds ki requests count karo
  - Accurate but memory expensive

Sliding Window Counter:
  - Fixed window + previous window weighted average
  - Best balance: accuracy + memory
  - Formula: current + previous × (1 - elapsed/window)
```

### Day 11 — High-Level Design:
```
Single server: In-memory Map (simple, not distributed)
Distributed:   Redis (centralized, atomic INCR)

Architecture:
  Client → Load Balancer → API Gateway (rate limiter) → App Servers
                                    ↕
                                  Redis
```

### Day 12 — Distributed Deep Dive:
```
Race condition: GET + SET = not atomic → bypass possible
Solution: INCR (atomic) + Lua scripts (complex atomic ops)

Synchronization:
  Sticky Sessions  → Avoid
  Centralized Redis→ Best (most cases)
  Redis Cluster    → High scale
  Gossip Protocol  → Approximate, ultra-scale
```

### Day 13 — Edge Cases:
```
Hard: Reject immediately (security endpoints)
Soft: Delay/throttle (non-critical)

Whitelist: Internal services, admin → Always allow
Blacklist: Attackers → Always block
Auto-blacklist: Too many violations → Auto-block

Multi-tier: Per second + per minute + per day
Redis down: Fail open (availability) vs Fail closed (security)
```

---

## 2. Complete Architecture — Draw This

```
                    ┌──────────────────────────────────┐
                    │           CLIENTS                │
                    │   (Browser, Mobile, API)         │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │         LOAD BALANCER            │
                    │   IP-based DDoS protection       │
                    │   Blacklist check (network level)│
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │          API GATEWAY             │
                    │                                  │
                    │  ┌────────────────────────────┐  │
                    │  │    Rate Limiter Middleware  │  │
                    │  │                            │  │
                    │  │  1. Whitelist check        │  │
                    │  │  2. Blacklist check        │  │
                    │  │  3. Extract identifier     │  │
                    │  │     (API Key > User > IP)  │  │
                    │  │  4. Multi-tier check       │  │
                    │  │     (per sec, min, day)    │  │
                    │  │  5. Redis INCR (atomic)    │  │
                    │  │  6. Allow or 429           │  │
                    │  │  7. Set headers            │  │
                    │  └────────────┬───────────────┘  │
                    └───────────────┼──────────────────┘
                                    │
                    ┌───────────────▼──────────────────┐
                    │          REDIS CLUSTER           │
                    │                                  │
                    │  rl:per_sec:user:123:ts  → 5     │
                    │  rl:per_min:user:123:ts  → 45    │
                    │  rl:per_day:user:123:ts  → 890   │
                    │  blacklist:ip:1.2.3.4    → {...} │
                    └──────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼──┐       ┌──────────▼──┐       ┌─────────▼──┐
    │ App Server │       │ App Server  │       │ App Server │
    │     1      │       │     2       │       │     3      │
    └────────────┘       └─────────────┘       └────────────┘
```

---

## 3. Algorithm Selection Guide

### Interview mein ye bolna:
```
"I would use Token Bucket algorithm because:

1. Web APIs ke liye best fit hai
2. Burst traffic allow karta hai
   (User occasionally zyada requests kare → okay)
3. Implementation simple hai
4. Redis mein efficiently store hota hai
   (HMSET: tokens + lastRefill)
5. Industry standard hai
   (AWS API Gateway, Stripe, GitHub use karte hain)

Leaky Bucket tab use karta jab:
  - Downstream service protect karna ho
  - Strict constant rate chahiye
  - Network packet processing ho

Sliding Window Counter tab use karta jab:
  - Boundary problem critical ho
  - Accuracy > simplicity
  - Memory budget available ho"
```

---

## 4. Mock Interview — 45 Min Practice

### Timer: 45 minutes

### Question: "Design a Rate Limiter for a REST API"

---

### Step 1 (5 min): Requirements Clarify Karo
```
Interviewer se poochho:

Functional:
  Q: "Should it work per user, per IP, or per API key?"
  Q: "What's the expected scale? (requests/sec)"
  Q: "Should we support different limits for different endpoints?"
  Q: "Hard or soft rate limiting?"

Non-functional:
  Q: "What's acceptable latency overhead?"
  Q: "Should it be highly available?"
  Q: "Distributed system hai ya single server?"

Assumptions (agar interviewer na bataye):
  - 10 million users
  - 100 req/min per user
  - Distributed system (multiple servers)
  - < 5ms latency overhead
  - 99.9% availability
```

### Step 2 (5 min): Capacity Estimate
```
Users:          10 million
Requests/user:  100/min
Total QPS:      10M × 100/60 = ~16,667 req/sec

Redis operations per request: 2 (INCR + EXPIRE)
Redis QPS needed: 33,334 ops/sec
Redis handles: 100,000+ ops/sec → Comfortable

Storage per user:
  Key: "rl:user:123:window" = ~30 bytes
  Value: counter = 8 bytes
  Total: ~40 bytes per user per window

10M users × 40 bytes = 400 MB → Manageable
```

### Step 3 (10 min): High-Level Design
```
Draw on paper:
  Client → Load Balancer → API Gateway → App Servers
                                ↕
                             Redis

Explain:
  "Rate limiter API Gateway mein middleware ke roop mein hoga.
   Redis centralized store hai — sab servers share karte hain.
   INCR command atomic hai — race condition nahi hogi."
```

### Step 4 (15 min): Deep Dive
```
Algorithm choice:
  "Token Bucket use karunga — burst allow karta hai,
   web APIs ke liye industry standard hai."

Redis implementation:
  "INCR + EXPIRE for fixed window.
   Lua script for token bucket (atomic multi-step)."

Distributed handling:
  "Centralized Redis with Sentinel for failover.
   All app servers same Redis instance use karenge."

Headers:
  "X-RateLimit-Limit, Remaining, Reset, Retry-After
   Standard RFC 6585 follow karunga."
```

### Step 5 (10 min): Edge Cases
```
Redis failure:
  "Fail open for non-critical endpoints.
   Fail closed for login/payment.
   In-memory fallback as last resort."

Whitelist/Blacklist:
  "Internal services whitelist mein.
   Known attackers blacklist mein.
   Auto-blacklist after 100 violations/hour."

Multi-tier:
  "Per second + per minute + per day.
   Free vs Pro vs Enterprise different limits."
```

---

## 5. Common Interview Questions

### Q1: "Which algorithm would you use and why?"
```
Answer:
  "Token Bucket for most web APIs.

  Reasons:
  1. Burst traffic handle karta hai gracefully
     (User 5 min idle → bucket full → burst okay)
  2. Simple implementation
     (Redis HMSET: tokens + lastRefill)
  3. Industry proven
     (AWS, Stripe, GitHub use karte hain)
  4. Memory efficient
     (Sirf 2 values store karne hain per user)

  Sliding Window Counter use karta jab:
  - Boundary problem critical ho
  - Exact accuracy chahiye
  - Memory available ho"
```

### Q2: "How do you handle Redis failure?"
```
Answer:
  "Hybrid approach use karunga:

  Critical endpoints (login, payment):
    → Fail closed (503)
    → Security > availability

  Non-critical endpoints (read APIs):
    → Fail open (allow request)
    → Availability > strict limiting

  Additionally:
  1. Redis Sentinel for automatic failover
     (Primary down → Replica promote, ~30 sec)
  2. In-memory fallback for brief outages
     (Less accurate but functional)
  3. Circuit breaker pattern
     (Redis slow → Switch to fallback automatically)
  4. Monitoring + alerts
     (PagerDuty alert on Redis down)"
```

### Q3: "How do you prevent race conditions?"
```
Answer:
  "Redis INCR command use karta hoon.

  INCR is atomic — single operation:
    GET + INCREMENT + SET in one step
    Redis single-threaded → No parallel execution

  For complex logic (Token Bucket):
    Lua scripts use karta hoon
    Entire script runs atomically
    No other command can interrupt

  Wrong approach (avoid):
    GET counter → check → SET counter
    (Race condition between GET and SET)"
```

### Q4: "How would you scale to 1 billion users?"
```
Answer:
  "Current design handles ~10M users.
  1 billion ke liye:

  1. Redis Cluster (sharding):
     User ID hash → Shard 1, 2, 3...
     Each shard independent scale kar sakta hai

  2. Multiple Redis regions:
     US users → US Redis
     Asia users → Asia Redis
     GeoDNS routing

  3. Gossip protocol (eventual consistency):
     Local counters + periodic sync
     Approximate but ultra-fast

  4. Tiered approach:
     L1: In-memory (per server, fast)
     L2: Redis (centralized, accurate)
     L3: Database (audit log)"
```

### Q5: "What's the difference between rate limiting and throttling?"
```
Answer:
  "Rate Limiting:
    Binary decision — allow or reject
    Hard cutoff at limit
    Example: 100 req/min → 101st = 429

  Throttling:
    Gradual slowdown
    Queue or delay requests
    Example: 100 req/min → 101st = 2s delay
             200 req/min → 201st = 10s delay

  In practice:
    Rate limiting = Hard limit (security)
    Throttling = Soft limit (UX)
    Often used together"
```

---

## 6. Self Quiz — Bina Dekhe Answer Karo

```
Q1. Token Bucket mein burst traffic kyun allow hota hai?
Q2. Leaky Bucket ka output rate kya hota hai?
Q3. Fixed Window ka boundary problem kya hai?
Q4. Sliding Window Counter ka formula kya hai?
Q5. INCR atomic kyun hai?
Q6. Lua script kab use karte hain?
Q7. Fail open vs fail closed — kab kya?
Q8. Auto-blacklist kab trigger hota hai?
```

### Answers:
```
A1. Bucket full hone pe tokens accumulate hote hain
    → Burst mein sab tokens ek saath use ho sakte hain

A2. Fixed constant rate (leak rate)
    Input burst ho toh bhi output smooth rehta hai

A3. Window boundary pe:
    Last second of window 1 + First second of window 2
    = 2x requests allowed in 2 seconds

A4. count = current_window_count +
           previous_window_count × (1 - elapsed/window_size)

A5. Redis single-threaded hai
    INCR = GET + INCREMENT + SET in one atomic step
    No other command can run between

A6. Multiple Redis operations atomically execute karne ho
    Example: Token bucket (GET tokens → calculate → SET)

A7. Fail open: Non-critical (availability > security)
    Fail closed: Critical endpoints (security > availability)

A8. 100+ rate limit violations in 1 hour
    → Auto-blacklist for 24 hours
```

---

## 7. Score Yourself

```
Quiz:
  8/8 → Month 2 (RAG System) ke liye ready
  6-7 → Weak areas review karo
  < 6 → Day 9-12 files dobara padho

Mock Interview:
  □ 45 min mein complete design kar sako?
  □ Algorithm choice justify kar sako?
  □ Redis failure handle kar sako?
  □ Blank paper pe architecture draw kar sako?
```

---

## 8. Resources

```
Videos:
  Rate Limiter System Design:
  https://www.youtube.com/watch?v=mhUQe4BKZXs

  ByteByteGo — Rate Limiting:
  https://www.youtube.com/watch?v=FU4WlwfS3G0

  Alex Xu — System Design Interview:
  Book: "System Design Interview Vol 1" Chapter 4

Real implementations:
  express-rate-limit (npm)
  Redis rate limiting patterns: https://redis.io/glossary/rate-limiting
  Cloudflare rate limiting: https://developers.cloudflare.com/waf/rate-limiting-rules
```

---

## 9. Month 1 System Design — Complete!

```
Week 1: URL Shortener ✓
  Day 1:  Requirements (functional + non-functional)
  Day 2:  Capacity estimation
  Day 3:  API design + DB schema
  Day 4:  Short code generation (Base62, Snowflake)
  Day 5:  High-level architecture
  Day 6:  Deep dive (scalability, edge cases)
  Day 7:  Revision + mock practice

Week 2: Rate Limiter ✓
  Day 8:  What & why of rate limiting
  Day 9:  Token Bucket + Leaky Bucket
  Day 10: Fixed Window + Sliding Window
  Day 11: High-level design (Redis)
  Day 12: Distributed rate limiting
  Day 13: Edge cases & rules
  Day 14: Revision + mock practice

Next: Month 2 — RAG System
  Week 1: Embeddings & Vector DB
  Week 2: Pinecone / Weaviate
  Week 3: PDF Q&A System
  Week 4: Production RAG
```
