# Day 12 — HTTP Performance

HTTP responses fast karna — compression, keep-alive, load testing.

---

## 1. Compression (gzip/brotli)

```javascript
import express from 'express';
import compression from 'compression';

// npm install compression
const app = express();

// Compression middleware — sab responses compress karo
app.use(compression({
  level:     6,      // 1-9 (6 = good balance)
  threshold: 1024,   // 1KB se bade responses compress karo
  filter: (req, res) => {
    // JSON aur text compress karo, images nahi
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.get('/data', (req, res) => {
  const bigData = { items: Array(1000).fill({ name: 'item', value: 42 }) };
  res.json(bigData);
  // Without compression: ~50KB
  // With gzip:           ~2KB (25x smaller!)
});
```

---

## 2. HTTP Keep-Alive

```javascript
import http from 'http';

// Keep-alive = Connection reuse karo
// Without: Har request ke liye new TCP connection
// With:    Same connection reuse karo

const server = http.createServer(app);

// Keep-alive timeout set karo
server.keepAliveTimeout = 65000;  // 65 seconds
server.headersTimeout   = 66000;  // Slightly more than keepAlive

// Result: 10x faster for multiple requests from same client
```

---

## 3. Load Testing with autocannon

```bash
# Install
npm install -g autocannon

# Basic test
autocannon http://localhost:3000

# 100 concurrent connections, 10 seconds
autocannon -c 100 -d 10 http://localhost:3000/api

# Output:
# Req/sec: 5000
# Latency: avg 20ms, p99 50ms
# Throughput: 2MB/sec
```

---

## 4. Response Time Headers

```javascript
// Request timing middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6; // ms
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration.toFixed(2)}ms)`);
  });

  next();
});
```

---

## 5. Quick Summary

```
Compression:
  npm install compression
  app.use(compression())
  25x smaller responses

Keep-Alive:
  server.keepAliveTimeout = 65000
  Connection reuse → Faster

Load Testing:
  autocannon -c 100 -d 10 http://localhost:3000
  Req/sec, latency, throughput measure karo
```

---

## 6. Practice Tasks

### Task 1: Compression
```javascript
// Express app banao with compression
// /data endpoint → Large JSON return karo
// Response size compare karo (with/without compression)
// curl -H "Accept-Encoding: gzip" http://localhost:3000/data
```

### Task 2: Load Test
```bash
# Server start karo
# autocannon se test karo
# Req/sec note karo
# Clustering add karo → Req/sec compare karo
```

---

Kal Day 13 mein Memory Management dekhenge —
V8 GC, heap snapshots, memory leak patterns.
