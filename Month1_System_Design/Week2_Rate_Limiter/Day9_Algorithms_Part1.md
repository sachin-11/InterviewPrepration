# Day 9 — Algorithms Part 1: Token Bucket & Leaky Bucket

Aaj 2 most popular rate limiting algorithms samjhenge —
diagram + code + comparison sab cover karenge.

---

## 1. Token Bucket Algorithm

### Concept:
```
Ek bucket hai jisme tokens hain.
Har request ek token consume karta hai.
Tokens ek fixed rate se refill hote hain.
Bucket full hone pe extra tokens discard ho jaate hain.
```

### Visual Diagram:
```
                    Refill Rate: 10 tokens/sec
                           ↓
                    ┌──────────────┐
                    │  🪙🪙🪙🪙🪙  │
                    │  🪙🪙🪙🪙🪙  │  ← Bucket (capacity: 10)
                    │              │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │      Request comes in   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Token available?       │
              └──────┬──────────┬───────┘
                     │ YES      │ NO
              ┌──────▼──┐  ┌────▼──────┐
              │ Consume  │  │  Reject   │
              │ 1 token  │  │  (429)    │
              │ Allow ✓  │  └───────────┘
              └──────────┘
```

### Step-by-step Example:
```
Config: Capacity = 5 tokens, Refill = 2 tokens/sec

Time 0s:  Bucket = [🪙🪙🪙🪙🪙]  (full, 5 tokens)
Request 1: Token consume → Bucket = [🪙🪙🪙🪙]   → ALLOW ✓
Request 2: Token consume → Bucket = [🪙🪙🪙]     → ALLOW ✓
Request 3: Token consume → Bucket = [🪙🪙]       → ALLOW ✓
Request 4: Token consume → Bucket = [🪙]         → ALLOW ✓
Request 5: Token consume → Bucket = []           → ALLOW ✓
Request 6: No token!     → Bucket = []           → REJECT ✗ (429)

Time 1s:  Refill +2     → Bucket = [🪙🪙]        (refilled)
Request 7: Token consume → Bucket = [🪙]         → ALLOW ✓
Request 8: Token consume → Bucket = []           → ALLOW ✓
Request 9: No token!                             → REJECT ✗
```

### Burst Traffic — Token Bucket ka Superpower:
```
Normal algorithms: 10 req/sec strictly
Token Bucket:      Bucket full ho toh burst allow karo!

Example:
  Rate: 10 tokens/sec, Capacity: 50 tokens
  
  User 5 seconds idle raha → Bucket = 50 tokens (full)
  Suddenly 50 requests ek saath → Sab ALLOW ✓ (burst!)
  
  Ye real-world mein useful hai:
  - User ne page refresh kiya → multiple requests ek saath
  - Mobile app background sync → batch requests
```

### Code Implementation:
```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity   = capacity;    // Max tokens
    this.tokens     = capacity;    // Current tokens (start full)
    this.refillRate = refillRate;  // Tokens per second
    this.lastRefill = Date.now();  // Last refill timestamp
  }

  // Tokens refill karo based on elapsed time
  refill() {
    const now     = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const newTokens = elapsed * this.refillRate;

    this.tokens     = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefill = now;
  }

  // Request allow karo ya nahi?
  allowRequest(tokensNeeded = 1) {
    this.refill(); // Pehle refill karo

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded;
      return {
        allowed:   true,
        remaining: Math.floor(this.tokens),
        message:   'Request allowed'
      };
    }

    return {
      allowed:    false,
      remaining:  0,
      retryAfter: Math.ceil((tokensNeeded - this.tokens) / this.refillRate),
      message:    'Rate limit exceeded'
    };
  }
}

// Test karo
const bucket = new TokenBucket(5, 2); // 5 capacity, 2 tokens/sec

console.log("=== Token Bucket Test ===\n");

// 7 rapid requests
for (let i = 1; i <= 7; i++) {
  const result = bucket.allowRequest();
  console.log(`Request ${i}: ${result.allowed ? '✓ ALLOW' : '✗ REJECT'} | Remaining: ${result.remaining}`);
}

// 1 second wait
console.log("\n[Waiting 1 second...]\n");
await new Promise(r => setTimeout(r, 1000));

// 3 more requests after refill
for (let i = 8; i <= 10; i++) {
  const result = bucket.allowRequest();
  console.log(`Request ${i}: ${result.allowed ? '✓ ALLOW' : '✗ REJECT'} | Remaining: ${result.remaining}`);
}
```

### Expected Output:
```
=== Token Bucket Test ===

Request 1: ✓ ALLOW | Remaining: 4
Request 2: ✓ ALLOW | Remaining: 3
Request 3: ✓ ALLOW | Remaining: 2
Request 4: ✓ ALLOW | Remaining: 1
Request 5: ✓ ALLOW | Remaining: 0
Request 6: ✗ REJECT | Remaining: 0
Request 7: ✗ REJECT | Remaining: 0

[Waiting 1 second...]

Request 8:  ✓ ALLOW | Remaining: 1  (2 tokens refilled)
Request 9:  ✓ ALLOW | Remaining: 0
Request 10: ✗ REJECT | Remaining: 0
```

---

## 2. Leaky Bucket Algorithm

### Concept:
```
Ek bucket hai jisme requests queue hoti hain.
Requests ek fixed rate se "leak" (process) hoti hain.
Bucket full ho jaaye toh new requests drop ho jaati hain.
Burst traffic smooth out ho jaata hai.
```

### Visual Diagram:
```
Requests IN (any rate)
    ↓  ↓  ↓  ↓  ↓  ↓
    ↓  ↓  ↓  ↓  ↓  ↓
┌───▼──▼──▼──▼──▼──▼───┐
│  📨 📨 📨 📨 📨      │  ← Queue (capacity: 5)
│  [req][req][req]...   │
│                       │
│  Bucket full?         │
│  New req → DROP (429) │
└───────────┬───────────┘
            │ Fixed leak rate: 2 req/sec
            ↓  ↓
         Process  Process
```

### Step-by-step Example:
```
Config: Queue capacity = 5, Leak rate = 2 req/sec

Time 0s:  Queue = []
10 requests ek saath aaye:
  Req 1-5:  Queue = [📨📨📨📨📨]  → QUEUED ✓
  Req 6-10: Queue full!           → DROPPED ✗ (429)

Time 0.5s: Leak 1 request → Queue = [📨📨📨📨]  → Process ✓
Time 1.0s: Leak 1 request → Queue = [📨📨📨]    → Process ✓
Time 1.5s: Leak 1 request → Queue = [📨📨]      → Process ✓
Time 2.0s: Leak 1 request → Queue = [📨]        → Process ✓
Time 2.5s: Leak 1 request → Queue = []          → Process ✓

Output: Smooth 2 req/sec regardless of input burst
```

### Code Implementation:
```javascript
class LeakyBucket {
  constructor(capacity, leakRate) {
    this.capacity  = capacity;   // Max queue size
    this.queue     = [];         // Pending requests
    this.leakRate  = leakRate;   // Requests per second to process
    this.lastLeak  = Date.now();
  }

  // Queue se requests leak karo (process karo)
  leak() {
    const now     = Date.now();
    const elapsed = (now - this.lastLeak) / 1000;
    const leakCount = Math.floor(elapsed * this.leakRate);

    if (leakCount > 0) {
      // leakCount requests process karo
      const processed = this.queue.splice(0, leakCount);
      this.lastLeak = now;
      return processed;
    }
    return [];
  }

  // New request add karo
  addRequest(requestId) {
    this.leak(); // Pehle leak karo

    if (this.queue.length < this.capacity) {
      this.queue.push(requestId);
      return {
        allowed:   true,
        queueSize: this.queue.length,
        message:   `Request queued (position ${this.queue.length})`
      };
    }

    return {
      allowed:   false,
      queueSize: this.queue.length,
      message:   'Bucket full — request dropped'
    };
  }
}

// Test karo
const bucket = new LeakyBucket(5, 2); // 5 capacity, 2 req/sec

console.log("=== Leaky Bucket Test ===\n");
console.log("10 requests ek saath:\n");

for (let i = 1; i <= 10; i++) {
  const result = bucket.addRequest(`req-${i}`);
  console.log(`Request ${i}: ${result.allowed ? '✓ QUEUED' : '✗ DROPPED'} | Queue: ${result.queueSize}/5`);
}

console.log("\n[Processing at 2 req/sec...]\n");
await new Promise(r => setTimeout(r, 2000));

const processed = bucket.leak();
console.log(`Processed: ${processed.length} requests`);
console.log(`Remaining in queue: ${bucket.queue.length}`);
```

---

## 3. Token Bucket vs Leaky Bucket — Comparison

### Side by Side:
```
Feature              Token Bucket           Leaky Bucket
───────────────────  ─────────────────────  ──────────────────────
Burst traffic        ✓ Allow karta hai      ✗ Smooth out karta hai
Output rate          Variable               Fixed (constant)
Memory               Low (just counter)     Higher (queue store)
Implementation       Simple                 Moderate
Use case             APIs, web apps         Network traffic shaping
Overflow behavior    Reject immediately     Queue then reject
```

### Visual Comparison:
```
INPUT (burst of 10 requests):
████████████████████  (all at once)

TOKEN BUCKET OUTPUT:
████████████████████  (burst allowed if tokens available)
then: ██  ██  ██  ██  (refill rate pe)

LEAKY BUCKET OUTPUT:
██  ██  ██  ██  ██  ██  ██  ██  ██  ██
(smooth, fixed rate regardless of input)
```

### Kab Kaunsa Use Karein:
```
Token Bucket:
  ✓ REST APIs (burst allow karo)
  ✓ User-facing applications
  ✓ When occasional bursts are okay
  ✓ Most common choice for web apps

Leaky Bucket:
  ✓ Network packet processing
  ✓ Video streaming (smooth playback)
  ✓ When strict constant rate needed
  ✓ Downstream service protect karna ho
```

---

## 4. Real-world: Token Bucket with Redis

```javascript
// Production mein Redis use karo — distributed systems ke liye
import { createClient } from 'redis';

const redis = createClient();
await redis.connect();

async function tokenBucketRedis(userId, capacity = 10, refillRate = 2) {
  const key       = `rate_limit:${userId}`;
  const now       = Date.now();

  // Lua script — atomic operation (race condition avoid)
  const luaScript = `
    local key        = KEYS[1]
    local capacity   = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local now        = tonumber(ARGV[3])

    local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
    local tokens     = tonumber(bucket[1]) or capacity
    local lastRefill = tonumber(bucket[2]) or now

    -- Refill tokens
    local elapsed   = (now - lastRefill) / 1000
    local newTokens = elapsed * refillRate
    tokens = math.min(capacity, tokens + newTokens)

    -- Check if request allowed
    if tokens >= 1 then
      tokens = tokens - 1
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)
      return {1, math.floor(tokens)}  -- allowed, remaining
    else
      return {0, 0}  -- rejected
    end
  `;

  const result = await redis.eval(luaScript, {
    keys: [key],
    arguments: [capacity.toString(), refillRate.toString(), now.toString()]
  });

  return {
    allowed:   result[0] === 1,
    remaining: result[1]
  };
}

// Express middleware
export function rateLimitMiddleware(capacity, refillRate) {
  return async (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const result = await tokenBucketRedis(userId, capacity, refillRate);

    res.setHeader('X-RateLimit-Limit',     capacity);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      return res.status(429).json({
        error:   'rate_limit_exceeded',
        message: 'Too many requests. Please slow down.',
      });
    }

    next();
  };
}
```

---

## 5. Quick Summary

```
Token Bucket:
  - Tokens bucket mein hain
  - Har request 1 token consume karta hai
  - Fixed rate pe refill hota hai
  - Burst allow karta hai (bucket full ho toh)
  - Web APIs ke liye best

Leaky Bucket:
  - Requests queue mein jaati hain
  - Fixed rate se process hoti hain
  - Burst smooth out ho jaata hai
  - Network traffic shaping ke liye best

Both:
  - Limit exceed → 429 Too Many Requests
  - Redis mein store karo (distributed systems)
  - Lua scripts use karo (atomic operations)
```

---

## 6. Practice Tasks (Aaj Karo)

### Task 1: Token Bucket Run Karo
```javascript
// Ye file banao aur run karo:
// node token-bucket.js

const bucket = new TokenBucket(10, 5); // 10 capacity, 5/sec refill

// 15 rapid requests
for (let i = 1; i <= 15; i++) {
  const r = bucket.allowRequest();
  console.log(`Req ${i}: ${r.allowed ? 'ALLOW' : 'REJECT'} | tokens: ${r.remaining}`);
}

// 2 second wait
await new Promise(r => setTimeout(r, 2000));
console.log("\nAfter 2 seconds:");

// 5 more requests
for (let i = 16; i <= 20; i++) {
  const r = bucket.allowRequest();
  console.log(`Req ${i}: ${r.allowed ? 'ALLOW' : 'REJECT'} | tokens: ${r.remaining}`);
}
```

### Task 2: Compare Karo
```
Same scenario dono algorithms pe run karo:
  - 20 requests ek saath
  - Capacity: 5
  - Rate: 2/sec

Token Bucket:  Kitne allow, kitne reject?
Leaky Bucket:  Kitne queued, kitne dropped?

Difference observe karo.
```

### Task 3: Design Decision
```
Ye scenarios ke liye kaunsa algorithm choose karoge?

1. Twitter post API (users occasionally post multiple tweets)
   Answer: ?

2. Video streaming server (smooth bandwidth needed)
   Answer: ?

3. Login endpoint (strict limit, no burst)
   Answer: ?

Answers:
1. Token Bucket (burst okay for posting)
2. Leaky Bucket (smooth output needed)
3. Token Bucket with small capacity (5 req/min, no burst)
```

---

Kal Day 10 mein Fixed Window Counter aur Sliding Window algorithms dekhenge.
