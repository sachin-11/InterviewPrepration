# Day 14 — Week 4 Revision + Final Project

---

## 1. Week 4 Recap

```
Day 8:  Streams — Buffer vs Stream, 4 types, backpressure
Day 9:  Readable/Writable — pipe(), pipeline(), events
Day 10: Transform — Custom transform, zlib, CSV parser
Day 11: Performance — Clustering, PM2, caching
Day 12: HTTP — Compression, keep-alive, load testing
Day 13: Memory — GC, leak patterns, detection
```

---

## 2. Self Quiz

```
Q1. Stream use karne ka main fayda kya hai?
Q2. pipe() aur pipeline() mein kya fark hai?
Q3. Transform stream mein _transform() mein callback() kyun call karte hain?
Q4. Clustering se performance kyun improve hoti hai?
Q5. Memory leak ke 3 common patterns kaunse hain?

Answers:
A1. Memory efficient — poori file load nahi hoti, chunks mein process
A2. pipe() = no error propagation | pipeline() = proper error handling
A3. Callback = "chunk processing done, next chunk bhejo" signal
A4. Multiple CPU cores use hote hain (default sirf 1 core)
A5. Global variables, event listener leak, cache without limit
```

---

## 3. Final Project: High-Performance File Processor

### Features:
```
✓ Large CSV file stream karo (memory efficient)
✓ Transform: filter + uppercase
✓ Compress output (gzip)
✓ Memory + time metrics
✓ Progress bar
```

### Project Code:

```javascript
// file-processor.js
import fs from 'fs';
import zlib from 'zlib';
import { Transform, pipeline as pipelineCb } from 'stream';
import { promisify } from 'util';
import { performance } from 'perf_hooks';

const pipeline = promisify(pipelineCb);

// ─── Create test CSV ─────────────────────────────────────
function createTestCSV(path, rows = 100000) {
  const ws = fs.createWriteStream(path);
  ws.write('id,name,age,city,status\n');
  const cities   = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'];
  const statuses = ['active', 'inactive', 'pending'];

  for (let i = 1; i <= rows; i++) {
    const city   = cities[i % cities.length];
    const status = statuses[i % statuses.length];
    ws.write(`${i},User${i},${20 + (i % 40)},${city},${status}\n`);
  }
  ws.end();
  return new Promise(r => ws.on('finish', r));
}

// ─── Filter Transform ────────────────────────────────────
class FilterTransform extends Transform {
  constructor(filterFn) {
    super();
    this.filterFn = filterFn;
    this.headers  = null;
    this.buffer   = '';
    this.kept     = 0;
    this.total    = 0;
  }

  _transform(chunk, enc, cb) {
    this.buffer += chunk.toString();
    const lines  = this.buffer.split('\n');
    this.buffer  = lines.pop();

    lines.forEach(line => {
      if (!line.trim()) return;
      if (!this.headers) { this.headers = line; this.push(line + '\n'); return; }
      this.total++;
      if (this.filterFn(line)) { this.kept++; this.push(line + '\n'); }
    });
    cb();
  }

  _flush(cb) {
    if (this.buffer.trim() && this.filterFn(this.buffer)) {
      this.push(this.buffer + '\n');
    }
    cb();
  }
}

// ─── Progress Transform ──────────────────────────────────
class ProgressTransform extends Transform {
  constructor(totalSize) {
    super();
    this.totalSize = totalSize;
    this.processed = 0;
  }

  _transform(chunk, enc, cb) {
    this.processed += chunk.length;
    const pct = ((this.processed / this.totalSize) * 100).toFixed(1);
    process.stdout.write(`\rProcessing: ${pct}%`);
    this.push(chunk);
    cb();
  }
}

// ─── Main ────────────────────────────────────────────────
async function processFile(input, output) {
  console.log('Creating test CSV...');
  await createTestCSV(input, 100000);

  const stats     = fs.statSync(input);
  const startMem  = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  console.log(`\nProcessing: ${(stats.size / 1024 / 1024).toFixed(1)}MB file`);

  const filter   = new FilterTransform(line => line.includes('active'));
  const progress = new ProgressTransform(stats.size);

  await pipeline(
    fs.createReadStream(input),
    progress,
    filter,
    zlib.createGzip(),
    fs.createWriteStream(output)
  );

  const endTime = performance.now();
  const endMem  = process.memoryUsage().heapUsed;
  const outSize = fs.statSync(output).size;

  console.log('\n\n=== Results ===');
  console.log(`Input:       ${(stats.size   / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Output:      ${(outSize      / 1024 / 1024).toFixed(2)}MB (compressed)`);
  console.log(`Compression: ${((1 - outSize/stats.size) * 100).toFixed(0)}%`);
  console.log(`Rows kept:   ${filter.kept}/${filter.total}`);
  console.log(`Time:        ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`RAM used:    ${((endMem - startMem) / 1024 / 1024).toFixed(1)}MB`);
}

await processFile('./data.csv', './output.csv.gz');
```

### Run:
```bash
node file-processor.js
```

### Expected Output:
```
Creating test CSV...
Processing: 6.5MB file
Processing: 100%

=== Results ===
Input:       6.5MB
Output:      0.12MB (compressed)
Compression: 98%
Rows kept:   66667/100000
Time:        1.23s
RAM used:    2.1MB  ← Very low! (stream magic)
```

---

## 4. Score Yourself

```
Week 4 complete:
  □ Stream vs Buffer difference samajh aaye
  □ pipe() aur pipeline() use kar sako
  □ Custom Transform stream likh sako
  □ Clustering implement kar sako
  □ Memory leak detect + fix kar sako
  □ Final project run ho raha ho

Score:
  6/6 → Month 2 ke liye ready
  4-5 → Weak areas review karo
  < 4 → Day 8-10 dobara padho
```

---

Month 1 Node Internals complete!
Next: Month 2 RAG System ya koi aur topic.
