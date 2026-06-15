# Database Scaling Strategy for 10M+ Users
# 10 Million Users Tak Database Kaise Scale Kare

---

## Problem Statement
Jab users badhte hain — 1K → 10K → 100K → 1M → 10M — tab database sabse pehle bottleneck banta hai.
- Slow queries
- Connection pool exhaustion
- Disk I/O saturation
- Single point of failure

---

## Phase-wise Scaling Journey

```
1K Users      → Single DB (Postgres/MySQL) — koi tension nahi
10K Users     → Add Read Replicas
100K Users    → Connection Pooling + Caching (Redis)
1M Users      → Sharding + CDN
10M Users     → Multi-region + CQRS + Event Sourcing
```

---

## Step 1: Read Replicas (Pehla Kadam)

### Problem
- 80% traffic READ hota hai (SELECT queries)
- Primary DB pe read + write dono → overload

### Solution: Master-Slave Replication

```
                    ┌─────────────┐
   Writes ─────────▶│  Primary DB │──── replication ──▶ Replica 1
                    └─────────────┘                  └─▶ Replica 2
   Reads ──────────▶   Replica 1 / 2 / 3             └─▶ Replica 3
```

### Implementation (Node.js / TypeORM)
```typescript
// Primary for writes
const primaryDB = new DataSource({
  host: "primary.db.internal",
  type: "postgres",
});

// Replica for reads
const replicaDB = new DataSource({
  host: "replica.db.internal",
  type: "postgres",
});

// Usage
async function getUser(id: string) {
  return replicaDB.getRepository(User).findOne({ where: { id } }); // READ → Replica
}

async function createUser(data: UserDto) {
  return primaryDB.getRepository(User).save(data); // WRITE → Primary
}
```

### Interview Point
> "Read replicas se read throughput linearly scale hota hai. Hum 3-5 replicas add karke 5x read capacity badha sakte hain bina primary ko touch kiye."

---

## Step 2: Connection Pooling (PgBouncer / HikariCP)

### Problem
- Har request pe DB connection banana = expensive (TCP handshake + auth)
- 10K concurrent users = 10K connections → DB crash

### Solution
```
App Servers ──▶ PgBouncer (Pool) ──▶ PostgreSQL
              (1000 app connections → 100 DB connections)
```

### Config (pgbouncer.ini)
```ini
[pgbouncer]
pool_mode = transaction          ; connection per transaction, not per session
max_client_conn = 10000          ; app se aane wale max connections
default_pool_size = 100          ; actual DB connections
reserve_pool_size = 10
reserve_pool_timeout = 3
```

### Key Numbers for Interview
| Mode        | Use Case                    | Multiplexing |
|-------------|----------------------------|--------------|
| Session     | Long-lived connections      | 1:1          |
| Transaction | Most web apps (recommended) | 100:1        |
| Statement   | Simple stateless queries    | 1000:1       |

---

## Step 3: Caching Layer (Redis)

### Problem
- Same data baar baar DB se fetch karna = waste
- Hot data (user profile, config) repeatedly hit karta hai DB

### Cache-Aside Pattern
```
App ──▶ Redis hit? ──YES──▶ Return cached data
         │
         NO
         ▼
        DB query ──▶ Store in Redis (TTL: 5 min) ──▶ Return data
```

### Implementation
```typescript
const redis = new Redis({ host: "redis.internal" });

async function getUserProfile(userId: string) {
  const cacheKey = `user:${userId}`;
  
  // Cache check
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // DB se fetch
  const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
  
  // Cache mein store karo (TTL: 300 seconds)
  await redis.setex(cacheKey, 300, JSON.stringify(user));
  
  return user;
}
```

### Cache Invalidation Strategies
```
1. TTL-based    → Simple, stale data possible
2. Write-through → Write DB + Cache simultaneously (consistent)
3. Write-behind → Write cache first, DB async (fast but risk of loss)
4. Event-driven → DB change → Invalidate cache via event
```

### Interview Point
> "Cache hit rate 95%+ hona chahiye. Agar 10M users hain aur 95% requests cache se serve ho rahi hain, to sirf 500K requests DB tak pahunchi. Yeh 20x DB load reduction hai."

---

## Step 4: Database Sharding (Sabse Critical Step)

### Problem
- Single DB ki storage aur compute limit hoti hai
- Even with replicas, writes sirf Primary pe hain → bottleneck

### Concept: Horizontal Partitioning

```
Sharding ke bina:             Sharding ke baad:
┌──────────────┐              ┌────────┐ ┌────────┐ ┌────────┐
│  Users Table │              │Shard 0 │ │Shard 1 │ │Shard 2 │
│  (100M rows) │     ────▶    │user_id │ │user_id │ │user_id │
└──────────────┘              │0-33M   │ │33-66M  │ │66-100M │
                              └────────┘ └────────┘ └────────┘
```

### Sharding Strategies

#### 1. Range-based Sharding
```
user_id 1        - 33,333,333  → Shard 0
user_id 33333334 - 66,666,666  → Shard 1
user_id 66666667 - 100,000,000 → Shard 2
```
- **Pro:** Range queries easy (e.g., get users registered in January)
- **Con:** Hot shard problem (naye users → sirf last shard)

#### 2. Hash-based Sharding (Recommended)
```typescript
function getShard(userId: string, totalShards: number): number {
  const hash = murmurhash(userId);
  return hash % totalShards;
}

// user_id "abc123" → hash → Shard 2
// user_id "xyz789" → hash → Shard 0
```
- **Pro:** Even distribution, no hot spots
- **Con:** Range queries impossible, resharding painful

#### 3. Directory-based Sharding
```
Lookup Table:
user_id → shard_id

"user_abc" → shard_2
"user_xyz" → shard_0
```
- **Pro:** Flexible, easy to move data
- **Con:** Lookup table itself becomes bottleneck

### Cross-shard Queries — The Hard Part

```sql
-- Yeh single shard pe easy hai:
SELECT * FROM orders WHERE user_id = 123;

-- Yeh cross-shard nightmare hai:
SELECT COUNT(*) FROM orders WHERE created_at > '2024-01-01';
-- Isko har shard pe run karna padega, then aggregate!
```

**Solution:** 
- Application-level aggregation
- Use separate analytics DB (Redshift / BigQuery) for cross-shard queries
- Denormalize data (store user_region in orders table)

---

## Step 5: CQRS Pattern (Command Query Responsibility Segregation)

### Problem
- Complex read queries (dashboards, reports) aur writes same DB pe → conflict
- Reads optimize karo to writes slow, vice versa

### Solution
```
                ┌─────────────────────────────────────┐
                │           Application               │
                └─────────────┬───────────────────────┘
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
    ┌─────────────────┐             ┌─────────────────────┐
    │  Command Side   │             │    Query Side        │
    │  (Writes)       │             │    (Reads)           │
    │                 │             │                      │
    │  PostgreSQL     │──sync──────▶│  Read-optimized DB   │
    │  (normalized)   │             │  (Elasticsearch /    │
    └─────────────────┘             │   Cassandra / Redis) │
                                    └─────────────────────┘
```

### Example: E-commerce Orders

```typescript
// Command: Order likhna (PostgreSQL - ACID)
async function placeOrder(command: PlaceOrderCommand) {
  await postgresDb.transaction(async (trx) => {
    await trx.insert('orders', command);
    await trx.update('inventory', { quantity: -command.qty });
    await trx.insert('payments', command.payment);
  });
  
  // Event emit karo query side ko sync karne ke liye
  await eventBus.emit('order.placed', command);
}

// Query: Orders dekhna (Elasticsearch - fast search)
async function getUserOrders(userId: string, filters: OrderFilters) {
  return elasticsearch.search({
    index: 'orders',
    query: { bool: { must: [{ term: { userId } }, ...buildFilters(filters)] } }
  });
}
```

---

## Step 6: Database Partitioning (Table-level)

### Time-based Partitioning (Most Common)

```sql
-- PostgreSQL table partitioning
CREATE TABLE events (
    id          BIGSERIAL,
    user_id     BIGINT,
    event_type  VARCHAR(50),
    created_at  TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Har mahine ke liye alag partition
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Query sirf relevant partition scan karegi → 10-100x faster
SELECT * FROM events WHERE created_at >= '2024-01-01' AND user_id = 123;
```

### Old Data Archive Karo
```
Hot Data (last 90 days)  → PostgreSQL (fast SSD)
Warm Data (90d - 1yr)    → PostgreSQL (standard disk)
Cold Data (1yr+)         → S3 / Glacier (cheap storage)
```

---

## Step 7: Multi-region Deployment

### Problem
- 10M users globally → Latency for users far from your single region

### Global DB Architecture
```
                    ┌──────────────────┐
    US Users ──────▶│  US-East (Write) │◀── Global Write Endpoint
                    │  Primary DB      │
                    └────────┬─────────┘
                             │ async replication
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  EU-West     │  │  AP-South    │  │  US-West     │
    │  Read Replica│  │  Read Replica│  │  Read Replica│
    └──────────────┘  └──────────────┘  └──────────────┘
    EU Users ──▶ EU   IN Users ──▶ AP   WC Users ──▶ West
```

### Tools
- **AWS Aurora Global Database** — sub-second replication cross-region
- **CockroachDB** — distributed SQL, multi-region native
- **Vitess** — MySQL sharding (YouTube use karta hai)
- **PlanetScale** — Vitess on cloud

---

## Step 8: Slow Query Optimization (Indexes)

### Identify Slow Queries
```sql
-- PostgreSQL slow query log
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Index Strategies
```sql
-- Composite index (order matters!)
CREATE INDEX idx_orders_user_status ON orders (user_id, status, created_at);

-- Partial index (sirf active users ke liye)
CREATE INDEX idx_active_users ON users (email) WHERE status = 'active';

-- Covering index (query ke saare columns index mein)
CREATE INDEX idx_user_cover ON users (user_id) INCLUDE (name, email, created_at);

-- Full-text search
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', name || ' ' || description));
```

### EXPLAIN ANALYZE use karo
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

-- Dekhna chahiye: "Index Scan" not "Seq Scan"
-- Seq Scan on large tables = problem!
```

---

## Complete Architecture: 10M Users

```
                         Users (10M)
                              │
                    ┌─────────▼──────────┐
                    │   CDN (CloudFront) │  ← Static assets, API caching
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Load Balancer     │  ← AWS ALB / Nginx
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         API Server 1   API Server 2   API Server 3  (Auto-scaling)
              │               │               │
              └───────────────┼───────────────┘
                              │
              ┌───────────────┼────────────────────┐
              ▼               ▼                    ▼
     ┌──────────────┐  ┌───────────┐      ┌──────────────┐
     │ Redis Cache  │  │  Message  │      │  PgBouncer   │
     │ (Read Cache) │  │  Queue    │      │  (Pool)      │
     └──────────────┘  │(RabbitMQ/ │      └──────┬───────┘
                       │ Kafka)    │             │
                       └───────────┘     ┌───────┼────────┐
                                         ▼       ▼        ▼
                                     Shard 0  Shard 1  Shard 2
                                    (Primary)(Primary)(Primary)
                                        │       │        │
                                     Replica  Replica  Replica
```

---

## Interview Cheat Sheet

### Common Questions & Answers

**Q: Database slow ho rahi hai, kya karoge?**
```
1. EXPLAIN ANALYZE se slow queries identify karo
2. Missing indexes add karo
3. Read replicas add karo (read/write split)
4. Redis cache add karo (hot data ke liye)
5. Connection pooling setup karo (PgBouncer)
6. Agar phir bhi nahi hua → Sharding consider karo
```

**Q: Sharding kab karoge?**
```
- Single DB > 1TB data
- Write throughput > 10K TPS
- Query latency unacceptable even with indexes + replicas
- Estimated future growth requires it
```

**Q: Sharding key kaise choose karoge?**
```
- High cardinality honi chahiye (user_id > status)
- Even distribution chahiye (UUID/hash based)
- Most common query pattern ke saath align karo
- Cross-shard joins avoid karo
```

**Q: Cache invalidation kaise handle karoge?**
```
- TTL: Simple, acceptable staleness ke liye
- Event-driven: DB write → Kafka event → Cache invalidate
- Write-through: Write DB + Cache simultaneously
```

**Q: ACID vs BASE?**
```
ACID (PostgreSQL)  → Bank transactions, orders (consistency critical)
BASE (Cassandra)   → Social feeds, logs (availability critical)

"Basically Available, Soft state, Eventually consistent"
```

---

## Technologies at Scale

| Problem              | Solution                           | Used By         |
|---------------------|------------------------------------|-----------------|
| Read scaling        | Read Replicas + Redis              | Almost everyone |
| Write scaling       | Sharding / Vitess                  | YouTube, GitHub |
| Full-text search    | Elasticsearch                      | LinkedIn, Uber  |
| Time-series data    | TimescaleDB / InfluxDB             | Grafana, Datadog|
| Global low latency  | CockroachDB / Aurora Global        | Cockroach Labs  |
| Event streaming     | Kafka + CDC (Debezium)             | Netflix, Uber   |
| Analytics           | Redshift / BigQuery / ClickHouse   | Airbnb, Shopify |

---

## Key Numbers to Remember

```
PostgreSQL max connections    → ~500 (without pooler)
PgBouncer with transaction    → 10,000 app → 100 DB connections
Redis GET/SET throughput      → ~100K ops/second
Single DB write throughput    → ~5,000 TPS
Sharded DB write throughput   → 5,000 × N shards TPS
Cache hit target              → >95%
Read replica replication lag  → <100ms (same region)
Aurora Global replication lag → <1 second (cross-region)
```
