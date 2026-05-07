# Day 5 — High-Level Architecture

Aaj hum poora system ek saath connect karenge.
Har component kya karta hai, kaise baat karta hai dusre se — ye samjhenge.

---

## 1. Complete Architecture Diagram

```
                        ┌─────────────────────────────────────────┐
                        │              CLIENTS                     │
                        │   (Browser, Mobile App, API Consumer)    │
                        └──────────────────┬──────────────────────┘
                                           │ HTTP Request
                                           ▼
                        ┌─────────────────────────────────────────┐
                        │            LOAD BALANCER                 │
                        │         (Nginx / AWS ALB)                │
                        │   Requests ko servers mein distribute    │
                        └────────┬──────────────┬─────────────────┘
                                 │              │
                    ┌────────────▼──┐      ┌────▼────────────┐
                    │  App Server 1  │      │  App Server 2   │
                    │  (Node/Java)   │      │  (Node/Java)    │
                    └────────┬───────┘      └────┬────────────┘
                             │                   │
                             └─────────┬─────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │           REDIS CACHE                    │
                    │   short_code → original_url store        │
                    │   Fast in-memory lookup (~1ms)           │
                    └──────────────────┬──────────────────────┘
                                       │ Cache Miss hone pe
                    ┌──────────────────▼──────────────────────┐
                    │          DATABASE LAYER                  │
                    │                                          │
                    │  ┌─────────────┐   ┌─────────────────┐  │
                    │  │   Primary   │   │    Read         │  │
                    │  │    DB       │──▶│   Replica 1     │  │
                    │  │  (Writes)   │   └─────────────────┘  │
                    │  │             │   ┌─────────────────┐  │
                    │  │             │──▶│   Read          │  │
                    │  └─────────────┘   │   Replica 2     │  │
                    │                    └─────────────────┘  │
                    └─────────────────────────────────────────┘
```

---

## 2. Har Component Ka Role

### Client
```
Kya hai:  Browser, Mobile app, ya koi bhi API consumer
Kya karta hai:
  - POST /shorten → URL shorten karne ke liye request bhejta hai
  - GET /abc123  → Short URL click karta hai redirect ke liye
```

### Load Balancer
```
Kya hai:  Traffic distributor (Nginx, AWS ALB, HAProxy)
Kya karta hai:
  - Incoming requests ko multiple app servers mein baanta hai
  - Agar ek server down ho toh traffic dusre pe bhejta hai
  - Health checks karta hai servers ka

Algorithms:
  Round Robin     → 1st request → Server1, 2nd → Server2, 3rd → Server1...
  Least Conn      → Jis server pe kam connections hain usse bhejo
  IP Hash         → Same user → same server (sticky session)
```

### App Servers
```
Kya hai:  Business logic run karne wale servers (Node.js, Java, Python)
Kya karta hai:
  - API requests handle karta hai
  - Short code generate karta hai
  - Cache check karta hai
  - DB se baat karta hai
  - Stateless hona chahiye (koi bhi server koi bhi request handle kar sake)
```

### Redis Cache
```
Kya hai:  In-memory key-value store
Kya karta hai:
  - short_code → original_url mapping store karta hai
  - DB se 100x fast hota hai (~1ms vs ~10ms)
  - Popular URLs memory mein rehti hain

Data structure:
  Key:   "abc123"
  Value: "https://www.example.com/very/long/url"
  TTL:   86400 seconds (1 day)
```

### Database (Primary + Replicas)
```
Kya hai:  Persistent storage (MySQL / PostgreSQL)
Kya karta hai:
  Primary:  Sirf writes handle karta hai (INSERT, UPDATE, DELETE)
  Replicas: Sirf reads handle karte hain (SELECT)

Replication:
  Primary pe koi bhi write hota hai →
  Automatically replicas pe copy ho jaata hai
```

---

## 3. Write Path — URL Shorten Karna

```
Step 1: Client POST /api/v1/shorten bhejta hai
        Body: { "original_url": "https://example.com/long" }

Step 2: Load Balancer request ko App Server 1 pe bhejta hai

Step 3: App Server:
        a. URL validate karo (valid format hai?)
        b. Check karo kya ye URL pehle se exist karti hai DB mein
        c. Nahi karti → Primary DB mein INSERT karo
        d. Auto-increment ID milta hai (e.g., 100523)
        e. Base62 encode karo → "q8X"
        f. short_code update karo DB mein

Step 4: Redis mein bhi store karo:
        SET "q8X" "https://example.com/long" EX 86400

Step 5: Client ko response bhejo:
        { "short_url": "https://short.ly/q8X" }
```

```
Write Path Diagram:

Client → Load Balancer → App Server → Primary DB (write)
                                    → Redis Cache (store)
                                    → Client (response)
```

---

## 4. Read Path — Short URL Redirect Karna

```
Step 1: Client GET /q8X request bhejta hai

Step 2: Load Balancer → App Server pe bhejta hai

Step 3: App Server Redis check karta hai:
        GET "q8X"

        ┌─ Cache HIT (80% cases) ─────────────────────────┐
        │  Redis se original_url milti hai                 │
        │  302 Redirect → "https://example.com/long"       │
        │  Total time: ~2ms                                │
        └──────────────────────────────────────────────────┘

        ┌─ Cache MISS (20% cases) ────────────────────────┐
        │  Redis mein nahi mili                            │
        │  Read Replica DB se fetch karo                   │
        │  Redis mein store karo (future ke liye)          │
        │  302 Redirect → "https://example.com/long"       │
        │  Total time: ~15ms                               │
        └──────────────────────────────────────────────────┘
```

```
Read Path Diagram:

Client → Load Balancer → App Server → Redis (check)
                                         ↓ HIT
                                      Client (redirect)
                                         ↓ MISS
                                      Read Replica DB
                                         ↓
                                      Redis (store)
                                         ↓
                                      Client (redirect)
```

---

## 5. Cache Strategy — 80/20 Rule

### Pareto Principle (80/20 Rule):
```
80% traffic → sirf 20% URLs pe aata hai
Matlab: kuch URLs bahut popular hain, baaki rarely access hoti hain
```

### Cache Strategy: LRU (Least Recently Used)
```
Cache mein limited space hai (e.g., 260 MB from Day 2)
Jab cache full ho jaaye:
  - Sabse purani (least recently used) entry remove karo
  - Nayi entry add karo

Example:
  Cache capacity: 5 URLs
  Current cache: [A, B, C, D, E]
  
  F aaya (cache miss):
  A sabse purana hai → remove karo
  Cache: [B, C, D, E, F]
```

### Cache TTL (Time To Live):
```
Har cache entry ka ek expiry time hota hai

SET "abc123" "https://example.com" EX 86400
                                       ↑
                                   86400 seconds = 1 day

Fayde:
  - Expired URLs automatically remove ho jaati hain
  - Stale data nahi rehta
  - Memory automatically free hoti hai
```

### Cache Warming:
```
System start hone pe popular URLs pehle se cache mein load karo
Taaki pehle requests pe bhi cache hit mile

SELECT short_code, original_url FROM urls
ORDER BY click_count DESC
LIMIT 10000;
-- Ye top 10k URLs Redis mein load karo at startup
```

---

## 6. DB Replication — Primary + Replicas

### Kyu Chahiye Replication?

```
Problem:
  Ek hi DB server pe sab kuch → bottleneck
  
  Reads per second = 12,000 (Day 2 se)
  Writes per second = 116
  
  Ek server 12,000 reads + 116 writes handle nahi kar sakta efficiently
```

### Solution: Read Replicas

```
Primary DB:
  - Sirf writes accept karta hai (INSERT, UPDATE, DELETE)
  - Har write automatically replicas pe copy hota hai
  - 1 primary kaafi hai (writes kam hain — 116/sec)

Read Replicas (2-3):
  - Sirf reads handle karte hain (SELECT)
  - Load distribute ho jaata hai
  - Ek replica down ho toh dusra handle karta hai

Traffic split:
  Writes (116/sec)   → Primary DB
  Reads  (12000/sec) → Read Replica 1 (6000/sec)
                     → Read Replica 2 (6000/sec)
```

### Replication Lag:
```
Primary pe write hota hai →
Thodi der baad (milliseconds) replica pe copy hota hai

Problem: Is thodi der mein agar read karo toh purana data milega
         (Eventual Consistency)

URL Shortener ke liye acceptable hai:
  Naya URL create hua → 100ms baad replica pe aaya
  Is 100ms mein agar koi click kare → cache se milega
  Cache mein nahi → primary se fetch karo (fallback)
```

---

## 7. Scalability Numbers

```
Component          Handles                  Scaling
─────────────────  ───────────────────────  ──────────────────────
Load Balancer      Millions req/sec         Active-Passive pair
App Servers        ~1000 req/sec each       Horizontal (add more)
Redis Cache        ~100,000 ops/sec         Redis Cluster
Primary DB         ~1000 writes/sec         Vertical first
Read Replicas      ~10,000 reads/sec each   Add more replicas
```

---

## 8. Complete Request Flow (End to End)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRITE FLOW (URL Shorten):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. POST /shorten → Load Balancer
2. Load Balancer → App Server (round robin)
3. App Server → Validate URL
4. App Server → Primary DB (INSERT)
5. Primary DB → Return auto-increment ID
6. App Server → Base62 encode ID
7. App Server → Redis SET short_code
8. App Server → Return short_url to client
Total time: ~50ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READ FLOW (Redirect) — Cache Hit:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GET /abc123 → Load Balancer
2. Load Balancer → App Server
3. App Server → Redis GET abc123
4. Redis → Returns original_url (HIT)
5. App Server → 302 Redirect
Total time: ~2ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READ FLOW (Redirect) — Cache Miss:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GET /abc123 → Load Balancer
2. Load Balancer → App Server
3. App Server → Redis GET abc123 (MISS)
4. App Server → Read Replica DB SELECT
5. DB → Returns original_url
6. App Server → Redis SET abc123 (cache karo)
7. App Server → 302 Redirect
Total time: ~15ms
```

---

## 9. Practice Task (Aaj Karo)

1. Blank paper pe poora architecture diagram draw karo
   (Client → LB → App Servers → Redis → DB)

2. Ye questions khud answer karo:
   - Agar Redis down ho jaaye toh kya hoga?
   - Agar Primary DB down ho jaaye toh kya hoga?
   - Agar ek App Server crash ho jaaye toh kya hoga?

3. Answers:
```
Redis down:
  → Saari requests DB pe jaayengi
  → DB pe load badh jaayega
  → Slow ho jaayega but system kaam karega (degraded mode)
  → Redis restart hone pe cache warm karo

Primary DB down:
  → Naye URLs create nahi ho paayenge (writes fail)
  → Existing URLs redirect karte rahenge (reads from replicas)
  → Standby primary promote karo (failover ~30 sec)

App Server crash:
  → Load Balancer health check fail detect karega
  → Traffic baaki servers pe route ho jaayega
  → Auto-scaling se naya server spin up hoga
  → User ko koi impact nahi (seamless)
```

---

Kal Day 6 mein Deep Dive karenge —
Snowflake IDs, URL expiry cleanup, analytics async processing.
