# Database Bottlenecks: Kab Kya Karna Chahiye
# Complete Decision Guide — Situation by Situation

---

## Sabse Pehle: Bottleneck Ko Pehchano

Database slow hone ke **4 root causes** hote hain. Pehle diagnose karo, phir fix karo.

```
┌─────────────────────────────────────────────────────────────┐
│              Database Slow Hai — Root Cause?                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  CPU High    │  Disk I/O    │  Memory Low  │  Connections   │
│  (Queries)   │  (Storage)   │  (Buffer)    │  Exhausted     │
├──────────────┼──────────────┼──────────────┼────────────────┤
│  Add Index   │  Partition / │  Increase    │  Connection    │
│  Add Replica │  Archive Old │  RAM / Cache │  Pooling       │
│  Cache       │  Data / SSD  │  Redis       │  PgBouncer     │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Bottleneck 1: READ Bottleneck
### "SELECT queries slow hain, page load time badh raha hai"

### Symptoms (Yeh dikh raha hai toh read bottleneck hai)
```
- DB CPU: reads ki wajah se 70-80%+ hai
- SELECT queries > 100ms lag rahi hain
- pg_stat_statements mein SELECT queries top pe hain
- Logs mein "slow query" warnings aa rahe hain
- Users complain: "page load 3-4 seconds le raha hai"
```

### Diagnosis Command
```sql
-- Top slow queries dekho
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- DB CPU breakdown
SELECT wait_event_type, wait_event, count(*)
FROM pg_stat_activity
GROUP BY wait_event_type, wait_event;
```

### Fix Order (Seedha sharding mat karo!)
```
Step 1: EXPLAIN ANALYZE karo → Index missing hai?
           ↓ (agar index hai phir bhi slow)
Step 2: Redis Cache add karo (hot data ke liye)
           ↓ (agar cache bhi kaam nahi aaya)
Step 3: Read Replica add karo
           ↓ (agar 3-5 replicas ke baad bhi slow)
Step 4: Table Partitioning (time-based data ke liye)
```

### Read Replica Kab Banani Chahiye?

```
REPLICA BANAO JAB:
✅ Read : Write ratio > 70:30 ho
✅ Single DB CPU > 60% sirf reads ki wajah se
✅ Read latency > 50ms consistently
✅ Users > 50,000 active concurrent
✅ Alag reporting / analytics queries hain jo production slow kar rahi hain

REPLICA MAT BANAO JAB:
❌ Problem actually missing index ki wajah se hai
❌ Problem network ya application level pe hai
❌ Write latency problem hai (replica writes help nahi karega)
❌ Cache miss rate > 50% hai (pehle cache fix karo)
```

### Real Situation Examples

**Situation A: E-commerce site — Product listing slow**
```
- 500K users, product catalog 2M items
- GET /products → 800ms response
- DB pe SELECT * FROM products WHERE category = 'electronics' → Seq Scan

Fix: 
  1. Index add karo: CREATE INDEX ON products(category, price);
  2. Redis mein product catalog cache karo (TTL: 10 min)
  Result: 800ms → 20ms, koi replica nahi chahiye
```

**Situation B: Social app — User feed slow**
```
- 2M users, feed query 10+ table joins
- SELECT ... JOIN ... JOIN ... JOIN → 2 seconds

Fix:
  1. Denormalize: Feed ko pre-compute karke Redis mein store karo
  2. Read Replica add karo sirf feed queries ke liye
  Result: 2s → 50ms
```

---

## Bottleneck 2: WRITE Bottleneck
### "INSERT/UPDATE/DELETE slow hain, data save hone mein time lag raha hai"

### Symptoms
```
- Write latency > 100ms
- DB CPU high during peak hours (not reads)
- "Lock wait timeout" errors aane lage
- Queue/job processor backlog badh raha hai
- INSERT throughput > 5,000 TPS pe DB choke ho raha hai
```

### Diagnosis
```sql
-- Locks dekho
SELECT pid, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';

-- Write-heavy tables
SELECT schemaname, relname, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;
```

### Write Bottleneck Fix Order
```
Step 1: Writes ko async karo (Queue: Kafka/RabbitMQ)
           ↓
Step 2: Batch writes (100 inserts → 1 bulk insert)
           ↓
Step 3: Write-ahead optimization (tune PostgreSQL WAL settings)
           ↓
Step 4: Vertical Scaling (bigger machine — temporary fix)
           ↓
Step 5: SHARDING (jab sab fail ho jaye)
```

### Sharding Kab Karna Chahiye?

```
SHARDING KARO JAB (IN ORDER — sab try karo pehle):
✅ Write throughput > 10,000 TPS consistently
✅ Single DB size > 1 TB (query planning slow hota hai)
✅ Vertical scaling (bigger machine) bhi kaam nahi aaya
✅ Async queues + batch writes ke baad bhi slow
✅ Users > 5-10 Million ho gaye

SHARDING MAT KARO JAB:
❌ Problem sirf reads ki wajah se hai (replica lagao)
❌ Missing indexes ya bad queries hain (pehle fix karo)
❌ Connection exhaustion hai (PgBouncer lagao)
❌ Team chhoti hai — sharding ops complexity bahut badhati hai
❌ Joins aur transactions bahut hain — cross-shard nightmare hoga
```

### Real Situation: Sharding kab kiya

**Situation: Uber ride tracking**
```
Problem:
- Rides table mein har second 50K+ inserts (GPS updates)
- Single PostgreSQL → 8K TPS max → choke
- Table size 5TB → queries slow even with indexes

Solution: Hash sharding on driver_id
- Shard 0: driver_id % 4 == 0
- Shard 1: driver_id % 4 == 1
- Shard 2: driver_id % 4 == 2
- Shard 3: driver_id % 4 == 3

Result: 50K TPS across 4 shards = 12.5K TPS per shard (manageable)
```

**Situation: Small startup — Wrong decision**
```
Problem: "Hum 100K users ho gaye, sharding karo!"

Reality check:
- 100K users = ~500 concurrent = ~200 TPS max
- Single PostgreSQL handles 5,000+ TPS easily
- Asli problem: N+1 queries aur missing indexes thay

Sahi solution: Index fix karo + Redis cache = problem solved
Sharding karna = unnecessary complexity + bugs
```

---

## Bottleneck 3: CONNECTION Exhaustion
### "Too many connections" error — Sabse Common Problem

### Symptoms
```
- Error: "FATAL: sorry, too many clients already"
- Error: "connection pool exhausted"
- App server timeouts even though DB load is low
- DB connections > 400-500 (PostgreSQL default max_connections = 100)
```

### Why Hota Hai
```
PostgreSQL har connection ke liye:
- ~5-10 MB RAM allocate karta hai
- Worker process fork karta hai

10,000 app requests → 10,000 connections = 50-100 GB RAM → DB crash!
```

### Diagnosis
```sql
-- Current connections
SELECT count(*), state, wait_event_type
FROM pg_stat_activity
GROUP BY state, wait_event_type;

-- Max connections setting
SHOW max_connections;

-- Connection usage %
SELECT count(*) * 100 / current_setting('max_connections')::int AS usage_percent
FROM pg_stat_activity;
```

### Fix: Connection Pooling (PgBouncer)

```
BEFORE PgBouncer:
10,000 app requests → 10,000 DB connections → DB CRASH

AFTER PgBouncer:
10,000 app requests → PgBouncer → 100 DB connections → Happy DB

Math: 100x compression ratio in transaction mode
```

```ini
# pgbouncer.ini
[pgbouncer]
pool_mode = transaction       ; MOST IMPORTANT SETTING
max_client_conn = 10000       ; App se aane wale connections
default_pool_size = 100       ; Actual DB connections
min_pool_size = 10
reserve_pool_size = 20
server_idle_timeout = 600
```

### Connection Pooling Kab Lagao?

```
POOLER LAGAO JAB:
✅ App servers > 5-10 (microservices)
✅ DB connections regularly > 50% of max_connections
✅ "Too many clients" error kabhi bhi aaye
✅ App auto-scaling on (new instances = new connections)

POOLER MAT LAGAO JAB:
❌ Single app server hai, fixed connections hain
❌ Long-running transactions bahut hain (pooling unhe break kar sakta hai)
```

---

## Bottleneck 4: STORAGE / DISK I/O Bottleneck
### "DB disk full ho raha hai ya disk reads/writes slow hain"

### Symptoms
```
- Disk usage > 70-80%
- I/O wait > 20% (server mein top command mein %wa)
- Table scans slow even with indexes (disk pe cache miss)
- Checkpoint warnings in PostgreSQL logs
- VACUUM operations lamba time le rahe hain
```

### Diagnosis
```sql
-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Index usage (unused indexes delete karo)
SELECT indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Yeh indexes kabhi use nahi hue!
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Fix Order

```
Step 1: Old data archive karo (S3 / cold storage)
           ↓
Step 2: Table partitioning (time-based data)
           ↓
Step 3: Compress old partitions
           ↓
Step 4: Upgrade to SSD / NVMe (if HDD pe ho)
           ↓
Step 5: Increase shared_buffers (RAM mein zyada cache)
```

### Partitioning Kab Karo?

```
PARTITION KARO JAB:
✅ Table > 100 million rows
✅ Data time-based hai (logs, events, orders, transactions)
✅ Old data regularly delete/archive karna hota hai
✅ Date-range queries common hain

Example tables jo partition honI chahiye:
- orders (by created_at)
- user_events / logs (by date)
- audit_trail (by month)
- notifications (by week)
```

```sql
-- Time-based partition example
CREATE TABLE orders (
    id         BIGSERIAL,
    user_id    BIGINT,
    amount     DECIMAL,
    created_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Query automatically sirf relevant partition scan karega
-- 100M rows ki jagah 10M rows scan → 10x faster
```

---

## Bottleneck 5: MEMORY Bottleneck
### "DB har baar disk se padh raha hai, RAM mein cache nahi ho raha"

### Symptoms
```
- Buffer hit ratio < 95% (bad!)
- I/O wait high
- Cold starts ke baad queries bahut slow
- pg_stat_bgwriter mein buffers_clean/maxwritten_clean high
```

### Diagnosis
```sql
-- Buffer hit ratio check karo
SELECT 
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
FROM pg_statio_user_tables;
-- Target: > 0.99 (99% cache hits)

-- Agar < 0.95 hai → shared_buffers badhao ya Redis add karo
```

### Fix

```
PostgreSQL tuning (postgresql.conf):
shared_buffers = 25% of total RAM       -- DB ki apni cache
effective_cache_size = 75% of total RAM -- OS cache estimate
work_mem = 64MB                         -- Sort/hash operations
maintenance_work_mem = 512MB            -- VACUUM, CREATE INDEX

Agar RAM expensive hai:
→ Redis add karo application layer pe (cheapest solution)
```

---

## Master Decision Tree: Kya Problem Hai, Kya Karo

```
DB Performance Problem
         │
         ▼
Is query slow? → EXPLAIN ANALYZE karo
         │
    ┌────┴────┐
    │         │
 Seq Scan   Index Scan
    │         │
Add Index   Kuch aur problem hai
    │         │
Problem      ├── High CPU → Read ya Write bottleneck?
Solved?      │
             ├── READ BOTTLENECK
             │      1. Cache (Redis) lagao
             │      2. Read Replica add karo
             │      3. Denormalize data
             │
             ├── WRITE BOTTLENECK
             │      1. Async queue (Kafka)
             │      2. Batch writes
             │      3. Vertical scale (temp)
             │      4. → SHARDING (last resort)
             │
             ├── CONNECTION EXHAUSTION
             │      → PgBouncer (connection pooling)
             │
             ├── DISK FULL
             │      1. Archive old data → S3
             │      2. Table Partitioning
             │      3. SSD upgrade
             │
             └── MEMORY LOW
                    1. shared_buffers badhao
                    2. Redis cache add karo
```

---

## Scale ke Saath Decision Timeline

### 0 → 1,000 Users
```
✅ Single PostgreSQL instance
✅ Basic indexes (primary key, foreign keys)
✅ No caching needed
✅ No replicas needed

Machine: t3.medium (2 CPU, 4 GB RAM) — $30/month
```

### 1,000 → 10,000 Users
```
Pehli problems:
- Slow queries start hone lagte hain

Fix:
✅ Missing indexes add karo (EXPLAIN ANALYZE use karo)
✅ N+1 queries fix karo (ORM eager loading)
✅ Connection pooling (PgBouncer) setup karo
❌ Still no replicas needed yet

Machine: t3.large (2 CPU, 8 GB RAM) — $60/month
```

### 10,000 → 100,000 Users
```
Pehli problems:
- Read queries load peak pe slow
- Cache miss queries DB hit kar rahe hain

Fix:
✅ Redis cache add karo (hot data: user profiles, configs)
✅ 1-2 Read Replicas add karo
✅ Async jobs ke liye queue (BullMQ/Celery)
❌ Sharding abhi nahi!

Machine: r5.xlarge primary (4 CPU, 32 GB RAM) — $200/month
```

### 100,000 → 1,000,000 Users
```
Pehli problems:
- Peak write load badh raha hai
- Read replicas bhi slow hone lage
- Single table > 10M rows → slow

Fix:
✅ 3-5 Read Replicas (read-heavy workload)
✅ Table Partitioning (orders, events, logs)
✅ Redis cluster (single Redis bottleneck ban sakta hai)
✅ CQRS — read aur write paths separate karo
✅ CDN for static + cacheable API responses
❌ Sharding sirf agar writes > 8K TPS consistently

Machine: r5.2xlarge + Multi-AZ — $500/month
```

### 1,000,000 → 10,000,000 Users
```
Pehli problems:
- Writes 10K+ TPS exceed kar rahe hain
- Single DB size > 1 TB
- Vertical scaling limit aa gayi

Fix:
✅ SHARDING — ab karo (user_id hash-based, 4-8 shards)
✅ Multi-region read replicas (global users ke liye)
✅ Aurora Global ya CockroachDB consider karo
✅ Analytics ke liye alag DB (Redshift/BigQuery)
✅ Elasticsearch for search queries
✅ Event sourcing + CDC (Debezium) for data sync

Machine: Multiple r5.4xlarge instances — $5,000+/month
```

---

## Situation-based Quick Reference

| Situation | Problem | Solution |
|-----------|---------|----------|
| Page load 3s+ | Missing index ya N+1 query | EXPLAIN ANALYZE → fix query/index |
| "Too many connections" | No connection pooler | PgBouncer — transaction mode |
| Read queries slow, writes fine | Read bottleneck | Redis Cache → Read Replicas |
| Write queries slow, reads fine | Write bottleneck | Async Queue → Batch → Sharding |
| Disk 80%+ full | Data accumulation | Archive + Partitioning |
| Reports slow, prod affected | Mixed workload | CQRS — separate read DB |
| Global users, high latency | Single region | Multi-region replicas |
| Table > 500M rows | Partition needed | Time-based partitioning |
| 10K+ TPS writes | Single DB limit | Hash-based sharding |
| Cold start slow | Low buffer hit ratio | Increase shared_buffers / Redis |

---

## Interview Mein Yeh Bolna (Decision Framework)

```
Interviewer: "Database slow ho gayi 10M users pe, kya karoge?"

Sahi Answer:

"Main pehle diagnose karunga ki bottleneck kahan hai:

1. EXPLAIN ANALYZE se slow queries dhundunga
   - Agar Seq Scan → Index add karunga
   - Agar Index Scan but slow → data volume problem

2. Metrics check karunga:
   - CPU high due to reads? → Cache + Replicas
   - CPU high due to writes? → Queue + Batch + eventually Sharding  
   - Connections exhausted? → PgBouncer
   - Disk full? → Archive + Partition

3. Phased approach:
   - Pehle: Index + Cache (simplest, biggest impact)
   - Phir: Read Replicas (agar read bottleneck)
   - Phir: Partitioning (agar table size problem)
   - Last: Sharding (sirf tab jab write throughput exceed hoga)

Sharding sabse last step hai kyunki:
- Cross-shard joins impossible
- Distributed transactions complex
- Operations complexity 10x badhti hai
- Zyada teams is complexity ko handle nahi kar sakti"
```

---

## Key Numbers — Yaad Rakho

```
PostgreSQL max_connections default    → 100
PgBouncer transaction mode ratio      → 100:1 (10K app → 100 DB)
Single PostgreSQL write limit         → ~5,000-10,000 TPS
Read Replica replication lag          → <10ms same AZ, <100ms cross-AZ
Redis throughput                      → 100,000+ ops/second
Cache target hit rate                 → >95%
Table rows before partitioning        → >50-100 million
DB size before sharding concern       → >500 GB - 1 TB
Users before sharding is typically needed → >5 million (write-heavy apps)
```
