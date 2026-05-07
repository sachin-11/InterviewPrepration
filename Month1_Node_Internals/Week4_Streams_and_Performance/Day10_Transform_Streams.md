# Day 10 — Transform Streams

Data modify karte hue pass karo — compression, encryption, parsing.

---

## 1. Transform Stream Kya Hai?

```
Readable + Writable = Duplex
Duplex + Data modification = Transform

Input → [Transform] → Output
  (modify, compress, encrypt, parse)

Examples:
  zlib.createGzip()    → Compress data
  crypto.createCipher  → Encrypt data
  CSV parser           → Text → Objects
```

---

## 2. Custom Transform Stream

```javascript
import { Transform } from 'stream';

// Uppercase transform
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const upper = chunk.toString().toUpperCase();
    this.push(upper);  // Output mein push karo
    callback();        // Done processing this chunk
  }

  _flush(callback) {
    // Stream end hone pe kuch extra push karna ho toh
    this.push('\n--- END ---\n');
    callback();
  }
}

// Usage
import fs from 'fs';
import { pipeline } from 'stream/promises';

await pipeline(
  fs.createReadStream('input.txt'),
  new UpperCaseTransform(),
  fs.createWriteStream('output.txt')
);
```

---

## 3. zlib — Compression

```javascript
import fs from 'fs';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';

// Compress
async function compress(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),
    fs.createWriteStream(output + '.gz')
  );
  console.log('Compressed!');
}

// Decompress
async function decompress(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGunzip(),
    fs.createWriteStream(output)
  );
  console.log('Decompressed!');
}

await compress('large.txt', 'large.txt');
await decompress('large.txt.gz', 'restored.txt');
```

---

## 4. CSV Parser Transform

```javascript
import { Transform } from 'stream';

class CSVParser extends Transform {
  constructor() {
    super({ objectMode: true }); // Objects output karenge
    this.headers  = null;
    this.buffer   = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines  = this.buffer.split('\n');
    this.buffer  = lines.pop(); // Incomplete line save karo

    lines.forEach(line => {
      if (!line.trim()) return;
      const values = line.split(',').map(v => v.trim());

      if (!this.headers) {
        this.headers = values; // First line = headers
      } else {
        const obj = {};
        this.headers.forEach((h, i) => obj[h] = values[i]);
        this.push(obj); // Object push karo
      }
    });

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim()) {
      const values = this.buffer.split(',').map(v => v.trim());
      const obj    = {};
      this.headers?.forEach((h, i) => obj[h] = values[i]);
      this.push(obj);
    }
    callback();
  }
}

// Usage
import fs from 'fs';

const parser = new CSVParser();
fs.createReadStream('data.csv').pipe(parser);

parser.on('data', (row) => {
  console.log(row); // { name: 'John', age: '25', city: 'Mumbai' }
});
```

---

## 5. Pipeline API — Production Ready

```javascript
import { pipeline } from 'stream/promises';
import fs from 'fs';
import zlib from 'zlib';
import { Transform } from 'stream';

// Multiple transforms chain karo
async function processLargeFile(input, output) {
  const filterTransform = new Transform({
    transform(chunk, enc, cb) {
      // Sirf lines jo "ERROR" contain karte hain
      const filtered = chunk.toString()
        .split('\n')
        .filter(line => line.includes('ERROR'))
        .join('\n');
      if (filtered) this.push(filtered + '\n');
      cb();
    }
  });

  await pipeline(
    fs.createReadStream(input),
    filterTransform,          // Filter
    zlib.createGzip(),        // Compress
    fs.createWriteStream(output + '.gz')
  );

  console.log('Processed and compressed!');
}

await processLargeFile('server.log', 'errors.log');
```

---

## 6. Quick Summary

```
Transform stream:
  _transform(chunk, encoding, callback) → Process chunk
  _flush(callback)                      → End mein cleanup
  this.push(data)                       → Output mein send
  callback()                            → Done signal

Common transforms:
  zlib.createGzip()    → Compress
  zlib.createGunzip()  → Decompress
  crypto.createCipher  → Encrypt
  Custom CSV/JSON      → Parse

pipeline() vs pipe():
  pipe()     → No error propagation
  pipeline() → Proper error handling (use this!)
```

---

## 7. Practice Tasks

### Task 1: Compress + Decompress
```bash
# Test file banao
node -e "require('fs').writeFileSync('test.txt', 'Hello\n'.repeat(10000))"
```
```javascript
// Compress karo → Size compare karo
// Decompress karo → Original se match karo
```

### Task 2: CSV Parser
```javascript
// CSV file banao:
// name,age,city
// John,25,Mumbai
// Jane,30,Delhi

// CSVParser implement karo
// Objects print karo
```

### Task 3: Log Filter
```javascript
// server.log file banao with mix of INFO/ERROR lines
// Sirf ERROR lines filter karo using Transform
// Output file mein save karo
```

---

Kal Day 11 mein Performance Optimization dekhenge —
Clustering, PM2, caching strategies.
