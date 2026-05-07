# Day 9 — Readable & Writable Streams

Streams practically use karna — file operations, pipe(), events.

---

## 1. Readable Stream

```javascript
import fs from 'fs';

// Create readable stream
const readable = fs.createReadStream('large-file.txt', {
  encoding:  'utf8',    // String chunks (default: Buffer)
  highWaterMark: 64 * 1024  // Chunk size: 64KB (default)
});

// Events
readable.on('data',  (chunk) => console.log(`Chunk: ${chunk.length} chars`));
readable.on('end',   ()      => console.log('Done reading'));
readable.on('error', (err)   => console.error('Error:', err.message));
readable.on('close', ()      => console.log('Stream closed'));
```

### for await...of (Modern way):
```javascript
async function readFile(path) {
  const stream = fs.createReadStream(path, { encoding: 'utf8' });
  let content  = '';

  for await (const chunk of stream) {
    content += chunk;
  }

  return content;
}
```

---

## 2. Writable Stream

```javascript
const writable = fs.createWriteStream('output.txt', {
  encoding: 'utf8',
  flags:    'w'  // 'w' = overwrite, 'a' = append
});

// write() returns false if buffer full (backpressure)
const ok = writable.write('Hello World\n');
console.log('Can continue:', ok); // true or false

// end() — writing complete
writable.end('Final line\n', () => {
  console.log('File written!');
});

// Events
writable.on('finish', () => console.log('All data flushed'));
writable.on('drain',  () => console.log('Buffer drained, can write more'));
writable.on('error',  (err) => console.error(err));
```

---

## 3. pipe() — Connect Streams

```javascript
// Simple file copy
fs.createReadStream('source.txt')
  .pipe(fs.createWriteStream('destination.txt'));

// pipe() automatically:
// ✓ Handles backpressure
// ✓ Ends writable when readable ends
// ✓ Passes data chunks

// Multiple pipes (chain)
fs.createReadStream('input.txt')
  .pipe(someTransformStream)
  .pipe(fs.createWriteStream('output.txt'));
```

---

## 4. pipeline() — Better than pipe()

```javascript
import { pipeline } from 'stream/promises';
import fs from 'fs';
import zlib from 'zlib';

// pipeline() = pipe() + proper error handling
async function compressFile(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),
    fs.createWriteStream(output)
  );
  console.log('Compressed!');
}

await compressFile('large.txt', 'large.txt.gz');
```

---

## 5. Custom Readable Stream

```javascript
import { Readable } from 'stream';

class NumberStream extends Readable {
  constructor(max) {
    super({ objectMode: true }); // Objects push kar sakte hain
    this.current = 1;
    this.max     = max;
  }

  _read() {
    if (this.current <= this.max) {
      this.push(this.current++);
    } else {
      this.push(null); // null = stream end
    }
  }
}

const numbers = new NumberStream(5);
numbers.on('data', (num) => console.log(num)); // 1, 2, 3, 4, 5
numbers.on('end',  ()    => console.log('Done'));
```

---

## 6. Custom Writable Stream

```javascript
import { Writable } from 'stream';

class LogStream extends Writable {
  constructor() {
    super({ objectMode: true });
    this.logs = [];
  }

  _write(chunk, encoding, callback) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      message:   chunk.toString()
    });
    callback(); // Must call callback when done!
  }

  getLogs() { return this.logs; }
}

const logger = new LogStream();
logger.write('Server started');
logger.write('Request received');
logger.end(() => {
  console.log(logger.getLogs());
});
```

---

## 7. Practical: File Copy with Progress

```javascript
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

async function copyWithProgress(src, dest) {
  const stats    = fs.statSync(src);
  const total    = stats.size;
  let   copied   = 0;

  // Progress transform stream
  const progress = new Transform({
    transform(chunk, encoding, callback) {
      copied += chunk.length;
      const percent = ((copied / total) * 100).toFixed(1);
      process.stdout.write(`\rCopying: ${percent}%`);
      callback(null, chunk); // Pass chunk through unchanged
    }
  });

  await pipeline(
    fs.createReadStream(src),
    progress,
    fs.createWriteStream(dest)
  );

  console.log(`\nCopied: ${(total / 1024 / 1024).toFixed(1)}MB`);
}

await copyWithProgress('large-file.txt', 'copy.txt');
```

---

## 8. Quick Summary

```
Readable:
  createReadStream(path, options)
  Events: data, end, error
  for await...of (modern)

Writable:
  createWriteStream(path, options)
  write(chunk) → false if backpressure
  end() → finish writing
  Events: finish, drain, error

pipe():
  readable.pipe(writable)
  Auto backpressure handling
  Chain multiple streams

pipeline():
  Better error handling than pipe()
  Use for production code
  import { pipeline } from 'stream/promises'
```

---

## 9. Practice Tasks

### Task 1: File Copy
```javascript
// source.txt → destination.txt copy karo using streams
// Time measure karo
```

### Task 2: Line Counter
```javascript
// Large file mein lines count karo using streams
// Memory usage compare karo (stream vs readFileSync)
```

### Task 3: Progress Bar
```javascript
// copyWithProgress() implement karo
// 10MB+ file copy karo
// Progress % dikhao
```

---

Kal Day 10 mein Transform Streams dekhenge —
Data modify karte hue pass karna, compression, pipeline.
