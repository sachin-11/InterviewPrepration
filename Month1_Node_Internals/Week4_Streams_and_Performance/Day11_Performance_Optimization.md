# Day 11 — Performance Optimization

Node.js ko production mein fast aur scalable banana.

---

## 1. Clustering — Multi-Core Use

```javascript
import cluster from 'cluster';
import os from 'os';
import express from 'express';

const CPUS = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} running`);
  console.log(`Forking ${CPUS} workers...`);

  // Har CPU ke liye ek worker
  for (let i = 0; i < CPUS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // Auto-restart
  });

} else {
  // Worker process — actual server
  const app = express();

  app.get('/', (req, res) => {
    res.json({ pid: process.pid, message: 'Hello!' });
  });

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

### Result:
```
Without clustering: 1 CPU core use
With clustering:    All CPU cores use (4x, 8x faster)

8-core machine:
  Single process: 1000 req/sec
  Clustered:      ~7000 req/sec
```

---

## 2. PM2 — Process Manager

```bash
# Install
npm install -g pm2

# Start app
pm2 start app.js

# Cluster mode (all CPUs)
pm2 start app.js -i max

# Monitor
pm2 monit

# Logs
pm2 logs

# Restart on crash
pm2 start app.js --watch

# Save config
pm2 save
pm2 startup  # Auto-start on reboot
```

### ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name:      'my-app',
    script:    'app.js',
    instances: 'max',      // All CPU cores
    exec_mode: 'cluster',
    watch:     false,
    env: {
      NODE_ENV: 'production',
      PORT:     3000
    },
    error_file: './logs/err.log',
    out_file:   './logs/out.log',
    max_memory_restart: '500M'  // Restart if > 500MB RAM
  }]
};

// pm2 start ecosystem.config.js
```

---

## 3. Caching Strategies

### In-Memory Cache (Simple):
```javascript
const cache = new Map();

function getCached(key, ttlMs, fetchFn) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.value; // Cache hit
  }

  const value = fetchFn();
  cache.set(key, { value, timestamp: Date.now() });
  return value;
}

// Usage
app.get('/users', async (req, res) => {
  const users = getCached('all-users', 60000, () => db.getUsers());
  res.json(users);
});
```

### Redis Cache:
```javascript
import { createClient } from 'redis';

const redis = createClient();
await redis.connect();

async function cacheMiddleware(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setEx(key, ttl, JSON.stringify(data));
  return data;
}

app.get('/products', async (req, res) => {
  const products = await cacheMiddleware('products', 300, () => db.getProducts());
  res.json(products);
});
```

---

## 4. Quick Summary

```
Clustering:
  os.cpus().length → Available cores
  cluster.fork()   → Worker process create
  Auto-restart on crash

PM2:
  pm2 start app.js -i max → Cluster mode
  pm2 monit               → Real-time monitoring
  ecosystem.config.js     → Configuration file

Caching:
  In-memory Map → Simple, fast, no persistence
  Redis         → Distributed, persistent, TTL support
  Cache-aside   → Check cache → miss → fetch → store
```

---

## 5. Practice Tasks

### Task 1: Clustering
```javascript
// Express server banao with clustering
// /pid endpoint → Worker PID return karo
// Multiple requests bhejo → Different PIDs dikhenge
```

### Task 2: PM2
```bash
pm2 start server.js -i max
pm2 monit
pm2 logs
pm2 stop all
```

### Task 3: Cache
```javascript
// Simple in-memory cache implement karo
// TTL = 5 seconds
// Same key dobara request karo → Cache hit
// 5 seconds baad → Cache miss
```

---

Kal Day 12 mein HTTP Performance dekhenge —
Compression, keep-alive, load testing.
