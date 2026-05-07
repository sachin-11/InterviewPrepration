# Day 2 — Event Loop Deep Dive

Event Loop = Node.js ka dil.
Ye decide karta hai ki kaunsa code kab execute hoga.

---

## 1. Event Loop Kya Hai?

```
Simple definition:
  Event Loop ek infinite loop hai jo continuously check karta hai:
  "Koi pending callback hai? Execute karo."

Pseudo code:
  while (true) {
    if (callStack.isEmpty()) {
      const callback = eventQueue.dequeue();
      if (callback) callStack.push(callback);
    }
  }
```

### Analogy:
```
Restaurant analogy:
  Chef (V8)         = JavaScript execute karta hai
  Waiter (libuv)    = Orders (I/O) bahar bhejta hai
  Kitchen bell      = I/O complete signal
  Order queue       = Event Queue
  Event Loop        = Waiter jo bell sunke order deliver karta hai

Chef ek time mein ek dish banata hai (single-threaded)
Lekin multiple orders simultaneously kitchen mein hain (non-blocking)
```

---

## 2. Event Loop ke 6 Phases

```
┌─────────────────────────────────────────────────────┐
│                   EVENT LOOP                        │
│                                                     │
│  ┌──────────┐                                       │
│  │  timers  │ ← setTimeout, setInterval callbacks   │
│  └────┬─────┘                                       │
│       │                                             │
│  ┌────▼──────────┐                                  │
│  │ pending I/O   │ ← Previous cycle I/O errors      │
│  └────┬──────────┘                                  │
│       │                                             │
│  ┌────▼──────┐                                      │
│  │   idle,   │ ← Internal use only                  │
│  │  prepare  │                                      │
│  └────┬──────┘                                      │
│       │                                             │
│  ┌────▼──────┐                                      │
│  │   poll    │ ← New I/O events fetch + execute     │
│  └────┬──────┘   (Most time spent here)             │
│       │                                             │
│  ┌────▼──────┐                                      │
│  │   check   │ ← setImmediate callbacks             │
│  └────┬──────┘                                      │
│       │                                             │
│  ┌────▼──────────┐                                  │
│  │ close events  │ ← socket.on('close'), etc.       │
│  └────┬──────────┘                                  │
│       │                                             │
│       └──────────────────────────────────────────┐  │
│                    (next tick)                   │  │
└──────────────────────────────────────────────────┘  │
```

---

## 3. Har Phase Detail Mein

### Phase 1: Timers
```
Kya execute hota hai:
  setTimeout() aur setInterval() callbacks

Important:
  Timer "minimum delay" guarantee karta hai, exact nahi
  setTimeout(fn, 100) → "100ms ke BAAD execute karo"
  Agar system busy hai → Thoda late bhi ho sakta hai

Example:
  setTimeout(() => console.log("timer"), 0);
  // 0ms delay → "Jaldi se execute karo"
  // But still goes through event loop phases!
```

### Phase 2: Pending I/O Callbacks
```
Kya execute hota hai:
  Previous iteration mein defer hue I/O callbacks
  TCP errors, etc.

Rarely directly interact karte hain isse
```

### Phase 3: Idle, Prepare
```
Internal use only — Node.js internals ke liye
Hum directly use nahi karte
```

### Phase 4: Poll ⭐ (Most Important)
```
Kya karta hai:
  1. New I/O events fetch karta hai
  2. I/O callbacks execute karta hai
  3. Agar koi callback nahi → Wait karta hai

Poll phase mein Node.js:
  - File read complete? → Callback execute karo
  - HTTP request aaya? → Handler execute karo
  - DB query done? → Callback execute karo

Blocking behavior:
  Agar poll queue empty hai aur:
    - setImmediate scheduled hai → Check phase pe jao
    - Timer ready hai → Timers phase pe jao
    - Kuch nahi → Wait karo (new I/O ka)
```

### Phase 5: Check
```
Kya execute hota hai:
  setImmediate() callbacks

setImmediate = "Poll phase ke BAAD execute karo"
setTimeout(fn, 0) = "Timers phase mein execute karo"

Difference:
  I/O callback ke andar:
    setImmediate → Hamesha pehle (check phase)
    setTimeout   → Baad mein (next timers phase)
```

### Phase 6: Close Events
```
Kya execute hota hai:
  'close' events
  socket.destroy() → 'close' event
  server.close() → 'close' event

Cleanup operations
```

---

## 4. Tick = One Full Iteration

```
"Tick" = Event loop ka ek complete cycle (Phase 1 → 6)

Between each phase:
  process.nextTick() callbacks execute hote hain
  Promise microtasks execute hote hain

Order within one tick:
  1. Current operation complete karo
  2. process.nextTick queue drain karo
  3. Promise microtask queue drain karo
  4. Next event loop phase
```

---

## 5. process.nextTick() vs setImmediate()

### process.nextTick():
```
"Current operation ke IMMEDIATELY baad execute karo"
Event loop ke KISI BHI phase ke baad run hota hai
Microtask queue mein jaata hai

Use case:
  - Error emit karna (synchronous feel)
  - API consistent banana
  - Cleanup before next I/O
```

### setImmediate():
```
"Current poll phase ke BAAD execute karo"
Check phase mein run hota hai
Macrotask queue mein jaata hai

Use case:
  - I/O ke baad kuch karna
  - CPU-intensive task break karna
  - Recursive operations
```

### Comparison:
```javascript
console.log("1. Start");

setImmediate(() => console.log("4. setImmediate"));

process.nextTick(() => console.log("2. nextTick"));

Promise.resolve().then(() => console.log("3. Promise"));

console.log("5. End");

// Output:
// 1. Start
// 5. End
// 2. nextTick      ← nextTick pehle (microtask, highest priority)
// 3. Promise       ← Promise baad (microtask)
// 4. setImmediate  ← setImmediate last (macrotask, check phase)
```

### Priority Order:
```
Highest Priority → Lowest Priority:

1. process.nextTick()    ← Sabse pehle
2. Promise.then()        ← Microtasks
3. queueMicrotask()      ← Microtasks
4. setTimeout(fn, 0)     ← Macrotasks (timers phase)
5. setImmediate()        ← Macrotasks (check phase)
6. I/O callbacks         ← Poll phase
```

---

## 6. Code Examples — Output Predict Karo

### Example 1: Basic Order
```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

process.nextTick(() => console.log("D"));

console.log("E");

// Output: A, E, D, C, B
// Kyun?
// A, E → Synchronous (call stack)
// D    → nextTick (microtask, highest priority)
// C    → Promise (microtask)
// B    → setTimeout (macrotask, timers phase)
```

### Example 2: I/O ke andar
```javascript
const fs = require('fs');

fs.readFile(__filename, () => {
  console.log("I/O callback");

  setTimeout(() => console.log("setTimeout"), 0);
  setImmediate(() => console.log("setImmediate"));
});

// Output:
// I/O callback
// setImmediate   ← Pehle! (check phase, same iteration)
// setTimeout     ← Baad mein (next timers phase)

// KEY INSIGHT:
// I/O callback ke ANDAR setImmediate hamesha setTimeout se pehle!
```

### Example 3: nextTick Starvation
```javascript
// DANGER: nextTick recursion → Event loop starve!
function recursiveNextTick() {
  process.nextTick(() => {
    console.log("nextTick");
    recursiveNextTick(); // Infinite recursion!
  });
}

recursiveNextTick();
// I/O callbacks kabhi execute nahi honge!
// nextTick queue kabhi empty nahi hogi

// setImmediate safe hai recursion ke liye:
function recursiveImmediate() {
  setImmediate(() => {
    console.log("immediate");
    recursiveImmediate(); // Safe - other callbacks bhi chalenge
  });
}
```

### Example 4: Timer Accuracy
```javascript
const start = Date.now();

setTimeout(() => {
  console.log(`Actual delay: ${Date.now() - start}ms`);
}, 100);

// Busy work (blocks event loop)
let sum = 0;
for (let i = 0; i < 1e8; i++) sum += i;

console.log("Busy work done");

// Output:
// Busy work done
// Actual delay: ~500ms  ← 100ms nahi! Busy work ne delay kiya
```

---

## 7. Event Loop Visualization — Step by Step

```javascript
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
console.log("sync");
```

```
Execution trace:

[Call Stack]
  console.log("sync") → Execute → "sync" print

[Microtask Queue after sync code]
  nextTick queue: [nextTick callback]
  Promise queue:  [promise callback]

[Drain microtasks]
  nextTick callback → Execute → "nextTick" print
  promise callback  → Execute → "promise" print

[Event Loop - Timers Phase]
  setTimeout callback → Execute → "timeout" print

[Event Loop - Check Phase]
  setImmediate callback → Execute → "immediate" print

Final output: sync, nextTick, promise, timeout, immediate
```

---

## 8. Practical Implications

### Don't Block the Event Loop:
```javascript
// BAD - Blocks event loop
app.get('/compute', (req, res) => {
  let result = 0;
  for (let i = 0; i < 1e10; i++) result += i; // 10 seconds!
  res.json({ result });
  // During these 10 seconds, NO other requests handled!
});

// GOOD - Use Worker Thread
const { Worker } = require('worker_threads');

app.get('/compute', (req, res) => {
  const worker = new Worker('./compute-worker.js');
  worker.on('message', result => res.json({ result }));
  worker.postMessage({ n: 1e10 });
  // Event loop free! Other requests handled normally
});
```

### Use setImmediate for Long Operations:
```javascript
// Process large array without blocking
function processChunk(array, index = 0) {
  const CHUNK_SIZE = 1000;
  const end = Math.min(index + CHUNK_SIZE, array.length);

  for (let i = index; i < end; i++) {
    // Process item
    array[i] = array[i] * 2;
  }

  if (end < array.length) {
    // Yield to event loop, then continue
    setImmediate(() => processChunk(array, end));
  } else {
    console.log("Processing complete!");
  }
}

const bigArray = new Array(1e6).fill(1);
processChunk(bigArray);
// Other requests still handled between chunks!
```

---

## 9. Quick Summary

```
Event Loop Phases (in order):
  1. Timers        → setTimeout, setInterval
  2. Pending I/O   → Deferred I/O callbacks
  3. Idle/Prepare  → Internal
  4. Poll          → New I/O (most time here)
  5. Check         → setImmediate
  6. Close         → 'close' events

Between EVERY phase:
  → process.nextTick() queue drain
  → Promise microtask queue drain

Priority (high → low):
  process.nextTick > Promise > setTimeout(0) > setImmediate

Key rules:
  - I/O ke andar: setImmediate > setTimeout
  - nextTick recursion → Starvation (avoid!)
  - CPU work → Blocks event loop (use Worker Threads)
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Output Predict Karo
```javascript
// Pehle khud predict karo, phir run karo:

console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
process.nextTick(() => console.log("4"));
setImmediate(() => console.log("5"));
console.log("6");

// Tumhara prediction: ?
// Actual output: 1, 6, 4, 3, 2, 5
```

### Task 2: I/O Order
```javascript
const fs = require('fs');

fs.readFile(__filename, () => {
  console.log("io");
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
  process.nextTick(() => console.log("nextTick"));
});

// Predict order: io, nextTick, immediate, timeout
```

### Task 3: Event Loop Blocking Test
```javascript
// Server banao aur blocking vs non-blocking compare karo:
const http = require('http');

http.createServer((req, res) => {
  if (req.url === '/block') {
    // Block event loop for 5 seconds
    const end = Date.now() + 5000;
    while (Date.now() < end) {}
    res.end("Blocked done");
  } else {
    res.end("Fast response");
  }
}).listen(3000);

// Test:
// 1. /block request bhejo
// 2. Turant /fast request bhejo
// Observe: /fast bhi 5 seconds wait karega!
```

---

Kal Day 3 mein Microtasks vs Macrotasks detail mein dekhenge —
Promise chains, async/await ke saath event loop behavior.
