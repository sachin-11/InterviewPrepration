# Day 4: Memory Leaks & Garbage Collection (Answers & Explanations)

Senior Full Stack roles mein database optimization ke baad sabse heavy technical round **Debugging & System Stability** par hota hai. Production crash problems ko handle karna ek senior capability hai.

---

## 1. V8 Engine mein Garbage Collection (GC) kaise kaam karta hai?
JavaScript memory automatic manage karta hai, iska engine **V8** (Jo Node.js aur Chrome mein hota hai) memory cleaning ke liye **Garbage Collector** ka use karta hai.

V8 memory (Heap) ko do main spaces mein divide karta hai:

### A. New Space (Young Generation)
* Yahan naye banne wale, short-lived (choti umar ke) objects rehte hain.
* Isme **Scavenge (Minor GC)** chalta hai jo bohot fast aur frequent hota hai. Yeh Cheney's Copying Algorithm use karta hai jahan active memory ko dusre clean block (To-Space) mein copy kiya jata hai aur purana space clear kar diya jata hai.

### B. Old Space (Old Generation)
* Jo objects New Space mein do-teen minor GC cycles survive kar lete hain, unhe Old Space mein promote kar diya jata hai (jaise global configs, database clients, sessions).
* Isme **Major GC (Mark-Sweep-Compact)** chalta hai. Iske 3 steps hote hain:
  1. **Marking:** V8 active global objects (Roots), stack variables, aur active callbacks se start karke memory tree traverse karta hai aur un sabhi objects ko *Mark* karta hai jo code se abhi bhi reachable hain.
  2. **Sweeping:** Jo objects *unmarked* reh jate hain (jo reachable nahi hain), unki memory ko sweep (free/delete) kar diya jata hai.
  3. **Compacting:** Khali jagah ko fill karne ke liye saare bache hue active objects ko ek sath copy karke organize kiya jata hai taaki memory fragmented (bikhri hui) na rahe.

---

## 2. Memory Leaks Kaise Hote Hain? (With Code Snippets)
Memory leak tab hota hai jab koi object ki zarurat ab nahi hai, par JS engine use Garbage Collect nahi kar pata kyunki uska koi reference system mein bacha reh gaya hai.

### A. Accidental Global Variables
Agar strict mode use nahi kiya, toh variable bina declare kiye use karne par wo `global` object se attach ho jata hai aur kabhi delete nahi hota.
```javascript
function processUser() {
    userData = new Array(1000000); // var/let/const nahi lagaya, global.userData ban gaya!
}
```

### B. Uncleared Intervals / Timers
`setInterval` tab tak memory hold karega jab tak `clearInterval` na kiya jaye, aur uske callbacks mein bache variables kabhi GC nahi honge.
```javascript
function loadData() {
    let largeObject = new Array(1000000);
    setInterval(() => {
        // largeObject ka reference callbacks mein hai, isliye GC largeObject ko clear nahi kar payega.
        console.log(largeObject.length); 
    }, 1000);
}
```

### C. Unclosed Connection Event Listeners
Jab database ya socket connections banate hain aur event listeners clear nahi karte.
```javascript
const emitter = require('events');
const globalEmitter = new emitter();

function handleUserRequest() {
    const heavyObj = { data: 'some heavy data' };
    globalEmitter.on('customEvent', () => {
        console.log(heavyObj.data); // heavyObj kabhi GC nahi hoga kyunki globalEmitter se connected hai
    });
}
```

---

## 3. Interview Question: 2 Din Baad Production Server OOM (Out Of Memory) Crash Debugging
**Question:** "Humara Node.js server production mein har 2 din baad crash ho jata hai (OOM). Isko step-by-step kaise debug karoge?"

### **Step-by-Step Answer (Pro Debugging Path):**

#### **Step 1: Metric Verification (Sawtooth Pattern)**
Pehle main Datadog, NewRelic, ya AWS CloudWatch Dashboard par memory usage chart check karunga. Agar memory linearly build ho kar drop ke bajaye sidhe crash ho rahi hai (classic **Sawtooth Pattern**), toh confirm ho jayega ki memory leak hai.

#### **Step 2: Reproduction & Heap Inspection (Local/Staging)**
Main server ko locally debug mode mein run karunga:
```bash
node --inspect index.js
```
Aur load generate karne ke liye `autocannon` ya `artillery` (e.g., 10,000 requests) tool use karunga.

#### **Step 3: Heap Snapshot Comparison (The Golden Method)**
Chrome browser mein `chrome://inspect` open karunga:
1. **Snapshot 1:** Server start hone ke turant baad pehla Heap Snapshot lunga.
2. **Load Test:** Server par autocannon se heavy request load daalunga.
3. **Snapshot 2:** Load khatam hone ke baad, aur Garbage Collection run hone ke baad, dusra Snapshot lunga.
4. **Analysis:** Chrome DevTools ke "Comparison" option mein jaakar dono snapshots ko compare karunga. Main **Delta (allocations minus deletions)** check karunga aur variables ko sort karunga by size/constructor. Main specific patterns dhundunga, jaise duplicate event listeners, un-cleared strings ya persistent db queries.

#### **Step 4: Using Performance Profiling Tools**
* **Clinic.js:** Main `npx clinic doctor -- node index.js` run karke deep metrics (Event loop delay, memory allocation charts) collect karunga.
* **Heap Dump:** Production environment se direct dump lene ke liye `heapdump` module integrate kar sakte hain.

#### **Step 5: Fix & Verification**
Code mein closures, database connections ya timers ko unbind/clear karunga. Dubara same load test run karke confirm karunga ki memory usage baseline (stabilized state) par aa gayi hai ya nahi.
