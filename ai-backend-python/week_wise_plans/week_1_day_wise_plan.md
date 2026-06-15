# Week 1: Day-Wise Preparation Plan
**Focus:** Advanced JavaScript, Node.js Internals, and React.js Performance
**Target Audience:** Senior Full Stack Engineer (6 YOE)

Ek senior engineer ko "What" se zyada "How it works under the hood" pata hona chahiye. Har din 1.5 se 2 ghante in topics ko deeply samajhne mein lagayein.

---

## 🗓️ Day 1: Advanced JavaScript (The Engine)
* **Topics to Cover:**
  1. Execution Context aur Hoisting (Kaise JS variables aur functions memory mein rakhti hai).
  2. Closures (Senior interviews mein practical closure based questions aate hain, e.g., memoization function banana).
  3. Promises, Async/Await aur Microtask Queue vs Macrotask Queue.
* **Interview Question:** `setTimeout`, `Promise.resolve`, aur `console.log` ka output order kya hoga aur kyun?
* **Action:** 1 ghanta 'JavaScript Visualized' (Lydia Hallie ke blogs) padhein event loop aur execution context ke liye.

---

## 🗓️ Day 2: Node.js Event Loop (Deep Dive)
* **Topics to Cover:**
  1. Event Loop ke 6 Phases (Timers, Pending Callbacks, Idle/Prepare, Poll, Check, Close Callbacks).
  2. `setImmediate()` vs `setTimeout(cb, 0)`.
  3. `process.nextTick()` ka Event loop mein kya role hai (Yeh sabse pehle kyun chalta hai?).
* **Interview Question:** Agar Node.js single-threaded hai, toh file system (fs) asynchronous kaise kaam karta hai? (Ans: libuv thread pool).
* **Action:** Node.js official docs se "The Node.js Event Loop, Timers, and process.nextTick()" guide padhein.

---

## 🗓️ Day 3: Node.js Concurrency & Multi-threading
* **Topics to Cover:**
  1. CPU Heavy tasks (jaise ML model parsing ya image processing) Node.js ko block kyun karte hain?
  2. Worker Threads vs Child Processes vs Cluster Module (Kab kya use karein?).
* **Interview Question:** Ek 5GB ki CSV file aayi hai jisko parse karke database mein dalna hai. Isko Node.js mein kaise handle karoge taaki server block na ho? (Ans: Streams aur Worker Threads).
* **Action:** Ek chota sa Node.js script likhein jisme `worker_threads` module use karke ek heavy for-loop chal raha ho.

---

## 🗓️ Day 4: Memory Leaks & Garbage Collection (V8 Engine)
* **Topics to Cover:**
  1. V8 Engine mein Garbage Collection kaise kaam karta hai (Mark and Sweep algorithm).
  2. Memory Leaks kaise hote hain? (Global variables, unclosed connections, closures holding references, uncleared intervals).
  3. Memory leaks detect karne ke tools (Chrome DevTools Inspector, Heap Snapshots).
* **Interview Question:** "Humara Node.js server production mein har 2 din baad crash (OOM - Out of Memory) ho jata hai. Isko step-by-step kaise debug karoge?"
* **Action:** YouTube par "How to find memory leaks in Node.js" ka ek practical tutorial dekhein.

---

## 🗓️ Day 5: React.js Under the Hood (React Fiber)
* **Topics to Cover:**
  1. Virtual DOM kya hai aur React ka Diffing Algorithm (Reconciliation) kaise elements compare karta hai.
  2. React Fiber Architecture kya hai? (Rendering ko pause, abort, aur resume karne ki capability).
  3. Keys ka kya importance hai lists mein? (Index as a key kyun avoid karna chahiye).
* **Interview Question:** React 18 mein Concurrent Mode aur Fiber engine se application fast kaise hoti hai?
* **Action:** Dan Abramov ya kisi senior developer ka blog padhein on "React Fiber Architecture".

---

## 🗓️ Day 6: React Performance Optimization
* **Topics to Cover:**
  1. Component re-renders ko kab aur kaise rokein?
  2. `React.memo` (HOC) vs `useMemo` (Hook) vs `useCallback` (Hook) – in teeno ka difference aur inka "cost" (har jagah inko use karna galat kyun hai?).
  3. Code Splitting: `React.lazy()` aur `Suspense` ka use karke bundle size kam karna.
* **Interview Question:** Aapne dekha ki ek bada list component type karte waqt lag kar raha hai. Aap isko kaise profile aur optimize karenge? (Ans: React Profiler, debouncing input, memoization).
* **Action:** Apne kisi purane React project mein React Profiler tab (Chrome extension) open karein aur dekhein kaunse components be-wajah re-render ho rahe hain.

---

## 🗓️ Day 7: Revision & Mock Execution
* **Task 1:** Pura hafta jo concepts padhe hain, unhe revise karein.
* **Task 2 (Coding):** 
  - Node.js mein ek simple Express API banayein jisme Memory Leak intentional banayein (ek global array mein data push karte rahein) aur uska memory trace lein.
  - React mein ek simple Parent-Child component banayein aur `useCallback` use karke check karein ki re-renders kaise block hote hain.
* **Mindset Check:** Khud se questions puchein - kya main in concepts ko ek story ki tarah interviewer ko samjha sakta hu?
