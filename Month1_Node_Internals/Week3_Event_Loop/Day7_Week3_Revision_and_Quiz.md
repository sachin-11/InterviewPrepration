# Day 7 — Week 3 Revision + Quiz

Poore Week 3 ka revision — Event Loop se EventEmitter tak.

---

## 1. Week 3 Complete Recap

### Day 1 — Node.js Architecture:
```
V8 Engine:   JavaScript execute karta hai (Call Stack, Heap)
libuv:       Async I/O, Event Loop, Thread Pool
Bindings:    V8 + libuv ko connect karta hai

Single-threaded but non-blocking:
  I/O operations → libuv ko delegate → Event loop free
  CPU operations → Main thread block → Worker Threads use karo

Thread Pool (libuv):
  Default 4 threads
  fs, crypto, dns operations use karte hain
  UV_THREADPOOL_SIZE=8 se change karo
```

### Day 2 — Event Loop 6 Phases:
```
1. Timers        → setTimeout, setInterval
2. Pending I/O   → Deferred I/O callbacks
3. Idle/Prepare  → Internal
4. Poll          → New I/O events (most time here)
5. Check         → setImmediate
6. Close         → 'close' events

Between EVERY phase:
  → process.nextTick() drain
  → Promise microtask drain
```

### Day 3 — Microtasks vs Macrotasks:
```
Priority (high → low):
  Synchronous code
  process.nextTick()
  Promise.then()
  queueMicrotask()
  setTimeout(fn, 0)
  setImmediate()
  I/O callbacks

Key rule: Microtask queue FULLY drain hoti hai before next macrotask
```

### Day 4 — Async Patterns:
```
Callbacks → Callback hell (avoid)
Promises  → .then/.catch chaining
async/await → Cleanest syntax

Promise combinators:
  Promise.all        → All parallel, fast fail
  Promise.race       → First to settle
  Promise.allSettled → All results, no fail
  Promise.any        → First success
```

### Day 5 — Worker Threads:
```
Problem: CPU-intensive tasks → Event loop block
Solution: Worker Threads → True parallel execution

Communication:
  postMessage()      → Data copy
  SharedArrayBuffer  → Zero-copy shared memory

Worker Pool:
  Workers reuse karo (create/destroy expensive)
  Queue for pending tasks

Use when: CPU task > 10ms
```

### Day 6 — EventEmitter:
```
Observer Pattern: emit events, listeners react

Methods:
  on(event, fn)    → Persistent listener
  once(event, fn)  → One-time listener
  emit(event)      → Trigger event
  off(event, fn)   → Remove listener

Rules:
  Always add 'error' listener (crash prevent)
  Use once() for one-time ops
  Cleanup listeners (memory leak prevent)
  Default max: 10 listeners per event
```

---

## 2. Self Quiz — Bina Dekhe Answer Karo

### Basic Level:
```
Q1. Node.js single-threaded hai phir bhi concurrent requests kaise handle karta hai?
Q2. Event loop ke 6 phases kaunse hain?
Q3. process.nextTick() aur setImmediate() mein kya fark hai?
Q4. Promise.all aur Promise.allSettled mein kya fark hai?
Q5. EventEmitter mein 'error' event special kyun hai?
```

### Intermediate Level:
```
Q6. Ye code ka output kya hoga?
    console.log("A");
    setTimeout(() => console.log("B"), 0);
    Promise.resolve().then(() => console.log("C"));
    process.nextTick(() => console.log("D"));
    console.log("E");

Q7. Worker Threads kab use karein? Ek example do.
Q8. Callback hell kya hota hai? Kaise avoid karein?
Q9. libuv Thread Pool default size kya hai? Kaise change karein?
Q10. Memory leak EventEmitter mein kaise hoti hai?
```

### Advanced Level:
```
Q11. I/O callback ke andar setTimeout vs setImmediate — kaunsa pehle?
Q12. SharedArrayBuffer Worker Threads mein kyun use karte hain?
Q13. Promise chain interleaving explain karo:
     Promise.resolve().then(() => console.log("1")).then(() => console.log("2"));
     Promise.resolve().then(() => console.log("3")).then(() => console.log("4"));
     Output kya hoga?
Q14. CPU-intensive task event loop block karta hai — kaise detect karein?
Q15. EventEmitter vs Promise — kab kaunsa use karein?
```

---

## 3. Quiz Answers

### Basic Level:
```
A1. libuv ka event loop — async I/O operations OS ko delegate karta hai
    Waiting time mein doosre requests handle hote hain
    Single thread, but non-blocking I/O

A2. 1.Timers 2.Pending I/O 3.Idle/Prepare 4.Poll 5.Check 6.Close

A3. process.nextTick() → Current phase ke IMMEDIATELY baad (microtask)
    setImmediate()      → Check phase mein (macrotask, after I/O)
    nextTick > setImmediate (priority)

A4. Promise.all:
      Ek bhi fail → Immediately reject (fast fail)
    Promise.allSettled:
      Sab wait karo, success ya failure dono return karo

A5. 'error' event ka listener nahi hai toh Node.js crash ho jaata hai
    UnhandledError throw hota hai
    Hamesha emitter.on('error', handler) add karo
```

### Intermediate Level:
```
A6. Output: A, E, D, C, B
    A, E → Synchronous
    D    → nextTick (microtask, highest priority)
    C    → Promise (microtask)
    B    → setTimeout (macrotask)

A7. CPU-intensive tasks:
    - Image/video processing
    - Large data transformation
    - Complex calculations
    Example: fibonacci(40) → Worker Thread mein run karo
    Main thread free rehta hai other requests ke liye

A8. Callback hell = Deeply nested callbacks (pyramid of doom)
    Avoid: Named functions, Promises, async/await

A9. Default: 4 threads
    Change: UV_THREADPOOL_SIZE=8 node app.js

A10. Loop mein listeners add karo → Memory leak
     Fix: once() use karo, ya off() se cleanup karo
     Warning: MaxListenersExceededWarning (default max 10)
```

### Advanced Level:
```
A11. I/O callback ke andar: setImmediate HAMESHA pehle
     setTimeout baad mein (next timers phase)
     Top level pe: unpredictable

A12. postMessage() data copy karta hai (slow for large data)
     SharedArrayBuffer zero-copy → Same memory share
     Large arrays/buffers ke liye much faster

A13. Output: 1, 3, 2, 4 (interleaved!)
     Round 1: Both first .then() → Queue: [1, 3]
     Execute 1 → Queue: [3, 2]
     Execute 3 → Queue: [2, 4]
     Execute 2 → Queue: [4]
     Execute 4

A14. Detect: Response time suddenly slow ho jaaye
     Tools: node --prof, clinic.js, process.hrtime()
     Fix: Worker Threads, setImmediate for chunking

A15. EventEmitter: Multiple events over time, streaming data
     Promise: Single result, one-time async operation
     Example:
       File upload progress → EventEmitter (multiple events)
       DB query result      → Promise (single result)
```

---

## 4. Code Output Challenges

### Challenge 1:
```javascript
const fs = require('fs');

console.log("1");
fs.readFile(__filename, () => {
  console.log("2");
  setTimeout(() => console.log("3"), 0);
  setImmediate(() => console.log("4"));
  process.nextTick(() => console.log("5"));
});
console.log("6");

// Output: 1, 6, 2, 5, 4, 3
```

### Challenge 2:
```javascript
async function foo() {
  console.log("A");
  await Promise.resolve();
  console.log("B");
}

console.log("1");
foo();
console.log("2");

// Output: 1, A, 2, B
```

### Challenge 3:
```javascript
process.nextTick(() => {
  console.log("nextTick 1");
  process.nextTick(() => console.log("nextTick 2"));
});

Promise.resolve().then(() => {
  console.log("promise 1");
  process.nextTick(() => console.log("nextTick in promise"));
});

// Output: nextTick 1, nextTick 2, promise 1, nextTick in promise
```

---

## 5. Score Yourself

```
Quiz score:
  15/15 → Week 4 (Streams & Performance) ke liye ready
  12-14 → Weak areas review karo
  < 12  → Day 2-4 files dobara padho

Code challenges:
  3/3 → Excellent!
  2/3 → Day 3 (Microtasks) dobara padho
  1/3 → Day 2 (Event Loop) se start karo
```

---

## 6. Week 3 Key Takeaways

```
1. Node.js single-threaded but non-blocking
   → libuv event loop magic karta hai

2. Event loop order:
   Sync → nextTick → Promise → setTimeout → setImmediate

3. CPU tasks → Worker Threads
   I/O tasks → async/await (already non-blocking)

4. async/await = Promises ka syntactic sugar
   Promise.all = Parallel execution

5. EventEmitter = Observer pattern
   Always handle 'error' event
   Cleanup listeners to prevent memory leaks
```

---

Week 4 mein Streams & Performance dekhenge —
Large files efficiently process karna, memory optimization.
