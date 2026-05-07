# Day 11 — High-Level Design: Rate Limiter

Aaj dekhenge ki rate limiter ko system mein kaise integrate karte hain —
single server se distributed system tak ka journey.

---

## 1. Single Server — In-Memory Counter

### Simplest Approach:
```
Ek server hai → Memory mein counter store karo

const counters = new Map();
// "user:123:2024031510" → 45  (45 requests this minute)
```

### Implementation:
```javascript
// Single server in-memory rate limiter
const counters = new Map();

function rateLimit(userId, limit = 100, windowSec = 60) {
  const now    = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSec); // Current window
  const key    = `${userId}:${window}`;

  const count = (counters.get(key) || 0) + 1;
  counters.set(key, count);

  // Old entries cleanup (memory leak avoid)
  setTimeout(() => counters.delete(key), windowSec * 1000);

  return {
    allowed:   count <= limit,
    count,
    remaining: Math.max(0, limit - count)
  };
}

// Express middleware
app.use((req, res, next) => {
  const result = rateLimit(req.ip);
  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
});
```

### Problem with Single Server:
```
Works perfectly for:
  ✓ Single server apps
  ✓ Development/testing
  ✓ Small scale (< 10k users)

Fails when:
  ✗ Server restart → All counters lost!
  ✗ Multiple servers → Each has own counter
  ✗ Memory leak possible
```

---

## 2. Distributed System Problem

### The Core Issue:
```
3 App Servers, User makes 10 requests:

Request 1  → Server 1 (count: 1)
Request 2  → Server 2 (count: 1)  ← Different server!
Request 3  → Server 3 (count: 1)  ← Different server!
Request 4  → Server 1 (count: 2)
Request 5  → Server 2 (count: 2)
...

Each server thinks user made only 3-4 requests
But actually user made 10 requests!

Limit: 5 req/min
Reality: User made 10 requests — all ALLOWED ✗
```

### Visual Problem:
```
User (10 requests)
        ↓
   Load Balancer
   ↙    ↓    ↘
 S1    S2    S3
count  count  count
= 4    = 3    = 3
              
Each server: "Under limit!" → All allowed
Total: 10 requests — limit bypassed!
```

---

## 3. Solution: Centralized Redis Store

### Why Redis?
```
Redis = Remote Dictionary Server
  ✓ In-memory (fast — < 1ms)
  ✓ Atomic operations (no race conditions)
  ✓ TTL support (auto-expire keys)
  ✓ Persistent (optional)
  ✓ Single source of truth for all servers
```

### Fixed Architecture:
```
User (10 requests)
        ↓
   Load Balancer
   ↙    ↓    ↘
 S1    S2    S3
  \    |    /
   \   |   /
    ↓  ↓  ↓
  ┌──────────┐
  │  REDIS   │  ← Single counter for all servers
  │ user:123 │
  │ count: 10│
  └──────────┘

Now: All servers check same counter → Accurate!
```

---

## 4. Redis INCR + EXPIRE — Fixed Window

### Redis Commands:
```
INCR key          → Increment counter by 1, return new value
EXPIRE key sec    → Set TTL (auto-delete after sec seconds)
GET key           → Get current value
TTL key           → Check remaining TTL
```

### Implementation:
```javascript
import { createClient } from 'redis';

const redis = createClient();
await redis.connect();

async function fixedWindowRedis(userId, limit = 100, windowSec = 60) {
  const now    = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSec);
  const key    = `rl:${userId}:${window}`;

  // INCR — atomic increment
  const count = await redis.incr(key);

  // First request in window → set TTL
  if (count === 1) {
    await redis.expire(key, windowSec);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed:    count <= limit,
    count,
    remaining:  Math.max(0, limit - count),
    resetIn:    ttl,
    limit
  };
}

// Test
const result = await fixedWindowRedis('user:123', 5, 60);
console.log(result);
// { allowed: true, count: 1, remaining: 4, resetIn: 60, limit: 5 }
```

### Redis mein kya store hota hai:
```
Key:   "rl:user:123:28537"   (user + window number)
Value: 7                      (7 requests so far)
TTL:   45 seconds             (window mein 45 sec bacha)

Window number = Math.floor(timestamp / windowSeconds)
  timestamp 1710234567, window 60sec
  → window = Math.floor(1710234567 / 60) = 28503909
```

---

## 5. Redis Sorted Sets — Sliding Window Log

### Why Sorted Sets?
```
Fixed window problem:
  Window boundary pe double traffic possible
  
  11:59:55 → 5 requests (window 1 end)
  12:00:05 → 5 requests (window 2 start)
  Total in 10 seconds: 10 requests — limit bypass!

Sliding window solution:
  Har request ka exact timestamp store karo
  Last 60 seconds ki requests count karo
  Always accurate!
```

### Redis Sorted Set Commands:
```
ZADD key score member    → Add member with score (timestamp as score)
ZREMRANGEBYSCORE key min max → Remove members in score range
ZCARD key                → Count members
ZRANGE key start stop    → Get members in range
```

### Implementation:
```javascript
async function slidingWindowRedis(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `rl:sliding:${userId}`;

  // Pipeline — multiple commands ek saath (faster)
  const pipeline = redis.multi();

  // 1. Old entries remove karo (window se bahar)
  pipeline.zRemRangeByScore(key, 0, now - windowMs);

  // 2. Current request add karo
  pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });

  // 3. Total count nikalo
  pipeline.zCard(key);

  // 4. TTL set karo
  pipeline.expire(key, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();
  const count   = results[2]; // zCard result

  return {
    allowed:   count <= limit,
    count,
    remaining: Math.max(0, limit - count),
    limit
  };
}
```

### Sorted Set Visualization:
```
Key: "rl:sliding:user:123"

Score (timestamp)    Value
─────────────────    ──────────────────
1710234500000        "1710234500000-0.23"
1710234510000        "1710234510000-0.45"
1710234520000        "1710234520000-0.67"
1710234530000        "1710234530000-0.89"
1710234540000        "1710234540000-0.12"

Query at 1710234560000 (now):
  Remove entries < (now - 60000) = 1710234500000
  → Entry 1 removed (exactly at boundary)
  Count remaining = 4
```

---

## 6. Complete Architecture

### Client → API Gateway → App Servers:
```
                    ┌─────────────────────────────────┐
                    │           CLIENTS               │
                    │   (Browser, Mobile, API)        │
                    └──────────────┬──────────────────┘
                                   │ HTTP Request
                                   ▼
                    ┌─────────────────────────────────┐
                    │         LOAD BALANCER           │
                    │      (Nginx / AWS ALB)          │
                    │   IP-based DDoS protection      │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────┐
                    │         API GATEWAY             │
                    │   ┌─────────────────────────┐   │
                    │   │   Rate Limiter          │   │
                    │   │   Middleware            │   │
                    │   │                         │   │
                    │   │  1. Extract user/IP     │   │
                    │   │  2. Check Redis counter │   │
                    │   │  3. Allow or 429        │   │
                    │   │  4. Add headers         │   │
                    │   └──────────┬──────────────┘   │
                    │              │                   │
                    │   ┌──────────▼──────────────┐   │
                    │   │   Auth Middleware        │   │
                    │   │   Logging               │   │
                    │   └──────────┬──────────────┘   │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │         REDIS CLUSTER           │
                    │                                 │
                    │  rl:user:123:28503  → 45        │
                    │  rl:ip:1.2.3.4:28503 → 12       │
                    │  rl:api:key123:28503 → 890       │
                    └─────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼──┐     ┌──────────▼──┐     ┌─────────▼──┐
    │ App Server │     │ App Server  │     │ App Server │
    │     1      │     │     2       │     │     3      │
    └────────────┘     └─────────────┘     └────────────┘
```

### Request Flow:
```
Step 1: Client → Load Balancer
        IP-based check (DDoS protection)

Step 2: Load Balancer → API Gateway
        Route to API Gateway

Step 3: API Gateway — Rate Limiter Middleware
        a. User ID / API Key / IP extract karo
        b. Redis mein INCR karo
        c. Count > limit? → 429 return karo
        d. Headers add karo (X-RateLimit-*)
        e. Next middleware pe pass karo

Step 4: API Gateway → App Server
        Business logic execute karo

Step 5: App Server → Response
        Client ko response bhejo
```

---

## 7. Express Rate Limiter — Production Code

```javascript
// middleware/rateLimiter.js
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export function createRateLimiter({
  limit     = 100,
  windowSec = 60,
  keyPrefix = 'rl',
  keyFn     = (req) => req.ip  // Default: per IP
} = {}) {

  return async (req, res, next) => {
    try {
      const identifier = keyFn(req);
      const window     = Math.floor(Date.now() / 1000 / windowSec);
      const key        = `${keyPrefix}:${identifier}:${window}`;

      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);

      const remaining = Math.max(0, limit - count);
      const resetTime = (Math.floor(Date.now() / 1000 / windowSec) + 1) * windowSec;

      // Headers set karo
      res.setHeader('X-RateLimit-Limit',     limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset',     resetTime);

      if (count > limit) {
        res.setHeader('Retry-After', resetTime - Math.floor(Date.now() / 1000));
        return res.status(429).json({
          error:       'rate_limit_exceeded',
          message:     `Too many requests. Limit: ${limit} per ${windowSec}s`,
          remaining:   0,
          retry_after: resetTime - Math.floor(Date.now() / 1000)
        });
      }

      next();

    } catch (err) {
      // Redis down → fail open (allow request)
      console.error('Rate limiter error:', err.message);
      next();
    }
  };
}

// app.js mein use karo:
import express from 'express';
import { createRateLimiter } from './middleware/rateLimiter.js';

const app = express();

// Global IP-based limit
app.use(createRateLimiter({ limit: 1000, windowSec: 60 }));

// Strict login limit
app.post('/login', createRateLimiter({
  limit:     5,
  windowSec: 60,
  keyFn:     (req) => `login:${req.ip}`
}));

// Per-user API limit
app.use('/api', createRateLimiter({
  limit:     100,
  windowSec: 60,
  keyFn:     (req) => `user:${req.user?.id || req.ip}`
}));
```

---

## 8. Redis Down — Fail Open vs Fail Closed

```
Fail Open (Recommended for most cases):
  Redis down → Allow all requests
  
  Pros: Service available
  Cons: Rate limiting temporarily disabled
  Use: Non-critical APIs

Fail Closed:
  Redis down → Reject all requests (503)
  
  Pros: Strict protection
  Cons: Service unavailable
  Use: Security-critical endpoints (payment, auth)

Code:
  } catch (err) {
    if (FAIL_OPEN) {
      next();           // Allow request
    } else {
      res.status(503).json({ error: 'Service unavailable' });
    }
  }
```

---

## 9. Quick Summary

```
Single Server:
  In-memory Map → Simple but not distributed

Distributed Problem:
  Multiple servers → Each has own counter → Bypass possible

Redis Solution:
  Centralized store → All servers share same counter
  INCR + EXPIRE → Fixed window (simple, fast)
  Sorted Sets   → Sliding window (accurate, more memory)

Architecture:
  Client → Load Balancer → API Gateway (rate limiter) → App Servers
                                    ↕
                                  Redis
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Redis Setup
```bash
# Redis install karo (Windows)
# Option 1: WSL mein
sudo apt install redis-server
redis-server

# Option 2: Docker
docker run -d -p 6379:6379 redis

# Test
redis-cli ping  # PONG aana chahiye
```

### Task 2: INCR + EXPIRE Test
```bash
# Redis CLI mein manually test karo:
redis-cli

SET counter 0
INCR counter    # 1
INCR counter    # 2
INCR counter    # 3
TTL counter     # -1 (no expiry)
EXPIRE counter 10
TTL counter     # 10
# 10 seconds baad:
GET counter     # nil (expired!)
```

### Task 3: Rate Limiter Middleware
```
createRateLimiter function implement karo.
Express app mein add karo.
curl se test karo:

for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/test
done

# First 5: 200
# Last 5:  429
```

---

Kal Day 12 mein Distributed Rate Limiting deep dive karenge —
Race conditions, Lua scripts, aur multi-tier rate limiting.
