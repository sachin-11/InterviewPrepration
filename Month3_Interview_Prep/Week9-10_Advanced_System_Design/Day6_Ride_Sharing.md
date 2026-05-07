# Day 5 — Design a Ride-Sharing (Uber / Ola)

*(Month 3 Study Plan — Week 9 Day 5)*

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. Rider: pickup + drop location, ride book karna, fare estimate
2. Driver: online/offline, location share, ride accept/reject
3. Matching: nearby available driver ko rider se jodo
4. Trip lifecycle: requested → accepted → arrived → in_progress → completed / cancelled
5. Real-time tracking: map pe driver movement (rider + ops)
6. Payments: trip end pe charge (out of scope deep — integrate payment provider)
7. Surge / dynamic pricing: demand zyada ho toh multiplier
8. Notifications: driver assigned, arriving, trip end (push)
```

### Non-Functional Requirements:
```
Availability:   High — booking + active trip critical path
Latency:        Match suggestion & location updates — low (hundreds of ms to few sec acceptable for match)
Scale:          Millions of drivers, tens of millions of rides/day, high write rate on locations
Consistency:    Trip state strong consistency (ek hi driver assign); location eventual OK
Accuracy:       GPS noise — smoothing + snap-to-road optional
```

---

## 2. Capacity Estimation (5 min)

```
Assumptions (interview mein tweak karo):

Rides completed/day:     20 million
Active drivers peak:     2 million simultaneously online
Location updates:        driver har 4 sec pe bhejta hai (battery vs accuracy tradeoff)

Writes/sec (location only):
  2M / 4 = 500,000 location writes/sec  (peak aggressive — real systems batch/throttle by region)

Reads:
  Riders watching map: WebSocket fan-out / regional
  Match queries: burst jab nayi ride request aaye

Storage:
  Trip records, audit, ratings — relational DB + analytics warehouse
  Hot driver positions — in-memory geo index + Redis TTL snapshots
```

---

## 3. High-Level Architecture

```
┌─────────────┐   ┌─────────────┐
│ Rider App   │   │ Driver App  │
└──────┬──────┘   └──────┬──────┘
       │ REST / WS       │ REST / WS
       ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LB                          │
└─────────────────────────────────────────────────────────────┘
       │                          │
       ▼                          ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ TRIP SERVICE │           │ LOCATION INGESTION SERVICE        │
│ (state mach.)│           │ (high write throughput)           │
└──────┬───────┘           └──────────────┬───────────────────┘
       │                                  │
       │ publish events                   │ update geo index
       ▼                                  ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ MATCHING     │◄──────────│ GEOSPATIAL INDEX                  │
│ SERVICE      │  query    │ (QuadTree / S2 / Redis GEO)       │
└──────┬───────┘           └──────────────────────────────────┘
       │
       │ pricing
       ▼
┌──────────────┐           ┌──────────────────────────────────┐
│ PRICING /    │           │ MESSAGE BUS (Kafka)                 │
│ SURGE ENGINE │           │ trips, locations (analytics)      │
└──────────────┘           └──────────────────────────────────┘
       │
┌──────────────┐           ┌──────────────────────────────────┐
│ NOTIFICATION │           │ PRIMARY DB (PostgreSQL / Spanner) │
│ SERVICE      │           │ trips, users, payments refs        │
└──────────────┘           └──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  REAL-TIME GATEWAY (WebSocket) — rider ko driver location     │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Location Tracking (GPS Updates)

### Flow:
```
Driver app:
  GPS → har X seconds (ya distance threshold: 50m move hua tab)
  Batch optional: 5 points ek saath bhejo toh HTTP overhead kam
```

### Ingestion path:
```
1. API validate: driver_id + session token + trip_id (if on trip)
2. Throttle abuse: per-driver rate limit
3. Write:
   - Hot path: update in-memory geo structure for that city shard
   - Async: Kafka → analytics, historical trail (optional cold storage)
4. Snap-to-road / Kalman filter: UI smooth dikhane ke liye (client ya server)
```

### Partitioning:
```
Location service ko **city / geohash region** se shard karo
  - Har shard apna QuadTree / S2 cell index rakhe
  - Cross-shard rare agar boundary pe ride ho
```

---

## 5. Geospatial Indexing — QuadTree vs S2

### Kyun zaroori?
```
Naive: "sab drivers scan karo distance < 2 km"
  → O(N) — millions pe slow

Spatial index: nearby query fast — interview mein yehi expect
```

### QuadTree (concept):
```
2D space ko recursively 4 quadrants mein todho
Har node mein driver IDs jinki position us box mein hai

Query: circle/box intersect karte quadrants traverse karo
Dynamic inserts/updates — tree rebalance / bucket split
```

### S2 (Google):
```
Sphere ko hierarchical cells (Hilbert curve)
Cell ID prefix se "nearby" approximate + exact filter
Distributed systems mein **cell ID = sharding key** bhi ban sakta hai
```

### Redis GEO:
```
GEOADD, GEORADIUS — prototype / mid-scale
Uber-scale pe custom + sharded index common
```

---

## 6. Driver Matching Algorithm

### Ride request aayi:
```
Input: rider pickup (lat, lng), vehicle type, time

Step 1 — Candidates:
  Geospatial query: radius R (e.g. 2–5 km) ya nearest K drivers
  Filter: ONLINE, not on trip, right vehicle, rating threshold

Step 2 — Rank:
  ETA estimate (road graph / ML model / simple haversine first pass)
  Driver acceptance rate, distance to pickup

Step 3 — Dispatch:
  Top 1 ya **broadcast to top N** (parallel ping — pehle accept wins)
  
  Uber-style: multiple drivers ko simultaneously offer
    - Reduces wait agar pehla driver ignore kare
```

### Consistency — ek driver ek ride:
```
Distributed lock (Redis Redlock / DB row lock) on driver_id:
  "ASSIGN" transaction: driver status BUSY + trip DRIVER_ASSIGNED
Idempotent trip request_id — duplicate network retry same trip na banaye
```

### Failure:
```
Timeout: koi accept nahi → radius badhao / surge badhao / notify rider
```

---

## 7. Surge Pricing

### Goal:
```
High demand mein price badhao → supply attract + demand thoda kam
```

### Signals:
```
Active ride requests / available drivers per region (geohash cell)
EWMA ya sliding window — spike detect
```

### Implementation sketch:
```
Pricing service:
  base_fare × surge_multiplier

Multiplier cap (PR + regulation)
Store multiplier per cell + TTL; refresh every minute

Transparency: rider ko UI mein "1.5x surge" dikhana
```

### Ethics / product:
```
Dynamic pricing sensitive — interview mein fairness + predictability mention karo
```

---

## 8. Real-Time Map Updates (WebSockets)

### Pattern:
```
Rider ne trip accept ke baad map khola:
  Client ←WebSocket→ Real-time Gateway

Gateway:
  trip_id subscribe
  Location service se driver ke latest coords (poll internal or push from ingest)

Update frequency throttle:
  Server → client har 1–2 sec ya significant move pe hi bhejo (battery + bandwidth)
```

### Scale:
```
Stateful connections → sticky sessions / gateway per city
Redis Pub/Sub ya dedicated streaming internal bus gateway instances ke beech
```

---

## 9. Trip Management (State Machine)

### States:
```
REQUESTED → SEARCHING_DRIVER → DRIVER_ASSIGNED → DRIVER_ARRIVED
          → IN_PROGRESS → COMPLETED
          → CANCELLED (rider/driver/system) at various points
```

### Storage:
```
trips table:
  trip_id, rider_id, driver_id, status, pickup, drop, fare_estimate, final_fare,
  created_at, updated_at, version (optimistic concurrency)

State transitions:
  Only valid edges — Trip Service enforces
  Events: TripRequested, DriverMatched, TripStarted, ... → Kafka for downstream
```

### Idempotency:
```
Rider "Complete payment" retry:
  idempotency key se duplicate charge roko
```

---

## 10. Complete Architecture (Ride Accept → Track)

```
Rider Request
     │
     ▼
Trip Service ──create──► DB (REQUESTED)
     │
     ▼
Matching Service ──geo query──► Geospatial Index
     │
     ▼
Notify top N drivers (Push / long poll / in-app)
     │
     ▼
Driver Accept (first wins + lock)
     │
     ▼
DB update DRIVER_ASSIGNED ──event──► Kafka
     │
     ▼
Rider WebSocket: driver info + live location stream
Driver app: navigation to pickup → trip start → dropoff
     │
     ▼
COMPLETE → pricing finalize → payment → ratings
```

---

## 11. Interview Questions & Answers

### Q: "Matching slow hai kya karenge?"
```
Radius/K badhao, parallel driver ping, pre-computed ETA index,
city-level sharding, read replicas for non-critical paths,
fallback: queue position dikhao rider ko
```

### Q: "QuadTree vs S2 interview mein kaun?"
```
Dono acceptable — S2 globe + sharding story strong;
QuadTree 2D intuitive — draw on whiteboard easily
```

### Q: "Split brain — do drivers same ride?"
```
Strong transaction / lock on assign + unique constraint trip→driver
Accept API idempotent with server-generated lease
```

### Q: "Privacy — location history?"
```
Retention policy, anonymize analytics, GDPR delete
Live location only authorized trip participants
```

---

## 12. Quick Summary

```
Location:   High-write ingestion → regional shards + spatial index (QuadTree / S2)
Matching:   Geo nearest + rank ETA → broadcast to N, lock driver on accept
Surge:      Per-region demand/supply → multiplier with cap
Real-time:  WebSocket gateway, throttled updates to rider
Trip:       Explicit state machine + DB + events

Key line:
  "Ride-sharing = geo-heavy + real-time; shard by region, index for nearby, strong consistency on assignment."
```

---

## 13. Practice Tasks (Aaj Karo)

### Task 1: Diagram
```
Khud draw karo:
  Apps → Gateway → Trip + Location → Geo Index → Matching → DB + Kafka + WS
```

### Task 2: Mock (45 min)
```
"Design Uber"
  Requirements, capacity, architecture, deep dive matching + surge + WebSocket
```

### Task 3: Drills
```
1. Nearby drivers query kaise O(log n) ya sub-linear?
2. Surge ka data source?
3. WebSocket scale?
4. Trip cancel race condition?
```

---

Kal study plan ke hisaab se Day 6 pe News Feed (Facebook/Twitter) design karenge.
