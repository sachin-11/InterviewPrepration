# Day 3 — Design a Rate Limiter

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. Client-side requests ko limit karo (per user / per IP / per API key)
2. Limit exceed hone pe request block karo (HTTP 429 Too Many Requests)
3. Different APIs ke liye different limits (login: 5/min, search: 100/min)
4. Distributed system mein kaam kare (multiple servers)
5. Rate limit headers return karo (X-RateLimit-Remaining, Retry-After)
```

### Non-Functional Requirements:
```
High Availability:   Rate limiter khud kabhi down na ho
Low Latency:         < 5ms overhead per request
Scale:               10 million requests/sec handle kare
Accuracy:            Exact limits enforce ho (approximate bhi acceptable)
Fault Tolerant:      Rate limiter fail ho toh requests pass ho jayein (fail-open)
```

---

## 2. Capacity Estimation (5 min)

```
Total requests/sec:     10 million
Rate limit checks/sec:  10 million (har request pe ek check)

Redis operations/sec:   10 million (GET + INCR per request)
Redis latency:          ~1ms per operation

Storage per user:
  Key: "user:123:api:login:minute:1700000060"
  Value: request count (integer)
  TTL: 60 seconds (auto expire)
  Size: ~50 bytes per key

Total active keys:      10M users × 5 APIs = 50M keys
Total Redis memory:     50M × 50 bytes = ~2.5 GB (very manageable)
```

---

## 3. High-Level Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              CLIENTS                     │
                    │   (Mobile, Web, Third-party APIs)       │
                    └──────────────┬──────────────────────────┘
                                   │ HTTP Request
                    ┌──────────────▼──────────────────────────┐
                    │           API GATEWAY                    │
                    │   (Rate Limiter Middleware yahan hoga)   │
                    └──────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼──────┐  ┌──────────▼──────┐  ┌─────────▼──────┐
    │  Rate Limiter   │  │  Rate Limiter   │  │  Rate Limiter   │
    │  Node 1         │  │  Node 2         │  │  Node 3         │
    └─────────┬───────┘  └──────────┬──────┘  └─────────┬───────┘
              │                     │                    │
              └─────────────────────┼────────────────────┘
                                    │ Redis GET/INCR
                    ┌───────────────▼─────────────────────────┐
                    │         REDIS CLUSTER                    │
                    │   (Centralized counter storage)          │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────────┐
                    │         BACKEND SERVERS                  │
                    │   (Request allowed hone pe yahan jaata)  │
                    └─────────────────────────────────────────┘
```

---

## 4. Rate Limiting Algorithms

### Algorithm 1: Token Bucket
```
Concept:
  - Bucket mein tokens hain (max capacity = limit)
  - Har request ek token consume karta hai
  - Tokens refill hote hain at fixed rate
  - Bucket empty? → Request reject karo

Example:
  Bucket capacity: 10 tokens
  Refill rate: 2 tokens/second
  
  t=0:  10 tokens, request aaya → 9 tokens
  t=0:  9 tokens,  request aaya → 8 tokens
  t=1:  10 tokens (refill), burst of 10 requests → 0 tokens
  t=1:  0 tokens,  request aaya → REJECT (429)

Pros:
  ✓ Burst traffic allow karta hai
  ✓ Simple implementation
  ✓ Memory efficient

Cons:
  ✗ Race condition in distributed system
  ✗ Exact rate hard to enforce

Used by: AWS API Gateway, Stripe
```

### Algorithm 2: Leaking Bucket
```
Concept:
  - Queue (bucket) mein requests aate hain
  - Fixed rate pe process hote hain (leak hote hain)
  - Queue full? → Request reject karo

Example:
  Queue size: 10
  Process rate: 2 requests/second
  
  Requests burst aaye → Queue mein fill ho gaye
  Queue full → Naye requests reject
  Fixed rate pe process hote rahenge

Pros:
  ✓ Smooth, consistent output rate
  ✓ Memory efficient

Cons:
  ✗ Burst requests queue mein stuck
  ✗ Old requests process hote hain, naye reject

Used by: Nginx rate limiting
```

### Algorithm 3: Fixed Window Counter ⭐ (Simple)
```
Concept:
  - Time ko fixed windows mein divide karo (e.g., 1 minute)
  - Har window mein counter rakho
  - Counter > limit? → Reject

Example:
  Limit: 100 requests/minute
  Window: 12:00:00 - 12:01:00
  
  12:00:30 → 50 requests → counter = 50 ✓
  12:00:45 → 60 more requests → counter = 110 → REJECT

Problem — Window boundary attack:
  12:00:59 → 100 requests (window 1 ka limit)
  12:01:00 → 100 requests (window 2 ka limit)
  Result: 200 requests in 2 seconds! ← BUG

Pros:
  ✓ Simple
  ✓ Memory efficient

Cons:
  ✗ Window boundary pe 2x traffic possible
```

### Algorithm 4: Sliding Window Log
```
Concept:
  - Har request ka timestamp store karo
  - Check: last 1 minute mein kitne requests?
  - Count > limit? → Reject

Example:
  Limit: 5 requests/minute
  
  12:00:10 → log: [10]           count=1 ✓
  12:00:20 → log: [10,20]        count=2 ✓
  12:00:50 → log: [10,20,50]     count=3 ✓
  12:01:05 → log: [20,50,65]     count=3 ✓ (10 expired)
  12:01:10 → log: [20,50,65,70]  count=4 ✓
  12:01:15 → log: [20,50,65,70,75] count=5 ✓
  12:01:16 → count=5 → REJECT

Pros:
  ✓ Accurate, no boundary problem

Cons:
  ✗ Memory heavy (har request ka timestamp store)
  ✗ Large traffic pe slow
```

### Algorithm 5: Sliding Window Counter ⭐⭐ (Best)
```
Concept:
  Fixed Window + Sliding ka combination
  
  Formula:
  current_count = current_window_count 
                + previous_window_count × overlap_percentage

Example:
  Limit: 100 requests/minute
  Previous window (12:00): 80 requests
  Current window (12:01): 30 requests
  Current time: 12:01:15 (25% into current window)
  
  Overlap = 75% of previous window still counts
  
  Estimated count = 30 + (80 × 0.75) = 30 + 60 = 90 ✓ (under limit)

Pros:
  ✓ Accurate approximation
  ✓ Memory efficient (sirf 2 counters per window)
  ✓ No boundary attack

Cons:
  ✗ Approximate (not 100% exact)

Used by: Cloudflare, most production systems
```

---

## 5. Redis Implementation

### Fixed Window Counter (Redis):
```
Key format: rate_limit:{user_id}:{api}:{window_timestamp}

Algorithm:
  1. window = current_time / window_size (floor)
  2. key = "rate_limit:user123:login:1700000060"
  3. count = INCR key
  4. If count == 1: EXPIRE key window_size  (first request, set TTL)
  5. If count > limit: return 429
  6. Else: allow request

Redis Commands:
  INCR rate_limit:user123:login:1700000060
  → Returns new count (atomic operation)
  
  EXPIRE rate_limit:user123:login:1700000060 60
  → Key 60 seconds baad auto-delete

Why INCR is atomic:
  Race condition nahi hoga
  Multiple servers ek saath INCR kar sakte hain safely
```

### Sliding Window (Redis with Sorted Set):
```
Key: rate_limit:user123:login
Value: Sorted Set (score = timestamp, member = request_id)

Algorithm:
  1. now = current_timestamp
  2. window_start = now - 60 (last 60 seconds)
  3. ZREMRANGEBYSCORE key 0 window_start  (purane entries remove)
  4. count = ZCARD key
  5. If count >= limit: return 429
  6. ZADD key now request_id
  7. EXPIRE key 60

Redis Commands:
  ZREMRANGEBYSCORE rate_limit:user123:login 0 1700000000
  ZCARD rate_limit:user123:login
  ZADD rate_limit:user123:login 1700000060 "req_abc"
```

---

## 6. Distributed Rate Limiting

### Problem:
```
Rate Limiter Node 1: user123 → 50 requests (local count)
Rate Limiter Node 2: user123 → 50 requests (local count)
Total actual: 100 requests
Each node thinks: 50 < limit (100) → Both allow!
Result: 100 requests pass ho gaye — limit bypass!
```

### Solution: Centralized Redis
```
Sab Rate Limiter nodes ek hi Redis cluster use karein

Node 1: INCR rate_limit:user123 → Redis returns 51
Node 2: INCR rate_limit:user123 → Redis returns 52
...
Node N: INCR rate_limit:user123 → Redis returns 101 → REJECT

Redis INCR is atomic → No race condition
All nodes share same counter → Accurate limiting
```

### Redis Cluster for Scale:
```
10M requests/sec → Single Redis node bottleneck

Solution: Redis Cluster
  - Shard by user_id
  - user_id % num_shards = shard_number
  - user123 → shard 3
  - user456 → shard 7
  
  Each shard handles subset of users
  Horizontal scaling possible
```

---

## 7. Rate Limit Headers

```
Response headers jo client ko bhejna chahiye:

X-RateLimit-Limit:     100        (total limit)
X-RateLimit-Remaining: 45         (remaining requests)
X-RateLimit-Reset:     1700000120 (window reset timestamp)
Retry-After:           30         (seconds to wait, only on 429)

HTTP Status:
  200 OK          → Request allowed
  429 Too Many Requests → Rate limit exceeded
```

---

## 8. Rules Engine — Different Limits per API

```
Config file / Database mein rules store karo:

rules:
  - api: /login
    limit: 5
    window: 60        # 5 requests per minute
    key_by: ip        # IP se limit karo

  - api: /search
    limit: 100
    window: 60        # 100 requests per minute
    key_by: user_id   # User se limit karo

  - api: /send-otp
    limit: 3
    window: 3600      # 3 requests per hour
    key_by: phone     # Phone number se limit karo

Rate Limiter flow:
  1. Request aaya → API endpoint dekho
  2. Rules engine se matching rule fetch karo
  3. key_by field se key banao
  4. Redis mein check karo
  5. Allow / Reject
```

---

## 9. Complete Architecture Diagram

```
Client Request
      │
      ▼
┌─────────────────┐
│   API Gateway   │
│  (Middleware)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Rate Limiter   │────▶│   Rules Engine   │
│  Service        │     │  (Config/DB)     │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Redis Cluster  │
│  (Counters)     │
│                 │
│  Shard 1: users │
│  Shard 2: users │
│  Shard 3: users │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
ALLOW       REJECT
  │           │
  ▼           ▼
Backend    HTTP 429
Server     + Headers
```

---

## 10. Edge Cases & Interview Questions

### Q: "What if Redis goes down?"
```
Option 1: Fail-open (recommended)
  Redis down → Rate limiting skip karo → Requests allow karo
  Reason: Availability > strict limiting
  Risk: Temporary abuse possible

Option 2: Fail-closed
  Redis down → Sab requests reject karo
  Reason: Security critical APIs ke liye
  Risk: Service unavailable

Implementation:
  try:
    count = redis.incr(key)
  except RedisException:
    if fail_open:
      allow_request()  # Redis down, allow karo
    else:
      reject_request() # Redis down, reject karo
```

### Q: "How to handle distributed race condition?"
```
Redis INCR is atomic → No race condition

But Lua script use karo for check-then-act:
  -- Atomic check + increment
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return count

Lua script Redis mein atomically execute hota hai
Multiple commands ek saath → No race condition
```

### Q: "How to rate limit by different keys?"
```
By User ID:    rate_limit:user:123:api:login
By IP:         rate_limit:ip:192.168.1.1:api:login
By API Key:    rate_limit:apikey:abc123:api:search
By Phone:      rate_limit:phone:9876543210:api:otp

Composite key: rate_limit:user:123:ip:192.168.1.1
  → Both user AND IP se limit karo
```

### Q: "How to scale to 10M requests/sec?"
```
Rate Limiter Nodes: Horizontal scaling (stateless)
Redis Cluster:      Shard by user_id (10+ shards)
Local Cache:        Rate Limiter node pe local counter
                    (sync with Redis every 100ms)
                    → Redis calls reduce ho jaate hain

Local cache approach:
  Node local count: 45
  Redis sync: every 100ms
  Tradeoff: Slight inaccuracy, much better performance
```

### Q: "Soft limit vs Hard limit?"
```
Hard limit: Exactly 100 requests/min → 101st reject
  Use case: Billing, security

Soft limit: 100 requests/min → 101-110 allow with warning
  Use case: User experience, gradual enforcement
  
  Implementation:
    90-100: Normal response
    101-110: Response + Warning header
    111+:    Reject (429)
```

---

## 11. Quick Summary

```
Core components:
  API Gateway        → Rate limiter middleware yahan hoga
  Redis Cluster      → Centralized atomic counters
  Rules Engine       → Per-API limit configuration

Best algorithm:
  Sliding Window Counter → Accurate + Memory efficient

Key Redis operations:
  INCR  → Atomic counter increment
  EXPIRE → Auto-cleanup after window
  ZSET  → Sliding window log implementation

Key decisions:
  Redis > Local memory (distributed accuracy)
  Sliding Window > Fixed Window (no boundary attack)
  Fail-open > Fail-closed (availability)
  Lua scripts → Atomic multi-step operations

Response codes:
  200 → Allowed
  429 → Rate limit exceeded (Too Many Requests)
```

---

## 12. Practice Tasks (Aaj Karo)

### Task 1: Diagram Draw Karo
```
Blank paper pe draw karo:
  Client → API Gateway → Rate Limiter → Redis Cluster → Backend
  Rules Engine → Rate Limiter
  429 response path
```

### Task 2: Algorithm Compare Karo
```
Ek table banao:
  Algorithm          | Accuracy | Memory | Burst | Complexity
  Fixed Window       |  Medium  |  Low   |  Yes  |  Simple
  Sliding Window Log |  High    |  High  |  No   |  Medium
  Sliding Window Ctr |  High    |  Low   |  No   |  Medium
  Token Bucket       |  Medium  |  Low   |  Yes  |  Simple
```

### Task 3: Mock Answer
```
45 min timer lagao:
"Design a Rate Limiter"

Step 1 (5 min):  Requirements clarify karo
Step 2 (5 min):  Capacity estimate karo
Step 3 (10 min): High-level design draw karo
Step 4 (15 min): Deep dive (Algorithm choice, Redis impl, Distributed)
Step 5 (10 min): Edge cases discuss karo
```

### Task 4: Questions Prepare Karo
```
Ye questions ka answer ready karo:
1. Which algorithm would you choose and why?
2. How to handle Redis failure?
3. How to rate limit in a distributed system?
4. What's the difference between hard and soft limits?
5. How to scale to 10M requests/sec?
```

---

Kal Day 4 mein URL Shortener (like bit.ly) design karenge.
