# Week 3–4: Node.js Internals + Performance

---

## Overview

```
Week 3: Event Loop (Day 1-7)
Week 4: Streams & Performance (Day 8-14)
```

---

## Week 3: Event Loop (Day 1-7)

### Day 1 — Node.js Architecture
```
Topics:
  - V8 engine kya hai
  - libuv kya hai
  - Single-threaded but non-blocking kaise?
  - Node.js vs traditional servers (Apache)
  - Call Stack, Heap, Event Queue
```

### Day 2 — Event Loop Deep Dive
```
Topics:
  - Event loop ke 6 phases (timers, I/O, idle, poll, check, close)
  - Har phase mein kya hota hai
  - Event loop ek iteration = "tick"
  - process.nextTick() vs setImmediate()
```

### Day 3 — Microtasks vs Macrotasks
```
Topics:
  - Microtasks: Promise.then, queueMicrotask, process.nextTick
  - Macrotasks: setTimeout, setInterval, setImmediate, I/O
  - Execution order — kaunsa pehle?
  - Common interview trap questions
```

### Day 4 — Async Patterns
```
Topics:
  - Callbacks → Callback hell
  - Promises → .then/.catch chaining
  - async/await → Clean syntax
  - Error handling in each pattern
  - Promise.all, Promise.race, Promise.allSettled
```

### Day 5 — Worker Threads
```
Topics:
  - CPU-intensive tasks problem
  - Worker Threads kya hain
  - Main thread ↔ Worker communication
  - Thread Pool (libuv)
  - When to use workers
```

### Day 6 — Event Emitter
```
Topics:
  - EventEmitter class
  - on(), emit(), once(), removeListener()
  - Custom events banana
  - Memory leaks (too many listeners)
  - Real-world use cases
```

### Day 7 — Week 3 Revision + Quiz
```
Topics:
  - Event loop order quiz
  - Code output predict karo
  - Common interview questions
```

---

## Week 4: Streams & Performance (Day 8-14)

### Day 8 — Streams Introduction
```
Topics:
  - Stream kya hota hai (pipe analogy)
  - 4 types: Readable, Writable, Duplex, Transform
  - Buffer vs Stream
  - Backpressure kya hota hai
```

### Day 9 — Readable & Writable Streams
```
Topics:
  - fs.createReadStream / createWriteStream
  - pipe() method
  - Events: data, end, error, drain
  - Flowing vs Paused mode
```

### Day 10 — Transform Streams
```
Topics:
  - Transform stream kya hota hai
  - Custom transform banana
  - zlib (compression)
  - crypto streams
  - Pipeline API
```

### Day 11 — Performance Optimization
```
Topics:
  - Memory leaks dhundna
  - CPU profiling
  - Clustering (multi-core use)
  - PM2 process manager
  - Caching strategies
```

### Day 12 — HTTP Performance
```
Topics:
  - Keep-alive connections
  - Compression (gzip/brotli)
  - HTTP/2
  - Connection pooling
  - Load testing (autocannon, k6)
```

### Day 13 — Memory Management
```
Topics:
  - V8 garbage collection
  - Memory leak patterns
  - Heap snapshots
  - --max-old-space-size
  - Buffer pooling
```

### Day 14 — Week 4 Revision + Project
```
Project: High-performance file processor
  - Large file stream karo
  - Transform (compress + encrypt)
  - Performance metrics collect karo
```

---

## Resources

```
Docs:
  https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick
  https://nodejs.org/api/stream.html

Videos:
  Event Loop: https://www.youtube.com/watch?v=8aGhZQkoFbQ (Philip Roberts)
  Node Internals: https://www.youtube.com/watch?v=PNa9OMajl9s

Books:
  "Node.js Design Patterns" — Mario Casciaro
```
