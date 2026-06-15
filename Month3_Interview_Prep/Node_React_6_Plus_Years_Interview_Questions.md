# Node.js and React.js Interview Questions & Answers (6+ Years Experience)

Yeh document ek Senior Full-Stack candidate ke liye advanced questions aur unke detailed answers contain karta hai (Hinglish format me).

---

## 🟢 React.js Advanced Questions

### 1. Architecture & Internals

**Q1: React Fiber architecture kya hai? Aur yeh purane stack reconciler ki problems ko kaise solve karta hai?**

*   **Answer:** 
    *   Purana "Stack Reconciler" synchronous tha. Matlab agar rendering ek baar start ho gayi, toh use bich me rok nahi sakte the. Agar component tree bohot deep ho toh main thread block ho jata tha aur UI lag/janky feel hota tha.
    *   **React Fiber** (jo React 16 me aaya) reconciliation algorithm ka ek complete rewrite hai. Yeh rendering ke kaam ko chote-chote chunks me tod deta hai (jinhe "fibers" bolte hain). 
    *   **Time-Slicing:** Yeh React ko power deta hai ki wo rendering work ko pause, abort ya browser ko yield kar sake. Agar koi high-priority task (jaise user input ya animation) aa jaye, toh React current render ko pause karke pehle priority task ko handle karta hai aur fir wapas resume kar leta hai.
    *   **Phases:** Yeh kaam ko 2 phases me split karta hai:
        *   *Render Phase (Asynchronous/Interruptible):* Isme React changes calculate karta hai aur ek "work-in-progress" tree banata hai. Ise pause ya resume kiya ja sakta hai. Isme actual DOM me koi change nahi hota.
        *   *Commit Phase (Synchronous/Uninterruptible):* Is phase me React calculated changes ko actual DOM pe ek sath apply karta hai.

**Q2: React 18 concurrent features perceived performance ko kaise improve karte hain? `useTransition` ka ek practical scenario batao.**

*   **Answer:**
    *   Concurrent features ki wajah se React ek sath background me UI ke multiple versions prepare kar sakta hai bina main thread ko block kiye.
    *   **`useTransition` Scenario:** Maan lo ek search input hai jo 10,000 items ki list ko filter karta hai. Agar hum input state aur list state dono ko ek sath update karenge, toh typing laggy feel hogi kyunki list filter hone me main thread block ho jayega.
    *   `startTransition` ka use karke hum input update ko high-priority (urgent) update mante hain taaki typing instant feel ho. List filtering logic ko hum `startTransition` ke andar daal dete hain, jo use low-priority (non-urgent) update bana deta hai. React pehle input dikhayega aur background me list filter karega. Agar user fir se type karega toh background filtering pause ho jayegi.

### 2. State Management at Scale

**Q3: 6+ years experience ke sath, aap ek large-scale enterprise application ke liye Context API, Redux (RTK), aur Zustand me se kaise choose karenge?**

*   **Answer:**
    *   **Context API:** Yeh low-frequency updates (jaise theme, user auth, localization) ke liye best hai. **Drawback:** Agar rapidly changing state ko Context se pass karenge toh saare consuming components bina matlab re-render honge (jab tak `React.memo` se optimize na kiya ho). Yeh state management tool nahi hai, balki dependency injection tool hai.
    *   **Redux Toolkit (RTK):** Yeh massive, complex apps ke liye best hai jahan strict team conventions, complex derived state aur debugging (Redux DevTools) ki zarurat hoti hai. **Drawback:** Isme abhi bhi thoda boilerplate code likhna padta hai baki naye tools ke comparison me.
    *   **Zustand / Jotai:** Modern React apps ke liye best hai jahan high performance aur minimal boilerplate chahiye. Zustand ek centralized store deta hai aur hooks ke through sirf specific parts ko subscribe karta hai (unnecessary re-renders bachata hai).
    *   *Conclusion:* Ek naye enterprise app ke liye, main 90% state (Server State/API data) ke liye **React Query (TanStack Query)** use karunga aur baki 10% (Client UI state jaise sidebar toggles) ke liye **Zustand** use karunga.

### 3. Performance Optimization

**Q4: `useMemo` aur `useCallback` exactly kis scenario me beneficial hote hain, aur kab yeh harmful hote hain?**

*   **Answer:**
    *   **Beneficial `useMemo`:** Jab koi computationally expensive function ho (jaise kisi badi array ko sort/filter karna ya complex math calculation).
    *   **Beneficial `useCallback`:** Jab hum ek callback function as a prop kisi child component ko pass kar rahe ho jo `React.memo` me wrapped hai. Agar `useCallback` use nahi karenge toh har parent render pe function ka naya reference banega, jo child ke `React.memo` ko break kar dega aur child fir se render ho jayega.
    *   **Harmful/Unnecessary:** 
        *   Primitive values ya simple operations pe inka use karna (kyunki unka dependency array check karne ka time operation se zyada mehenga pad sakta hai).
        *   Normal HTML elements me pass karte time (jaise `<button onClick={useCallback(...)}>`). Browser ko referential equality se koi farq nahi padta, wahan iska koi faida nahi.

---

## 🟢 Node.js Advanced Questions

### 1. Internals & Architecture

**Q5: Node.js Event Loop ke phases explain karo. `process.nextTick` aur Promises kahan aate hain?**

*   **Answer:**
    *   Event loop I/O operations ko system kernel (ya Libuv thread pool) pe offload karta hai. Iske phases sequence me ye hain:
        1.  **Timers:** `setTimeout()` aur `setInterval()` ke callbacks execute karta hai.
        2.  **Pending Callbacks:** Kuch system level callbacks jo delay ho gaye the unhe chalata hai.
        3.  **Idle, Prepare:** Internal Node use ke liye.
        4.  **Poll:** Naye I/O events ko retrieve karta hai; I/O related callbacks ko execute karta hai.
        5.  **Check:** `setImmediate()` ke callbacks execute karta hai.
        6.  **Close Callbacks:** Close events execute karta hai (jaise `socket.on('close', ...)`).
    *   **Microtasks (`process.nextTick` aur Promises):** Yeh Event loop ke phases ka hissa nahi hote. Jaise hi koi current operation complete hota hai, agle phase me jane se pehle microtask queue check hoti hai aur unhe execute kiya jata hai. Inme `process.nextTick` ki priority Promises se zyada hoti hai.

**Q6: Node.js single-threaded hai, toh yeh concurrent I/O kaise handle karta hai? Libuv aur Thread Pool ka role samjhao.**

*   **Answer:**
    *   Node ka main thread V8 aur Event Loop chalata hai.
    *   Jab Node ko koi asynchoronous I/O task milta hai (jaise file read karna ya network call), toh wo ise **Libuv** (ek C library) ko de deta hai.
    *   Network I/O ke liye, Libuv OS ke native async APIs (jaise epoll, kqueue) use karta hai. Isme threads use nahi hote.
    *   File I/O (fs), DNS lookups, aur heavy crypto operations ke liye native async OS APIs consistent nahi hote. In tasks ke liye Libuv apna internal **Thread Pool** use karta hai (by default 4 threads hote hain). Ye worker threads blocking kaam karte hain aur complete hone pe event loop ko signal bhejte hain.

### 2. Scalability & Multithreading

**Q7: Aap `worker_threads`, `child_process`, aur `cluster` ka use kab kab karenge?**

*   **Answer:**
    *   **`cluster`:** Yeh vertical scaling ke liye hota hai. Yeh main Node process ko fork karke available CPU cores ke hisaab se multiple identical instances banata hai jo same server port share karte hain. Iska main use zyada concurrent HTTP requests handle karna hai.
    *   **`child_process` (`spawn`, `exec`):** Yeh ek poora alag OS process spin up karne ke liye hai. Yeh external non-Node scripts (jaise Python script, bash command, video processing) chalane ke liye best hai. Inme memory consumption zyada hota hai aur ye IPC ke through communicate karte hain.
    *   **`worker_threads`:** Yeh Node.js ke andar hi CPU-intensive tasks (jaise image processing, crypto) chalane ke liye hote hain. Yeh same V8 isolate aur memory (`SharedArrayBuffer` ke through) share karte hain, isliye `child_process` se kaafi halke (lightweight) hote hain aur main event loop ko block hone se bachate hain.

### 3. Memory & Streams

**Q8: Ek 10GB CSV file read karke database me insert karni hai, par server ki RAM sirf 1GB hai. Ise Node.js Streams ka use karke kaise likhoge? Backpressure kya hota hai?**

*   **Answer:**
    *   Agar hum `fs.readFile` se poori file read karenge toh V8 ki memory limit exceed ho jayegi aur app crash kar jayega. Isliye hume **Streams** use karni padengi.
    *   **Implementation:**
        1.  File ko chote chunks me read karne ke liye `fs.createReadStream` banayenge.
        2.  Ise ek parser (jaise `csv-parse`) me pipe karenge jo ek Transform stream ki tarah kaam karega.
        3.  Fir us data ko ek Writable stream me pipe karenge jo chunk-by-chunk database me insert karega.
    *   **Backpressure:** Yeh tab hota hai jab ReadStream database Writable stream ke insert karne ki speed se zyada speed me data read karta hai. Aise me buffer bharne lagta hai jis se memory leak ho sakta hai. 
    *   `.pipe()` ka use backpressure ko automatically handle karta hai. Agar Writable buffer full ho jata hai, toh wo ReadStream ko pause hone ka signal deta hai aur buffer khaali hone par wapas resume kar deta hai.

### 4. Security & System Design

**Q9: Kisi Node.js API ko DDoS attacks se kaise bachaoge? Distributed rate limiting kaise implement karoge?**

*   **Answer:**
    *   **Infrastructure Level:** WAF (Web Application Firewall) jaise Cloudflare use karenge. Reverse proxy (Nginx) se malformed requests ko Node tak pahuchne se pehle hi drop kar denge.
    *   **Application Level (Distributed Rate Limiting):**
        *   Agar app cluster ya multiple pods me chal raha hai, toh normal in-memory rate limiting kaam nahi karegi kyunki pods aapas me memory share nahi karte.
        *   **Solution:** Hum ek centralized aur fast in-memory store jaise **Redis** ka use karenge. Jab bhi koi request aayegi, Node server Redis me us IP ya User ID ke hisaab se ek key ko increment karega (`INCR key`). Agar kisi TTL window me limit exceed ho jati hai, toh hum HTTP 429 (Too Many Requests) return kar denge.
    *   **Other Defenses:** `helmet` use karenge HTTP headers secure karne ke liye, strict CORS, input validation (Joi/Zod) jisse kharab payload parse na ho, aur request body sizes ko limit karenge.

---

## 🟢 Scenario-Based / Architectural 

**Q10: Scenario - Hum ek real-time collaborative code editor bana rahe hain (Google Docs for code type). Iska high-level architecture kya hoga?**

*   **Answer:**
    *   **Communication:** Persistent, bidirectional communication ke liye hum **WebSockets** (Socket.io) use karenge. Normal HTTP Polling realtime typing ke liye bohot slow hoti hai.
    *   **Conflict Resolution:** Sabse mushkil part hai jab do users ek hi time pe type karein. Conflicts avoid karne ke liye hum **CRDTs (Conflict-free Replicated Data Types)** jaise Yjs ya Automerge use karenge, ya fir Operational Transformation (OT).
    *   **Frontend (React):** Monaco Editor jaise editor use karenge aur uski state ko CRDT document se directly bind kar denge. Jab local user type karega, toh local CRDT update hoga aur "delta" (change) WebSocket ke through bhej diya jayega.
    *   **Backend (Node.js):** 
        *   Node server ek WebSocket relay ki tarah kaam karega. 
        *   Multiple Node servers pe WebSockets scale karne ke liye hum **Redis Pub/Sub** ka use karenge. Agar User A ka change Server 1 pe aaya hai, toh wo Redis me publish hoga, jisse Server 2 pe connected User B ko bhi update mil jayega.
        *   Periodically document state ka snapshot le kar MongoDB ya Postgres me save karte rahenge.
