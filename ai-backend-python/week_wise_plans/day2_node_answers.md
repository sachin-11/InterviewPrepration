# Day 2: Node.js Event Loop (Answers & Explanations)

Yeh file aapke Day 2 ke Event Loop internals aur senior-level interview questions ka deep-dive guide hai.

---

## 1. Interview Question: Single-threaded Node.js mein Asynchronous operations kaise hote hain?
**Question:** Agar Node.js single-threaded hai (yani JS code sirf ek thread par chalta hai), toh File System (`fs.readFile`) ya cryptography (`crypto`) jaise heavy asynchronous operations bina server ko block kiye kaise chalte hain?

### **Answer (The Architecture):**
Node.js sirf JS code run karne ke liye single-threaded hai, par backend par wo ek C++ framework **Libuv** ka use karta hai jo multi-threaded hai.

When an async I/O operation is called:
1. **Network I/O:** Node.js network requests ko directly **OS Kernel** (Linux mein `epoll`, Windows mein `IOCP`) ko hand over kar deta hai. OS kernel natively multi-threaded aur asynchronous hota hai. Jab kaam ho jata hai, OS Node.js ko notify karta hai. Isme kisi thread ki zaroorat nahi padti.
2. **File System (`fs`) & CPU Heavy Tasks:** OS files read karne ko fully async tarike se support nahi karta. Iske liye Libuv ke paas ek **Thread Pool** hota hai (default size = 4 threads).
   - Jab aap `fs.readFile()` call karte hain, toh JS main thread is task ko Libuv ke **C++ Thread Pool** ke ek background thread ko hand over kar deta hai aur khud aage badh jata hai (non-blocking).
   - Jab background thread file read kar leta hai, toh callback function ko Event Loop ke through back-queue mein daal diya jata hai taaki JS main thread use execute kar sake.

*Tip for Interview:* Aap bol sakte hain ki hum background threads ka size badha sakte hain using env variable `process.env.UV_THREADPOOL_SIZE = 8`.

---

## 2. Event Loop ke 6 Phases
Event loop ek continuous loop hai jo niche diye gaye order mein ghumta hai. Har phase ke paas callbacks ki ek FIFO (First In First Out) queue hoti hai:

```
   ┌───────────────────────────┐
┌─>│          Timers           │ <── setTimeout() & setInterval() callbacks
│  └─────────────┬─────────────┘
│                ▼
│  ┌───────────────────────────┐
│  │     Pending Callbacks     │ <── System errors (e.g., TCP socket errors)
│  └─────────────┬─────────────┘
│                ▼
│  ┌───────────────────────────┐
│  │      Idle, Prepare        │ <── Internally used by Node.js only
│  └─────────────┬─────────────┘
│                ▼
│  ┌───────────────────────────┐
│  │           Poll            │ <── Naye incoming requests, database results, connections
│  └─────────────┬─────────────┘
│                ▼
│  ┌───────────────────────────┐
│  │           Check           │ <── setImmediate() callbacks
│  └─────────────┬─────────────┘
│                ▼
│  ┌───────────────────────────┐
│  │      Close Callbacks      │ <── socket.on('close', ...) callbacks
└─────────────────┴─────────────┘
```

---

## 3. `setImmediate()` vs `setTimeout(cb, 0)`

Dono hi asychronous timers hain, par dono ke execute hone ke time mein farq hai:

* **`setTimeout(cb, 0)` / `setTimeout(cb, 1)`:** Yeh **Timers phase** mein execute hota hai. 0ms technically 1ms hota hai JS memory mein.
* **`setImmediate(cb)`:** Yeh **Check phase** (Poll phase ke theek baad) mein execute hota hai.

### **Kaun pehle chalega?**
1. **Inside an I/O Cycle (Always Deterministic):** Agar dono ko kisi asynchronous operation (jaise `fs.readFile`) ke andar chalaya jaye, toh **`setImmediate` hamesha pehle chalega**.
   ```javascript
   const fs = require('fs');
   fs.readFile(__filename, () => {
       setTimeout(() => console.log('timeout'), 0);
       setImmediate(() => console.log('immediate'));
   });
   // Output:
   // immediate
   // timeout
   ```
   *Reason:* File read hone par event loop **Poll phase** mein tha. Poll phase ke theek agla phase **Check phase** hota hai, isliye `setImmediate` pehle chal gaya.

2. **In Main Module (Non-Deterministic):** Agar normal code mein bina I/O ke chalayein, toh unka chalna CPU speed aur execution limits par depend karta hai. Output random ho sakta hai.

---

## 4. `process.nextTick()` Kya Hai?
* **Concept:** `process.nextTick()` technically **Event Loop ka part nahi hai**. 
* **Working:** Yeh "Next Tick Queue" mein jata hai. Jab bhi JS ka current operation complete hota hai, event loop agle phase mein jaane se pehle is queue ko poori tarah execute karta hai.
* **Priority:** Iska priority normal Promise (Microtask) se bhi high hota hai.
* **Caution:** Agar aap `process.nextTick` mein recursive call (loop) laga denge, toh Event loop agle phase mein jaa hi nahi payega aur aapka pura Node.js server lock (starve) ho jayega.

```javascript
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
// Output:
// nextTick
// promise
```
