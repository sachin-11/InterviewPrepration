# Day 13 — Edge Cases & Rules

Aaj production mein aane wale real edge cases handle karenge.
Ye woh topics hain jo interviews mein senior engineers se pooche jaate hain.

---

## 1. Hard vs Soft Rate Limiting

### Hard Rate Limiting:
```
Limit exceed → Request immediately reject karo (429)
No exceptions, no delays

Use cases:
  ✓ Security-critical endpoints (login, payment)
  ✓ Expensive operations (AI API calls, email sending)
  ✓ Strict business rules (free tier limits)
  ✓ DDoS protection

Example:
  Limit: 5 req/min on POST /login
  6th request → 429 immediately
  No matter who the user is
```

### Soft Rate Limiting (Throttling):
```
Limit exceed → Request slow karo, queue karo, ya warn karo
Graceful degradation

Use cases:
  ✓ Non-critical read endpoints
  ✓ Good UX important ho
  ✓ Paying customers (don't want to block them)
  ✓ Background jobs

Example:
  Limit: 100 req/min on GET /feed
  101st request → 2 second delay, then process
  200th request → 10 second delay
  500th request → 429 (finally block)
```

### Implementation:
```javascript
// Hard rate limiter
export function hardRateLimit(limit, windowSec) {
  return async (req, res, next) => {
    const result = await checkLimit(req.ip, limit, windowSec);
    if (!result.allowed) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        retry_after: result.retryAfter
      });
    }
    next();
  };
}

// Soft rate limiter (throttle with delay)
export function softRateLimit(limit, windowSec) {
  return async (req, res, next) => {
    const result = await checkLimit(req.ip, limit, windowSec);

    if (!result.allowed) {
      // Delay calculate karo based on how much over limit
      const overLimit = result.count - limit;
      const delay     = Math.min(overLimit * 500, 10000); // Max 10 sec

      await new Promise(r => setTimeout(r, delay));

      // Warn karo but allow
      res.setHeader('X-RateLimit-Warning', 'Approaching rate limit');
    }

    next(); // Always allow (just delayed)
  };
}

// Usage
app.post('/login',    hardRateLimit(5, 60));    // Strict
app.get('/feed',      softRateLimit(100, 60));  // Lenient
```

---

## 2. Rate Limit by: IP vs User ID vs API Key

### Per IP:
```
Key: req.ip  →  "192.168.1.1"

Pros:
  ✓ Works for anonymous users
  ✓ DDoS protection
  ✓ No auth needed

Cons:
  ✗ NAT: Office ke 100 employees ek IP share karte hain
    → Ek employee limit hit kare → Sab block!
  ✗ VPN/Proxy se bypass ho sakta hai
  ✗ Dynamic IPs (mobile users)

Best for:
  - Public endpoints (no auth)
  - DDoS protection layer
  - Login/signup endpoints
```

### Per User ID:
```
Key: req.user.id  →  "user:12345"

Pros:
  ✓ Accurate per-person limiting
  ✓ NAT problem nahi
  ✓ Tier-based limits possible

Cons:
  ✗ Auth required (anonymous users ke liye nahi)
  ✗ Multiple accounts banake bypass possible

Best for:
  - Authenticated API endpoints
  - Subscription-based limits
  - User-specific quotas
```

### Per API Key:
```
Key: req.headers['x-api-key']  →  "sk-abc123"

Pros:
  ✓ Developer/application level control
  ✓ Easy to revoke
  ✓ Per-application limits
  ✓ Usage tracking

Cons:
  ✗ Key leak → Attacker use kar sakta hai
  ✗ Key rotation complexity

Best for:
  - B2B APIs
  - Third-party integrations
  - Developer platforms (like OpenAI, Stripe)
```

### Combined Strategy (Production):
```javascript
function getIdentifier(req) {
  // Priority order:
  // 1. API Key (most specific)
  // 2. User ID (authenticated)
  // 3. IP (fallback)

  if (req.headers['x-api-key']) {
    return `apikey:${req.headers['x-api-key']}`;
  }
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${req.ip}`;
}

// Different limits per identifier type
function getLimitConfig(identifier) {
  if (identifier.startsWith('apikey:')) {
    return { limit: 10000, windowSec: 3600 }; // API keys: 10k/hour
  }
  if (identifier.startsWith('user:')) {
    return { limit: 1000, windowSec: 3600 };  // Users: 1k/hour
  }
  return { limit: 100, windowSec: 3600 };     // IPs: 100/hour
}
```

### Decision Table:
```
Scenario                          Use
────────────────────────────────  ──────────────────
Public API, no auth               Per IP
Logged-in user dashboard          Per User ID
Developer API (like OpenAI)       Per API Key
Login/signup page                 Per IP (strict)
Premium user features             Per User ID (higher limit)
Microservice to microservice      Per Service ID / API Key
```

---

## 3. Whitelisting & Blacklisting

### Whitelist — Always Allow:
```
Kuch IPs/users ko rate limiting se exempt karo

Use cases:
  - Internal services (monitoring, health checks)
  - Admin users
  - Trusted partners
  - Your own servers

Implementation:
```

```javascript
const WHITELIST_IPS = new Set([
  '10.0.0.1',      // Internal monitoring
  '10.0.0.2',      // Admin server
  '203.0.113.5',   // Trusted partner
]);

const WHITELIST_USERS = new Set([
  'admin',
  'system',
  'internal-service'
]);

function isWhitelisted(req) {
  if (WHITELIST_IPS.has(req.ip)) return true;
  if (WHITELIST_USERS.has(req.user?.id)) return true;
  return false;
}

// Middleware mein:
export function rateLimiterWithWhitelist(config) {
  return async (req, res, next) => {
    // Whitelist check — skip rate limiting
    if (isWhitelisted(req)) {
      res.setHeader('X-RateLimit-Whitelisted', 'true');
      return next();
    }

    // Normal rate limiting
    return rateLimiter(config)(req, res, next);
  };
}
```

### Blacklist — Always Block:
```
Kuch IPs/users ko permanently block karo

Use cases:
  - Known attackers
  - Spam bots
  - Abusive users
  - Malicious API keys

Implementation:
```

```javascript
// Redis mein blacklist store karo (dynamic)
async function isBlacklisted(identifier) {
  const result = await redis.get(`blacklist:${identifier}`);
  return result !== null;
}

async function addToBlacklist(identifier, reason, ttlSeconds = null) {
  const key = `blacklist:${identifier}`;
  await redis.set(key, JSON.stringify({
    reason,
    blockedAt: new Date().toISOString()
  }));

  // TTL set karo (null = permanent)
  if (ttlSeconds) {
    await redis.expire(key, ttlSeconds);
  }
}

// Auto-blacklist: Too many 429s
async function autoBlacklist(req) {
  const key   = `abuse:${req.ip}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour window

  // 100 rate limit violations in 1 hour → blacklist for 24 hours
  if (count >= 100) {
    await addToBlacklist(`ip:${req.ip}`, 'Too many rate limit violations', 86400);
    console.log(`Auto-blacklisted: ${req.ip}`);
  }
}

// Middleware:
export function rateLimiterWithBlacklist(config) {
  return async (req, res, next) => {
    const identifier = getIdentifier(req);

    // Blacklist check
    if (await isBlacklisted(identifier)) {
      return res.status(403).json({
        error:   'access_denied',
        message: 'Your access has been blocked due to policy violations.'
      });
    }

    const result = await checkLimit(identifier, config.limit, config.windowSec);

    if (!result.allowed) {
      await autoBlacklist(req); // Track violations
      return res.status(429).json({ error: 'rate_limit_exceeded' });
    }

    next();
  };
}
```

---

## 4. Multi-Tier Rate Limiting

### Per Second + Per Day:
```
Real-world APIs have multiple windows:
  Stripe:  100 req/sec  AND  1000 req/day
  OpenAI:  3500 req/min AND  90000 req/day (tokens)
  GitHub:  5000 req/hour (authenticated)
```

### Implementation:
```javascript
// Multiple windows check karo
async function multiTierRateLimit(identifier, tiers) {
  const results = await Promise.all(
    tiers.map(tier => checkLimit(
      `${identifier}:${tier.name}`,
      tier.limit,
      tier.windowSec
    ))
  );

  // Sab tiers pass hone chahiye
  const blocked = results.find(r => !r.allowed);

  if (blocked) {
    return {
      allowed:    false,
      blockedBy:  tiers[results.indexOf(blocked)].name,
      retryAfter: blocked.retryAfter
    };
  }

  // Most restrictive remaining return karo
  const minRemaining = Math.min(...results.map(r => r.remaining));
  return { allowed: true, remaining: minRemaining };
}

// Usage
const TIERS = [
  { name: 'per_second', limit: 10,    windowSec: 1    },
  { name: 'per_minute', limit: 100,   windowSec: 60   },
  { name: 'per_hour',   limit: 1000,  windowSec: 3600 },
  { name: 'per_day',    limit: 10000, windowSec: 86400 }
];

app.use('/api', async (req, res, next) => {
  const identifier = getIdentifier(req);
  const result     = await multiTierRateLimit(identifier, TIERS);

  if (!result.allowed) {
    return res.status(429).json({
      error:      'rate_limit_exceeded',
      blocked_by: result.blockedBy,
      retry_after: result.retryAfter
    });
  }

  res.setHeader('X-RateLimit-Remaining', result.remaining);
  next();
});
```

### Tier-based User Limits:
```javascript
const USER_TIERS = {
  free: [
    { name: 'per_minute', limit: 10,   windowSec: 60    },
    { name: 'per_day',    limit: 100,  windowSec: 86400 }
  ],
  pro: [
    { name: 'per_minute', limit: 100,  windowSec: 60    },
    { name: 'per_day',    limit: 5000, windowSec: 86400 }
  ],
  enterprise: [
    { name: 'per_minute', limit: 1000, windowSec: 60    },
    { name: 'per_day',    limit: -1,   windowSec: 86400 } // -1 = unlimited
  ]
};

async function userTierRateLimit(req, res, next) {
  const userTier = req.user?.tier || 'free';
  const tiers    = USER_TIERS[userTier];
  const result   = await multiTierRateLimit(`user:${req.user?.id}`, tiers);

  if (!result.allowed) {
    return res.status(429).json({
      error:   'quota_exceeded',
      message: `${userTier} plan limit reached. Upgrade for more requests.`,
      upgrade_url: '/pricing'
    });
  }
  next();
}
```

---

## 5. Redis Down — Fail Open vs Fail Closed

### Fail Open:
```
Redis down → Allow all requests (ignore rate limiting)

Behavior:
  try {
    result = await redis.incr(key)
  } catch (err) {
    // Redis down → allow request
    return next();
  }

Pros:
  ✓ Service available
  ✓ Users not affected
  ✓ Good UX

Cons:
  ✗ Rate limiting disabled temporarily
  ✗ Abuse possible during outage

Use when:
  - Rate limiting is for fair usage (not security)
  - Service availability > strict limiting
  - GET endpoints, read operations
```

### Fail Closed:
```
Redis down → Reject all requests (503 Service Unavailable)

Behavior:
  try {
    result = await redis.incr(key)
  } catch (err) {
    // Redis down → reject request
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

Pros:
  ✓ No abuse during outage
  ✓ Strict protection maintained

Cons:
  ✗ Service unavailable
  ✗ Bad UX
  ✗ Revenue loss

Use when:
  - Security critical (login, payment)
  - Strict compliance required
  - POST/write operations
```

### Hybrid Approach (Best):
```javascript
async function resilientRateLimit(req, res, next) {
  try {
    const result = await checkLimitRedis(req.ip);

    if (!result.allowed) {
      return res.status(429).json({ error: 'rate_limit_exceeded' });
    }
    next();

  } catch (err) {
    console.error('Redis down:', err.message);

    // Endpoint ke hisaab se decide karo
    const isCritical = CRITICAL_ENDPOINTS.includes(req.path);

    if (isCritical) {
      // Fail closed — security endpoints
      return res.status(503).json({
        error:   'service_unavailable',
        message: 'Rate limiting service is down. Please try again.'
      });
    } else {
      // Fail open — non-critical endpoints
      res.setHeader('X-RateLimit-Fallback', 'true');
      next();
    }
  }
}

const CRITICAL_ENDPOINTS = ['/login', '/payment', '/admin'];
```

### Redis Fallback — In-Memory:
```javascript
// Redis down hone pe local memory use karo
const localCounters = new Map();

async function rateLimitWithFallback(identifier, limit, windowSec) {
  try {
    // Primary: Redis
    return await checkLimitRedis(identifier, limit, windowSec);

  } catch (redisErr) {
    console.warn('Redis unavailable, using local fallback');

    // Fallback: In-memory (less accurate but works)
    const window = Math.floor(Date.now() / 1000 / windowSec);
    const key    = `${identifier}:${window}`;
    const count  = (localCounters.get(key) || 0) + 1;
    localCounters.set(key, count);

    // Cleanup old entries
    setTimeout(() => localCounters.delete(key), windowSec * 1000);

    return {
      allowed:   count <= limit,
      remaining: Math.max(0, limit - count),
      fallback:  true  // Flag: using fallback
    };
  }
}
```

---

## 6. Complete Production Rate Limiter

```javascript
// middleware/productionRateLimiter.js
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', err => console.error('Redis error:', err));
await redis.connect();

const WHITELIST = new Set(process.env.WHITELIST_IPS?.split(',') || []);
const localFallback = new Map();

export function productionRateLimiter({
  tiers       = [{ name: 'default', limit: 100, windowSec: 60 }],
  keyFn       = (req) => req.ip,
  failOpen    = true,
  criticalPath = false
} = {}) {

  return async (req, res, next) => {
    const identifier = keyFn(req);

    // 1. Whitelist check
    if (WHITELIST.has(req.ip)) return next();

    // 2. Blacklist check
    try {
      const blocked = await redis.get(`blacklist:${identifier}`);
      if (blocked) {
        return res.status(403).json({ error: 'access_denied' });
      }
    } catch {}

    // 3. Multi-tier rate limit check
    try {
      for (const tier of tiers) {
        const window = Math.floor(Date.now() / 1000 / tier.windowSec);
        const key    = `rl:${tier.name}:${identifier}:${window}`;
        const count  = await redis.incr(key);

        if (count === 1) await redis.expire(key, tier.windowSec);

        if (count > tier.limit) {
          const ttl = await redis.ttl(key);
          res.setHeader('X-RateLimit-Limit',     tier.limit);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset',     Math.floor(Date.now()/1000) + ttl);
          res.setHeader('Retry-After',           ttl);

          return res.status(429).json({
            error:       'rate_limit_exceeded',
            tier:        tier.name,
            limit:       tier.limit,
            retry_after: ttl
          });
        }

        res.setHeader('X-RateLimit-Remaining',
          Math.max(0, tier.limit - count));
      }

      next();

    } catch (err) {
      // Redis down
      if (criticalPath || !failOpen) {
        return res.status(503).json({ error: 'service_unavailable' });
      }
      res.setHeader('X-RateLimit-Fallback', 'true');
      next();
    }
  };
}
```

---

## 7. Quick Summary

```
Hard vs Soft:
  Hard → Reject immediately (security endpoints)
  Soft → Delay/throttle (non-critical endpoints)

Identifier:
  IP      → Anonymous, DDoS protection
  User ID → Authenticated, fair usage
  API Key → Developer APIs, B2B

Whitelist → Always allow (internal, admin)
Blacklist → Always block (attackers, abusers)
Auto-blacklist → Too many violations → auto-block

Multi-tier:
  Per second + per minute + per day
  Most restrictive tier wins

Redis Down:
  Fail Open  → Allow (availability > security)
  Fail Closed→ Block (security > availability)
  Hybrid     → Critical = closed, others = open
```

---

## 8. Practice Tasks (Aaj Karo)

### Task 1: Whitelist Test
```javascript
// Whitelist implement karo
// Whitelisted IP se request karo → No rate limit headers
// Normal IP se request karo → Rate limit headers dikhein
```

### Task 2: Multi-tier Design
```
Ek URL shortener ke liye multi-tier limits design karo:

Free user:
  POST /shorten → ? req/min, ? req/day
  GET /{code}   → ? req/min

Pro user ($10/month):
  POST /shorten → ? req/min, ? req/day
  GET /{code}   → ? req/min

Answer:
  Free:  POST 10/min, 100/day | GET 1000/min
  Pro:   POST 100/min, 5000/day | GET unlimited
```

### Task 3: Failure Scenario
```
Ye scenarios mein fail open ya fail closed choose karo:

1. POST /payment/process
   Answer: Fail Closed (security critical)

2. GET /products/list
   Answer: Fail Open (read, non-critical)

3. POST /login
   Answer: Fail Closed (brute force risk)

4. GET /health
   Answer: Fail Open (monitoring must work)
```

---

Kal Day 14 — Week 2 Final Revision + Mock Practice.
Poora Rate Limiter system design karenge blank paper pe.
