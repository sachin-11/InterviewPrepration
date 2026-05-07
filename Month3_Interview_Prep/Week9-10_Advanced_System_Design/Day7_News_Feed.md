# Day 6 — Design a News Feed (Facebook / Twitter)

*(Month 3 Study Plan — Week 9 Day 6)*

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. User apne followed accounts / friends ki posts ka feed dekhe
2. Nayi post create karna (text, media links)
3. Feed chronological ya ranked (product clarify — usually ranked + recency mix)
4. Infinite scroll — next page load
5. Like, comment counts (engagement) — optional deep
6. Delete / hide post — consistency with cached feeds
```

### Non-Functional Requirements:
```
Availability:   High — read-heavy system
Latency:        Feed load < few seconds (p99); first screen fastest
Scale:          Billions of users, millions of posts/day, heavy fan-out for celebrities
Consistency:    Post visible eventual OK; user-facing "my post" strong after write
```

---

## 2. Capacity Estimation (5 min)

```
Assumptions:

DAU:                    500 million
Avg follows per user:   200 (Twitter skewed — many lurkers, few heavy)
Posts/day:              500 million

Fan-out (if pure write):
  Worst post: 50M followers (celebrity) → 50M feed inserts for ONE post — bottleneck

Read path:
  Each user opens feed 20x/day → huge read QPS
  Home timeline fetch: top K posts (e.g. K=400 cached, show 20)

Storage:
  Post metadata + media refs — TB scale; feed lists per user — petabyte class at scale
```

**Interview punchline:** Celebrity fan-out write path explode ho jata hai — isliye **hybrid** strategy standard hai.

---

## 3. High-Level Architecture

```
┌─────────────┐   ┌─────────────┐
│   Client    │   │   Client    │
└──────┬──────┘   └──────┬──────┘
       │ REST            │
       ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LB                        │
└─────────────────────────────────────────────────────────────┘
       │                          │
       ▼                          ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ POST SERVICE │           │ FEED SERVICE                      │
│ (create post)│           │ (read timeline)                   │
└──────┬───────┘           └──────────────┬───────────────────┘
       │                                  │
       │ publish                          │ read
       ▼                                  ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ FAN-OUT      │           │ FEED CACHE (Redis)                │
│ WORKER       │           │ user_feed:{id} → post IDs list    │
│ (Kafka cons.)│           └──────────────┬───────────────────┘
└──────┬───────┘                          │
       │                                  │
       ▼                                  ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ FEED STORE   │           │ RANKING / ML SERVICE (optional)   │
│ (per-user    │           │ re-order top N before response    │
│  timeline)   │           └──────────────────────────────────┘
└──────┬───────┘
       │
┌──────────────┐           ┌──────────────────────────────────┐
│ POST STORE   │           │ GRAPH SERVICE                     │
│ + OBJECT     │           │ follow edges                     │
│   STORAGE    │           └──────────────────────────────────┘
└──────────────┘

        ┌─────────────────────────────────────┐
        │  MESSAGE BUS (Kafka)                 │
        │  topic: new_post, fanout_jobs        │
        └─────────────────────────────────────┘
```

---

## 4. Fan-out on Write vs Fan-out on Read

### Fan-out on write (pre-compute feed):
```
Jab user A post karta hai:
  Har follower F ke liye: F ki home_feed list mein post_id prepend karo

Pros:
  Read path fast — sirf user ki pre-built list fetch
Cons:
  Celebrity: 50M writes per post — slow, expensive, worker queue jam
```

### Fan-out on read (compute on request):
```
Read time pe:
  User ki follow list lo → har followed user ki recent posts merge + sort

Pros:
  Post create cheap (O(1))
Cons:
  Read expensive — 200 follows × recent posts = heavy query + sort on every refresh
```

### Hybrid (production pattern):
```
Regular user (< threshold followers, e.g. 10k–100k):
  Fan-out on WRITE into followers' feed shards

Celebrity / high fan-out:
  Fan-out on READ — unki post alag "global / celebrity pool" se merge
  OR partial write to "active" followers only + read merge

Twitter-style mental model:
  Home timeline = merged(cached fan-out chunk, materialized celeb tweets)
```

---

## 5. Celebrity Problem (High Follower Count)

```
Problem:
  Single post → millions of timeline updates

Mitigations:
1. Threshold: follower_count > X → "celebrity" flag, skip per-follower insert
2. Merge at read: fetch user's feed cache + fetch recent posts from followed celebs in parallel
3. Separate hot storage for celebrity timelines (sharded by author_id)
4. Rate limit how many celeb accounts get full fan-out (none for mega accounts)

Interview drawing:
  Normal post → Kafka fan-out worker → batch insert into follower feed rows
  Celeb post → only write to author's own "outbox" + lightweight notify
```

---

## 6. Feed Ranking Algorithm

```
Naive: strict reverse chronological post IDs

Real: score = f(recency, engagement, author affinity, content type, ...)

Stages (typical):
1. Candidate generation: thousands of post IDs (from feed cache + celeb merge + ads slot)
2. Lightweight ranking: linear model / GBDT on features
3. Heavy model (optional): top hundreds only — latency budget

Features examples:
  - time decay
  - mutual follows, past likes on author
  - post engagement velocity (likes/sec)
  - media type, link domain quality

Serving:
  Online feature store + cache; batch precompute user/author embeddings
```

**Interview tip:** Ranking ko **separate service** bolo; feed service IDs deta hai, ranker order deta hai — independent iterate.

---

## 7. Pagination — Cursor-Based

### Kyun cursor, offset nahi?
```
OFFSET 10000:
  DB slow — deep pagination scan
  Concurrent new posts → duplicate / skip rows

Cursor:
  (last_post_id, last_timestamp) ya opaque token
  Next page: WHERE (ts, id) < (cursor_ts, cursor_id) ORDER BY ts DESC LIMIT 20

Stable cursor:
  Tie-break with post_id; monotonic Snowflake ID helps
```

### Ranked feed:
```
Chronological cursor simple

Ranked feed:
  Session-based snapshot harder — often "refresh" new ranked page,
  ya cursor = rank position + seed (reproducibility tradeoffs)

Product: "Since you last opened" marker separate from deep pagination
```

---

## 8. Cache Strategy for Feeds

```
Layers:
1. CDN: not for personalized home (mostly dynamic)
2. Redis per user: top N post IDs (e.g. 400–1000) — hot path
3. DB: durable feed rows / post metadata

Patterns:
- Cache-aside: miss → reconstruct from DB (expensive — avoid on hot users)
- Write-through for fan-out: worker writes DB + Redis pipeline

Invalidation:
  Post deleted → tombstone post_id; reader filters OR async purge from lists
  Stale OK short TTL for non-critical metadata; counts eventual

Sharding:
  feed:user_id → shard by user_id mod N
```

---

## 9. Data Model (Sketch)

```
posts:
  post_id (Snowflake), author_id, text, media_ids, created_at, deleted_at

follows:
  follower_id, followee_id, created_at
  (heavy read: followee_id index for celeb read fan-out)

user_timeline (fan-out store):
  user_id, post_id, inserted_at
  PRIMARY KEY (user_id, inserted_at DESC, post_id)

celebrity_recent_posts:
  author_id, post_id, created_at  — small list per celeb
```

---

## 10. Post Create → Fan-out Flow

```
1. Client POST → Post Service
2. Persist post row (author_id, content, post_id)
3. If author NOT celebrity:
     Kafka message: {post_id, author_id, follower_batch_cursor}
   Fan-out workers:
     Pull followers in pages (10k) → bulk insert into each follower timeline shard
4. If celebrity:
     Write to author outbox only; optional push to "subscribers who opted realtime"
5. Invalidate / warm cache for author's own profile feed
```

---

## 11. Interview Questions & Answers

### Q: "Pure fan-out on write kyun nahi?"
```
Celebrity explosion — write amplification O(followers) per post
Hybrid se write bounded + read manageable merge
```

### Q: "Strong consistency between post and feed?"
```
Usually eventual — acceptable for social feed
Author immediately sees own post via write path / profile cache
```

### Q: "Global sort across 200 follows on read?"
```
Pull top M from each followee recent (bounded), merge-k sorted lists — heap O(K log N)
Still heavy — hybrid reduces need
```

### Q: "Feed rank transparency / filter bubble?"
```
Product ethics — out of infra scope but good awareness
```

---

## 12. Quick Summary

```
Fan-out WRITE: pre-compute timelines — fast read, bad for mega influencers
Fan-out READ: cheap write, expensive read
Hybrid: normal users write fan-out; celebrities merged at read
Ranking: multi-stage retrieval + models — decouple from storage
Pagination: cursor > offset; tie-break with post_id
Cache: Redis hot list per user; shard by user_id

Key line:
  "News feed = fan-out problem + ranking problem; celebrities force hybrid."
```

---

## 13. Practice Tasks (Aaj Karo)

### Task 1: Diagram
```
Draw: Post → Kafka → Fan-out workers → per-user feed store
      Read: Feed Service → Redis → merge celebs → Ranker → client
```

### Task 2: Mock (45 min)
```
"Design Twitter feed" / "Design Facebook news feed"
  Clarify ranking vs chronological; nail hybrid fan-out
```

### Task 3: Drills
```
1. Celebrity 50M followers — exact design?
2. Cursor vs offset?
3. Post delete — cache invalidation?
4. Why Kafka between post and fan-out?
```

---

Kal study plan ke hisaab se Day 7 pe Week 9 Revision / ya Week 10 topics (folder ke hisaab se aage badhenge).
