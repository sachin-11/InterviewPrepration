# Day 3: Node.js Concurrency & Multi-threading (Answers & Explanations)

High-performance backends aur scalable AI systems ke liye concurrency module ki knowledge sabse critical hoti hai.

---

## 1. CPU Heavy Tasks Node.js Event Loop ko block kyun karte hain?
**Reason:** Node.js ka JavaScript main execution engine **single-threaded** hai. Jab event loop chal raha hota hai, toh Call Stack mein functions line-by-line execute hote hain.
* Agar koi task CPU-heavy hai (jaise 10 million iterations ka loop, heavy image resizing, cryptography calculations, ya LLM model ke JSON output ko deep parse karna), toh woh call stack ko hold kar leta hai.
* Jab tak call stack poori tarah khali nahi hota, Event Loop aage nahi badh sakta.
* Iska matlab, us time ke dauran **server par aane wali koi bhi nayi API request process nahi hogi** aur new clients ko timeout ya delay milega.

---

## 2. Worker Threads vs Child Processes vs Cluster Module (Deep Dive)

Interviews mein iska tabular comparison ya decision-making scenario pucha jata hai:

| Feature | **Worker Threads (`worker_threads`)** | **Child Processes (`child_process`)** | **Cluster Module (`cluster`)** |
| :--- | :--- | :--- | :--- |
| **Basic Concept** | Ek hi Node process ke andar multiple threads chalana. | Ek bilkul naya, independent OS process spawn karna. | Apni Node app ke multiple clones/replicas run karna. |
| **Memory Sharing** | **Shared Memory:** Threads aapas mein fast data share kar sakte hain (`SharedArrayBuffer`). | **No Shared Memory:** Aapas mein heavy IPC (Inter-Process Comm) karna padta hai. | **No Shared Memory:** Each instance runs independently on its own RAM. |
| **Overhead** | Very Low (Lightweight threads). | High (Naya OS process, CPU & RAM heavy). | Medium (Spawns 1 process per CPU core). |
| **Best Use Case** | **CPU-heavy JS tasks** (e.g., parsing, crypto, JSON validation). | **Non-JS execution** (e.g., Running a Python script, terminal commands). | **Web Server Scaling** (e.g., Express server par multi-core request handling). |

---

## 3. Interview Question: 5GB CSV File Parsing & DB Ingestion
**Question:** Aapke paas 5GB ki CSV file hai jise parse karke database mein bulk-insert karna hai. Kaise handle karoge bina server block kiye?

### **Solution (Step-by-Step Architecture):**
1. **NEVER use `fs.readFile()`:** 5GB data ko memory mein load karne se instant `OutOfMemory (OOM)` error aayega.
2. **Streams (Mandatory):** Hum `fs.createReadStream()` use karenge. Streams data ko 64KB ke chote-chote chunks (pieces) mein read karti hain.
3. **CSV Parsing Pipeline:** CSV parsing (e.g., using `csv-parser`) ko stream ke pipeline mein attach karenge.
4. **Worker Threads:** Parsing aur data formatting ka heavy CPU-bound task main thread se offload karke ek `Worker Thread` ko bhej denge.
5. **Batch DB Ingestion (Bulk Insert):** Database mein single-single insert query nahi chalayenge. Data ko 1000-1000 records ke batches mein divide karke bulk-insert (`INSERT INTO ... VALUES ...`) karenge.
6. **Backpressure Handling:** Agar database write karne ki speed file read karne ki speed se slow hai, toh memory block hone lagegi. Isko control karne ke liye **backpressure** pattern use karenge (database busy hone par file stream ko `.pause()` karenge aur database khali hone par `.resume()` karenge).

---

## 4. Practical Action: Worker Thread Script Boilerplate
Aap apne assignment/interview demos ke liye is code ko refer kar sakte hain:

### `main.js` (Main Thread)
```javascript
const { Worker } = require('worker_threads');
const path = require('path');

function runHeavyTask(limit) {
  return new Promise((resolve, reject) => {
    // Spawning worker thread (points to worker.js)
    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: { limit } // Sending input to worker
    });

    // Listening for result
    worker.on('message', (result) => resolve(result));
    
    // Listening for errors
    worker.on('error', (err) => reject(err));
    
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

// Example API / Route integration
async function handleRequest() {
  console.log("Main Thread is free, spawning task...");
  try {
    const result = await runHeavyTask(5000000000); // 5 Billion iterations
    console.log("Heavy Task Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

handleRequest();
```

### `worker.js` (Worker Thread)
```javascript
const { parentPort, workerData } = require('worker_threads');

// Heavy CPU calculations running in background
function performHeavyLoop(limit) {
  let count = 0;
  for (let i = 0; i < limit; i++) {
    count++;
  }
  return count;
}

// Perform calculation and send result back to main thread
const result = performHeavyLoop(workerData.limit);
parentPort.postMessage(result);
```
