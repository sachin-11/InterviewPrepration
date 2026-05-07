# Day 3 — Microtasks vs Macrotasks

Ye topic interviews mein sabse zyada poochha jaata hai.
Code output predict karna aana chahiye — bina run kiye.

---

## 1. Macrotask vs Microtask — Simple Definition

```
Macrotask (Task Queue):
  "Bade kaam" — Event loop ke ek poore phase mein ek execute hota hai
  
  Examples:
    setTimeout()
    setInterval()
    setImmediate()
    I/O callbacks (fs.readFile, HTTP)
    UI rendering (browser)

Microtask (Microtask Queue):
  "Chhote urgent kaam" — Current task ke IMMEDIATELY baad sab execute hote hain
  
  Examples:
    Promise.then() / .catch() / .finally()
    async/await (internally Promise)
    queueMicrotask()
    process.nextTick() ← Node.js specific (highest priority)
```

### Key Rule:
```
Ek macrotask execute hone ke baad →
  SARI microtasks execute hoti hain →
    Phir next macrotask

Microtask queue EMPTY hone tak next macrotask nahi chalega!
```

---

## 2. Execution Order — Complete Picture

```
┌─────────────────────────────────────────────────────┐
│              EXECUTION ORDER                        │
│                                                     │
│  1. Synchronous code (Call Stack)                   │
│     ↓                                               │
│  2. process.nextTick() queue (drain completely)     │
│     ↓                                               │
│  3. Promise microtask queue (drain completely)      │
│     ↓                                               │
│  4. Macrotask (ONE from queue)                      │
│     ↓                                               │
│  5. process.nextTick() queue (drain again)          │
│     ↓                                               │
│  6. Promise microtask queue (drain again)           │
│     ↓                                               │
│  7. Next macrotask                                  │
│     ↓                                               │
│  ... repeat ...                                     │
└─────────────────────────────────────────────────────┘
```

### Priority (Highest → Lowest):
```
1. Synchronous code          ← Sabse pehle
2. process.nextTick()        ← Microtask (Node.js specific)
3. Promise.then()            ← Microtask
4. queueMicrotask()          ← Microtask
5. setTimeout(fn, 0)         ← Macrotask
6. setImmediate()            ← Macrotask (check phase)
7. I/O callbacks             ← Macrotask (poll phase)
```

---

## 3. Microtasks — Detail

### Promise.then():
```javascript
console.log("1");

Promise.resolve("hello")
  .then(val => {
    console.log("2 -", val);
    return "world";
  })
  .then(val => {
    console.log("3 -", val);
  });

console.log("4");

// Output: 1, 4, 2 - hello, 3 - world
// Kyun?
// 1, 4 → Synchronous
// Promise.then → Microtask queue mein
// Sync code khatam → Microtask queue drain
// 2, 3 → Execute
```

### queueMicrotask():
```javascript
console.log("1");

queueMicrotask(() => console.log("2 - microtask"));

Promise.resolve().then(() => console.log("3 - promise"));

console.log("4");

// Output: 1, 4, 2 - microtask, 3 - promise
// queueMicrotask aur Promise.then same priority
// Jo pehle register hua, pehle execute hoga
```

### process.nextTick() — Highest Priority:
```javascript
console.log("1");

Promise.resolve().then(() => console.log("2 - promise"));

process.nextTick(() => console.log("3 - nextTick"));

queueMicrotask(() => console.log("4 - microtask"));

console.log("5");

// Output: 1, 5, 3 - nextTick, 2 - promise, 4 - microtask
// nextTick HAMESHA Promise se pehle!
// Even if Promise pehle register hua
```

---

## 4. Macrotasks — Detail

### setTimeout vs setImmediate:
```javascript
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));

// Output: UNPREDICTABLE at top level!
// Sometimes: timeout, immediate
// Sometimes: immediate, timeout
// Depends on system timer resolution

// BUT inside I/O callback → ALWAYS setImmediate first:
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
  // ALWAYS: immediate, timeout
});
```

### setInterval:
```javascript
let count = 0;
const interval = setInterval(() => {
  count++;
  console.log(`Interval ${count}`);
  if (count >= 3) clearInterval(interval);
}, 100);

// Output every 100ms:
// Interval 1
// Interval 2
// Interval 3
```

---

## 5. async/await — Event Loop mein

### async/await internally Promise hai:
```javascript
async function fetchData() {
  console.log("2 - async start");
  const result = await Promise.resolve("data");
  console.log("4 - after await:", result);
  return result;
}

console.log("1 - before");
fetchData();
console.log("3 - after call");

// Output: 1, 2, 3, 4
// Kyun?
// 1 → Sync
// 2 → fetchData() call, sync part execute
// await → Microtask queue mein jaata hai
// 3 → Sync continue
// 4 → Microtask execute (after sync done)
```

### Multiple awaits:
```javascript
async function example() {
  console.log("A");
  await null;           // Microtask 1
  console.log("B");
  await null;           // Microtask 2
  console.log("C");
}

console.log("1");
example();
console.log("2");

// Output: 1, A, 2, B, C
// 1 → Sync
// A → Sync (inside async fn, before first await)
// await → Pause, return to caller
// 2 → Sync (caller continues)
// B → Microtask 1 resolves
// C → Microtask 2 resolves
```

---

## 6. Interview Trap Questions

### Trap 1: nextTick inside Promise
```javascript
Promise.resolve().then(() => {
  console.log("promise");
  process.nextTick(() => console.log("nextTick inside promise"));
});

process.nextTick(() => {
  console.log("nextTick");
  Promise.resolve().then(() => console.log("promise inside nextTick"));
});

// Output: nextTick, promise inside nextTick, promise, nextTick inside promise
// 
// Step 1: nextTick queue: [nextTick callback]
//         Promise queue:  [promise callback]
//
// Step 2: Drain nextTick:
//   "nextTick" print
//   Promise.resolve().then → Promise queue mein add
//   nextTick queue: []
//   Promise queue: [promise callback, promise inside nextTick]
//
// Step 3: Drain Promise queue:
//   "promise inside nextTick" print
//   nextTick inside promise → nextTick queue mein
//   "promise" print
//   nextTick queue: [nextTick inside promise]
//
// Step 4: Drain nextTick again:
//   "nextTick inside promise" print
```

### Trap 2: Promise chain order
```javascript
Promise.resolve()
  .then(() => console.log("1"))
  .then(() => console.log("2"))
  .then(() => console.log("3"));

Promise.resolve()
  .then(() => console.log("4"))
  .then(() => console.log("5"))
  .then(() => console.log("6"));

// Output: 1, 4, 2, 5, 3, 6
// NOT: 1, 2, 3, 4, 5, 6
//
// Kyun? Interleaved!
// Round 1: Both first .then() → Queue: [1, 4]
//   Execute 1 → Queue: [4, 2]
//   Execute 4 → Queue: [2, 5]
// Round 2: Execute 2 → Queue: [5, 3]
//   Execute 5 → Queue: [3, 6]
// Round 3: Execute 3 → Queue: [6]
//   Execute 6 → Queue: []
```

### Trap 3: setTimeout 0 vs Promise
```javascript
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));

// Output: promise, timeout
// Promise (microtask) HAMESHA setTimeout (macrotask) se pehle
// Even if setTimeout 0ms delay hai
```

### Trap 4: Nested setTimeout
```javascript
setTimeout(() => {
  console.log("outer");
  setTimeout(() => console.log("inner"), 0);
}, 0);

setTimeout(() => console.log("sibling"), 0);

// Output: outer, sibling, inner
// Kyun?
// outer aur sibling same macrotask queue mein hain
// inner outer ke execute hone ke BAAD queue mein jaata hai
// So: outer → sibling → inner
```

### Trap 5: async function return
```javascript
async function foo() {
  return 1;
}

async function bar() {
  return Promise.resolve(2);
}

foo().then(v => console.log("foo:", v));
bar().then(v => console.log("bar:", v));

// Output: foo: 1, bar: 2
// BUT bar() takes one extra microtask tick!
// async fn returning Promise → Extra unwrapping step
// In practice: foo resolves before bar
```

---

## 7. Complete Order Example

```javascript
console.log("script start");           // 1

setTimeout(() => {
  console.log("setTimeout 1");         // 7
}, 0);

Promise.resolve()
  .then(() => {
    console.log("promise 1");          // 4
    process.nextTick(() =>
      console.log("nextTick in promise") // 5
    );
  })
  .then(() => console.log("promise 2")); // 6

process.nextTick(() => {
  console.log("nextTick 1");           // 2
  process.nextTick(() =>
    console.log("nextTick 2")          // 3
  );
});

setImmediate(() => console.log("setImmediate")); // 8

console.log("script end");             // 1 (continues)
```

```
Execution trace:

Sync:
  "script start"
  setTimeout → macrotask queue
  Promise.resolve().then → microtask queue
  process.nextTick → nextTick queue
  setImmediate → check phase queue
  "script end"

Drain nextTick:
  "nextTick 1"
  nextTick 2 → nextTick queue
  "nextTick 2"

Drain Promise microtasks:
  "promise 1"
  nextTick in promise → nextTick queue
  promise 2 → microtask queue

Drain nextTick again:
  "nextTick in promise"

Drain Promise microtasks again:
  "promise 2"

Macrotask (timers):
  "setTimeout 1"

Macrotask (check):
  "setImmediate"

Final output:
  script start, script end, nextTick 1, nextTick 2,
  promise 1, nextTick in promise, promise 2,
  setTimeout 1, setImmediate
```

---

## 8. Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│              QUICK REFERENCE                        │
├─────────────────┬───────────────────────────────────┤
│ Type            │ Examples                          │
├─────────────────┼───────────────────────────────────┤
│ Synchronous     │ console.log, for loop, assignment │
│ nextTick        │ process.nextTick()                │
│ Microtask       │ Promise.then, queueMicrotask      │
│ Macrotask       │ setTimeout, setInterval, I/O      │
│ Check phase     │ setImmediate                      │
└─────────────────┴───────────────────────────────────┘

Rules:
  1. Sync → nextTick → Microtask → Macrotask
  2. Microtask queue FULLY drain hoti hai before next macrotask
  3. nextTick > Promise (always)
  4. I/O ke andar: setImmediate > setTimeout
  5. Top level: setTimeout vs setImmediate = unpredictable
```

---

## 9. Practice Tasks (Aaj Karo)

### Task 1: Output Predict Karo (Easy)
```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");

// Predict: ?
// Answer: A, D, C, B
```

### Task 2: Output Predict Karo (Medium)
```javascript
async function main() {
  console.log("1");
  await Promise.resolve();
  console.log("2");
  await Promise.resolve();
  console.log("3");
}

console.log("A");
main();
console.log("B");

// Predict: ?
// Answer: A, 1, B, 2, 3
```

### Task 3: Output Predict Karo (Hard)
```javascript
process.nextTick(() => console.log("1"));

Promise.resolve()
  .then(() => {
    console.log("2");
    process.nextTick(() => console.log("3"));
  })
  .then(() => console.log("4"));

process.nextTick(() => console.log("5"));

// Predict: ?
// Answer: 1, 5, 2, 3, 4
```

### Task 4: Fix the Bug
```javascript
// Ye code expected output nahi de raha:
// Expected: "data loaded", then "processing"
// Actual: "processing", then "data loaded"

function loadData(callback) {
  if (cache.has('data')) {
    callback(cache.get('data')); // Synchronous!
  } else {
    fetchFromDB((data) => {
      cache.set('data', data);
      callback(data);           // Asynchronous
    });
  }
}

loadData((data) => {
  console.log("data loaded");
});
console.log("processing");

// Fix: Use process.nextTick for consistent async behavior
function loadDataFixed(callback) {
  if (cache.has('data')) {
    process.nextTick(() => callback(cache.get('data'))); // Always async!
  } else {
    fetchFromDB((data) => {
      cache.set('data', data);
      callback(data);
    });
  }
}
```

---

Kal Day 4 mein Async Patterns dekhenge —
Callbacks, Promises, async/await — evolution aur best practices.
