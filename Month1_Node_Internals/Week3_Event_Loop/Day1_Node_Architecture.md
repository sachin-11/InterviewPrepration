# Day 1 — Node.js Architecture

Aaj samjhenge ki Node.js andar se kaise kaam karta hai —
single-threaded hoke bhi millions of requests kaise handle karta hai.

---

## 1. Traditional Server vs Node.js

### Traditional Server (Apache, PHP):
```
Request 1 aaya → Thread 1 assign karo → Wait for DB → Response
Request 2 aaya → Thread 2 assign karo → Wait for DB → Response
Request 3 aaya → Thread 3 assign karo → Wait for DB → Response
...
Request 1000  → No threads available → WAIT (blocking!)

Problem:
  - Har request ke liye ek thread
  - Thread = ~2MB memory
  - 1000 concurrent users = 2GB RAM sirf threads ke liye!
  - Thread creation/switching = expensive
```

### Node.js Server:
```
Request 1 aaya → Start DB query → Move on (non-blocking)
Request 2 aaya → Start DB query → Move on
Request 3 aaya → Start DB query → Move on
...
DB query 1 done → Callback execute → Response bhejo
DB query 2 done → Callback execute → Response bhejo

Single thread, but handles thousands of concurrent requests!
```

### Why Node.js is Fast:
```
Key insight:
  Most server time = WAITING (I/O operations)
  DB query: 10ms wait
  File read: 5ms wait
  Network: 50ms wait

Node.js:
  "Waiting time mein doosra kaam karo!"
  Non-blocking I/O = Never sit idle
```

---

## 2. Node.js Core Components

### Component 1: V8 Engine
```
Kya hai: Google ka JavaScript engine (Chrome mein bhi use hota hai)
Kya karta hai:
  - JavaScript code → Machine code compile karta hai
  - JIT (Just-In-Time) compilation
  - Memory management (Heap)
  - Garbage collection

V8 handles:
  ✓ JavaScript execution
  ✓ Call stack management
  ✓ Memory allocation

V8 does NOT handle:
  ✗ File system operations
  ✗ Network operations
  ✗ Timers (setTimeout)
  → Ye sab libuv karta hai
```

### Component 2: libuv
```
Kya hai: C library jo async I/O provide karta hai
Kya karta hai:
  - File system operations (async)
  - Network operations (async)
  - Timers (setTimeout, setInterval)
  - Thread pool (CPU-intensive tasks)
  - Event loop implementation

libuv = Node.js ka "engine room"
```

### Component 3: Node.js Bindings
```
V8 (JavaScript) ↔ libuv (C) ko connect karta hai
Node.js APIs (fs, http, crypto) yahan implement hote hain
```

### Component 4: Node.js Standard Library
```
Built-in modules:
  fs      → File system
  http    → HTTP server/client
  crypto  → Encryption
  path    → File paths
  os      → Operating system info
  events  → EventEmitter
  stream  → Streams
  buffer  → Binary data
```

### Architecture Diagram:
```
┌─────────────────────────────────────────────┐
│           YOUR APPLICATION CODE             │
│         (JavaScript / Node.js APIs)         │
└─────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────┐
│           NODE.JS BINDINGS (C++)            │
│    (fs, http, crypto, path, etc.)           │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────▼──────────┐  ┌────────────────┐
    │      V8 ENGINE      │  │     libuv      │
    │                     │  │                │
    │  - JS execution     │  │  - Event Loop  │
    │  - Call Stack       │  │  - Thread Pool │
    │  - Heap memory      │  │  - Async I/O   │
    │  - Garbage collect  │  │  - Timers      │
    └─────────────────────┘  └────────────────┘
```

---

## 3. Call Stack

### Kya hota hai:
```
Call Stack = Function calls ka record
LIFO (Last In, First Out) — Stack ki tarah

JavaScript single-threaded = Ek time mein ek function execute
```

### Example:
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

function main() {
  const msg = greet("Rahul");
  console.log(msg);
}

main();
```

```
Call Stack execution:

Step 1: main() push
  [main]

Step 2: greet("Rahul") push
  [main, greet]

Step 3: greet returns "Hello, Rahul!"
  greet pop
  [main]

Step 4: console.log push
  [main, console.log]

Step 5: console.log executes, pop
  [main]

Step 6: main returns, pop
  []  (empty)
```

### Stack Overflow:
```javascript
// Infinite recursion → Stack overflow
function infinite() {
  return infinite(); // Never stops
}
infinite();
// RangeError: Maximum call stack size exceeded
```

---

## 4. Heap Memory

```
Heap = Objects aur variables store hone ki jagah

Stack:
  - Primitive values (numbers, strings, booleans)
  - Function call records
  - Fast access

Heap:
  - Objects, arrays, functions
  - Dynamic size
  - Garbage collected

Example:
  const x = 5;           // Stack mein
  const obj = {a: 1};    // Heap mein (obj reference stack mein)
```

---

## 5. Event Queue & Event Loop (Preview)

```
Jab async operation complete hota hai:
  Callback → Event Queue mein jaata hai

Event Loop:
  Call Stack empty? → Event Queue se callback uthao → Execute karo

Simple flow:
  setTimeout(() => console.log("Hello"), 1000)
  
  1. setTimeout register hota hai (libuv ke paas)
  2. 1000ms baad → Callback Event Queue mein jaata hai
  3. Call Stack empty hone pe → Callback execute hota hai
```

---

## 6. Non-Blocking I/O — Practically

```javascript
const fs = require('fs');

console.log("1. Start");

// Non-blocking file read
fs.readFile('large-file.txt', 'utf8', (err, data) => {
  console.log("3. File read complete");
});

console.log("2. After readFile call");

// Output:
// 1. Start
// 2. After readFile call    ← readFile wait nahi kiya!
// 3. File read complete     ← Baad mein aaya
```

### Why this order?
```
1. console.log("1. Start") → Execute immediately
2. fs.readFile() → libuv ko delegate karo, move on
3. console.log("2. After...") → Execute immediately
4. [File reading happens in background]
5. File read complete → Callback queue mein
6. Call stack empty → Callback execute
```

---

## 7. Thread Pool

```
Node.js single-threaded hai, but libuv ke paas Thread Pool hai!

Thread Pool use hota hai:
  - File system operations (fs.readFile)
  - DNS lookups
  - Crypto operations (bcrypt, etc.)
  - zlib compression

Default: 4 threads
Change: UV_THREADPOOL_SIZE=8 node app.js

Network I/O (HTTP, TCP):
  Thread pool use NAHI karta
  OS ke async mechanisms use karta hai (epoll, kqueue)
```

---

## 8. Node.js vs Other Runtimes

```
Feature          Node.js        Python        Java
───────────────  ─────────────  ────────────  ──────────────
Threading        Single thread  Multi-thread  Multi-thread
I/O Model        Non-blocking   Blocking      Blocking
Concurrency      Event-driven   GIL limited   True parallel
Best for         I/O heavy      CPU + I/O     Enterprise
Memory           Low            Medium        High
Startup time     Fast           Fast          Slow
```

---

## 9. When NOT to Use Node.js

```
Node.js BAD for:
  ✗ CPU-intensive tasks (image processing, ML, video encoding)
    → Single thread block ho jaata hai
    → Workaround: Worker Threads, child_process

  ✗ Heavy computation (scientific computing)
    → Python/Julia better hai

Node.js GOOD for:
  ✓ REST APIs
  ✓ Real-time apps (chat, gaming)
  ✓ Microservices
  ✓ Streaming data
  ✓ I/O heavy applications
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Call Stack Trace
```javascript
// Ye code ka call stack trace karo manually:
function a() { return b(); }
function b() { return c(); }
function c() { return "done"; }

console.log(a());

// Stack at each step:
// Step 1: [a]
// Step 2: [a, b]
// Step 3: [a, b, c]
// Step 4: [a, b]  (c returns)
// Step 5: [a]     (b returns)
// Step 6: []      (a returns)
```

### Task 2: Non-blocking Observe Karo
```javascript
// Ye run karo aur output order note karo:
const fs = require('fs');

console.log("A");
fs.readFile(__filename, () => console.log("B"));
console.log("C");
setTimeout(() => console.log("D"), 0);
console.log("E");

// Expected order: A, C, E, B, D  (ya A, C, E, D, B)
// Kyun? Explain karo
```

### Task 3: Stack Overflow
```javascript
// Ye run karo — error observe karo:
function recurse(n) {
  return recurse(n + 1);
}
try {
  recurse(0);
} catch(e) {
  console.log("Error:", e.message);
  console.log("Type:", e.constructor.name);
}
```

---

Kal Day 2 mein Event Loop ke 6 phases detail mein dekhenge.
