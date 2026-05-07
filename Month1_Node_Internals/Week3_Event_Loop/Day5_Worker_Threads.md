# Day 5 — Worker Threads

Node.js single-threaded hai — lekin CPU-intensive tasks ke liye
Worker Threads use karke true parallelism achieve kar sakte hain.

---

## 1. CPU-Intensive Tasks Problem

### Problem:
```javascript
const express = require('express');
const app = express();

app.get('/fast', (req, res) => {
  res.json({ message: 'Fast response' });
});

app.get('/slow', (req, res) => {
  // CPU-intensive task — Event loop BLOCK ho jaata hai!
  let result = 0;
  for (let i = 0; i < 5_000_000_000; i++) {
    result += i;
  }
  res.json({ result });
});

app.listen(3000);
```

```
Test scenario:
  User A: GET /slow  (5 second CPU task)
  User B: GET /fast  (should be instant)

Reality:
  User A starts /slow → Event loop blocked
  User B requests /fast → WAITING for User A!
  User B gets response after 5 seconds!

This is the problem — single thread blocks everyone.
```

### Why I/O is Fine but CPU is Not:
```
I/O operations (file read, DB query, HTTP):
  Node.js → libuv → OS handles it → Callback when done
  Event loop FREE during wait ✓

CPU operations (calculations, image processing):
  Node.js → JavaScript runs on V8 → Blocks call stack
  Event loop BLOCKED during computation ✗
```

---

## 2. Worker Threads Kya Hain?

```
Worker Threads = Separate JavaScript execution contexts
                 Each with own V8 instance + event loop
                 True parallel execution (different OS threads)

Main Thread:
  - HTTP requests handle karo
  - Event loop manage karo
  - Workers ko tasks delegate karo

Worker Thread:
  - CPU-intensive work karo
  - Main thread ko result bhejo
  - Main thread block nahi hota
```

### Architecture:
```
┌─────────────────────────────────────────────────────┐
│                  NODE.JS PROCESS                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           MAIN THREAD                        │   │
│  │  - Event Loop                                │   │
│  │  - HTTP requests                             │   │
│  │  - Business logic                            │   │
│  │  - Worker management                         │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │ postMessage / on('message')        │
│    ┌────────────┼────────────┐                       │
│    │            │            │                       │
│  ┌─▼──────┐  ┌─▼──────┐  ┌─▼──────┐                │
│  │Worker 1│  │Worker 2│  │Worker 3│                │
│  │CPU task│  │CPU task│  │CPU task│                │
│  └────────┘  └────────┘  └────────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. Basic Worker Thread Example

### worker.js (Worker file):
```javascript
// worker.js
const { workerData, parentPort } = require('worker_threads');

// workerData = Main thread se aaya data
const { start, end } = workerData;

// CPU-intensive calculation
let sum = 0;
for (let i = start; i <= end; i++) {
  sum += i;
}

// Result main thread ko bhejo
parentPort.postMessage({ sum });
```

### main.js (Main thread):
```javascript
// main.js
const { Worker } = require('worker_threads');
const path = require('path');

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, 'worker.js'),
      { workerData }
    );

    worker.on('message', resolve);   // Worker ne result bheja
    worker.on('error', reject);      // Worker mein error
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

// Test
console.time('worker');
const result = await runWorker({ start: 1, end: 1_000_000_000 });
console.timeEnd('worker');
console.log('Sum:', result.sum);
```

---

## 4. Main Thread ↔ Worker Communication

### postMessage — Data Transfer:
```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

// Main → Worker
worker.postMessage({ type: 'START', data: [1, 2, 3, 4, 5] });

// Worker → Main
worker.on('message', (msg) => {
  console.log('From worker:', msg);
});
```

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// Main se message receive karo
parentPort.on('message', (msg) => {
  if (msg.type === 'START') {
    const result = msg.data.reduce((a, b) => a + b, 0);
    // Main ko result bhejo
    parentPort.postMessage({ type: 'RESULT', result });
  }
});
```

### SharedArrayBuffer — Zero-Copy Sharing:
```javascript
// Large data copy karne ki jagah share karo (faster!)

// main.js
const { Worker } = require('worker_threads');

// Shared memory create karo
const sharedBuffer = new SharedArrayBuffer(4); // 4 bytes
const sharedArray  = new Int32Array(sharedBuffer);
sharedArray[0] = 0; // Initial value

const worker = new Worker('./worker.js', {
  workerData: { sharedBuffer }
});

// Worker ke kaam karne ke baad result read karo
worker.on('exit', () => {
  console.log('Result:', sharedArray[0]); // Worker ne update kiya
});
```

```javascript
// worker.js
const { workerData } = require('worker_threads');

const sharedArray = new Int32Array(workerData.sharedBuffer);

// Shared memory mein directly write karo (no copy!)
let sum = 0;
for (let i = 0; i < 1_000_000; i++) sum += i;
sharedArray[0] = sum;
```

### MessageChannel — Direct Worker-to-Worker:
```javascript
const { Worker, MessageChannel } = require('worker_threads');

const { port1, port2 } = new MessageChannel();

const worker1 = new Worker('./worker1.js', {
  workerData: { port: port1 },
  transferList: [port1]
});

const worker2 = new Worker('./worker2.js', {
  workerData: { port: port2 },
  transferList: [port2]
});

// worker1 aur worker2 directly communicate kar sakte hain
// Main thread bypass!
```

---

## 5. Worker Pool Pattern

```javascript
// worker-pool.js
// Ek pool of workers — reuse karo, create/destroy mat karo

const { Worker } = require('worker_threads');
const path = require('path');

class WorkerPool {
  constructor(workerFile, poolSize = 4) {
    this.workerFile = workerFile;
    this.poolSize   = poolSize;
    this.workers    = [];
    this.queue      = [];

    // Pool initialize karo
    for (let i = 0; i < poolSize; i++) {
      this.addWorker();
    }
  }

  addWorker() {
    const worker = new Worker(this.workerFile);
    worker.isIdle = true;

    worker.on('message', (result) => {
      worker.isIdle = true;
      worker.currentResolve(result);
      worker.currentResolve = null;

      // Queue mein pending tasks hain?
      this.processQueue();
    });

    worker.on('error', (err) => {
      worker.isIdle = true;
      worker.currentReject(err);
      worker.currentReject = null;
      this.processQueue();
    });

    this.workers.push(worker);
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const idleWorker = this.workers.find(w => w.isIdle);
    if (!idleWorker) return;

    const { data, resolve, reject } = this.queue.shift();
    idleWorker.isIdle = false;
    idleWorker.currentResolve = resolve;
    idleWorker.currentReject  = reject;
    idleWorker.postMessage(data);
  }

  run(data) {
    return new Promise((resolve, reject) => {
      const idleWorker = this.workers.find(w => w.isIdle);

      if (idleWorker) {
        idleWorker.isIdle = false;
        idleWorker.currentResolve = resolve;
        idleWorker.currentReject  = reject;
        idleWorker.postMessage(data);
      } else {
        // Sab busy hain → Queue mein daalo
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  async destroy() {
    await Promise.all(this.workers.map(w => w.terminate()));
  }
}

// Usage
const pool = new WorkerPool('./compute-worker.js', 4);

// 10 tasks simultaneously
const tasks = Array.from({ length: 10 }, (_, i) => ({ n: i * 1000 }));
const results = await Promise.all(tasks.map(t => pool.run(t)));
console.log(results);

await pool.destroy();
```

---

## 6. libuv Thread Pool

### Kya hai:
```
libuv ka apna Thread Pool hai (Worker Threads se alag!)
Default: 4 threads
Max: 1024 threads

Ye automatically use hota hai:
  - fs.readFile, fs.writeFile
  - crypto.pbkdf2, crypto.scrypt
  - zlib operations
  - DNS lookups (dns.lookup)
  - Some network operations
```

### Thread Pool Size Change:
```bash
# Default 4 threads
node app.js

# 8 threads
UV_THREADPOOL_SIZE=8 node app.js

# Max (CPU cores ke hisaab se)
UV_THREADPOOL_SIZE=$(nproc) node app.js
```

### Thread Pool vs Worker Threads:
```
libuv Thread Pool:
  - Automatic (Node.js internally use karta hai)
  - I/O operations ke liye
  - Hum directly control nahi karte
  - Default 4 threads

Worker Threads:
  - Manual (hum create karte hain)
  - CPU-intensive JavaScript ke liye
  - Full control
  - Unlimited (memory limit tak)
```

### Thread Pool Saturation Problem:
```javascript
// Problem: 4 concurrent crypto operations → 5th waits!
const crypto = require('crypto');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, 'salt', 100000, 64, 'sha512',
      (err, key) => err ? reject(err) : resolve(key)
    );
  });
}

// 5 simultaneous hashes
console.time('5 hashes');
await Promise.all([
  hashPassword('pass1'),
  hashPassword('pass2'),
  hashPassword('pass3'),
  hashPassword('pass4'),
  hashPassword('pass5'), // 5th waits for thread!
]);
console.timeEnd('5 hashes');

// Fix: UV_THREADPOOL_SIZE=8 node app.js
```

---

## 7. When to Use Workers

### Use Worker Threads When:
```
✓ Image/video processing
✓ Large data transformation (CSV, JSON parsing)
✓ Cryptographic operations (custom, not built-in)
✓ Machine learning inference
✓ Complex mathematical calculations
✓ Compression/decompression (custom)
✓ Any loop that takes > 100ms
```

### Don't Use Worker Threads When:
```
✗ Simple I/O (file read, DB query) → async/await kaafi hai
✗ HTTP requests → Non-blocking already
✗ Simple calculations → Overhead > benefit
✗ Shared state needed → Use Redis instead
```

### Decision Tree:
```
Task hai CPU-intensive?
  NO  → async/await use karo (I/O is fine)
  YES → Kitna time lagta hai?
          < 10ms  → Main thread pe chalao
          > 10ms  → Worker Thread use karo
                    Ek baar? → Single worker
                    Repeated? → Worker Pool
```

---

## 8. Express + Worker Threads

```javascript
// server.js
const express = require('express');
const { Worker } = require('worker_threads');
const path = require('path');

const app = express();
app.use(express.json());

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, 'compute.worker.js'),
      { workerData: data }
    );
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// CPU-intensive endpoint — non-blocking!
app.post('/process', async (req, res) => {
  try {
    const result = await runWorker(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fast endpoint — still works during heavy computation!
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running'));
```

```javascript
// compute.worker.js
const { workerData, parentPort } = require('worker_threads');

const { numbers } = workerData;

// Heavy computation
const result = numbers.reduce((acc, n) => {
  // Simulate complex processing
  for (let i = 0; i < 1000; i++) acc += Math.sqrt(n * i);
  return acc;
}, 0);

parentPort.postMessage({ result });
```

---

## 9. Quick Summary

```
Problem:
  CPU-intensive tasks → Event loop block → All requests wait

Solution: Worker Threads
  - Separate V8 instance + event loop
  - True parallel execution
  - Main thread stays free

Communication:
  postMessage()      → Data copy karke bhejo
  SharedArrayBuffer  → Zero-copy shared memory
  MessageChannel     → Worker-to-worker direct

Worker Pool:
  - Workers reuse karo (create/destroy expensive)
  - Queue for pending tasks
  - Fixed pool size (CPU cores ke hisaab se)

libuv Thread Pool:
  - Automatic, for I/O operations
  - Default 4 threads
  - UV_THREADPOOL_SIZE se change karo

Use when:
  CPU task > 10ms → Worker Thread
  I/O task → async/await (already non-blocking)
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Basic Worker
```javascript
// worker.js banao jo fibonacci calculate kare
// Main thread se n bhejo, worker result return kare

// worker.js:
const { workerData, parentPort } = require('worker_threads');

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

parentPort.postMessage(fibonacci(workerData.n));

// main.js:
// fibonacci(40) worker mein run karo
// Compare: with worker vs without worker
// Server responsiveness test karo
```

### Task 2: Blocking vs Non-blocking
```javascript
// 2 endpoints banao:
// GET /blocking  → Main thread pe heavy computation
// GET /worker    → Worker thread pe same computation

// Test:
// 1. /blocking request bhejo
// 2. Turant /health request bhejo
// Observe: /health /blocking ke saath block hota hai?

// Phir:
// 1. /worker request bhejo
// 2. Turant /health request bhejo
// Observe: /health instantly respond karta hai!
```

### Task 3: Worker Pool
```javascript
// WorkerPool class implement karo
// 4 workers ka pool banao
// 10 fibonacci calculations simultaneously run karo
// Time measure karo: pool vs sequential

console.time('pool');
const results = await Promise.all(
  [35, 36, 37, 38, 39, 40, 35, 36, 37, 38].map(n =>
    pool.run({ n })
  )
);
console.timeEnd('pool');
```

---

Kal Day 6 mein EventEmitter dekhenge —
Node.js ka observer pattern, custom events, memory leaks.
