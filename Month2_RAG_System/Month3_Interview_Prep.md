# Month 3: Interview Prep — Complete Study Plan

Focus: **Advanced System Design** → **DSA (medium)** → **Mocks + Apply**  
Format: har din **Topics** + **Practice** (Month 2 plan jaisa).

---

## Month 3 Overview

```
Week 9  (Day 1–7):   System Design — foundations, building blocks, core patterns
Week 10 (Day 8–14):  System Design — advanced topics, trade-offs, full designs
Week 11 (Day 15–21): DSA — medium level (patterns + timed practice)
Week 12 (Day 22–28): Mock interviews + resume/LinkedIn + apply pipeline
```

---

## Week 9: System Design — Foundations (Day 1–7)

### Day 1 — Interview Framework & Requirements
```
Topics:
  - Functional vs non-functional requirements (latency, scale, consistency)
  - Back-of-the-envelope: users, QPS, storage, bandwidth
  - API design basics (REST, idempotency, pagination)
  - Read-heavy vs write-heavy systems

Practice:
  - Ek chhota prompt (e.g. "URL shortener") par 15 min mein requirements likho
  - Traffic estimate: DAU → peak QPS rough calculation
```

### Day 2 — Load Balancing, DNS, CDN
```
Topics:
  - L4 vs L7 load balancing
  - Health checks, sticky sessions kab use karein
  - DNS hierarchy, TTL, GeoDNS
  - CDN: edge caching, cache invalidation basics

Practice:
  - Diagram banao: client → DNS → LB → servers
  - "Static assets ko CDN, API ko origin" — explain in 2 minutes
```

### Day 3 — Databases: SQL, Indexes, Replication
```
Topics:
  - Normalization vs denormalization (trade-offs)
  - Indexes: B-Tree, when indexes fail
  - Primary/replica replication, read replicas
  - Sharding intro (horizontal scaling)

Practice:
  - 2 queries likho jo index se fast hon vs slow hon — explain
  - "Read scaling" ke liye replicas vs caching — compare
```

### Day 4 — NoSQL & Data Models
```
Topics:
  - Key-value, document, wide-column, graph — kab kya
  - CAP theorem (practical intuition, not dogma)
  - Hot partitions / hot keys problem
  - Eventual consistency user-facing examples

Practice:
  - Feed / timeline ke liye SQL vs NoSQL — 1 page reasoning
  - Ek system choose karo (e.g. chat) — data model sketch
```

### Day 5 — Caching Everywhere
```
Topics:
  - Cache-aside vs write-through vs write-behind
  - Redis use cases (session, rate limit, pub/sub overview)
  - HTTP caching headers (Cache-Control, ETag)
  - Cache stampede / thundering herd (basics)

Practice:
  - "Cache invalidation strategy" for user profile — design in bullets
  - Redis vs in-memory app cache — when which
```

### Day 6 — Async: Queues, Streams, Workers
```
Topics:
  - Message queues (decoupling, retries, DLQ)
  - Kafka vs RabbitMQ (high level — log vs queue mental model)
  - Backpressure, idempotent consumers
  - Exactly-once vs at-least-once (practical)

Practice:
  - Email notification system — queue + worker diagram
  - Failure scenario: worker crash mid-job — kya hoga?
```

### Day 7 — Week 9 Revision + Mini Design
```
Mini Design (45–60 min):
  - Topic: Rate limiter OR Pastebin OR simple notification service
  - Deliver: requirements, capacity sketch, components, 1 bottleneck + mitigation

Revision:
  - Week 9 ke notes 1 page cheat sheet mein condense karo
```

---

## Week 10: System Design — Advanced (Day 8–14)

### Day 8 — Microservices vs Monolith
```
Topics:
  - Service boundaries (DDD light)
  - Sync (REST/gRPC) vs async communication
  - Service discovery, API gateway
  - Distributed transactions: Saga, outbox pattern (overview)

Practice:
  - E-commerce checkout — monolith vs microservices argument (pros/cons)
  - Ek diagram: gateway → services → DB per service
```

### Day 9 — Consistency, Consensus, Leader Election (Intro)
```
Topics:
  - Strong vs eventual consistency (where it hurts)
  - Quorum (read/write) intuition
  - Leader-follower in distributed systems (conceptual)
  - Why "distributed systems are hard" (partial failures)

Practice:
  - "Inventory count" in sale — consistency issue explain karo
  - 3 bullet: CP vs AP trade-off real product example
```

### Day 10 — Search & Full-Text (Elasticsearch etc.)
```
Topics:
  - Inverted index (intuition)
  - Elasticsearch / search service in architecture
  - Near real-time search vs batch index rebuild
  - Ranking basics (relevance)

Practice:
  - Design snippet: "search autocomplete" — components + data flow
  - Twitter search vs Google — scale difference (1 paragraph)
```

### Day 11 — Real-Time: WebSockets, Fan-out, Presence
```
Topics:
  - Long polling vs WebSockets
  - Chat / live feed fan-out (inbox pattern, push vs pull)
  - Presence (online/offline) — storage + broadcast
  - Redis pub/sub for real-time (when enough, when not)

Practice:
  - WhatsApp-style 1:1 chat — high-level design (no deep crypto)
  - Group chat vs 1:1 — extra complexity (3 points)
```

### Day 12 — Object Storage, Media, Large Files
```
Topics:
  - S3-style object storage, pre-signed URLs
  - Chunked upload, resumable uploads
  - Image/video processing pipelines (async workers)
  - CDN + origin for media

Practice:
  - YouTube / Netflix style — storage + transcoding pipeline (boxes + arrows)
  - Photo app: metadata in DB, blobs in object store — sketch
```

### Day 13 — Observability & Reliability
```
Topics:
  - Metrics, logs, traces (three pillars)
  - SLI / SLO / SLA, error budgets
  - Circuit breaker, bulkhead, retries with jitter
  - Disaster recovery: RPO, RTO

Practice:
  - "API p99 latency bad" — debugging order (what you check first)
  - Ek service ke liye 3 SLO examples likho
```

### Day 14 — Week 10 Capstone Design
```
Capstone (90 min, timed):
  - Pick ONE: Instagram feed, Uber ride matching (high level), OR Slack
  - Full: requirements, estimates, API, storage, scaling, failure mode
  - Record yourself 10 min verbal walkthrough (phone voice memo)

Checklist:
  - Trade-offs explicitly bole (not only happy path)
  - Ek "if this fails" scenario cover kiya?
```

---

## Week 11: DSA — Medium Level (Day 15–21)

### Day 15 — Arrays & Hashing (Medium)
```
Topics:
  - Prefix sum, two pointers on array
  - Hash map patterns: frequency, anagram, grouping
  - Sliding window (fixed / variable size) — template

Practice:
  - 3 problems: LeetCode style medium (1 timed 25 min)
  - Pattern diary: "is problem sliding window hai ya hash?"
```

### Day 16 — Linked List & Stack / Queue
```
Topics:
  - Dummy node, two pointers on list
  - Monotonic stack intuition
  - BFS/queue = layer-wise thinking

Practice:
  - 2 medium: list manipulation + 1 stack (parentheses / daily temperatures class)
```

### Day 17 — Trees & BST
```
Topics:
  - DFS (pre/in/post), BFS level order
  - BST search property, validation
  - LCA, path problems (common patterns)

Practice:
  - 2 medium tree + 1 BST validation / kth smallest class
```

### Day 18 — Graphs (Medium)
```
Topics:
  - Adjacency list/matrix, BFS/DFS on graph
  - Cycle detection (directed / undirected overview)
  - Topological sort (when DAG)

Practice:
  - 2 medium: number of islands / course schedule class OR clone graph
```

### Day 19 — Heaps & Greedy
```
Topics:
  - Min/max heap, k largest / merge k lists
  - Greedy: when it works, when it fails
  - Interval problems (sort + sweep)

Practice:
  - 2 heap medium + 1 interval greedy
```

### Day 20 — Dynamic Programming (Medium)
```
Topics:
  - 1D DP, 2D DP templates
  - Knapsack class, LCS class (recognition)
  - Memoization vs tabulation

Practice:
  - 2 medium DP (house robber / coin change / unique paths class)
  - Har solution ka recurrence 1 line likho
```

### Day 21 — Week 11 Mixed Timed Set
```
Timed contest (90 min):
  - 3 medium problems (mixed topics), strict timer
  - Phir 30 min: failed problems ko pattern ke saath revise

Weekly review:
  - Weak topic 1 identify karo → Week 12 mein extra 2 Q add
```

---

## Week 12: Mock Interviews + Apply (Day 22–28)

### Day 22 — Mock #1 (Full Loop)
```
Topics:
  - Mock structure: intro → problem → hints → optimal
  - Communication: think aloud, clarify before code

Practice:
  - 1 system design mock (45 min) — peer ya AI
  - 1 DSA round (45 min) — 2 medium
  - 15 min self-review: kya improve?
```

### Day 23 — Resume & Project Stories (STAR)
```
Topics:
  - 1 page resume: impact > buzzwords
  - 2–3 project stories: problem, action, metric
  - Month 2 RAG / Second Brain — 2 min pitch

Practice:
  - Resume draft update
  - Har project par "hardest bug / trade-off" 1 bullet
```

### Day 24 — Mock #2 + Behavioral
```
Topics:
  - Behavioral: conflict, failure, leadership (simple stories)
  - Company research template (product, scale, engineering blog)

Practice:
  - Mock: 1 DSA + 3 behavioral questions (record answers)
  - 1 company deep dive (30 min notes)
```

### Day 25 — Apply Pipeline & Tracking
```
Topics:
  - Application tracker (sheet): company, role, date, status
  - Referrals vs cold apply strategy
  - Follow-up email template (short)

Practice:
  - 5 targeted applications (quality > spam)
  - Tracker mein entries + next follow-up date
```

### Day 26 — Mock #3 (Weak Area Focus)
```
Topics:
  - Pehle mocks / self-review se weakest area
  - Timeboxing: brute force acceptable, then optimize

Practice:
  - Dedicated mock on weak topic only (90 min)
  - System design: ek aur capstone repeat (shorter, 45 min)
```

### Day 27 — Speed & Communication Drill
```
Topics:
  - DSA: 25 min per medium (timer)
  - System design: 5 min framework recap out loud

Practice:
  - 2 timed medium DSA
  - 10 min: "Design cache" verbal without drawing — phir draw
```

### Day 28 — Month 3 Closeout
```
Closeout:
  - Mock interview #4 OR full-day light review (notes only)
  - List: top 10 DSA patterns + top 5 system design themes
  - Next month / ongoing: 1 mock/week + 3–5 applications/week habit

Check:
  - Resume live (PDF)
  - LinkedIn headline + About updated
  - At least 15–20 quality applications total (Month 3) — adjust to your pace
```

---

## Resources (short)

```
System Design:
  - "Designing Data-Intensive Applications" (book — selective chapters)
  - System Design Primer (GitHub), engineering blogs (Uber, Netflix, Meta)

DSA:
  - LeetCode / similar — medium focus, tags filter
  - NeetCode 150 / Blind 75 — as checklist, not superstition

Mocks:
  - Pramp, Interviewing.io, peers, Excalidraw for diagrams
```

---

## Prerequisites Check

```
Month 1–2 se carry forward:
  - Basic DSA (arrays, trees, complexity) comfortable?
  - At least 1–2 end-to-end projects bolne ke liye (RAG, etc.)?

Month 3 daily:
  - 1–2 hr DSA OR system design (Week 9–11), Week 12 mein mocks priority
  - Weekend: 1 longer mock or capstone design
```
