# Day 4 — Design a Video Streaming (YouTube / Netflix)

*(Month 3 Study Plan — Week 9 Day 4)*

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. Video upload (creators) — large files, resumable acceptable
2. Processing: multiple resolutions + codecs (1080p, 720p, 480p, etc.)
3. Playback (viewers) — smooth streaming, seek, pause
4. Adaptive quality — network slow/fast ke hisaab se bitrate badle
5. Metadata: title, description, thumbnails, duration, visibility (public/unlisted)
6. Basic recommendations — related videos / "you may also like"
7. (Optional clarify) Live streaming vs VOD — yahan pehle VOD focus
8. (Optional) DRM / geo-restriction — premium platforms
```

### Non-Functional Requirements:
```
Availability:   High (playback 99.9%+; upload/transcode degraded mode acceptable with retry)
Scale:          Billions of views/day, millions of hours stored
Latency:        Playback start < few seconds (first frame / first segment)
Cost:           CDN egress + transcode = major $ → caching & encoding ladder optimize karo
Consistency:    Metadata strong consistency; video segments eventually available after transcode
Durability:     No video loss — object storage replication
```

---

## 2. Capacity Estimation (5 min)

```
Assumptions (interview mein numbers bol ke fix karo):
  DAU viewers:           200 million
  Views/user/day:        10 → 2 billion views/day
  Avg video length:      10 minutes
  Avg watched fraction:  50% → 5 min effective per view

Viewing time:
  2B × 5 min = 10 billion minutes/day ≈ 166 million hours/day

Bandwidth (order of magnitude):
  Avg bitrate (ABR middle tier): ~5 Mbps
  Peak concurrent (rule of thumb): ~2% of DAU = 4M concurrent
  Egress-heavy → CDN pe majority traffic; origin ko protect karna hai

Upload side:
  New uploads/day:       1 million (example)
  Avg raw size:          500 MB → 500 PB logical before compression (use compression + long-tail; 
                         realistic cluster: hundreds of TB–PB new/day at YouTube scale)

Transcode:
  1 upload → N renditions (e.g. 5 resolutions × 2 codecs) = many output files
  Job queue throughput:  prioritize by channel size / SLA

Storage:
  Raw + transcoded segments (HLS: many small .ts / .m4s files)
  Thumbnails + posters
  Metadata DB relatively small vs blob storage
```

---

## 3. High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│ Creator App  │     │ Viewer App   │     │            ADMIN / PORTAL            │
│ (Upload)     │     │ (Playback)   │     │  metadata, moderation, analytics   │
└──────┬───────┘     └──────┬───────┘     └──────────────────┬──────────────────┘
       │                  │                                 │
       │ HTTPS            │ HTTPS                           │
       ▼                  ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                           │
└──────────────────────────────────────────────────────────────────────────────┘
       │                           │                           │
       │ upload URL / complete     │ manifest + auth         │ CRUD metadata
       ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐            ┌──────────────────┐
│ UPLOAD       │          │ STREAMING    │            │ METADATA SERVICE │
│ SERVICE      │          │ API          │            │ (video info)     │
│ (chunked)    │          │ (signed URLs)│            └────────┬─────────┘
└──────┬───────┘          └──────┬───────┘                     │
       │                         │                             │
       │ enqueue                 │                             │
       ▼                         │                             ▼
┌──────────────┐                 │                    ┌──────────────────┐
│ TRANSCODE    │                 │                    │ SQL / NoSQL DB   │
│ WORKERS      │                 │                    │ (titles, stats)  │
│ (FFmpeg etc.)│                 │                    └──────────────────┘
└──────┬───────┘                 │
       │ write segments          │
       ▼                         │
┌──────────────────────────────────────────────────────────────────────────────┐
│                    OBJECT STORAGE (e.g. S3) — raw + transcoded segments       │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ origin fill
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CDN (edge POPs worldwide)                            │
│                    caches segments + manifests (TTL + cache keys)             │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                              Viewer devices

┌──────────────────────────────────────────────────────────────────────────────┐
│  RECOMMENDATION SERVICE  ←  offline batch + online features  ←  user events    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Study plan flow (yaad rakhne layak):**  
`Upload → Transcoding Queue → Storage (S3) → CDN → Client`

---

## 4. Video Upload Pipeline — Deep Dive

### Kyun chunked / resumable upload?
```
Single PUT for 2 GB file:
  - Timeout, retry poora dubara, mobile network drop

Multipart upload:
  - File ko chunks mein todho
  - Har part parallel upload + independent retry
  - Complete pe server side assemble / compose (S3 multipart API)
```

### Typical flow:
```
1. Client → Upload Service: "main 500 MB video bhejna chahta hoon"
2. Server: upload_id + pre-signed URLs (per chunk) ya session token
3. Client: chunks → Object storage (direct-to-S3) — API server pe bandwidth kam
4. Client: "upload complete"
5. Message → Transcode queue (Kafka / SQS / custom)
6. Workers: raw object se renditions banate hain → output paths register
7. Metadata service: status = READY, duration, thumbnail URLs update
```

### Idempotency & dedup:
```
Same file do baar upload? (creator retry)
  - Content hash (expensive for full file) ya upload_id idempotency
  - Optional: perceptual hash / fingerprint for duplicate detection (copyright)
```

---

## 5. Transcoding — Multiple Resolutions

### Kyun zaroori?
```
Ek hi 4K file sabko bhejna:
  - Mobile / slow network pe buffering
  - Waste of bandwidth

Encoding ladder:
  2160p, 1080p, 720p, 480p, 360p (bitrate caps per resolution)
  Optional: AV1 / VP9 / H.265 for efficiency (compute heavy)
```

### Architecture pattern:
```
Queue-based async jobs (CPU/GPU heavy)
  - Spot instances / autoscaling worker pool
  - Priority queues: trending, premium creators pehle

Output:
  - Segmented files (HLS: .m3u8 + .ts / fMP4)
  - Multiple renditions same segment boundaries (synced GOP) for ABR switching
```

### Thumbnails:
```
Seek previews (Netflix-style scrub) = extra sprite sheets or short VTT storyboards
Poster frame = single JPEG from mid timestamp
```

---

## 6. CDN for Video Delivery

### Problem without CDN:
```
Sab viewers ek hi region ke origin se:
  - Latency high
  - Origin + egress collapse
```

### CDN behavior:
```
First request for segment at edge POP:
  - Cache MISS → origin (S3) se fetch → edge pe store → user ko serve

Repeat / nearby users:
  - Cache HIT → fast, origin load kam

Cache key:
  - URL path + query (signed params change → careful TTL / key design)
```

### Origin shield / mid-tier:
```
Bahut bade scale pe: regional shield layer se origin hits aur kam
```

---

## 7. Adaptive Bitrate Streaming (ABR) — HLS / DASH

### Concept:
```
Player ko ek master manifest milta hai (HLS: master.m3u8, DASH: MPD)
  - Usme har rendition ka URL + bandwidth hint

Player:
  - Current buffer + throughput dekh ke kaunsa rendition chune
  - Segment boundary pe switch (smooth experience)
```

### HLS vs DASH (high level):
```
HLS:   Apple ecosystem friendly, m3u8 playlists, broad support
DASH:  ISO standard, codec flexible, Google/Android heavy

Many platforms serve dono / ya CMAF se unify karne ki koshish
```

### Latency vs VOD:
```
VOD: segments 2–10 sec common (tradeoff: buffer stability vs seek granularity)
Live: shorter segments + LL-HLS extensions (alag deep dive)
```

---

## 8. Recommendation System — Basics

### Goals:
```
Maximize watch time / CTR while diversity & freshness maintain karo
```

### Data:
```
Offline: watch history, likes, subs, co-watch graphs, video embeddings
Online: current session, context (device, time), cold start (new user)
```

### Simple architecture:
```
Batch jobs (Spark / Dataflow):
  - Similarity: "users who watched A also watched B"
  - Matrix factorization / two-tower models → candidate generation

Serving:
  - Candidate retrieval (1000s) → ranking model (dozens) → re-rank (diversity)

Storage:
  - Feature store, embedding index (ANN — e.g. FAISS, ScaNN behind service)
```

---

## 9. Complete Playback Flow (End-to-End)

```
1. Viewer app: video_id open karta hai
2. Metadata API: title, available resolutions, CDN base URLs, (optional) ads info
3. Player: master manifest fetch (CDN)
4. Player: throughput measure → ladder se appropriate rendition
5. Segments sequentially CDN se (parallel prefetch next segments)
6. Analytics beacons: quartiles, stalls, bitrate switches (product + ML feedback)
```

---

## 10. Interview Questions & Answers

### Q: "Transcode fail ho gaya toh?"
```
Job retry with backoff; dead-letter queue for manual fix
User-facing: "Processing failed" + support re-queue
Partial success: kam resolutions pehle AVAILABLE mark, baaki retry
```

### Q: "CDN cache invalidation?"
```
VOD segments immutable URLs (version in path) → invalidation kam chahiye
Metadata / manifest update = naya version path preferred over purge storms
```

### Q: "Hot video — origin overload?"
```
CDN popular tiers; origin request coalescing; regional shields
Optional: P2P / internal Netflix-style Open Connect (very advanced)
```

### Q: "Copyright / moderation?"
```
Upload-time + async scanning (audio fingerprint, hash DB)
Quarantine bucket until CLEAR; geo-block per license
```

### Q: "Cost optimize?"
```
Encoding ladder trim (SR-IO optimized bitrates)
Tiered storage (archive cold raw)
CDN commit pricing; peer-to-peer only if product allows
```

---

## 11. Quick Summary

```
Pipeline:   Chunked upload → queue → transcode workers → object storage → CDN
Playback:   HLS/DASH ABR — player throughput ke hisaab se rendition switch
Scale:      CDN for egress; async workers for CPU; immutable segments for caching
Recs:       Offline candidates + online ranking + ANN retrieval (basics)

Key interview line:
  "Video read-heavy + egress-heavy hai — design CDN-first;
   write path async transcoding se decouple karo."
```

---

## 12. Practice Tasks (Aaj Karo)

### Task 1: Diagram
```
Paper pe bina dekhe:
  Upload → Queue → Workers → S3 → CDN → Player
  Metadata DB + Recommendation box alag se
```

### Task 2: Mock (45 min)
```
"Design YouTube" / "Design Netflix streaming"
  5 min requirements + 5 min capacity
  10 min architecture
  15 min deep: upload, transcode, HLS, CDN
  10 min edge: failures, cost, DRM
```

### Task 3: Mouth drills
```
1. Multipart upload kyun?
2. ABR kaise kaam karta hai?
3. CDN cache key / immutable segments?
4. Transcode queue priority?
5. Recs: candidate generation vs ranking?
```

---

Kal study plan ke hisaab se Day 5 pe Ride-Sharing (Uber/Ola) design karenge.
