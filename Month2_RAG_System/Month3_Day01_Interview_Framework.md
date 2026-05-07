# Month 3 — Week 9 — Day 1: Interview Framework & Requirements

> Parent plan: `Month3_Interview_Prep.md` (Week 9, Day 1)  
> Goal: System design interview ka **pehla phase** — requirements clarify karna + rough numbers se scale samajhna.

---

## 1. Topics (detail)

### 1.1 Functional vs non-functional requirements

**Functional requirements** — system **kya karega** (features, behaviour).

- User se kya input lena hai, kya output dena hai.
- Kaunse flows zaroori hain (create, read, update, delete).
- Business rules (e.g. “short code 7 character”, “link 1 saal baad expire”).

**Non-functional requirements (NFRs)** — system **kaise** kaam karega — quality attributes.

| NFR | Matlab (short) |
|-----|----------------|
| **Latency** | Response kitni jaldi (p50 / p99) |
| **Scale** | Kitne users / kitna traffic (QPS, storage) |
| **Consistency** | Naya write turant read mein dikhe ya thoda delay OK |
| **Availability** | Uptime target (e.g. 99.9%) |
| **Durability** | Data loss na ho |

**Interview tip:** Pehle functional likho / bolo, phir interviewer ke hints se NFRs tighten karo. Har NFR par **trade-off** sochna (e.g. strong consistency vs latency).

---

### 1.2 Back-of-the-envelope: users, QPS, storage, bandwidth

**Purpose:** Exact calculator nahi — **order of magnitude** (10 vs 10³ vs 10⁶) taaki:

- DB single machine kaafi hai ya nahi,
- cache / replicas / sharding **kab** sochna hai,
- bandwidth bottleneck ho sakta hai ya nahi.

**Typical steps:**

1. **DAU / MAU** — kitne active users per day/month.
2. **Actions per user** — roz kitne create / read / write.
3. **Daily total requests** → **peak hour** (e.g. 2×–3× average) → **peak QPS** = peak requests ÷ peak window seconds.
4. **Storage** — record size × number of records × retention (days/years).
5. **Bandwidth** — (avg payload size × QPS) rough — **egress** cost / CDN need.

**Yaad rakho:** Galat number se kam, **reasoning** zyada important — “main 100M DAU assume kar raha hoon taaki worst case dekho” bolna OK hai.

---

### 1.3 API design basics (REST, idempotency, pagination)

**REST (high level)**

- `Resources` URLs se represent (e.g. `/v1/short-links`, `{shortCode}`).
- HTTP methods: `GET` (safe, read), `POST` (create), `DELETE`, `PATCH` jahan zaroori ho.
- **Versioning:** `/v1/` prefix — future breaking change ke liye.

**Idempotency**

- Same request **dobara** bhejne par same **logical** outcome (duplicate charge / duplicate create na ho).
- **GET** idempotent hota hai; **POST** duplicate submit problem ho sakta hai.
- **Fix:** `Idempotency-Key` header (client unique key), ya server-side dedupe.

**Pagination**

- Badi lists → ek saath na bhejo; **page size limit** + **next cursor** (preferred for large data) ya `offset` (simple, deep pages par slow).

---

### 1.4 Read-heavy vs write-heavy systems

| Type | Pattern | Design hints |
|------|---------|----------------|
| **Read-heavy** | Zyada GET / redirect / feed | Caching, read replicas, CDN, denormalized read models |
| **Write-heavy** | Zyada create / ingest / logs | Write throughput, sharding, queues, batching |

**Pehla sawal:** Is system mein **main load read par hai ya write par?** — isse components prioritize hote hain.

---

## 2. Practice (detail)

### Practice A — URL shortener: 15 min requirements

**Timer:** 15 minutes.

**Likhne / bolne ka order:**

1. **Clarifying questions** (1–2 min) — optional: logged-in users? analytics? custom alias?
2. **Functional (bullets):**
   - Long URL → short code generate karna.
   - Short URL hit → redirect (301/302).
   - Optional: expiry, delete, click stats.
3. **Non-functional (bullets):**
   - Redirect latency target (e.g. low ms).
   - Scale: global vs single region.
   - Consistency: naya code create ke turant redirect chale — **strong** ya **eventual** acceptable?
4. **Rough APIs (2–4 lines):**
   - `POST /v1/links` — body: `{ "url": "..." }` — response: `{ "short": "..." }`
   - `GET /{code}` — redirect

**Deliverable:** 1 page notes / Excalidraw — **perfect diagram optional**, **clear scope** zaroori.

---

### Practice B — DAU → peak QPS (rough)

**Example walkthrough (tum apne numbers change kar sakte ho):**

| Step | Assumption | Calculation |
|------|------------|-------------|
| 1 | DAU = 1,000,000 | — |
| 2 | Har user roz 10 redirect follow karta hai (read-heavy) | 10M redirects/day |
| 3 | Roz 0.1 create / user (short link create) | 100k creates/day |
| 4 | **Reads** dominate: 10M/day | Peak hour = 20% of daily in 1 hour → 2M reads in 3600s ≈ **~556 RPS** reads in that hour (rough); peak spike 3× → **~1.5k–2k RPS** order |
| 5 | **Writes** 100k/day | Spread karo → peak QPS writes **~few–tens** unless burst |

**Output:** Ek number + sentence: “Isliye read path ko **cache + scale** dena priority; write path **relatively chhota**.”

---

## 3. Day 1 checklist (end of day)

```
□ Functional vs NFR difference 2 min mein explain kar sakta hoon
□ Ek chhote system (URL shortener) ke liye 5 bullet functional + 3 NFR likhe
□ DAU se peak QPS ka 1 rough estimate (steps + final order of magnitude)
□ Read-heavy vs write-heavy identify karke 1 design hint de sakta hoon
```

---

## 4. Next day (preview)

**Day 2** — Load balancing, DNS, CDN — aaj wale requirements + traffic se **traffic ko kaun handle karega** (distribution layer) us par build hoga.
