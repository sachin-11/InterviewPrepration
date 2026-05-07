# Day 7 — Week 9 Revision

*(Month 3 Study Plan — Week 9 Day 7)*

---

## 1. Aaj Ka Goal (1 line)

```
6 systems ka diagram khud paper/whiteboard pe bina dekhe,
common patterns unme map karo,
aur 45 min mock: "Design WhatsApp" poora flow se.
```

---

## 2. Cheh Systems — Diagram Checklist

Har ek ke liye **5–7 min** timer lagao: sirf **high-level boxes + arrows** (detail notes mat kholo pehle).

| # | System (Study Plan) | Full notes (reference) | Diagram pe minimum boxes |
|---|---------------------|-------------------------|---------------------------|
| 1 | Chat (WhatsApp) | `Day1_Chat_System.md` | Client → LB → Chat/WebSocket → **Kafka** → Cassandra; **Redis** presence; **FCM/APNs** |
| 2 | Notification | `Day2_Notification_System.md` | Sources → API → **Kafka** (topics) → Workers → FCM / SES / Twilio |
| 3 | Search | `Day4_Search_System.md` | Crawler → Parser → **Indexer** → **ES** / index store → Search API; typeahead |
| 4 | Video (YouTube/Netflix) | `Day5_Video_Streaming.md` | Upload → **Queue** → Transcode → **S3** → **CDN** → HLS/DASH player |
| 5 | Ride (Uber/Ola) | `Day6_Ride_Sharing.md` | Apps → Trip + **Location ingest** → **Geo index** (S2/QuadTree) → **Matching** → DB + **WebSocket** |
| 6 | News Feed | `Day7_News_Feed.md` | Post → **Kafka fan-out** → per-user feed store; **hybrid** celeb merge; **Redis**; **Ranker** |

### Draw order (suggested)
```
Pehle Chat + Notification (dono mein queue + workers pattern same family)
Phir Search (read pipeline alag)
Phir Video (async + CDN)
Phir Ride (geo + real-time)
Last News Feed (fan-out + cache)
```

### Optional 7th (folder mein extra topic)
```
Rate Limiter: `Day3_Rate_Limiter.md` — Week 9 ke "6" mein count nahi,
             lekin interview mein baaki systems ke gateway pe use hota hai.
```

---

## 3. Common Patterns — Ek Jagah Pe

Inko har diagram ke baad mentally bolna: *"Is system mein ye pattern kahan hai?"*

### Messaging & decoupling
```
Kafka / queue — Chat (cross-server), Notification (channel workers), Video (transcode jobs),
News Feed (fan-out workers). Ride: events + analytics.
```

### Caching
```
Redis — Chat (presence), Notification (rate limit / dedup optional), Search (hot queries),
Video (signed URL metadata optional), Ride (driver location hot), News Feed (timeline IDs).
```

### Sharding / partitioning
```
Chat: conversations / servers by load; Search: index shards; Video: by video_id + region;
Ride: by city / geohash; News Feed: feed store by user_id; Cassandra: partition key design.
```

### Read vs write heavy
```
Write heavy: Chat messages, locations, post fan-out.
Read heavy: Search, Video CDN, Feed scroll.
Hybrid: ranking + storage separate.
```

### Real-time push
```
WebSocket — Chat delivery; Ride map; (Search/Feed usually poll/HTTP).
Long-lived connections → sticky sessions, scale gateways.
```

### Consistency trade-offs
```
Strong: money, trip assignment, post author view.
Eventual: feed visibility, notif duplicate rare OK, CDN cache.
```

### Idempotency & ordering
```
Chat: Snowflake / time-ordered IDs; Notification: dedup keys;
Feed: cursor pagination; Trip: state machine transitions.
```

### Geo
```
Ride + (optional location-based Search/Feed) — S2, QuadTree, Redis GEO.
```

---

## 4. Quick Pattern → System Map (revision glance)

```
┌─────────────────┬───────────┬───────┬────────┬──────┬──────┬──────┐
│ Pattern         │ Chat      │ Notif │ Search │ Video│ Ride │ Feed │
├─────────────────┼───────────┼───────┼────────┼──────┼──────┼──────┤
│ Message queue   │    ✓      │   ✓   │  crawl │  ✓   │ evt  │  ✓   │
│ Redis / cache   │ presence  │ opt   │  hot   │ opt  │ hot  │  ✓   │
│ CDN             │ media     │   —   │   —    │  ✓   │  —   │  —   │
│ WebSocket       │    ✓      │   —   │   —    │  —   │  ✓   │  —   │
│ Geo index       │    —      │   —   │   —    │  —   │  ✓   │  —   │
│ Fan-out problem │  group    │ burst │   —    │  —   │  —   │  ✓   │
└─────────────────┴───────────┴───────┴────────┴──────┴──────┴──────┘
```

---

## 5. Mock Interview — "Design WhatsApp" (45 min)

Timer **45:00** start. Sirf **tumhari awaaz / likhna** — pehle 35 min deliver karo, 10 min edge cases.

### Minute map
```
0–5   Requirements (1-1, group, delivered/read, presence, notif, history)
5–10  Capacity (DAU, msgs/day, QPS, peak, storage order of magnitude)
10–22 Architecture (diagram): LB, WebSocket servers, Kafka, Cassandra, Redis, FCM
22–32 Deep dive: 
        - A user A server 1, B server 2 → message path via Kafka
        - Ordering: Snowflake / ID
        - Group: fan-out write vs read, threshold
32–40 Edge: server crash reconnect, offline queue, abuse rate limit
40–45 Recap + "agar aur time ho to encryption / media CDN"
```

### End pe khud se 4 punches
```
1. Kyun WebSocket?
2. Kyun Kafka chat servers ke beech?
3. Kyun Cassandra (vs SQL) is workload pe?
4. Group 500 members pe strategy?
```

### Compare karte waqt (bonus — revision link)
```
"WhatsApp jaisa real-time" ≈ Chat + Notification (offline push) + optional Video notes ka media CDN.
```

---

## 6. Self-Check (Ha / Na)

```
[ ] 6 diagrams aaj draw kiye (ya kal tak — lekin list complete karo)
[ ] Har system ka "bottleneck" ek sentence: kya scale pe tootega?
[ ] Teen cheezein bina hesitation: Kafka use, Redis use, CDN use — kahan?
[ ] Mock WhatsApp 45 min ek baar poora bola / likha
```

---

## 7. Kal

```
Month 3 Study Plan — Week 10 Day 8: Distributed Cache (Redis) shuru.
File jab banao: folder sequence ke hisaab se `Day9_...` ya jo naming follow kar rahe ho.
```

---

**Short summary:** Aaj ka kaam **practice day** hai — files sirf reference; asli output **tumhare 6 sketches + 1 full mock** hain.
