# Day 13 — Memory Management

V8 garbage collection, memory leaks dhundna aur fix karna.

---

## 1. V8 Memory Structure

```
Node.js process memory:
  ┌─────────────────────────────────┐
  │  Heap (V8 managed)              │
  │  ├── New Space (Young gen)      │ ← Short-lived objects
  │  │   ~1-8MB                     │
  │  └── Old Space (Old gen)        │ ← Long-lived objects
  │      ~1.5GB default             │
  │                                 │
  │  Stack                          │ ← Function calls, primitives
  │  External (Buffers, C++ objects)│
  └─────────────────────────────────┘
```

### Memory Usage Check:
```javascript
function printMemory() {
  const mem = process.memoryUsage();
  console.log({
    heapUsed:  `${(mem.heapUsed  / 1024 / 1024).toFixed(1)}MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`,
    rss:       `${(mem.rss       / 1024 / 1024).toFixed(1)}MB`,
    external:  `${(mem.external  / 1024 / 1024).toFixed(1)}MB`
  });
}

printMemory();
// { heapUsed: '5.2MB', heapTotal: '8.0MB', rss: '35.0MB' }
```

---

## 2. Garbage Collection

```
V8 GC automatically frees unused memory

Minor GC (Scavenge):
  New Space clean karo
  Fast, frequent (~every few ms)

Major GC (Mark-Sweep):
  Old Space clean karo
  Slow, infrequent
  "Stop the world" — app pause hoti hai briefly

GC trigger karo manually (testing only):
  global.gc() — node --expose-gc app.js
```

---

## 3. Common Memory Leak Patterns

### Pattern 1: Global Variables
```javascript
// BAD — Global array grows forever
const requests = []; // Global!

app.get('/api', (req, res) => {
  requests.push({ url: req.url, time: Date.now() }); // Never cleaned!
  res.json({ ok: true });
});

// GOOD — Limit size
const MAX_REQUESTS = 1000;
app.get('/api', (req, res) => {
  requests.push({ url: req.url, time: Date.now() });
  if (requests.length > MAX_REQUESTS) requests.shift(); // Remove oldest
  res.json({ ok: true });
});
```

### Pattern 2: Event Listener Leak
```javascript
// BAD — Listeners accumulate
app.get('/api', (req, res) => {
  emitter.on('data', (data) => res.json(data)); // New listener each request!
});

// GOOD — once() use karo
app.get('/api', (req, res) => {
  emitter.once('data', (data) => res.json(data)); // Auto-remove
});
```

### Pattern 3: Closure Leak
```javascript
// BAD — Large object captured in closure
function createHandler() {
  const largeData = new Array(1000000).fill('data'); // 8MB!

  return function handler(req, res) {
    // largeData never released (closure holds reference)
    res.json({ count: largeData.length });
  };
}

// GOOD — Only needed data capture karo
function createHandler() {
  const count = 1000000; // Just the number

  return function handler(req, res) {
    res.json({ count });
  };
}
```

### Pattern 4: Cache Without Limit
```javascript
// BAD — Cache grows forever
const cache = new Map();
app.get('/user/:id', async (req, res) => {
  if (!cache.has(req.params.id)) {
    cache.set(req.params.id, await db.getUser(req.params.id));
  }
  res.json(cache.get(req.params.id));
});

// GOOD — LRU Cache with limit
import LRU from 'lru-cache';
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 }); // 500 items, 5min TTL
```

---

## 4. Detect Memory Leaks

```javascript
// Monitor memory over time
setInterval(() => {
  const mem = process.memoryUsage();
  const mb  = (mem.heapUsed / 1024 / 1024).toFixed(1);
  console.log(`Heap: ${mb}MB`);

  // Alert if > 500MB
  if (mem.heapUsed > 500 * 1024 * 1024) {
    console.error('HIGH MEMORY USAGE!');
  }
}, 5000);
```

### Heap Snapshot (Chrome DevTools):
```bash
# Start with inspector
node --inspect app.js

# Chrome mein open karo:
# chrome://inspect → Open dedicated DevTools

# Memory tab → Take snapshot
# Compare snapshots → Growing objects = leak
```

---

## 5. --max-old-space-size

```bash
# Default: ~1.5GB
node app.js

# Increase for large apps
node --max-old-space-size=4096 app.js  # 4GB

# PM2 mein
pm2 start app.js --node-args="--max-old-space-size=4096"
```

---

## 6. Quick Summary

```
Memory structure:
  Heap (V8): Objects, arrays, functions
  Stack:     Primitives, function calls
  External:  Buffers, C++ objects

GC types:
  Minor (Scavenge): Fast, frequent, new space
  Major (Mark-Sweep): Slow, old space, app pauses

Common leaks:
  Global variables growing
  Event listeners not removed
  Closures holding large objects
  Cache without size limit

Detection:
  process.memoryUsage() → Monitor over time
  --inspect + Chrome DevTools → Heap snapshots
  PM2 → max_memory_restart
```

---

## 7. Practice Tasks

### Task 1: Memory Monitor
```javascript
// Express server banao
// Har 5 seconds mein memory print karo
// /leak endpoint → Array mein data add karo (simulate leak)
// Memory growing dekho
```

### Task 2: Fix the Leak
```javascript
// Ye code mein leak dhundho aur fix karo:
const history = [];
app.get('/api', (req, res) => {
  history.push({ req: req.headers, time: Date.now() });
  res.json({ ok: true });
});
```

---

Kal Day 14 — Week 4 Revision + High-performance file processor project.
