# Day 10 — Algorithms Part 2: Fixed Window, Sliding Window Log & Counter

Aaj 3 aur algorithms dekhenge — inme se Sliding Window Counter
production mein sabse zyada use hota hai.

---

## 1. Fixed Window Counter

### Concept:
```
Time ko fixed windows mein divide karo (e.g., 1 minute each).
Har window mein ek counter hota hai.
Request aaye → counter++
Counter limit se zyada → reject (429)
Window end → counter reset
```

### Visual Diagram:
```
Time:  0s ──────── 60s ──────── 120s ──────── 180s
       │  Window 1  │  Window 2  │  Window 3   │
       │            │            │             │
       │ req: 1-100 │ req: 1-100 │ req: 1-100  │
       │ (allowed)  │ (allowed)  │ (allowed)   │
       │ req: 101+  │            │             │
       │ (rejected) │            │             │
       └────────────┴────────────┴─────────────┘
                    ↑            ↑
                 RESET         RESET
```

### Step-by-step Example:
```
Limit: 100 req/minute

Window 1 (0:00 - 1:00):
  Requests 1-100  → ALLOW ✓
  Request 101     → REJECT ✗ (429)
  Request 102     → REJECT ✗

At 1:00 → Counter RESET to 0

Window 2 (1:00 - 2:00):
  Requests 1-100  → ALLOW ✓ (fresh window)
```

### THE PROBLEM — Boundary Attack:
```
Limit: 100 req/minute

Window 1 ends at 1:00
Window 2 starts at 1:00

Attack:
  12:59 → 100 requests (last second of Window 1) → ALL ALLOWED ✓
  1:00  → Counter resets
  1:01  → 100 requests (first second of Window 2) → ALL ALLOWED ✓

Result: 200 requests in 2 seconds! (2x the limit)
```

```
Timeline:
  ──────────────────────────────────────────────
  0:58  0:59  1:00  1:01  1:02
              ↑
           RESET
  
  Window 1:  ░░░░░░░░░░░░████████████  (100 req at 0:59)
  Window 2:  ████████████░░░░░░░░░░░░  (100 req at 1:01)
                         ↑
                    200 req in 2 sec!
```

### Code Implementation:
```javascript
class FixedWindowCounter {
  constructor(limit, windowSizeMs) {
    this.limit        = limit;
    this.windowSizeMs = windowSizeMs;
    this.counters     = new Map(); // windowKey → count
  }

  getWindowKey() {
    // Current window ka unique key
    return Math.floor(Date.now() / this.windowSizeMs);
  }

  allowRequest(userId) {
    const key     = `${userId}:${this.getWindowKey()}`;
    const current = this.counters.get(key) || 0;

    if (current >= this.limit) {
      const windowEnd    = (this.getWindowKey() + 1) * this.windowSizeMs;
      const retryAfterMs = windowEnd - Date.now();
      return {
        allowed:    false,
        count:      current,
        retryAfter: Math.ceil(retryAfterMs / 1000)
      };
    }

    this.counters.set(key, current + 1);
    return {
      allowed:   true,
      count:     current + 1,
      remaining: this.limit - current - 1
    };
  }
}

// Test — boundary problem demonstrate karo
const limiter = new FixedWindowCounter(5, 10000); // 5 req per 10 sec

console.log("=== Fixed Window Counter ===\n");

for (let i = 1; i <= 7; i++) {
  const r = limiter.allowRequest('user1');
  console.log(`Req ${i}: ${r.allowed ? '✓ ALLOW' : '✗ REJECT'} | count: ${r.count}`);
}
```

### Pros & Cons:
```
Pros:
  ✓ Simple implement karna
  ✓ Memory efficient (sirf counter store)
  ✓ Fast O(1) operations
  ✓ Redis mein easy (INCR + EXPIRE)

Cons:
  ✗ Boundary attack possible (2x traffic)
  ✗ Bursty behavior at window boundaries
  ✗ Not accurate for strict rate limiting
```

---

## 2. Sliding Window Log

### Concept:
```
Har request ka timestamp store karo.
Request aaye → purane timestamps remove karo (window se bahar)
Remaining timestamps count karo
Count < limit → allow, else reject
```

### Visual Diagram:
```
Limit: 5 req/minute
Current time: 1:30

Timestamps stored:
  [1:05, 1:15, 1:20, 1:25, 1:28]
         ↑
   1:05 is within last 60 seconds? YES (1:30 - 1:05 = 25s < 60s)

New request at 1:30:
  Count = 5 (already at limit) → REJECT ✗

New request at 1:31:
  Remove timestamps older than 0:31 (1:31 - 60s)
  1:05 → remove (too old? 1:31 - 1:05 = 86s > 60s) → REMOVE
  Remaining: [1:15, 1:20, 1:25, 1:28]
  Count = 4 < 5 → ALLOW ✓
```

### Sliding Window — No Boundary Problem:
```
Fixed Window problem:
  12:59 → 100 req → ALLOWED (Window 1)
  1:01  → 100 req → ALLOWED (Window 2 reset)
  Total: 200 req in 2 sec ← PROBLEM

Sliding Window Log:
  12:59 → 100 req → ALLOWED
  1:01  → Check last 60 seconds:
          12:59 to 1:01 = 100 requests still in window
          → REJECT ✗ (accurate!)
```

### Code Implementation:
```javascript
class SlidingWindowLog {
  constructor(limit, windowSizeMs) {
    this.limit        = limit;
    this.windowSizeMs = windowSizeMs;
    this.logs         = new Map(); // userId → [timestamps]
  }

  allowRequest(userId) {
    const now        = Date.now();
    const windowStart = now - this.windowSizeMs;

    // User ka log lo ya empty array
    if (!this.logs.has(userId)) {
      this.logs.set(userId, []);
    }

    const userLog = this.logs.get(userId);

    // Purane timestamps remove karo (window se bahar)
    const validLog = userLog.filter(ts => ts > windowStart);

    if (validLog.length >= this.limit) {
      // Kitni der baad retry karein?
      const oldestInWindow = validLog[0];
      const retryAfter     = Math.ceil((oldestInWindow + this.windowSizeMs - now) / 1000);

      this.logs.set(userId, validLog);
      return {
        allowed:    false,
        count:      validLog.length,
        retryAfter: retryAfter
      };
    }

    // Current request add karo
    validLog.push(now);
    this.logs.set(userId, validLog);

    return {
      allowed:   true,
      count:     validLog.length,
      remaining: this.limit - validLog.length
    };
  }
}

// Test
const limiter = new SlidingWindowLog(5, 60000); // 5 req/minute

console.log("=== Sliding Window Log ===\n");

for (let i = 1; i <= 7; i++) {
  const r = limiter.allowRequest('user1');
  console.log(`Req ${i}: ${r.allowed ? '✓ ALLOW' : '✗ REJECT'} | count: ${r.count} | remaining: ${r.remaining || 0}`);
}
```

### Pros & Cons:
```
Pros:
  ✓ Most accurate — no boundary problem
  ✓ Smooth rate limiting
  ✓ Exact retry time batata hai

Cons:
  ✗ Memory expensive — har request ka timestamp store
  ✗ High traffic pe memory issue
    1M users × 100 req = 100M timestamps in memory!
  ✗ Cleanup overhead (old timestamps remove karna)
  ✗ Redis mein sorted sets use karne padte hain
```

---

## 3. Sliding Window Counter

### Concept:
```
Fixed Window + Sliding Window ka best of both worlds.

Formula:
  current_count = current_window_count
                + previous_window_count × overlap_percentage

Overlap = kitna previous window current window mein overlap karta hai
```

### Visual Diagram:
```
Limit: 100 req/minute

Previous Window (0:00 - 1:00): 80 requests
Current Window  (1:00 - 2:00): 30 requests so far
Current time: 1:15 (15 seconds into current window)

Overlap calculation:
  Current window mein 15/60 = 25% time guzra
  Previous window ka 75% still "relevant" hai

Estimated count:
  = 30 + (80 × 0.75)
  = 30 + 60
  = 90 requests

90 < 100 → ALLOW ✓

At 1:30 (50% into current window):
  = 30 + (80 × 0.50)
  = 30 + 40
  = 70 requests → ALLOW ✓
```

### Formula Explained:
```
overlap = (window_size - time_elapsed_in_current_window) / window_size

estimated_count = current_window_requests
                + previous_window_requests × overlap

Example:
  Window = 60 seconds
  Time elapsed in current window = 15 seconds
  overlap = (60 - 15) / 60 = 0.75 (75%)

  Previous window: 80 req
  Current window:  30 req

  Estimated = 30 + (80 × 0.75) = 90
```

### Code Implementation:
```javascript
class SlidingWindowCounter {
  constructor(limit, windowSizeMs) {
    this.limit        = limit;
    this.windowSizeMs = windowSizeMs;
    this.windows      = new Map(); // userId → {current, previous, windowStart}
  }

  allowRequest(userId) {
    const now        = Date.now();
    const windowKey  = Math.floor(now / this.windowSizeMs);

    if (!this.windows.has(userId)) {
      this.windows.set(userId, {
        current:     0,
        previous:    0,
        windowStart: windowKey
      });
    }

    const data = this.windows.get(userId);

    // New window shuru hua?
    if (data.windowStart !== windowKey) {
      // Current → Previous, reset current
      data.previous    = data.current;
      data.current     = 0;
      data.windowStart = windowKey;
    }

    // Overlap calculate karo
    const elapsed    = now % this.windowSizeMs;
    const overlap    = (this.windowSizeMs - elapsed) / this.windowSizeMs;
    const estimated  = data.current + (data.previous * overlap);

    if (estimated >= this.limit) {
      return {
        allowed:   false,
        estimated: Math.ceil(estimated),
        message:   'Rate limit exceeded'
      };
    }

    data.current++;
    return {
      allowed:   true,
      estimated: Math.ceil(estimated + 1),
      remaining: Math.floor(this.limit - estimated - 1)
    };
  }
}

// Test
const limiter = new SlidingWindowCounter(5, 10000); // 5 req/10 sec

console.log("=== Sliding Window Counter ===\n");

for (let i = 1; i <= 7; i++) {
  const r = limiter.allowRequest('user1');
  console.log(`Req ${i}: ${r.allowed ? '✓ ALLOW' : '✗ REJECT'} | estimated: ${r.estimated} | remaining: ${r.remaining || 0}`);
}
```

### Pros & Cons:
```
Pros:
  ✓ Memory efficient (sirf 2 counters per user)
  ✓ No boundary attack problem (approximate)
  ✓ Fast O(1) operations
  ✓ Redis mein easy implement
  ✓ Best balance of accuracy & memory

Cons:
  ✗ Approximate (not 100% accurate)
  ✗ Edge cases mein thoda off ho sakta hai
  ✗ Slightly complex than fixed window
```

---

## 4. All 5 Algorithms — Complete Comparison Table

```
Algorithm           Memory    Accuracy   Burst    Complexity  Best For
──────────────────  ────────  ─────────  ───────  ──────────  ──────────────────────
Token Bucket        Low       Good       Allow    Low         REST APIs, web apps
Leaky Bucket        Medium    Good       Smooth   Medium      Network, streaming
Fixed Window        Very Low  Poor       Allow    Very Low    Simple use cases
Sliding Window Log  High      Excellent  Prevent  Medium      Strict accuracy needed
Sliding Window      Low       Good       Prevent  Medium      Production (best choice)
Counter
```

### Detailed Comparison:
```
Feature              Token    Leaky    Fixed    SW Log   SW Counter
───────────────────  ───────  ───────  ───────  ───────  ──────────
Boundary attack      N/A      N/A      YES ✗    NO ✓     NO ✓
Memory usage         Low      Medium   Very Low High     Low
Burst traffic        Allow    Smooth   Allow    Prevent  Prevent
Implementation       Easy     Medium   Easy     Medium   Medium
Redis support        Easy     Medium   Easy     Complex  Easy
Accuracy             Good     Good     Poor     Exact    ~95%
Production use       Common   Network  Avoid    Rare     Most common
```

---

## 5. Redis Implementation — Sliding Window Counter

```javascript
// Production ready — Redis ke saath
import { createClient } from 'redis';

const redis = createClient();
await redis.connect();

async function slidingWindowCounter(userId, limit, windowSec) {
  const now        = Math.floor(Date.now() / 1000); // seconds
  const windowKey  = Math.floor(now / windowSec);
  const currKey    = `swc:${userId}:${windowKey}`;
  const prevKey    = `swc:${userId}:${windowKey - 1}`;

  // Atomic operations
  const [currCount, prevCount] = await Promise.all([
    redis.get(currKey),
    redis.get(prevKey)
  ]);

  const curr    = parseInt(currCount) || 0;
  const prev    = parseInt(prevCount) || 0;
  const elapsed = now % windowSec;
  const overlap = (windowSec - elapsed) / windowSec;

  const estimated = curr + (prev * overlap);

  if (estimated >= limit) {
    return { allowed: false, estimated: Math.ceil(estimated) };
  }

  // Increment current window
  await redis.multi()
    .incr(currKey)
    .expire(currKey, windowSec * 2) // 2 windows tak rakho
    .exec();

  return {
    allowed:   true,
    estimated: Math.ceil(estimated + 1),
    remaining: Math.floor(limit - estimated - 1)
  };
}
```

---

## 6. Which Algorithm to Choose?

```
Interview mein ye bolna:

"I would use Sliding Window Counter because:
  1. Memory efficient — sirf 2 counters per user
  2. No boundary attack problem
  3. ~95% accurate — good enough for rate limiting
  4. Easy Redis implementation
  5. O(1) time complexity

For strict accuracy (e.g., billing), I'd use Sliding Window Log
despite higher memory cost."
```

---

## 7. Practice Tasks (Aaj Karo)

### Task 1: Boundary Problem Demonstrate Karo
```javascript
// Fixed Window boundary attack simulate karo:
const limiter = new FixedWindowCounter(5, 10000); // 5 req/10 sec

// Window end ke paas 5 requests
for (let i = 1; i <= 5; i++) limiter.allowRequest('attacker');

// Window reset hone ke baad 5 aur
await new Promise(r => setTimeout(r, 10000)); // wait for reset
for (let i = 1; i <= 5; i++) {
  const r = limiter.allowRequest('attacker');
  console.log(`Req ${i}: ${r.allowed ? 'ALLOW' : 'REJECT'}`);
}
// 10 requests in 10 seconds — 2x the limit!
```

### Task 2: Sab Algorithms Compare Karo
```
Same scenario sab pe run karo:
  Limit: 5 req/minute
  Input: 8 requests rapid fire

Note karo:
  Fixed Window:       Kitne allow?
  Sliding Window Log: Kitne allow?
  Sliding Window Counter: Kitne allow?
```

### Task 3: Algorithm Choose Karo
```
Ye scenarios ke liye best algorithm batao aur kyun:

1. Bank transaction API (strict, no boundary issues)
   Answer: ?

2. Social media feed API (high traffic, memory concern)
   Answer: ?

3. Simple internal tool (low traffic, easy to implement)
   Answer: ?

Answers:
1. Sliding Window Log (exact accuracy critical)
2. Sliding Window Counter (memory efficient, accurate enough)
3. Fixed Window (simple, low traffic mein boundary issue rare)
```

---

Kal Day 11 mein High-Level Design dekhenge —
Redis ke saath distributed rate limiter architecture.
