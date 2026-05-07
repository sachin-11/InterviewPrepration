# Day 12 — Deep Dive: Distributed Rate Limiting

Aaj production-level problems solve karenge —
race conditions, atomic operations, aur synchronization strategies.

---

## 1. Race Condition Problem

### Kya hota hai Race Condition?
```
2 servers ek saath same user ka counter check karte hain.
Dono ko same value milti hai.
Dono increment karte hain.
Result: Counter galat ho jaata hai.
```

### Visual Example:
```
User limit: 5 req/min
Current count in Redis: 4

Server 1                    Redis              Server 2
────────                    ─────              ────────
GET counter    ──────────→  returns 4
                                               GET counter ──→ returns 4
count = 4+1 = 5
SET counter 5  ──────────→  value = 5
                                               count = 4+1 = 5
                                               SET counter 5 → value = 5

Both servers think count = 5 (under limit)
Both ALLOW the request
Actual requests: 6 (limit bypassed!)
```

### Why This Happens:
```
GET → Check → SET  (3 separate operations)
Between GET and SET, another server can interfere

This is called "Check-Then-Act" race condition
```

---

## 2. Redis Atomic Operations

### Solution: INCR Command
```
INCR = GET + INCREMENT + SET in ONE atomic operation
No other command can run between these steps

Redis is single-threaded → INCR is always atomic!

Server 1: INCR counter → 5  (atomic)
Server 2: INCR counter → 6  (atomic, waits for Server 1)

No race condition possible with INCR!
```

### INCR vs GET+SET:
```
WRONG (race condition possible):
  count = GET counter      # Step 1
  count = count + 1        # Step 2
  SET counter count        # Step 3
  ← Another server can run between steps!

CORRECT (atomic):
  count = INCR counter     # Single atomic operation
  ← Nothing can run between!
```

### Redis Single-Thread Model:
```
Redis processes commands one at a time:

Queue: [INCR, INCR, INCR, GET, SET]
         ↓
Process: INCR → INCR → INCR → GET → SET
         (sequential, no parallel execution)

Result: No race conditions for single commands!
```

---

## 3. Lua Scripts — Complex Atomic Operations

### Kab Chahiye Lua?
```
INCR alone kaafi hai simple cases ke liye.
But complex logic ke liye multiple commands chahiye:

Example — Token Bucket:
  1. GET current tokens
  2. Calculate refill
  3. Check if enough tokens
  4. Decrement tokens
  5. SET new value

Ye 5 steps ke beech race condition possible hai!
Solution: Lua script — sab steps ek atomic operation mein
```

### Lua Script Basics:
```lua
-- Redis Lua script
-- KEYS[1] = key name
-- ARGV[1], ARGV[2] = arguments

local key   = KEYS[1]
local limit = tonumber(ARGV[1])
local now   = tonumber(ARGV[2])

-- GET current count
local count = tonumber(redis.call('GET', key)) or 0

-- Check limit
if count < limit then
  redis.call('INCR', key)
  redis.call('EXPIRE', key, 60)
  return {1, limit - count - 1}  -- allowed, remaining
else
  return {0, 0}  -- rejected
end
```

### Node.js mein Lua Script:
```javascript
import { createClient } from 'redis';

const redis = createClient();
await redis.connect();

// Token Bucket Lua Script
const tokenBucketScript = `
  local key        = KEYS[1]
  local capacity   = tonumber(ARGV[1])
  local refillRate = tonumber(ARGV[2])
  local now        = tonumber(ARGV[3])
  local requested  = tonumber(ARGV[4])

  -- Current state fetch karo
  local data       = redis.call('HMGET', key, 'tokens', 'lastRefill')
  local tokens     = tonumber(data[1]) or capacity
  local lastRefill = tonumber(data[2]) or now

  -- Tokens refill karo
  local elapsed   = math.max(0, (now - lastRefill) / 1000)
  local newTokens = elapsed * refillRate
  tokens = math.min(capacity, tokens + newTokens)

  -- Request check karo
  if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key,
      'tokens',     tokens,
      'lastRefill', now
    )
    redis.call('EXPIRE', key, 3600)
    return {1, math.floor(tokens)}   -- {allowed, remaining}
  else
    local waitTime = math.ceil((requested - tokens) / refillRate)
    return {0, 0, waitTime}          -- {rejected, 0, retry_after}
  end
`;

async function tokenBucketLua(userId, capacity = 10, refillRate = 2) {
  const key    = `tb:${userId}`;
  const now    = Date.now();

  const result = await redis.eval(tokenBucketScript, {
    keys:      [key],
    arguments: [
      capacity.toString(),
      refillRate.toString(),
      now.toString(),
      '1'  // tokens requested
    ]
  });

  return {
    allowed:    result[0] === 1,
    remaining:  result[1],
    retryAfter: result[2] || 0
  };
}

// Test
for (let i = 1; i <= 8; i++) {
  const r = await tokenBucketLua('user:123', 5, 2);
  console.log(`Request ${i}: ${r.allowed ? 'ALLOW' : 'REJECT'} | remaining: ${r.remaining}`);
}
```

---

## 4. Synchronization Strategies

### Strategy 1: Sticky Sessions (Not Great)
```
Idea: Same user → Always same server
      Each server has its own counter

Load Balancer config:
  User 123 → Always Server 1
  User 456 → Always Server 2
  User 789 → Always Server 3

Pros:
  + No Redis needed
  + Simple implementation
  + Fast (in-memory)

Cons:
  ✗ Server crash → User's session lost
  ✗ Uneven load distribution
  ✗ Scaling mushkil (new server add karo toh?)
  ✗ Not truly distributed

Verdict: Avoid in production
```

### Strategy 2: Centralized Redis (Good) ⭐
```
Idea: Single Redis instance → All servers share

Architecture:
  Server 1 ──┐
  Server 2 ──┼──→ Redis ← Single source of truth
  Server 3 ──┘

Pros:
  ✓ Accurate counts
  ✓ Atomic operations (INCR)
  ✓ Simple to implement
  ✓ Works with any number of servers

Cons:
  ✗ Redis = Single point of failure
  ✗ Network latency (1-2ms extra per request)
  ✗ Redis overload possible at very high scale

Fix for SPOF:
  Redis Sentinel (automatic failover)
  Redis Cluster (horizontal scaling)

Verdict: Best for most production systems
```

### Strategy 3: Redis Cluster (Scale)
```
Multiple Redis nodes → Data sharded across nodes

User 123 → Hash → Node 1
User 456 → Hash → Node 2
User 789 → Hash → Node 3

Pros:
  ✓ Horizontal scaling
  ✓ No single point of failure
  ✓ Handles millions of keys

Cons:
  ✗ Complex setup
  ✗ Cross-slot operations not supported

Use when: > 100k requests/second
```

### Strategy 4: Gossip Protocol / Eventual Consistency (Advanced)
```
Idea: Each server has local counter
      Servers periodically sync with each other
      Eventual consistency (not immediate)

How it works:
  Server 1: count = 30
  Server 2: count = 25
  Server 3: count = 20

  Gossip: Servers share counts every 100ms
  After sync: All servers know total = 75

Pros:
  ✓ No central dependency
  ✓ Very fast (local reads)
  ✓ Fault tolerant

Cons:
  ✗ Temporarily inaccurate (eventual consistency)
  ✗ User might exceed limit briefly
  ✗ Complex implementation

Use when:
  - Approximate rate limiting okay hai
  - Ultra-low latency needed
  - Global distributed system (multiple regions)

Example: Cloudflare uses this approach
```

### Comparison:
```
Strategy              Accuracy   Complexity   Fault Tolerant   Scale
────────────────────  ─────────  ───────────  ───────────────  ──────
Sticky Sessions       Medium     Low          No               Poor
Centralized Redis     High       Low          With Sentinel    Good
Redis Cluster         High       Medium       Yes              Great
Gossip Protocol       Approx     High         Yes              Excellent
```

---

## 5. Rate Limit Headers — Standard

### Required Headers:
```
X-RateLimit-Limit:     100      ← Max requests allowed
X-RateLimit-Remaining: 45       ← Requests left in window
X-RateLimit-Reset:     1711234567 ← Unix timestamp when window resets
Retry-After:           45       ← Seconds to wait (only on 429)
```

### Complete Implementation:
```javascript
// middleware/rateLimiter.js
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// Lua script for atomic rate limiting
const rateLimitScript = `
  local key       = KEYS[1]
  local limit     = tonumber(ARGV[1])
  local windowSec = tonumber(ARGV[2])
  local now       = tonumber(ARGV[3])

  local count = tonumber(redis.call('GET', key)) or 0

  if count < limit then
    redis.call('INCR', key)
    if count == 0 then
      redis.call('EXPIRE', key, windowSec)
    end
    return {1, limit - count - 1, redis.call('TTL', key)}
  else
    return {0, 0, redis.call('TTL', key)}
  end
`;

export function rateLimiter({
  limit     = 100,
  windowSec = 60,
  keyFn     = (req) => req.ip
} = {}) {

  return async (req, res, next) => {
    const identifier = keyFn(req);
    const window     = Math.floor(Date.now() / 1000 / windowSec);
    const key        = `rl:${identifier}:${window}`;
    const now        = Math.floor(Date.now() / 1000);
    const resetTime  = (window + 1) * windowSec;

    try {
      const result    = await redis.eval(rateLimitScript, {
        keys:      [key],
        arguments: [limit.toString(), windowSec.toString(), now.toString()]
      });

      const allowed   = result[0] === 1;
      const remaining = result[1];
      const ttl       = result[2];

      // Always set headers
      res.setHeader('X-RateLimit-Limit',     limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      res.setHeader('X-RateLimit-Reset',     resetTime);

      if (!allowed) {
        res.setHeader('Retry-After', ttl > 0 ? ttl : windowSec);
        return res.status(429).json({
          error:       'rate_limit_exceeded',
          message:     `Rate limit of ${limit} requests per ${windowSec}s exceeded`,
          limit,
          remaining:   0,
          reset_at:    new Date(resetTime * 1000).toISOString(),
          retry_after: ttl > 0 ? ttl : windowSec
        });
      }

      next();

    } catch (err) {
      // Redis down → fail open
      console.error('Rate limiter Redis error:', err.message);
      next();
    }
  };
}
```

### Usage in Express:
```javascript
import express from 'express';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();
app.use(express.json());

// Global limit
app.use(rateLimiter({ limit: 1000, windowSec: 60 }));

// Strict login limit
app.post('/login',
  rateLimiter({
    limit:     5,
    windowSec: 60,
    keyFn:     (req) => `login:${req.ip}`
  }),
  loginHandler
);

// Per-user API limit
app.use('/api',
  rateLimiter({
    limit:     100,
    windowSec: 60,
    keyFn:     (req) => `user:${req.headers['x-user-id'] || req.ip}`
  })
);
```

### Test with curl:
```bash
# 6 requests (limit = 5)
for i in {1..6}; do
  echo "Request $i:"
  curl -s -D - http://localhost:3000/api/test | grep -E "HTTP|X-Rate|Retry"
  echo "---"
done

# Output:
# Request 1: HTTP/1.1 200 | X-RateLimit-Remaining: 4
# Request 2: HTTP/1.1 200 | X-RateLimit-Remaining: 3
# Request 3: HTTP/1.1 200 | X-RateLimit-Remaining: 2
# Request 4: HTTP/1.1 200 | X-RateLimit-Remaining: 1
# Request 5: HTTP/1.1 200 | X-RateLimit-Remaining: 0
# Request 6: HTTP/1.1 429 | Retry-After: 45
```

---

## 6. Multi-Tier Rate Limiting

```javascript
// Different limits for different tiers
const tiers = {
  free:       { limit: 100,   windowSec: 3600  },  // 100/hour
  pro:        { limit: 1000,  windowSec: 3600  },  // 1000/hour
  enterprise: { limit: 10000, windowSec: 3600  },  // 10000/hour
};

app.use('/api', async (req, res, next) => {
  // User ka tier DB se fetch karo
  const userTier = req.user?.tier || 'free';
  const config   = tiers[userTier];

  return rateLimiter({
    ...config,
    keyFn: (req) => `tier:${req.user?.id || req.ip}`
  })(req, res, next);
});
```

---

## 7. Quick Summary

```
Race Condition:
  GET + SET = Not atomic → Race condition possible
  INCR      = Atomic     → No race condition

Lua Scripts:
  Multiple operations → Single atomic execution
  Use for: Token bucket, complex logic

Synchronization:
  Sticky Sessions  → Avoid (not reliable)
  Centralized Redis→ Best for most cases
  Redis Cluster    → High scale
  Gossip Protocol  → Approximate, ultra-scale

Headers:
  X-RateLimit-Limit:     Max allowed
  X-RateLimit-Remaining: Left in window
  X-RateLimit-Reset:     When window resets
  Retry-After:           Wait time (429 only)
```

---

## 8. Practice Tasks (Aaj Karo)

### Task 1: Race Condition Simulate Karo
```javascript
// Bina atomic operation ke race condition dekho
const counter = { value: 0 };

async function nonAtomicIncrement() {
  const current = counter.value;      // GET
  await new Promise(r => setTimeout(r, 1)); // Simulate delay
  counter.value = current + 1;        // SET
}

// 10 concurrent increments
await Promise.all(Array(10).fill(0).map(nonAtomicIncrement));
console.log("Expected: 10, Got:", counter.value); // Less than 10!
```

### Task 2: Lua Script Test
```
Redis CLI mein Lua script run karo:

redis-cli EVAL "
  local count = tonumber(redis.call('GET', KEYS[1])) or 0
  if count < tonumber(ARGV[1]) then
    redis.call('INCR', KEYS[1])
    redis.call('EXPIRE', KEYS[1], 60)
    return 1
  end
  return 0
" 1 "test:user:123" 5

# 5 baar run karo → 1 (allowed)
# 6th baar → 0 (rejected)
```

### Task 3: Headers Test
```bash
# Server run karo with rate limiter
# curl se test karo aur headers dekho:

curl -v http://localhost:3000/api/test 2>&1 | grep "X-Rate\|Retry\|HTTP"

# Ye headers dikhne chahiye:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1711234567
```

---

Kal Day 13 mein Edge Cases aur Rules dekhenge —
Hard/Soft limiting, whitelisting, multi-tier, Redis failure handling.
