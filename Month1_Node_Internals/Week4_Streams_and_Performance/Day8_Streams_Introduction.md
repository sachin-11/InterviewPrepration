# Day 8 — Streams Introduction

Streams = Data ko chunks mein process karo — memory efficient, fast.

---

## 1. Stream Kya Hota Hai?

### Problem without Streams:
```javascript
// BAD — Poori file memory mein load karo
const data = fs.readFileSync('large-file.txt'); // 1GB file → 1GB RAM!
console.log(data.toString());

// 1GB file ke liye 1GB+ RAM chahiye
// Server crash ho sakta hai
```

### Solution with Streams:
```javascript
// GOOD — Chunks mein process karo
const stream = fs.createReadStream('large-file.txt');
stream.on('data', (chunk) => {
  console.log(chunk.toString()); // 64KB at a time
});

// 1GB file ke liye sirf ~64KB RAM!
// Memory constant rehti hai
```

### Analogy:
```
Without stream: Poori bucket paani ek baar mein uthao (heavy!)
With stream:    Pipe se paani flow karo (easy, continuous)

YouTube video:
  Without stream: Poori video download karo, phir play karo
  With stream:    Chunks download hote hain, simultaneously play hota hai
```

---

## 2. 4 Types of Streams

### Type 1: Readable
```
Data source se read karo
Examples: fs.createReadStream, http.IncomingMessage, process.stdin

Events: data, end, error, close
```

### Type 2: Writable
```
Data destination mein write karo
Examples: fs.createWriteStream, http.ServerResponse, process.stdout

Events: drain, finish, error
Methods: write(), end()
```

### Type 3: Duplex
```
Both readable AND writable
Examples: net.Socket, TCP connections

Read aur write simultaneously
```

### Type 4: Transform
```
Data modify karte hue pass karo
Examples: zlib.createGzip, crypto.createCipher

Input → Transform → Output
```

---

## 3. Buffer vs Stream

```
Buffer:
  Poora data memory mein store karo
  Process karo
  
  [████████████████████] ← Poori file load
  Process karo
  
  Memory: File size ke barabar
  Latency: Poori file load hone ka wait

Stream:
  Chunks mein process karo
  
  [████] → Process → [████] → Process → ...
  
  Memory: Chunk size (64KB default)
  Latency: Pehla chunk aate hi process shuru
```

### Comparison:
```
File Size    Buffer RAM    Stream RAM
──────────   ──────────    ──────────
1 MB         1 MB          64 KB
100 MB       100 MB        64 KB
1 GB         1 GB          64 KB
10 GB        CRASH!        64 KB
```

---

## 4. Backpressure

### Kya hota hai:
```
Problem: Reader fast, Writer slow
  Reader: 1GB/sec data produce karta hai
  Writer: 100MB/sec data consume karta hai
  
  Buffer overflow → Memory leak → Crash!

Backpressure = Writer ka "slow down!" signal
```

### Code:
```javascript
const readable = fs.createReadStream('large.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);

  if (!canContinue) {
    // Writer busy hai — pause karo!
    readable.pause();
    console.log('Paused reading');
  }
});

writable.on('drain', () => {
  // Writer ready hai — resume karo!
  readable.resume();
  console.log('Resumed reading');
});

readable.on('end', () => writable.end());
```

### pipe() automatically handles backpressure:
```javascript
// pipe() = backpressure automatic!
fs.createReadStream('large.txt')
  .pipe(fs.createWriteStream('output.txt'));
// No manual pause/resume needed
```

---

## 5. Stream Modes

### Flowing Mode:
```javascript
// Data automatically flow karta hai
const stream = fs.createReadStream('file.txt');
stream.on('data', (chunk) => {
  // Automatically called as data arrives
  console.log(chunk.length);
});
// Flowing mode: on('data') add karne se start hota hai
```

### Paused Mode:
```javascript
// Manual read karo
const stream = fs.createReadStream('file.txt');

stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read()) !== null) {
    console.log(chunk.length);
  }
});
// Paused mode: read() manually call karo
```

---

## 6. Practical Example — Memory Comparison

```javascript
import fs from 'fs';
import { performance } from 'perf_hooks';

// Create a large test file first
// node -e "require('fs').writeFileSync('test.txt', 'Hello World\n'.repeat(100000))"

// Method 1: Buffer (readFileSync)
function readWithBuffer(path) {
  const start  = performance.now();
  const before = process.memoryUsage().heapUsed;

  const data = fs.readFileSync(path);
  const lines = data.toString().split('\n').length;

  const after = process.memoryUsage().heapUsed;
  const time  = performance.now() - start;

  console.log(`Buffer: ${time.toFixed(0)}ms | RAM: ${((after-before)/1024/1024).toFixed(1)}MB | Lines: ${lines}`);
}

// Method 2: Stream
async function readWithStream(path) {
  const start  = performance.now();
  const before = process.memoryUsage().heapUsed;

  let lines = 0;
  const stream = fs.createReadStream(path, { encoding: 'utf8' });

  for await (const chunk of stream) {
    lines += chunk.split('\n').length;
  }

  const after = process.memoryUsage().heapUsed;
  const time  = performance.now() - start;

  console.log(`Stream: ${time.toFixed(0)}ms | RAM: ${((after-before)/1024/1024).toFixed(1)}MB | Lines: ${lines}`);
}

readWithBuffer('./test.txt');
await readWithStream('./test.txt');

// Expected:
// Buffer: 50ms  | RAM: 12.5MB | Lines: 100001
// Stream: 30ms  | RAM: 0.5MB  | Lines: 100001
```

---

## 7. Quick Summary

```
Stream types:
  Readable  → Source (file read, HTTP request)
  Writable  → Destination (file write, HTTP response)
  Duplex    → Both (TCP socket)
  Transform → Modify data (compression, encryption)

Key concepts:
  Buffer    → All data in memory (simple but heavy)
  Stream    → Chunks in memory (efficient, scalable)
  Backpressure → Slow down signal (pipe() handles automatically)
  pipe()    → Connect streams + handle backpressure

Use streams when:
  ✓ Large files (> 10MB)
  ✓ Real-time data processing
  ✓ HTTP request/response
  ✓ Memory-constrained environments
```

---

## 8. Practice Tasks (Aaj Karo)

### Task 1: Create Test File
```bash
node -e "require('fs').writeFileSync('test.txt', 'Hello World\n'.repeat(100000))"
```

### Task 2: Buffer vs Stream Compare
```javascript
// Upar wala memory comparison code run karo
// RAM difference observe karo
```

### Task 3: Basic Stream
```javascript
// test.txt ko stream se read karo
// Har chunk ka size print karo
// Total chunks count karo
const stream = fs.createReadStream('test.txt');
let chunks = 0;
stream.on('data', (chunk) => {
  chunks++;
  console.log(`Chunk ${chunks}: ${chunk.length} bytes`);
});
stream.on('end', () => console.log(`Total chunks: ${chunks}`));
```

---

Kal Day 9 mein Readable & Writable Streams detail mein dekhenge —
pipe(), events, file copy with streams.
