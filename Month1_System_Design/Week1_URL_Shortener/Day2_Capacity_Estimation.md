# Day 2 — Capacity Estimation

Capacity estimation se hum ye samajhte hain ki system ko kitne resources chahiye.
Ye interview mein dikhata hai ki tum real-world scale ke baare mein sochte ho.

---

## 1. DAU (Daily Active Users) Estimate Karna

DAU = Kitne log ek din mein system use karte hain

### Kaise estimate karte hain?
Interviewer kabhi exact number nahi deta. Tum khud assume karte ho aur batate ho.

```
Example Assumption:
  Total registered users     = 500 million
  Daily Active Users (DAU)   = 100 million  (20% of total, industry standard)
```

### Write vs Read users alag hote hain:
```
URL Create karne wale (Writers) = 10 million/day   (10% of DAU)
URL Click karne wale (Readers)  = 100 million/day  (100% of DAU)
```

Ye numbers assume karke aage badhte hain. Interview mein bolna:
> "I'll assume 100 million DAU, with 10% creating URLs and rest clicking."

---

## 2. Read/Write Ratio

### Write Operations = URL shorten karna
### Read Operations  = Short URL pe click karna (redirect)

```
Writes per day = 10 million
Reads per day  = 1 billion  (100x of writes)

Read/Write Ratio = 1,000,000,000 / 10,000,000 = 100:1
```

Matlab ye system READ HEAVY hai.
Iska design impact:
- Cache pe zyada focus karo (reads fast karne ke liye)
- DB pe write load kam hai, read load zyada hai
- Read replicas banana padega DB ka

---

## 3. Storage Estimation

### Formula:
```
Storage = Data per record × Writes per day × Retention period
```

### Ek URL record ka size:
```
Field           Size
────────────    ──────
short_code      7 bytes
original_url    100 bytes (average)
created_at      8 bytes
expires_at      8 bytes
user_id         8 bytes
─────────────────────────
Total           ~131 bytes ≈ 130 bytes per record
```

### Calculation:
```
Writes per day        = 10 million = 10 × 10^6
Retention period      = 5 years    = 5 × 365 = 1825 days
Storage per record    = 130 bytes

Total records         = 10 × 10^6 × 1825
                      = 18.25 billion records

Total storage         = 18.25 × 10^9 × 130 bytes
                      = 2.37 × 10^12 bytes
                      = ~2.4 TB
```

### Simple yaad rakhne ka trick:
```
10M writes/day × 130 bytes = 1.3 GB/day
1.3 GB/day × 365 days      = ~475 GB/year
475 GB × 5 years            = ~2.4 TB total
```

2.4 TB — ye manageable hai, ek bade DB server mein fit ho sakta hai.

---

## 4. Bandwidth Estimation

### Write Bandwidth (Incoming):
```
Writes per second = 10 million / 86400 seconds
                  = ~116 writes/sec  ≈ 120 writes/sec

Data per write    = 100 bytes (original URL size)

Write bandwidth   = 120 × 100 bytes
                  = 12,000 bytes/sec
                  = ~12 KB/sec   (bahut kam hai)
```

### Read Bandwidth (Outgoing):
```
Reads per second  = 1 billion / 86400 seconds
                  = ~11,574 reads/sec  ≈ 12,000 reads/sec

Data per read     = 100 bytes (original URL return karna)

Read bandwidth    = 12,000 × 100 bytes
                  = 1,200,000 bytes/sec
                  = ~1.2 MB/sec   (manageable)
```

```
Summary:
  Incoming (write) bandwidth = ~12 KB/sec
  Outgoing (read) bandwidth  = ~1.2 MB/sec
```

---

## 5. Memory (Cache) Estimation

Cache mein popular URLs store karte hain taaki DB hit na ho.

### 80/20 Rule (Pareto Principle):
> 80% traffic sirf 20% URLs pe aata hai

```
Reads per day         = 1 billion
20% unique URLs       = 20% of 1 billion = 200 million requests
                        (but unique URLs kam honge)

Unique URLs per day   = 10 million (writes/day)
Cache 20% of them     = 2 million URLs

Memory per URL        = 130 bytes

Cache memory needed   = 2 million × 130 bytes
                      = 260 million bytes
                      = ~260 MB
```

260 MB cache — Redis easily handle kar sakta hai (Redis typically GBs mein hota hai).

---

## 6. QPS (Queries Per Second) Summary

```
Metric                    Calculation              Result
──────────────────────    ─────────────────────    ──────────────
Write QPS                 10M / 86400              ~116/sec
Read QPS                  1B / 86400               ~11,574/sec
Peak Read QPS (2x)        11,574 × 2               ~23,000/sec
Write bandwidth           116 × 100 bytes          ~12 KB/sec
Read bandwidth            11,574 × 100 bytes       ~1.2 MB/sec
Storage (5 years)         10M × 130B × 1825        ~2.4 TB
Cache memory              2M × 130 bytes           ~260 MB
```

---

## 7. Estimation Karne Ka Tarika (Interview Mein)

### Step-by-step bolte jao:

```
1. "I'll assume 100 million DAU"
2. "10% will create URLs → 10 million writes/day"
3. "Read/Write ratio is 100:1 → 1 billion reads/day"
4. "Each record is ~130 bytes"
5. "For 5 year retention → ~2.4 TB storage"
6. "Caching 20% hot URLs → ~260 MB Redis memory"
```

### Important numbers yaad rakho:
```
1 day     = 86,400 seconds  (~10^5)
1 month   = 2.5 million seconds
1 year    = 31.5 million seconds (~3 × 10^7)

1 KB = 10^3 bytes
1 MB = 10^6 bytes
1 GB = 10^9 bytes
1 TB = 10^12 bytes
```

---

## 8. Practice Task (Aaj Karo)

Blank paper lo aur khud se ye calculate karo:

```
Assumptions:
  DAU                = 50 million
  Write %            = 5% of DAU
  Read/Write ratio   = 200:1
  Record size        = 150 bytes
  Retention          = 3 years

Calculate:
  1. Writes per day
  2. Reads per day
  3. Write QPS & Read QPS
  4. Total storage needed
  5. Cache memory (20% hot URLs)
```

Answer check karne ke liye:
```
Writes/day  = 50M × 5%        = 2.5 million
Reads/day   = 2.5M × 200      = 500 million
Write QPS   = 2.5M / 86400    = ~29/sec
Read QPS    = 500M / 86400    = ~5,787/sec
Storage     = 2.5M × 150 × 1095 days = ~411 GB
Cache       = 2.5M × 20% × 150 bytes = ~75 MB
```

---

Kal Day 3 mein in estimations ke basis pe API Design aur Database Schema design karenge.
