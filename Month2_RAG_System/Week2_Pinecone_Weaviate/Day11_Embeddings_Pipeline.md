# Day 11 — Embeddings Pipeline

Production mein documents efficiently embed karna —
batch processing, caching, aur rate limiting.

---

## 1. Problem with Naive Embedding

```javascript
// NAIVE approach — problems hain
const docs = loadDocuments(); // 1000 documents

// Problem 1: One by one — SLOW
for (const doc of docs) {
  const embedding = await embed(doc.text); // 1000 API calls!
}

// Problem 2: No caching — same text dobara embed hota hai
const e1 = await embed("Node.js is great"); // API call
const e2 = await embed("Node.js is great"); // Same text! Waste!

// Problem 3: Rate limit hit
// Ollama: ~10 req/sec
// 1000 docs → 100 seconds!
```

---

## 2. Batch Embedding

```javascript
// Batch mein embed karo — faster
async function batchEmbed(texts, batchSize = 10) {
  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Batch parallel embed karo
    const embeddings = await Promise.all(
      batch.map(text => embed(text))
    );

    results.push(...embeddings);
    console.log(`Progress: ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
  }

  return results;
}

// Usage
const texts = docs.map(d => d.text);
const embeddings = await batchEmbed(texts, 10); // 10 at a time
```

### Speed Comparison:
```
Sequential (1 by 1):  100 docs × 100ms = 10 seconds
Batch (10 at a time): 10 batches × 100ms = 1 second (10x faster!)
Batch (50 at a time): 2 batches × 100ms = 200ms (50x faster!)
```

---

## 3. Embedding Cache

```javascript
import fs from 'fs/promises';
import crypto from 'crypto';

class EmbeddingCache {
  constructor(cacheFile = './embedding-cache.json') {
    this.cacheFile = cacheFile;
    this.cache     = {};
  }

  // Cache file se load karo
  async load() {
    try {
      const data  = await fs.readFile(this.cacheFile, 'utf-8');
      this.cache  = JSON.parse(data);
      console.log(`Cache loaded: ${Object.keys(this.cache).length} entries`);
    } catch {
      this.cache = {}; // Fresh cache
    }
  }

  // Cache file mein save karo
  async save() {
    await fs.writeFile(this.cacheFile, JSON.stringify(this.cache));
  }

  // Text ka hash key banao
  key(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  // Cache se get ya embed karo
  async getOrEmbed(text, embedFn) {
    const k = this.key(text);

    if (this.cache[k]) {
      return this.cache[k]; // Cache hit!
    }

    // Cache miss — embed karo
    const embedding  = await embedFn(text);
    this.cache[k]    = embedding;
    return embedding;
  }
}

// Usage
const cache = new EmbeddingCache('./embedding-cache.json');
await cache.load();

// Same text dobara embed nahi hoga
const e1 = await cache.getOrEmbed("Node.js is great", embed); // API call
const e2 = await cache.getOrEmbed("Node.js is great", embed); // Cache hit!

await cache.save();
```

---

## 4. Rate Limiting

```javascript
// Ollama ya OpenAI rate limit handle karo
class RateLimiter {
  constructor(requestsPerSecond = 5) {
    this.rps      = requestsPerSecond;
    this.interval = 1000 / requestsPerSecond; // ms between requests
    this.lastCall = 0;
  }

  async wait() {
    const now     = Date.now();
    const elapsed = now - this.lastCall;
    const wait    = this.interval - elapsed;

    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait));
    }

    this.lastCall = Date.now();
  }
}

// Usage
const limiter = new RateLimiter(5); // 5 requests/second

async function rateLimitedEmbed(text) {
  await limiter.wait();
  return embed(text);
}
```

---

## 5. Complete Pipeline

```javascript
// pipeline.js — Production-ready embedding pipeline
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs/promises';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// ─── Embed function ──────────────────────────────────────
async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// ─── Cache ───────────────────────────────────────────────
const CACHE_FILE = './embedding-cache.json';
let cache = {};

async function loadCache() {
  try {
    cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
    console.log(`Cache: ${Object.keys(cache).length} entries loaded`);
  } catch { cache = {}; }
}

async function saveCache() {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache));
}

function cacheKey(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

async function cachedEmbed(text) {
  const k = cacheKey(text);
  if (cache[k]) return cache[k];
  const embedding = await embed(text);
  cache[k] = embedding;
  return embedding;
}

// ─── Rate limiter ────────────────────────────────────────
let lastCall = 0;
async function rateLimitedEmbed(text, rps = 8) {
  const interval = 1000 / rps;
  const wait     = interval - (Date.now() - lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
  return cachedEmbed(text);
}

// ─── Batch pipeline ──────────────────────────────────────
async function runPipeline(documents, indexName, batchSize = 10) {
  await loadCache();

  const index = pc.index(indexName);
  let processed = 0;
  let cached    = 0;
  let apiCalls  = 0;

  console.log(`\nProcessing ${documents.length} documents...`);
  const startTime = Date.now();

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    const vectors = await Promise.all(batch.map(async (doc) => {
      const k = cacheKey(doc.text);
      const wasCached = !!cache[k];

      const values = await rateLimitedEmbed(doc.text);

      if (wasCached) cached++;
      else apiCalls++;

      return {
        id:       doc.id,
        values,
        metadata: { text: doc.text, ...doc.metadata }
      };
    }));

    await index.upsert(vectors);
    processed += batch.length;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  [${elapsed}s] ${processed}/${documents.length} | cache hits: ${cached} | api calls: ${apiCalls}`);
  }

  await saveCache();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Pipeline complete in ${totalTime}s`);
  console.log(`  Cache hits: ${cached} (saved ${cached} API calls)`);
  console.log(`  API calls:  ${apiCalls}`);

  return { processed, cached, apiCalls };
}

// ─── Test ────────────────────────────────────────────────
const testDocs = Array.from({ length: 20 }, (_, i) => ({
  id:       `pipeline-${i + 1}`,
  text:     `Programming concept ${i + 1}: ${["Node.js", "JavaScript", "Python", "React", "SQL"][i % 5]} best practices`,
  metadata: { category: "programming", index: i }
}));

await runPipeline(testDocs, "learning-index", 5);

// Run again — cache hits dikhenge!
console.log("\n--- Running again (should use cache) ---");
await runPipeline(testDocs, "learning-index", 5);
```

---

## 6. Pipeline Stats

```javascript
// Kitna time + cost save hua?
function pipelineStats(docs, cached, apiCalls, msPerCall = 100) {
  const timeSaved  = cached * msPerCall;
  const timeSpent  = apiCalls * msPerCall;
  const costSaved  = (cached / 1_000_000) * 0.02; // OpenAI pricing

  console.log(`\nPipeline Stats:`);
  console.log(`  Total docs:   ${docs}`);
  console.log(`  Cache hits:   ${cached} (${((cached/docs)*100).toFixed(0)}%)`);
  console.log(`  API calls:    ${apiCalls}`);
  console.log(`  Time saved:   ${timeSaved}ms`);
  console.log(`  Cost saved:   $${costSaved.toFixed(4)}`);
}
```

---

## 7. Quick Summary

```
Batch embedding:
  10 at a time → 10x faster than sequential
  batchSize = 10-50 (sweet spot)

Caching:
  MD5 hash of text → Cache key
  Same text → No API call
  Persist to JSON file

Rate limiting:
  Ollama: ~8-10 req/sec
  OpenAI: 3000 req/min (paid)
  Wait between calls to avoid errors

Pipeline order:
  Load cache → Batch embed (cached) → Upsert → Save cache
```

---

## 8. Practice Tasks

### Task 1: Cache Test
```javascript
// 10 docs embed karo
// Same 10 docs dobara embed karo
// Cache hits count karo
// Time difference measure karo
```

### Task 2: Batch Size Experiment
```javascript
// Same 50 docs, different batch sizes:
// batchSize = 1  → Time?
// batchSize = 10 → Time?
// batchSize = 50 → Time?
// Kaunsa fastest?
```

### Task 3: Full Pipeline
```javascript
// runPipeline() implement karo
// 30 docs process karo
// Stats print karo
// Dobara run karo — cache hits dekho
```

---

Kal Day 12 mein RAG Pipeline banayenge —
Query → Embed → Search → Context → LLM → Answer.
