# Day 1 — Fundamentals & Requirements

---

## 1. System Design Interview Approach

Interview mein sabse pehle ye samajhna hota hai ki problem ko structured way mein solve karo. Ek framework follow karo:

```
Step 1: Requirements Clarify karo (5 min)
Step 2: Capacity Estimate karo (5 min)
Step 3: High-Level Design banao (10 min)
Step 4: Deep Dive karo (15 min)
Step 5: Edge Cases & Bottlenecks discuss karo (5 min)
```

Interviewer ko dikhana hota hai ki tum sochte kaise ho, na ki sirf answer dete ho.

---

## 2. Functional vs Non-Functional Requirements

### Functional Requirements
"System kya karta hai" — features aur capabilities

### Non-Functional Requirements
"System kaisa karta hai" — quality attributes

```
Functional                    Non-Functional
─────────────────────────     ──────────────────────────
URL shorten karna             High Availability (99.9%)
Short URL pe redirect         Low Latency (< 100ms)
URL expire karna              Scalability (millions of users)
Analytics track karna         Durability (data loss nahi)
```

---

## 3. URL Shortener Kya Hota Hai

Ek long URL ko ek chhoti unique URL mein convert karna.

```
Original:  https://www.example.com/blog/how-to-learn-system-design-in-2024
Shortened: https://bit.ly/3xKpQ2
```

Real-world examples:
- bit.ly  — marketing campaigns mein use hota hai
- tinyurl — sabse purana
- t.co    — Twitter ka internal shortener

Kaam kaise karta hai basically:
```
User → short URL click karta hai
     → Server pe request jaati hai
     → Server original URL dhundta hai
     → 301/302 redirect karta hai
     → User original site pe pahunch jaata hai
```

---

## 4. Functional Requirements — Detail

### (a) Short URL Generate Karna
- User ek long URL deta hai
- System ek unique short code banata hai (e.g., abc123)
- Short URL return hoti hai: https://short.ly/abc123
- Same URL dobara submit kare toh same short URL mile ya nayi? — ye clarify karna hota hai

### (b) Redirect Karna
- User https://short.ly/abc123 visit kare
- System original URL pe redirect kare
- 301 vs 302 redirect — important difference:

```
301 Permanent Redirect:
  - Browser cache kar leta hai
  - Dobara server pe request nahi aati
  - Server load kam, but analytics miss ho jaati

302 Temporary Redirect:
  - Browser cache nahi karta
  - Har baar server pe request aati hai
  - Analytics track ho sakti hai (recommended for URL shorteners)
```

### (c) URL Expiry
- Kuch URLs sirf limited time ke liye valid honi chahiye
- e.g., "ye link 7 din baad expire ho jaaye"
- Default expiry set kar sakte hain (e.g., 1 year)
- Expired URL pe jaane pe 410 Gone ya custom error page dikhao

### (d) Analytics (Optional)
- Kitni baar click hua
- Kahan se click hua (country, device)
- Kab click hua (time-based graph)
- Ye async hona chahiye — redirect slow nahi hona chahiye analytics ki wajah se

---

## 5. Non-Functional Requirements — Detail

### High Availability (99.9% uptime)
```
99.9%  = ~8.7 hours downtime/year   (acceptable)
99.99% = ~52 minutes downtime/year  (better)
```
- Agar system down hai toh millions of links kaam nahi karenge
- Solution: multiple servers, load balancer, DB replication

### Low Latency (< 100ms)
- Redirect bahut fast hona chahiye
- User ko feel nahi hona chahiye ki koi extra step hai
- Solution: Redis cache mein popular URLs store karo

### Scalability
- Read heavy system hai (100:1 read/write ratio)
- Millions of redirects per day handle karne chahiye
- Solution: horizontal scaling (servers badhao), CDN, caching

### Durability
- Ek baar short URL bani toh permanently kaam karni chahiye
- Data loss nahi hona chahiye
- Solution: DB backups, replication, persistent storage

---

## 6. Quick Summary Table

```
Requirement        Kya matlab           Solution Direction
─────────────────  ───────────────────  ──────────────────────
Short URL banana   Unique code gen      Base62 / Hashing
Redirect           Fast lookup          Redis Cache
Expiry             TTL management       Redis TTL + DB cleanup
Analytics          Click tracking       Async queue (Kafka)
High Availability  No downtime          Load balancer + replicas
Low Latency        Fast response        Cache layer
Scalability        Handle more users    Horizontal scaling
```

---

## 7. Practice Task (Karo aaj)

Ek blank paper lo aur khud se ye likho:
1. URL shortener ke 4 functional requirements apne words mein
2. 3 non-functional requirements aur unka reason
3. 301 vs 302 ka difference ek line mein

Kal Day 2 mein in requirements ke basis pe Capacity Estimation karenge.
