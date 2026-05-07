# Day 8 — What & Why of Rate Limiting

Rate limiter ek aisa system hai jo control karta hai ki
ek user/IP kitni baar ek time window mein request kar sakta hai.

---

## 1. Rate Limiter Kya Solve Karta Hai?

### Problem without Rate Limiter:
```
Scenario 1 — DDoS Attack:
  Attacker: 1,000,000 requests/second bhejta hai
  Server:   Crash ho jaata hai
  Result:   Legitimate users access nahi kar paate

Scenario 2 — API Abuse:
  Bot:      Tumhara data scrape karta hai (10,000 req/min)
  Server:   Slow ho jaata hai
  Result:   Real users ko slow experience

Scenario 3 — Unfair Usage:
  Power user: 99% bandwidth use karta hai
  Others:     1% bandwidth milti hai
  Result:     Unfair resource distribution

Scenario 4 — Brute Force:
  Hacker:   Login pe 10,000 passwords try karta hai
  Server:   Koi check nahi → Account hack ho jaata hai
```

### Rate Limiter ke Fayde:
```
✓ DDoS attacks se protect karo
✓ API abuse prevent karo
✓ Fair usage ensure karo
✓ Server costs control karo
✓ Brute force attacks block karo
✓ Revenue model (free vs paid tiers)
```

---

## 2. Real-World Examples

### Twitter/X API Limits:
```
Free tier:
  Read:  500,000 tweets/month
  Write: 1,500 tweets/month

Basic tier ($100/month):
  Read:  10,000 tweets/month
  Write: 3,000 tweets/month

Exceed karo → 429 Too Many Requests
```

### GitHub API Limits:
```
Unauthenticated: 60 requests/hour per IP
Authenticated:   5,000 requests/hour per user
Search API:      30 requests/minute

Response headers:
  X-RateLimit-Limit:     5000
  X-RateLimit-Remaining: 4999
  X-RateLimit-Reset:     1372700873  (Unix timestamp)
```

### Other Examples:
```
Stripe API:      100 requests/second
Twilio SMS:      1 message/second (free tier)
OpenAI API:      3 requests/minute (free), 3500/min (paid)
Instagram API:   200 requests/hour
Spotify API:     Rate limits vary by endpoint
```

---

## 3. Types of Rate Limiting

### Type 1: Per IP
```
Ek IP address se max N requests per time window

Use case:
  - Anonymous users
  - DDoS protection
  - Login endpoint

Example:
  IP 192.168.1.1 → max 100 req/minute
  IP 192.168.1.2 → max 100 req/minute (independent)

Problem:
  - NAT ke peeche multiple users ek IP share karte hain
  - VPN use karke bypass ho sakta hai
```

### Type 2: Per User
```
Authenticated user ke liye limit

Use case:
  - API keys
  - Logged-in users
  - Subscription tiers

Example:
  user_id: 123 → max 1000 req/hour
  user_id: 456 → max 1000 req/hour

Faida:
  - More accurate than IP
  - Tier-based limits possible
```

### Type 3: Per Endpoint
```
Alag alag endpoints ke liye alag limits

Use case:
  - Expensive operations pe strict limit
  - Cheap operations pe loose limit

Example:
  POST /login          → 5 req/minute    (brute force prevent)
  GET  /users          → 100 req/minute  (normal)
  POST /send-email     → 10 req/hour     (expensive)
  GET  /health         → unlimited       (monitoring)
```

### Type 4: Per API Key
```
Developer applications ke liye

Use case:
  - Third-party integrations
  - B2B APIs

Example:
  API Key A (free):    100 req/day
  API Key B (pro):     10,000 req/day
  API Key C (enterprise): unlimited
```

### Combined Approach (Production):
```
Rule 1: Per IP     → 1000 req/hour    (DDoS protection)
Rule 2: Per User   → 500 req/hour     (fair usage)
Rule 3: Per endpoint:
  /login           → 5 req/minute
  /api/search      → 30 req/minute
  /api/export      → 5 req/hour

Most restrictive rule apply hoti hai
```

---

## 4. Functional Requirements

### Core Requirements:
```
1. Request limit enforce karo:
   - Time window define karo (1 min, 1 hour, 1 day)
   - Max requests per window define karo
   - Limit exceed hone pe block karo

2. 429 Too Many Requests return karo:
   HTTP/1.1 429 Too Many Requests
   {
     "error": "rate_limit_exceeded",
     "message": "Too many requests. Please try again later.",
     "retry_after": 45
   }

3. Rate limit headers return karo:
   X-RateLimit-Limit:     100
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset:     1710234620
   Retry-After:           45
```

### Non-Functional Requirements:
```
Low latency:    Rate limit check < 1ms add karna chahiye
High accuracy:  Exact limits enforce karo (not approximate)
Fault tolerant: Rate limiter down ho toh system kaam kare
Distributed:    Multiple servers pe consistent limits
Scalable:       Millions of users handle karo
```

---

## 5. Where to Place Rate Limiter?

### Option 1: Client Side
```
Location: Browser / Mobile App

Pros:
  + Server pe load nahi
  + Instant feedback to user

Cons:
  - Easily bypass ho sakta hai (client code modify karo)
  - Unreliable — NEVER use alone

Use: UX improvement only (disable button after click)
```

### Option 2: Server Side (Application Code)
```
Location: Express middleware, Django middleware

Pros:
  + Full control
  + Business logic ke saath integrate
  + Easy to implement

Cons:
  - Har service mein implement karna padega
  - Distributed systems mein complex

Code example:
  app.use('/api', rateLimitMiddleware);
```

### Option 3: API Gateway
```
Location: Kong, AWS API Gateway, Nginx

Pros:
  + Centralized — ek jagah configure karo
  + All services automatically protected
  + No code changes needed
  + Built-in analytics

Cons:
  - Additional infrastructure
  - Vendor lock-in possible

Best for: Microservices architecture
```

### Option 4: Load Balancer
```
Location: Nginx, HAProxy, AWS ALB

Pros:
  + Very early in request pipeline
  + DDoS protection at network level
  + High performance

Cons:
  - Limited flexibility
  - User-level limits mushkil

Best for: IP-based rate limiting, DDoS
```

### Recommended Architecture:
```
Internet
   ↓
Load Balancer (IP-based, DDoS protection)
   ↓
API Gateway (per-user, per-endpoint limits)
   ↓
Application (business logic specific limits)
   ↓
Services
```

---

## 6. Rate Limit Response — Standard Format

### HTTP 429 Response:
```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710234620
Retry-After: 45

{
  "error": "rate_limit_exceeded",
  "message": "You have exceeded the rate limit of 100 requests per minute.",
  "limit": 100,
  "remaining": 0,
  "reset_at": "2024-03-12T10:30:20Z",
  "retry_after_seconds": 45
}
```

### Success Response Headers:
```
HTTP/1.1 200 OK
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 87
X-RateLimit-Reset:     1710234620

Matlab: 100 mein se 87 remaining hain
        Reset hoga 1710234620 (Unix timestamp) pe
```

---

## 7. Hard vs Soft Rate Limiting

```
Hard Rate Limiting:
  Limit exceed → Request reject karo (429)
  Strict enforcement
  Use: Security-critical endpoints (login, payment)

Soft Rate Limiting:
  Limit exceed → Request slow karo (throttle)
  Degrade gracefully
  Use: Non-critical endpoints (search, browse)

Example:
  Hard: POST /login → 5 req/min → 6th request = 429
  Soft: GET /search → 100 req/min → 101st request = 2 second delay
```

---

## 8. Rate Limiting vs Throttling

```
Rate Limiting:
  Binary — allow ya block
  "100 requests/minute — 101st blocked"

Throttling:
  Gradual — slow down karo
  "100 requests/minute — 101st delayed by 1 second"
  "200 requests/minute — delayed by 5 seconds"

Queue-based Throttling:
  Requests queue mein daalo
  Fixed rate se process karo
  Leaky bucket algorithm (Day 9 mein detail)
```

---

## 9. Quick Summary Table

```
Type              Use Case                    Key Identifier
────────────────  ──────────────────────────  ──────────────
Per IP            DDoS, anonymous users       IP address
Per User          Authenticated APIs          user_id
Per API Key       Developer APIs              api_key
Per Endpoint      Expensive operations        URL path
Combined          Production systems          Multiple rules

Placement         Best For
────────────────  ──────────────────────────
Client side       UX only (not security)
Server middleware Small/medium apps
API Gateway       Microservices
Load Balancer     DDoS, IP-based
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Real APIs Explore Karo
```
GitHub API test karo:
  curl -I https://api.github.com/users/octocat

Response headers mein dekho:
  X-RateLimit-Limit
  X-RateLimit-Remaining
  X-RateLimit-Reset

Note karo: Unauthenticated = 60/hour
```

### Task 2: Design Decision
```
Ye scenarios ke liye rate limiting strategy decide karo:

1. Banking app ka login endpoint
   Type: ?  Limit: ?  Hard/Soft: ?

2. Social media post feed (GET)
   Type: ?  Limit: ?  Hard/Soft: ?

3. Email sending API
   Type: ?  Limit: ?  Hard/Soft: ?

4. Public weather API (free tier)
   Type: ?  Limit: ?  Hard/Soft: ?

Answers:
1. Per IP + Per User, 5/min, Hard (security critical)
2. Per User, 1000/min, Soft (UX important)
3. Per User, 100/day, Hard (cost control)
4. Per API Key, 1000/day, Hard (business model)
```

### Task 3: Requirements Define Karo
```
Ek URL shortener ke liye rate limiting requirements likho:

Endpoints:
  POST /shorten  → ?
  GET /{code}    → ?
  DELETE /urls   → ?

Consider:
  - Anonymous vs authenticated users
  - Free vs paid tier
  - DDoS protection
```

---

Kal Day 9 mein Rate Limiting Algorithms dekhenge —
Token Bucket aur Leaky Bucket practically samjhenge.
