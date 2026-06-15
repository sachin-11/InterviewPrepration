# Database Bottlenecks — Complete Guide
## Kya kya problem aa sakti hai aur kaise fix karein

---

## 1. N+1 QUERY PROBLEM (Sabse Common)

### Kya hota hai?
Ek query ke result ke liye N extra queries chalti hain.

```javascript
// ❌ WRONG — 1 + N queries
const users = await db.query('SELECT * FROM users LIMIT 100');
// Abhi tak: 1 query

for (const user of users) {
  const orders = await db.query(
    'SELECT * FROM orders WHERE user_id = $1', [user.id]
  );
  // Yahan: 100 alag queries! Total = 101 queries
}

// ✓ CORRECT — Sirf 2 queries (ya 1 JOIN se)
const users = await db.query('SELECT * FROM users LIMIT 100');
const userIds = users.rows.map(u => u.id);

const orders = await db.query(
  'SELECT * FROM orders WHERE user_id = ANY($1::int[])', [userIds]
);
// Total: 2 queries only!

// Ya JOIN se ek hi query mein
const result = await db.query(`
  SELECT u.*, o.id as order_id, o.amount
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  LIMIT 100
`);
```

### Real Impact
```
100 users × 5ms per query = 500ms  ← N+1
1 batch query               = 10ms  ← Fixed

10,000 requests/sec pe:
  N+1:   50,000 queries/sec  → DB crash
  Fixed:  10,000 queries/sec → Manageable
```

---

## 2. MISSING INDEXES (Slow Queries)

### Kya hota hai?
Without index → DB **pura table scan** karta hai (Full Table Scan).

```sql
-- ❌ SLOW — No index on email column
SELECT * FROM users WHERE email = 'sachin@example.com';
-- PostgreSQL 10M rows scan karega! → 8000ms

-- ✓ FIX — Index banao
CREATE INDEX idx_users_email ON users(email);
-- Ab: 1ms! B-tree se directly milega
```

### Index Types aur Kab Use Karein

```sql
-- 1. B-Tree Index (default) — equality aur range queries
CREATE INDEX idx_orders_created_at ON orders(created_at);
SELECT * FROM orders WHERE created_at > '2025-01-01';  -- Fast!

-- 2. Composite Index — multiple columns filter
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
SELECT * FROM orders WHERE user_id = 5 AND status = 'pending';

-- 3. Partial Index — sirf kuch rows index karo (space efficient)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
-- Sirf active users ka index → smaller, faster

-- 4. Full-Text Index — text search ke liye
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name));
SELECT * FROM products WHERE to_tsvector('english', name) @@ to_tsquery('laptop');

-- 5. Hash Index — exact equality only
CREATE INDEX idx_sessions_token ON sessions USING hash(token);
```

### Index ke Saath Problems (Over-indexing)

```sql
-- ❌ PROBLEM: Bahut zyada indexes = WRITE operations slow
-- Har INSERT/UPDATE/DELETE pe sab indexes update hote hain

-- Example: 10 indexes wale table pe INSERT
INSERT INTO orders VALUES (...);
-- 10 indexes update → 10x slow writes!

-- ✓ RULE: Sirf woh columns index karo jo WHERE, JOIN, ORDER BY mein aate hain
-- Write-heavy tables pe indexes minimize karo
```

### EXPLAIN ANALYZE — Query ka X-Ray

```sql
-- Pehle yeh chalao, dekho kya ho raha hai
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

-- Output:
-- Seq Scan on orders  ← BAD! Full table scan
--   cost=0.00..15420.00 rows=1000
--   actual time=0.043..892.000  ← 892ms!

-- Index add karne ke baad:
-- Index Scan using idx_orders_user_status  ← GOOD!
--   actual time=0.043..0.890  ← 0.89ms!
```

---

## 3. CONNECTION POOL EXHAUSTION

### Kya hota hai?
DB ke paas limited connections hoti hain. Sab use ho jaayein → new requests wait karein ya fail ho jaayein.

```
PostgreSQL default: max_connections = 100

Agar 10 app servers × 20 connections each = 200 connections needed
Lekin DB sirf 100 allow karta hai → ERROR: too many connections
```

### Fix: PgBouncer (Connection Pooler)

```
Before PgBouncer:
App Server 1 (20 conn) ─┐
App Server 2 (20 conn) ─┼→ PostgreSQL (max 100)  ← Problem!
App Server 3 (20 conn) ─┘

After PgBouncer:
App Server 1 (20 conn) ─┐
App Server 2 (20 conn) ─┼→ PgBouncer (1000 conn) → PostgreSQL (20 conn)
App Server 3 (20 conn) ─┘                               ↑ Multiplexing!
```

```ini
# pgbouncer.ini
[databases]
myapp = host=localhost dbname=myapp

[pgbouncer]
pool_mode = transaction    # Connection sirf transaction ke time tak hold karo
max_client_conn = 1000     # App servers se max connections
default_pool_size = 20     # Actual DB connections
```

```javascript
// Code mein connection pool sahi configure karo
const pool = new Pool({
  max: 20,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // 30 sec idle → close
  connectionTimeoutMillis: 2000,  // 2 sec wait → error throw
  
  // ✓ Always connection release karo!
});

// ❌ WRONG — Connection leak!
async function getUser(id) {
  const client = await pool.connect();
  const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
  // client.release() bhool gaye! → Connection leak
  return result.rows[0];
}

// ✓ CORRECT — try/finally se guarantee
async function getUser(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release();  // Hamesha release hoga, error pe bhi
  }
}
```

---

## 4. SLOW QUERIES / LONG-RUNNING TRANSACTIONS

### Problem 1: Missing WHERE clause

```sql
-- ❌ DANGER — Pura table update!
UPDATE users SET is_notified = true;
-- 10M rows update → 10 minutes lock!

-- ✓ SAFE — Specific rows
UPDATE users SET is_notified = true WHERE created_at > '2025-01-01';
```

### Problem 2: SELECT *

```sql
-- ❌ WRONG — Sab columns fetch karo
SELECT * FROM users;
-- 50 columns, 1M rows → 500MB data transfer!

-- ✓ CORRECT — Sirf chahiye woh columns
SELECT id, name, email FROM users WHERE is_active = true;
```

### Problem 3: LIKE with leading wildcard

```sql
-- ❌ VERY SLOW — Index use nahi hoga
SELECT * FROM products WHERE name LIKE '%laptop%';
-- Full table scan guaranteed!

-- ✓ OPTION 1: Trailing wildcard (index use hoga)
SELECT * FROM products WHERE name LIKE 'laptop%';

-- ✓ OPTION 2: Full-text search use karo
SELECT * FROM products
WHERE to_tsvector('english', name) @@ to_tsquery('laptop');
```

### Problem 4: Long Transactions = Table Lock

```sql
-- ❌ WRONG — Long transaction, table locked!
BEGIN;
UPDATE inventory SET stock = stock - 1 WHERE product_id = 123;
-- ... 30 seconds kuch aur processing ...
-- Sab SELECT bhi wait karenge!
COMMIT;

-- ✓ CORRECT — Transaction short rakho
BEGIN;
-- Sirf DB operations transaction mein
UPDATE inventory SET stock = stock - 1 WHERE product_id = 123;
COMMIT;
-- Business logic transaction ke baahir karo
```

### Find Slow Queries

```sql
-- PostgreSQL mein slow queries dhundho
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Currently running long queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Kill stuck query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE duration > interval '10 minutes';
```

---

## 5. DATABASE LOCKING

### Types of Locks

```
Row Lock    → Sirf ek row locked (INSERT/UPDATE/DELETE)
Table Lock  → Pura table locked (DDL operations, full table update)
Deadlock    → 2 transactions ek doosre ka wait kar rahe hain
```

### Deadlock Example

```sql
-- Transaction A                    -- Transaction B
BEGIN;                               BEGIN;
UPDATE accounts                      UPDATE accounts
  SET balance = balance - 100          SET balance = balance - 50
  WHERE id = 1;  ← Row 1 lock          WHERE id = 2;  ← Row 2 lock

UPDATE accounts                      UPDATE accounts  
  SET balance = balance + 100          SET balance = balance + 50
  WHERE id = 2;  ← Waiting...          WHERE id = 1;  ← Waiting...

-- DEADLOCK! Dono wait kar rahe hain ek doosre ka
-- PostgreSQL automatically detect karke ek ko kill karega
```

### Deadlock Fix

```javascript
// ✓ FIX: Hamesha same order mein rows lock karo
// Pehle lower ID, phir higher ID

async function transfer(fromId, toId, amount) {
  const [first, second] = fromId < toId 
    ? [fromId, toId] 
    : [toId, fromId];
    
  await db.query('BEGIN');
  await db.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [first]);
  await db.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [second]);
  // Ab koi deadlock nahi — order consistent hai
  await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
  await db.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
  await db.query('COMMIT');
}
```

### Optimistic vs Pessimistic Locking

```sql
-- PESSIMISTIC: Pehle lock, phir kaam
SELECT * FROM inventory WHERE id = 1 FOR UPDATE;
-- Row lock ho gayi, koi aur update nahi kar sakta
UPDATE inventory SET stock = stock - 1 WHERE id = 1;
COMMIT;

-- OPTIMISTIC: Lock nahi, version check karo
SELECT id, stock, version FROM inventory WHERE id = 1;
-- stock = 10, version = 5

UPDATE inventory 
SET stock = 9, version = version + 1
WHERE id = 1 AND version = 5;  -- Version same hai toh hi update
-- Agar version change ho gayi → 0 rows affected → retry karo
```

```javascript
// Optimistic locking in code
async function decreaseStock(productId, quantity) {
  let retries = 3;
  
  while (retries > 0) {
    const product = await db.query(
      'SELECT stock, version FROM inventory WHERE id = $1', [productId]
    );
    
    if (product.rows[0].stock < quantity) throw new Error('Out of stock');
    
    const result = await db.query(
      `UPDATE inventory 
       SET stock = stock - $1, version = version + 1
       WHERE id = $2 AND version = $3`,
      [quantity, productId, product.rows[0].version]
    );
    
    if (result.rowCount === 1) return; // Success!
    
    retries--;
    await sleep(10 * (4 - retries)); // Exponential backoff
  }
  
  throw new Error('Concurrent update conflict, please retry');
}
```

---

## 6. REPLICATION LAG

### Kya hota hai?
Primary DB pe write hota hai, Read Replica ko sync hone mein time lagta hai.

```
User ne password change kiya:
  Write → Primary DB (updated)
  
User turant login karta hai:
  Read  → Replica DB (old password!) ← LOGIN FAIL!
  
Replica lag: 100ms to seconds (load ke hisaab se)
```

### Fix Strategies

```javascript
// Strategy 1: Critical reads Primary se karo
async function login(email, password) {
  // Auth ke liye hamesha primary use karo
  const user = await primaryDB.query(
    'SELECT * FROM users WHERE email = $1', [email]
  );
  return verifyPassword(password, user.rows[0].password_hash);
}

async function getProductList() {
  // Non-critical reads replica se
  return replicaDB.query('SELECT * FROM products LIMIT 20');
}

// Strategy 2: Read-your-own-writes
// Write ke baad ek short time primary se padhna
async function updateProfile(userId, data) {
  await primaryDB.query('UPDATE users SET ... WHERE id = $1', [userId]);
  
  // Next 5 seconds mein same user ki reads primary se
  await redis.setEx(`read-primary:${userId}`, 5, '1');
}

async function getProfile(userId) {
  const usePrimary = await redis.get(`read-primary:${userId}`);
  const db = usePrimary ? primaryDB : replicaDB;
  return db.query('SELECT * FROM users WHERE id = $1', [userId]);
}
```

---

## 7. PAGINATION PROBLEMS

### Problem: OFFSET LIMIT at Scale

```sql
-- ❌ SLOW at large offsets
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000;
-- PostgreSQL 100,020 rows skip karega, phir 20 return karega!
-- 1M records pe → 5000ms+

-- ✓ CURSOR-BASED PAGINATION (Keyset Pagination)
-- First page:
SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT 20;
-- Last item: created_at = '2025-01-15 10:30:00', id = 5000

-- Next page:
SELECT * FROM posts
WHERE (created_at, id) < ('2025-01-15 10:30:00', 5000)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- Ye hamesha fast rahega — index use hoga!
```

```javascript
// Cursor pagination implementation
async function getPosts(cursor = null, limit = 20) {
  let query;
  let params;
  
  if (!cursor) {
    // First page
    query = 'SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT $1';
    params = [limit];
  } else {
    // Decode cursor
    const { createdAt, id } = decodeCursor(cursor);
    query = `
      SELECT * FROM posts
      WHERE (created_at, id) < ($1, $2)
      ORDER BY created_at DESC, id DESC
      LIMIT $3
    `;
    params = [createdAt, id, limit];
  }
  
  const posts = await db.query(query, params);
  const lastPost = posts.rows[posts.rows.length - 1];
  
  return {
    data: posts.rows,
    nextCursor: lastPost 
      ? encodeCursor({ createdAt: lastPost.created_at, id: lastPost.id }) 
      : null
  };
}
```

---

## 8. WRONG DATA TYPES

```sql
-- ❌ WRONG — String mein numbers store karo
CREATE TABLE products (
  price VARCHAR(20)   -- '1999.99' as string
);
SELECT * FROM products WHERE price > '500';
-- String comparison: '9' > '500' (alphabetically!) — WRONG!

-- ✓ CORRECT
CREATE TABLE products (
  price DECIMAL(10, 2)  -- Proper numeric type
);

-- ❌ WRONG — UUID string ke roop mein
id VARCHAR(36)  -- '550e8400-e29b-41d4-a716-446655440000'
-- 36 bytes per row

-- ✓ CORRECT
id UUID  -- 16 bytes, indexed efficiently
-- Ya serial/bigserial auto-increment ke liye

-- ❌ WRONG — JSON sabke liye
user_preferences JSONB  -- Agar structure fixed hai

-- ✓ CORRECT — Fixed structure → proper columns
-- JSONB sirf truly dynamic data ke liye
```

---

## 9. NO QUERY CACHING STRATEGY

```javascript
// ❌ WRONG — Har baar DB hit karo
app.get('/products', async (req, res) => {
  const products = await db.query('SELECT * FROM products');
  res.json(products.rows);
});

// ✓ CORRECT — Cache-Aside Pattern
app.get('/products', async (req, res) => {
  const cacheKey = 'products:all';
  
  // 1. Cache check karo
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // 2. DB se fetch karo
  const products = await db.query('SELECT * FROM products');
  
  // 3. Cache mein store karo
  await redis.setEx(cacheKey, 300, JSON.stringify(products.rows)); // 5 min TTL
  
  res.json(products.rows);
});

// ✓ Cache invalidation — product update hone pe
app.put('/products/:id', async (req, res) => {
  await db.query('UPDATE products SET ... WHERE id = $1', [req.params.id]);
  await redis.del('products:all');  // Cache clear karo
  res.json({ success: true });
});
```

---

## 10. CARTESIAN PRODUCT (Missing JOIN Condition)

```sql
-- ❌ DISASTER — Missing JOIN condition
SELECT * FROM users, orders;
-- 1000 users × 50,000 orders = 50,000,000 rows! DB hang!

-- ✓ CORRECT
SELECT * FROM users u
JOIN orders o ON o.user_id = u.id;
-- Sirf matching rows
```

---

## Bottleneck Detection Toolkit

```sql
-- 1. Sabse slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- 2. Index usage check karo (low idx_scan = unused index)
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- 3. Table scan vs index scan ratio
SELECT relname, seq_scan, idx_scan,
  CASE WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE round(100.0 * idx_scan / (seq_scan + idx_scan), 2)
  END AS index_usage_percent
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- 4. Bloated tables (VACUUM karna chahiye)
SELECT relname, n_dead_tup, n_live_tup,
  round(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- 5. Lock conflicts
SELECT blocked.pid, blocked.query, blocking.pid AS blocking_pid
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking 
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.cardinality(pg_blocking_pids(blocked.pid)) > 0;
```

---

## Quick Fix Priority List

```
Severity: HIGH → FIX IMMEDIATELY
  1. Missing indexes on WHERE/JOIN columns
  2. N+1 queries
  3. Connection pool exhaustion
  4. Long-running transactions causing locks

Severity: MEDIUM → Fix this sprint
  5. SELECT * instead of specific columns
  6. OFFSET pagination on large tables
  7. No caching on frequently read data
  8. Replication lag on critical reads

Severity: LOW → Plan for next quarter
  9. Wrong data types
  10. Over-indexing on write-heavy tables
  11. Dead tuple bloat (schedule VACUUM)
```

---

## Interview Mein Yeh Bolna

| Question | Answer |
|----------|--------|
| DB slow kyun hai? | "EXPLAIN ANALYZE se slow query dhundho, index missing check karo" |
| Scale kaise karoge? | "Read replicas → Caching → Sharding — in order" |
| N+1 kaise detect karein? | "Query count log karo, Datadog/New Relic use karo" |
| Lock issue? | "Pessimistic vs Optimistic, transaction short rakho" |
| 1M users pe DB? | "Connection pooling + Read replicas + Redis cache" |

---

*Last Updated: June 2026*
*Related: [Scaling_1_to_1M_Users.md](Scaling_1_to_1M_Users.md)*
