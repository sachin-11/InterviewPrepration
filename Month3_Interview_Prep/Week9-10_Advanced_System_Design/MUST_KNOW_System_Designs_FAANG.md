# MUST-KNOW System Designs — FAANG & Top Product Companies
> Top of the World banne ke liye ye sab yaad kar lo

---

## COVERAGE MAP — Kya Already Hai vs Kya Naya Hai

| Already Covered | Naya (Is File Mein) |
|---|---|
| Chat System (WhatsApp) | URL Shortener (TinyURL) |
| Video Streaming (Netflix) | Google Drive / Dropbox |
| Ride Sharing (Uber) | Typeahead / Autocomplete |
| News Feed (Facebook) | Unique ID Generator (Snowflake) |
| Rate Limiter | Web Crawler |
| Search System | Distributed Job Scheduler |
| Notification System | Ad Click Aggregation |
| Fintech / Payments | Ticket Booking (BookMyShow) |
| | E-Commerce (Amazon) |
| | Food Delivery (Zomato/Swiggy) |
| | Google Docs (Collaborative Editing) |
| | Nearby Friends / Yelp |
| | Real-Time Leaderboard |
| | CDN Design |
| | Stock Trading System |
| | Instagram Stories |

---

# 1. URL Shortener (TinyURL / Bitly)
> Frequency: VERY HIGH — almost every company puchta hai

## Requirements
```
Functional:
- Long URL → Short URL generate karo (e.g. tinyurl.com/abc123)
- Short URL → Original URL redirect karo
- Custom alias support (optional)
- URL expiry (optional)

Non-Functional:
- 100M URLs per day write
- 10:1 read:write ratio → 1 Billion reads/day
- 10 years data retain karo
- < 10ms redirect latency
- High availability
```

## Capacity Estimation
```
Writes: 100M / day = ~1200 writes/sec
Reads:  1B / day   = ~12,000 reads/sec

Storage per URL: ~500 bytes
10 years: 100M × 365 × 10 × 500B = ~180 TB
```

## Core Design Decisions

### Short URL Generation — 3 Approaches:
```
Option 1: Hash (MD5/SHA256) → take first 7 chars
  - Collision possible
  - Need to handle collisions with bloom filter

Option 2: Base62 Encoding of Auto-increment ID
  - 62^7 = 3.5 Trillion combinations (enough)
  - Predictable (security issue)
  - [RECOMMENDED for interviews]

Option 3: Pre-generated Keys (KGS — Key Generation Service)
  - Separate service generates keys beforehand
  - Stores in DB (used/unused tables)
  - No collision, no real-time computation
  - [BEST for scale]
```

## Architecture
```
Client → Load Balancer → App Servers → Cache (Redis) → DB (MySQL/Cassandra)

Write Flow:
1. Long URL aaya
2. Check if already exists (cache/DB)
3. Generate short key (via KGS or Base62)
4. Store {short_key → long_url, created_at, expiry, user_id}
5. Return short URL

Read Flow:
1. short URL aaya → extract key
2. Redis cache check karo (80% hit rate expected)
3. Miss → DB se fetch → cache mein store
4. 301 (permanent) or 302 (temporary) redirect
```

## DB Schema
```sql
urls (
  short_key   VARCHAR(10) PRIMARY KEY,
  long_url    TEXT NOT NULL,
  user_id     BIGINT,
  created_at  TIMESTAMP,
  expires_at  TIMESTAMP,
  click_count BIGINT DEFAULT 0
)
```

## Scaling
```
- Read heavy → Redis cache with LRU eviction
- DB sharding by short_key (consistent hashing)
- Separate analytics pipeline (Kafka + ClickHouse) for click counts
- CDN ke edge servers pe cache hot URLs
```

---

# 2. Google Drive / Dropbox — File Storage System
> Frequency: HIGH — Google, Microsoft, Dropbox interviews

## Requirements
```
Functional:
- File upload/download
- File sync across devices
- File/folder sharing (read/write permissions)
- File versioning (last 30 versions)
- Conflict resolution (two devices same file edit kare)
- Offline access

Non-Functional:
- 50M DAU, 10GB free per user
- 99.99% durability
- < 500ms sync latency
- Support files up to 50GB
```

## Chunked Upload — Key Concept
```
Large file ko chunks mein divide karo (4MB each)
- Upload each chunk separately
- Server pe chunks reassemble karo
- Identical chunks detect karo (deduplication)
- Resumable uploads → network cut hone pe bhi resume ho

Benefits:
1. Network failure pe sirf failed chunk retry
2. Parallel chunk upload → faster
3. Deduplication → storage 30-40% save
```

## Architecture
```
                    ┌──────────────┐
Client App ──────── │  API Gateway │
(Delta Sync)        └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        Block Service  Metadata    Notification
        (S3 chunks)    Service      Service
                       (MySQL)      (WebSocket)
                          │
                     File Version
                       Table
```

## Delta Sync Algorithm
```
1. Client file change detect karta hai (file watcher)
2. Changed blocks calculate karo (Rsync algorithm)
3. Sirf changed blocks upload karo (bandwidth save)
4. Server pe version create karo
5. Other devices ko notification bhejo
6. Devices sirf diff download kare
```

## DB Schema
```sql
files (
  file_id     UUID PRIMARY KEY,
  owner_id    BIGINT,
  name        VARCHAR(255),
  size        BIGINT,
  mime_type   VARCHAR(100),
  parent_id   UUID,  -- folder hierarchy
  is_deleted  BOOLEAN
)

file_chunks (
  chunk_hash  VARCHAR(64) PRIMARY KEY,  -- SHA256
  s3_path     TEXT,
  size        INT
)

file_versions (
  version_id  UUID,
  file_id     UUID,
  chunk_ids   JSON,  -- ordered list of chunk hashes
  created_at  TIMESTAMP,
  created_by  BIGINT
)

permissions (
  file_id     UUID,
  user_id     BIGINT,
  role        ENUM('viewer', 'editor', 'owner')
)
```

## Conflict Resolution
```
Last-Write-Wins (LWW): Simple, data loss possible
Operational Transformation (OT): Used in Google Docs
Version Vector: Detect conflicts, user ko dono versions dikhao

Dropbox approach:
- Conflict file create karo (filename_conflict_2024.docx)
- User manually merge kare
```

---

# 3. Typeahead / Search Autocomplete
> Frequency: VERY HIGH — Google, Amazon, Flipkart

## Requirements
```
Functional:
- User type kare → top 5 suggestions show karo
- Real-time (< 100ms)
- Trending searches include karo
- Personalized (optional)

Non-Functional:
- 10M DAU, 10 searches/user/day
- 100M queries/day
- Suggestions within 100ms
```

## Core Data Structure — Trie
```
Trie (Prefix Tree):
         root
        /    \
       a      b
      / \      \
     p   n      e
    /     \      \
   p       k      e
   |
   l
   |
   e (apple → 15M searches)

- Each node stores: character + search_count + top_5_suggestions
- Query: "app" → traverse a→p→p → return stored top 5
- Space: O(Total characters in all words)
- Time: O(prefix length) for lookup
```

## Optimized Architecture
```
Data Collection Service:
- User queries → Kafka → Aggregator → Update search counts
- Aggregate every 1 hour (real-time update karna expensive)

Trie Service:
- Trie in memory (Redis/custom)
- Snapshot to disk every 6 hours
- Two tries: one serving, one being updated
- Atomic swap when update complete

Query Flow:
Client → CDN/Browser Cache (1min TTL) → LB → Trie Servers

Trie Sharding:
- By prefix (a-m on server1, n-z on server2)
- Problem: skewed (s prefix has more words)
- Solution: shard by actual frequency distribution
```

## Ranking Formula
```
score = frequency × recency_weight × personalization_weight

recency_weight:
- Last hour: 1.0
- Last day: 0.8
- Last week: 0.5
- Older: 0.2
```

---

# 4. Unique ID Generator (Twitter Snowflake)
> Frequency: HIGH — asked as a component in most system designs

## Why Not Auto-Increment?
```
- Distributed system mein multiple DB nodes hain
- Node A: 1, 2, 3... Node B: 1, 2, 3... → COLLISION!
- Auto-increment single point of failure hai
```

## Requirements
```
- Globally unique
- 64-bit integer (sortable, numeric)
- Time-ordered (newer IDs > older IDs)
- 10,000 IDs/ms per server
- No single point of failure
```

## Snowflake Format (64 bits)
```
┌─────────────────┬─────────────────┬──────────────────┬──────────────┐
│   1 bit (sign)  │  41 bits (ms)   │  10 bits (node)  │ 12 bits (seq)│
└─────────────────┴─────────────────┴──────────────────┴──────────────┘

- 1 bit:   Always 0 (positive number)
- 41 bits: Milliseconds since epoch (69 years capacity)
- 10 bits: Machine ID (1024 machines)
- 12 bits: Sequence number (4096 IDs per ms per machine)

Total capacity: 1024 machines × 4096 IDs/ms = 4M IDs/ms
```

## Implementation
```javascript
class SnowflakeIDGenerator {
  constructor(machineId) {
    this.machineId = machineId;  // 0-1023
    this.sequence = 0;
    this.lastTimestamp = -1;
    this.epoch = 1609459200000;  // 2021-01-01
  }

  generate() {
    let timestamp = Date.now() - this.epoch;
    
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xFFF;  // 12 bit mask
      if (this.sequence === 0) {
        // Sequence overflow — wait for next ms
        while (Date.now() - this.epoch <= this.lastTimestamp) {}
        timestamp = Date.now() - this.epoch;
      }
    } else {
      this.sequence = 0;
    }
    
    this.lastTimestamp = timestamp;
    
    return BigInt(timestamp) << 22n |
           BigInt(this.machineId) << 12n |
           BigInt(this.sequence);
  }
}
```

## Alternatives
```
UUID v4:    128-bit, random, not sortable, storage heavy
ULID:       26-char, time-sortable, URL-safe
NanoID:     Custom alphabet, shorter than UUID
DB Sequence: Single point of failure
```

---

# 5. Web Crawler (Google Search Indexer)
> Frequency: MEDIUM-HIGH — Google, Bing interviews

## Requirements
```
Functional:
- Internet crawl karo aur pages index karo
- Revisit pages for freshness (every 7 days for popular)
- Duplicate content detect karo
- Robots.txt respect karo
- Handle different content types (HTML, PDF, images)

Non-Functional:
- 1 Billion pages/month crawl karo
- 500 TB storage/month
- Politeness (same domain pe flood mat karo)
- Distributed (thousands of crawler nodes)
```

## Architecture
```
                    ┌─────────────────┐
                    │   Seed URLs     │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  URL Frontier   │ ← Priority Queue
                    │  (BFS Queue)    │
                    └────────┬────────┘
                             ▼
              ┌──────────────────────────┐
              │      DNS Resolver        │ ← Cache DNS results
              └──────────┬───────────────┘
                         ▼
              ┌──────────────────────────┐
              │     Crawler Workers      │ ← Thousands of nodes
              │  (politeness: 1 req/s    │
              │   per domain)            │
              └──────────┬───────────────┘
                         ▼
         ┌───────────────┼──────────────────┐
         ▼               ▼                  ▼
   HTML Parser    Content Store       Link Extractor
   (Kafka)        (S3 + ElasticSearch) (→ URL Frontier)
         │
         ▼
   Duplicate Detector
   (SimHash / MinHash)
```

## Key Algorithms

### URL Priority Queue
```
Priority Factors:
- PageRank score (high authority sites first)
- Freshness (last crawled kab)
- Update frequency (news sites > static pages)
- Domain diversity (ek domain pe mat atak jao)
```

### Duplicate Detection — SimHash
```
Problem: Same content, different URLs
Solution: SimHash (locality sensitive hashing)

1. Page content → extract words + weights (TF-IDF)
2. Each word → 64-bit hash
3. Weighted sum → 64-bit fingerprint
4. Similar content → similar fingerprint
5. Hamming distance < 3 → duplicate

Storage: 1 Billion hashes × 8 bytes = 8 GB (fits in memory!)
```

### Politeness Policy
```
- Per-domain queue maintain karo
- Minimum 1 second between requests to same domain
- Robots.txt parse karo → blocked paths skip karo
- User-Agent properly set karo
- Rate limit per IP
```

---

# 6. Distributed Job Scheduler
> Frequency: MEDIUM — Uber, LinkedIn, Airbnb interviews

## Requirements
```
Functional:
- Schedule jobs (one-time or recurring cron)
- Job priorities
- Job retries on failure
- Job dependencies (Job B runs after Job A)
- Job status tracking

Non-Functional:
- 100K jobs/day
- At-least-once execution guarantee
- Job execution within 1 minute of scheduled time
- Horizontal scalability
```

## Architecture
```
API Layer:
  POST /jobs  { type, cron_expr, payload, priority, max_retries }

                    ┌─────────────────────┐
                    │     Job Store       │
                    │ (PostgreSQL + Redis) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Scheduler        │ ← Leader election (Zookeeper)
                    │  (Polling loop)     │   Only one scheduler active
                    └──────────┬──────────┘
                               │ (ready jobs)
                    ┌──────────▼──────────┐
                    │   Message Queue     │
                    │     (Kafka)         │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
         Worker-1          Worker-2          Worker-N
         (email)           (report)          (cleanup)
```

## Job States
```
PENDING → QUEUED → RUNNING → SUCCESS
                           → FAILED → RETRYING → FAILED (final)
                           → TIMEOUT
```

## DB Schema
```sql
jobs (
  job_id       UUID PRIMARY KEY,
  name         VARCHAR(255),
  type         VARCHAR(100),
  payload      JSONB,
  cron_expr    VARCHAR(100),  -- NULL for one-time
  next_run_at  TIMESTAMP,
  last_run_at  TIMESTAMP,
  status       VARCHAR(20),
  priority     INT DEFAULT 5,
  max_retries  INT DEFAULT 3,
  retry_count  INT DEFAULT 0,
  created_at   TIMESTAMP
)
```

## At-Least-Once Guarantee
```
1. Job acquire: Pessimistic lock (SELECT ... FOR UPDATE SKIP LOCKED)
2. Heartbeat: Worker every 30s update karta hai last_heartbeat
3. Timeout detection: Scheduler checks if heartbeat stopped → re-queue
4. Idempotency: Job payload mein idempotency_key rakho
```

---

# 7. Ad Click Aggregation System
> Frequency: MEDIUM-HIGH — Meta, Google, Twitter interviews

## Requirements
```
Functional:
- Ad clicks record karo (advertiser_id, ad_id, user_id, timestamp, geo)
- Real-time dashboard: clicks in last 1 min / 1 hour / 1 day
- Top 100 ads by clicks (last hour)
- Query: SELECT clicks WHERE ad_id=X AND time BETWEEN A AND B

Non-Functional:
- 1 Billion clicks/day = ~12,000 clicks/sec
- Query latency < 1 second
- Data accuracy (no double counting)
- At-least-once click delivery
```

## Architecture — Lambda Architecture
```
Clicks → Kafka → ─────────────────────────────┐
                 │                             │
                 ▼ (Speed Layer)               ▼ (Batch Layer)
            Flink/Spark                   Spark Batch
            Streaming                     (hourly/daily)
            (1-min windows)               (full accuracy)
                 │                             │
                 ▼                             ▼
           Redis (real-time)          ClickHouse / Druid
           aggregates                 (historical OLAP)
                 │                             │
                 └──────────┬──────────────────┘
                            ▼
                     Query Service
                     (serves dashboard)
```

## Deduplication (Click Fraud Prevention)
```
Problem: Same click multiple times (network retry, malicious bot)

Solution 1: Redis SETNX with click_id (TTL 5 min)
  - click_id = hash(ad_id + user_id + timestamp_minute)
  - If already exists → discard

Solution 2: Kafka exactly-once semantics
  - Producer idempotency ON
  - Transactional consumer
```

## Top-K Ads — Heavy Hitters
```
Naive approach: Sort all ads → O(N log N) — too slow

Heap approach:
- Min-heap of size K (100)
- Stream through all ads
- If click_count > heap.min → replace

Count-Min Sketch:
- Probabilistic, memory efficient
- O(1) update, O(1) query
- Small error margin (±ε)
- Used by Twitter, Facebook for trending topics
```

---

# 8. Ticket Booking System (BookMyShow / Ticketmaster)
> Frequency: HIGH — Amazon, Flipkart, BookMyShow interviews

## Requirements
```
Functional:
- Shows/events list karo (movies, concerts)
- Available seats dikhao
- Seat select karo + book karo
- Payment process karo
- Booking confirmation send karo
- Cancellation support

Non-Functional:
- No double booking (strong consistency for seats)
- 10M users, 100K concurrent during popular events
- < 3 second booking time
- Handle traffic spikes (Coldplay concert announce → 10x spike)
```

## The Core Problem — Seat Locking
```
User A aur User B same seat select karte hain simultaneously.

Solution 1: Pessimistic Lock
  SELECT seat WHERE seat_id=X FOR UPDATE
  - Transaction hold karo jab tak payment ho
  - Timeout: 10 minutes
  - Problem: High contention, deadlock possible

Solution 2: Optimistic Lock (version number)
  UPDATE seat SET booked_by=user, version=version+1
  WHERE seat_id=X AND version=expected_version
  - Conflict pe retry
  - Low contention ke liye better

Solution 3: Redis Distributed Lock (RECOMMENDED)
  SETNX seat_lock:{seat_id} {user_id} PX 600000  (10 min TTL)
  - Fast (in-memory)
  - TTL se auto-expire
  - Seat "selected" state maintain karo
  - Lua script for atomic check-and-set
```

## Architecture
```
User → LB → API Gateway
              │
    ┌─────────┼──────────────┐
    ▼         ▼              ▼
 Show       Seat          Booking
 Service   Service        Service
    │         │              │
    ▼         ▼              ▼
 MySQL      Redis         MySQL
 (shows,   (seat locks,   (bookings,
  events)   availability) payments)
              │
              ▼
          Cassandra
          (seat status
           for scale)
```

## Seat Status State Machine
```
AVAILABLE → LOCKED (user ne select kiya, 10 min TTL)
         → BOOKED  (payment success)
         → AVAILABLE (payment failed / timeout)
         → CANCELLED (user cancel kiya → refund)
```

## Handle Traffic Spikes
```
Queue-based approach:
1. Virtual waiting room (like Ticketmaster)
2. User enters queue → gets position number
3. Tokens release karo in batches (e.g., 100 users/min)
4. Only token holders can access booking page

Implementation:
- Redis ZADD waiting_queue {timestamp} {user_id}
- ZRANK → position in queue
- Background job: every minute → release next 100 tokens
```

---

# 9. E-Commerce System (Amazon / Flipkart)
> Frequency: HIGH — especially for Amazon SDE

## Requirements
```
Functional:
- Product catalog (search, browse, filter)
- Shopping cart
- Order placement
- Inventory management
- Order tracking
- Reviews & ratings

Non-Functional:
- 100M DAU, 10M orders/day
- Black Friday: 10x normal traffic
- Inventory accuracy (no overselling)
- < 2 second page load
```

## Microservices Breakdown
```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
└──────┬────────┬──────────┬───────────┬──────────────────┘
       ▼        ▼          ▼           ▼
  Product    Cart        Order      Inventory
  Service    Service     Service    Service
     │          │           │           │
     ▼          ▼           ▼           ▼
 Elastic      Redis       MySQL      MySQL +
  Search    (session)   (orders)    Redis
  (catalog)                         (stock)
     │
     ▼
  S3 (images)
  CloudFront (CDN)
```

## Inventory — Oversell Prevention
```
Problem: 100 users simultaneously buy last item

Solution 1: Database Lock
  UPDATE inventory SET quantity = quantity - 1
  WHERE product_id = X AND quantity > 0
  → Returns 0 rows if out of stock → reject order

Solution 2: Redis Atomic Decrement
  DECRBY inventory:product_X 1
  IF result < 0 → INCRBY (rollback) → reject order
  Else → reserve in DB (async)

Solution 3: Two-Phase Reservation
  1. Reserve: soft lock inventory (15 min TTL)
  2. Payment success → confirm reservation
  3. Payment fail / timeout → release reservation
```

## Order State Machine
```
PLACED → PAYMENT_PENDING → PAYMENT_DONE → CONFIRMED
                         → PAYMENT_FAILED → CANCELLED
CONFIRMED → PROCESSING → SHIPPED → DELIVERED
          → CANCELLED (before shipped)
DELIVERED → RETURN_REQUESTED → RETURNED
```

## Flash Sale / Big Billion Day
```
Pre-sale:
- Warm up all caches
- Pre-generate product pages (static HTML on CDN)
- Disable non-essential features (reviews, suggestions)

During sale:
- Queue incoming requests (token bucket)
- Async order processing (Kafka)
- Inventory in Redis (DB sync async)
- Circuit breaker for downstream services

Post-sale:
- Reconcile Redis ↔ DB inventory
- Process queued orders
- Send confirmation emails (bulk batch)
```

---

# 10. Food Delivery System (Zomato / Swiggy / DoorDash)
> Frequency: HIGH — startup to FAANG

## Requirements
```
Functional:
- Restaurants browse/search (by location, cuisine, rating)
- Menu + add to cart
- Order place karo
- Real-time delivery tracking
- Driver matching
- ETA calculation

Non-Functional:
- 10M orders/day
- Real-time location updates (< 5 sec lag)
- Driver location accuracy: 10 meters
- Order ETA within 2 min accuracy
```

## Location Tracking Architecture
```
Driver App → Location Update (every 5 sec) → Location Service
                                                    │
                                               Redis GEO
                                          (lat/lng per driver_id)
                                                    │
                                          WebSocket Server
                                                    │
                                             Customer App
                                          (real-time tracking)

Redis GEO commands:
GEOADD drivers {lng} {lat} {driver_id}
GEODIST drivers driver1 restaurant1 km
GEORADIUS restaurant_location 3 km  → nearby drivers
```

## Driver Matching Algorithm
```
When order placed:
1. Restaurant location le lo
2. GEORADIUS → available drivers within 3km
3. Score calculate karo:
   score = (1/distance) × driver_rating × acceptance_rate
4. Highest score driver ko offer karo (60 sec timeout)
5. Decline/timeout → next driver
6. Repeat until accepted or no drivers → notify customer
```

## ETA Calculation
```
Total ETA = Food Prep Time + Pickup Time + Delivery Time

Food Prep Time:
- ML model trained on historical order data
- Inputs: restaurant, menu items, current queue length, time of day

Pickup Time:
- Driver ke restaurant pahunchne ka time
- Google Maps API / internal routing engine
- Real-time traffic data

Delivery Time:
- Restaurant → customer route
- Historical delivery data for that area
- Dynamic updates as driver moves
```

---

# 11. Google Docs — Collaborative Real-Time Editing
> Frequency: MEDIUM-HIGH — Google, Notion, Confluence interviews

## The Core Problem
```
User A types "Hello" at position 5
User B simultaneously types "World" at position 5

Who wins? Both insertions should survive!
Simple last-write-wins will lose data.
```

## Operational Transformation (OT)
```
Operation types:
- Insert(position, character)
- Delete(position, count)

Transform rule:
User A: Insert(5, 'H')
User B: Insert(5, 'W')

After applying A first:
- B's operation transforms to Insert(6, 'W')
- Result: "...Hello World..."

Transform function:
if (op1.type == INSERT && op2.type == INSERT):
  if op1.position <= op2.position:
    op2.position += len(op1.content)  # shift right
```

## CRDT — Conflict-free Replicated Data Type
```
Modern approach (Figma, Notion use this)

Each character gets a unique ID:
char = { id: "A1", value: 'H', parent: "ROOT", side: LEFT }

CRDTs are commutative and associative:
apply(op1, apply(op2, doc)) == apply(op2, apply(op1, doc))

No server coordination needed!
Works offline too → merge when reconnected
```

## Architecture
```
Client (Browser) ──WebSocket──▶ Collaboration Server
      │                               │
      │                               ▼
  Local Buffer                  Operation Log
  (pending ops)                 (append-only)
      │                               │
      │                           Transform &
      │                           Broadcast to
      │                           all clients
      ▼                               │
  Apply ops                           ▼
  to local doc                  Persistent Store
                                (S3 + DynamoDB)
```

## Cursor Awareness (Presence)
```
- Each user has a cursor position
- Broadcast cursor updates via WebSocket (separate from document ops)
- Show colored cursors with user name
- Debounce cursor updates (every 100ms, not every keystroke)
```

---

# 12. Nearby Friends / Location-Based Service (Yelp, Uber Eats)
> Frequency: MEDIUM — Meta, Yelp, Foursquare

## Requirements
```
Functional:
- User ke 5km radius mein restaurants/friends dikhao
- Distance by walking/driving (not straight line)
- Filter by rating, cuisine, open now

Non-Functional:
- 100M locations stored
- Query < 200ms
- Location updates real-time
```

## Geospatial Indexing

### Approach 1: Geohash
```
Geohash: World ko grid cells mein divide karo
- Each cell has a string code: "tdr1w" (San Francisco area)
- Nearby cells share prefix: "tdr1" → same area
- Precision: 6 chars = 1.2km × 0.6km

Algorithm:
1. User location → geohash string
2. Current cell + 8 neighboring cells lookup
3. Filter by exact distance (haversine formula)
4. Sort by distance

Storage: Redis GEOADD or DB with geohash column + index
```

### Approach 2: Quadtree
```
- Divide map into 4 quadrants recursively
- Each leaf node holds max N locations (e.g., 100)
- If overflow → subdivide further
- Query: traverse tree to find relevant cells

Used by: Google Maps, Apple Maps (internally)
```

### Approach 3: H3 (Uber's Hexagonal Grid)
```
- World → hexagonal cells (6 neighbors, equal area)
- Better for distance queries than square grid
- Uber uses this for surge pricing regions
```

## Architecture
```
Location Write:
  Driver/Restaurant → GEOADD {lng} {lat} {id} (Redis)

Location Read:
  User location → GEORADIUS 5 km → [ids]
  → Batch fetch metadata from MySQL
  → Sort + filter → Return

Scale:
  - Shard Redis by region (Americas, Europe, Asia)
  - Hot cities → dedicated Redis instances
  - Read replicas for query load
```

---

# 13. Real-Time Gaming Leaderboard
> Frequency: MEDIUM — gaming companies, Amazon, Meta

## Requirements
```
Functional:
- Player score update karo
- Global top 100 leaderboard
- Player ka rank dikhao (even if not in top 100)
- Friend leaderboard (subset)
- Weekly/monthly leaderboard reset

Non-Functional:
- 10M active players
- Score update < 10ms
- Leaderboard query < 50ms
- 1M score updates/day
```

## Redis Sorted Set — Perfect Solution
```
Redis Sorted Set (ZSET):
ZADD leaderboard {score} {player_id}
ZINCRBY leaderboard 100 {player_id}  ← score add karo
ZREVRANK leaderboard {player_id}     ← rank nikalo (0-indexed)
ZREVRANGE leaderboard 0 99           ← top 100

Time complexity:
- Update: O(log N)
- Rank query: O(log N)
- Range query: O(log N + K)

10M players → ZSET size = ~800 MB (fits in Redis)
```

## Tiered Leaderboard for Scale
```
Problem: 1 Billion players → Redis ZSET too large

Solution: Sharded leaderboard
1. Players divided into shards by player_id mod 100
2. Each shard has its own top-1000 list
3. Global leaderboard = merge top-1000 from each shard
4. Background job every 5 min: merge and compute final top 100

For exact rank:
- Count players with score > my_score
- Binary search on score distribution (stored in histogram)
```

---

# 14. CDN (Content Delivery Network) Design
> Frequency: MEDIUM — Netflix, Akamai, Cloudflare interviews

## Requirements
```
Functional:
- Static assets serve karo (JS, CSS, images, videos)
- Geographic distribution (low latency globally)
- Cache invalidation
- Dynamic content acceleration

Non-Functional:
- 99.99% availability
- < 20ms latency globally
- 1 Petabyte data serve/day
```

## Architecture
```
Origin Server (NYC) → Edge PoPs (Points of Presence)
                      - Mumbai
                      - London
                      - Singapore
                      - São Paulo
                      (each PoP = cluster of servers)

Request Flow:
User (India) → DNS → Mumbai PoP (cache HIT → serve directly)
                  ↘ cache MISS → Origin → cache → serve

Anycast Routing:
- Same IP address → multiple edge locations
- BGP routes user to geographically nearest PoP
```

## Cache Strategy
```
Cache-Control headers:
  static assets: max-age=31536000 (1 year) + content hash in URL
  API responses: max-age=60, stale-while-revalidate=300
  private data: no-cache

Cache Invalidation:
1. URL versioning: main.a1b2c3.js (change content → change URL)
2. Purge API: POST /cdn/purge {urls: [...]} → propagate to all PoPs
3. Surrogate keys: Tag content by category → invalidate by tag

Pull CDN: Edge server fetches from origin on first miss
Push CDN: Origin pushes content to all edges (for known content)
```

## Video Streaming on CDN
```
HLS (HTTP Live Streaming):
- Video → segments (2-10 sec each) → .m3u8 playlist file
- CDN caches individual segments
- Client downloads segment by segment (adaptive bitrate)

Adaptive Bitrate:
- Multiple quality variants: 240p, 480p, 720p, 1080p, 4K
- Client measures bandwidth → switch quality
- Buffer < 10 sec → lower quality
- Buffer > 30 sec → higher quality
```

---

# 15. Stock Trading System
> Frequency: MEDIUM — Goldman Sachs, JPMorgan, fintech startups

## Requirements
```
Functional:
- Buy/Sell orders place karo
- Order matching (buyer ↔ seller)
- Real-time price updates
- Order book maintain karo
- Trade history

Non-Functional:
- Ultra-low latency: < 1ms order matching
- 1M orders/sec throughput
- No data loss (financial system)
- Strict ordering (FIFO for same price)
```

## Order Book
```
BUY orders (Bids):          SELL orders (Asks):
Price  | Quantity            Price  | Quantity
105    | 100                106    | 200
104    | 500                107    | 150
103    | 200                108    | 300
102    | 1000               109    | 500

Spread = Ask - Bid = 106 - 105 = 1

Matching: If new BUY order price >= lowest ASK → match!
```

## Matching Engine
```
Data Structure: Two Priority Queues (Heaps)
- Buy side: Max-heap (highest bid first)
- Sell side: Min-heap (lowest ask first)

Matching Algorithm:
while buy_heap.max >= sell_heap.min:
  buy_order = buy_heap.pop()
  sell_order = sell_heap.pop()
  match_price = sell_order.price  (price-time priority)
  quantity = min(buy_order.qty, sell_order.qty)
  execute_trade(buy_order, sell_order, match_price, quantity)
  if buy_order.qty > 0: push back remaining
  if sell_order.qty > 0: push back remaining

Optimized: Red-Black Tree (sorted + fast insert/delete)
Used by: NYSE, NASDAQ matching engines
```

## Architecture
```
Order Gateway → Risk Check → Order Matching Engine
                                      │
                          ┌───────────┼──────────────┐
                          ▼           ▼               ▼
                     Order Book   Trade Feed      Market Data
                     (Memory)     (Kafka)         (WebSocket)
                          │           │
                          ▼           ▼
                     PostgreSQL    ClickHouse
                    (persistent)   (analytics)
```

## Ultra-Low Latency Tricks
```
- Single-threaded matching engine (no lock contention)
- LMAX Disruptor (ring buffer) instead of queues
- Memory-mapped files for persistence
- Kernel bypass networking (DPDK, RDMA)
- Co-location (exchange ke server room mein apna server)
- CPU pinning (dedicated cores for matching engine)
```

---

# INTERVIEW FRAMEWORK — Har System Design Mein Yahi Bolna Hai

## Step-by-Step Template (45 min interview)

```
1. Requirements Clarify (5 min)
   - Functional: "Kya karna chahiye?"
   - Non-Functional: "Kitna scale? Latency? Consistency?"
   - Out of scope: "Ye cheez is interview mein nahi cover karenge"

2. Capacity Estimation (5 min)
   - DAU / MAU
   - Reads per second, Writes per second
   - Storage (5 years)
   - Bandwidth

3. High-Level Design (10 min)
   - Major components draw karo
   - Data flow explain karo
   - Don't go into details yet

4. Deep Dive (20 min)
   - Interviewer jo component choose kare
   - DB schema
   - API design
   - Algorithms (core part of the system)
   - Bottlenecks identify karo

5. Scale & Edge Cases (5 min)
   - Hot spots (celebrity problem)
   - Failure scenarios
   - Monitoring & alerting
```

## Key Numbers to Remember
```
Latency:
  L1 cache: 1 ns
  RAM: 100 ns
  SSD random read: 100 μs
  Network (same DC): 500 μs
  Network (cross region): 150 ms
  HDD random read: 10 ms

Storage:
  1 KB = 10^3 bytes
  1 MB = 10^6 bytes
  1 GB = 10^9 bytes
  1 TB = 10^12 bytes

Scale:
  1 server: ~10,000 req/sec (typical)
  MySQL: ~5,000 writes/sec per node
  Redis: ~100,000 ops/sec per node
  Kafka: ~1,000,000 msgs/sec per broker

Availability:
  99%    = 87.6 hours downtime/year
  99.9%  = 8.7 hours downtime/year
  99.99% = 52 minutes downtime/year
  99.999% = 5 minutes downtime/year (five nines)
```

---

# QUICK REFERENCE — Component Kab Use Karna Hai

| Situation | Solution |
|---|---|
| High read load | Read replicas + Cache (Redis) |
| High write load | Sharding + Async (Kafka) |
| Exact match query | Hash index / Redis |
| Range query | B-Tree index / ElasticSearch |
| Full-text search | ElasticSearch / Solr |
| Real-time updates | WebSocket / SSE |
| File storage | S3 + CDN |
| Time-series data | InfluxDB / ClickHouse |
| Graph relationships | Neo4j / Adjacency list in MySQL |
| ML recommendations | Feature store + Vector DB (Pinecone) |
| Distributed lock | Redis SETNX / Zookeeper |
| Message queue | Kafka (high throughput) / RabbitMQ (complex routing) |
| Session storage | Redis (TTL support) |
| Rate limiting | Redis sliding window |
| Unique IDs | Snowflake / ULID |
| Analytics / OLAP | ClickHouse / Redshift / BigQuery |
| Config management | Zookeeper / etcd / Consul |
| Service discovery | Consul / Kubernetes DNS |

---

# COMPANY-WISE FOCUS

## Google
- Web Crawler, Search Autocomplete, YouTube, Google Drive, Maps

## Meta/Facebook  
- News Feed, Messenger, Instagram Stories, Nearby Friends, Ad System

## Amazon
- E-Commerce, Order System, Inventory, DynamoDB internals, Recommendation

## Uber/Lyft
- Ride Matching, Driver Location, Surge Pricing, ETA, Job Scheduler

## Netflix
- Video Streaming, CDN, Recommendation, A/B Testing Platform

## Microsoft
- SharePoint (collaborative docs), Teams (chat), Azure services

## Flipkart/Swiggy/Zomato (India)
- E-Commerce flash sale, Food delivery, Payment system

---

*Bhai, ye sab yaad kar le → top of the world guaranteed!*
*Practice each design in 45 minutes — timer lagao aur whiteboard pe draw karo.*
