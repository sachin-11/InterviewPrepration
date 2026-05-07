# Day 9 — Pinecone Advanced Features

Aaj Pinecone ke advanced features dekhenge —
batch upsert, complex filters, namespaces, aur stats.

---

## 1. Batch Upsert — 100 Vectors at Once

### Kyu Batch?
```
One by one upsert:
  100 docs × 1 API call = 100 API calls → Slow!

Batch upsert:
  100 docs → 1 API call → Fast!

Pinecone limit: 100 vectors per batch (recommended)
```

### Code:
```javascript
// Batch upsert helper
async function batchUpsert(index, vectors, batchSize = 100) {
  let upserted = 0;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${vectors.length}`);
  }

  return upserted;
}

// 100 docs embed + batch upsert
const docs = Array.from({ length: 100 }, (_, i) => ({
  id:   `doc-${i + 1}`,
  text: `Programming fact number ${i + 1} about Node.js and JavaScript`,
  category: i % 2 === 0 ? "nodejs" : "javascript",
  difficulty: ["beginner", "intermediate", "advanced"][i % 3]
}));

console.log("Embedding 100 docs...");
const vectors = await Promise.all(docs.map(async (doc) => ({
  id:       doc.id,
  values:   await embed(doc.text),
  metadata: { text: doc.text, category: doc.category, difficulty: doc.difficulty }
})));

await batchUpsert(index, vectors, 50); // 50 per batch
```

---

## 2. Metadata Filtering — Advanced

### Available Operators:
```javascript
// Equality
{ category: { "$eq": "nodejs" } }

// Not equal
{ category: { "$ne": "security" } }

// Greater than / Less than
{ score: { "$gt": 0.5 } }
{ score: { "$gte": 0.5 } }
{ score: { "$lt": 0.8 } }
{ score: { "$lte": 0.8 } }

// In array
{ category: { "$in": ["nodejs", "javascript"] } }

// Not in array
{ category: { "$nin": ["security"] } }

// AND condition
{
  "$and": [
    { category: { "$eq": "nodejs" } },
    { difficulty: { "$eq": "beginner" } }
  ]
}

// OR condition
{
  "$or": [
    { category: { "$eq": "nodejs" } },
    { category: { "$eq": "javascript" } }
  ]
}
```

### Practical Examples:
```javascript
// Beginner nodejs docs
const r1 = await index.query({
  vector:          queryVec,
  topK:            5,
  includeMetadata: true,
  filter: {
    "$and": [
      { category:   { "$eq": "nodejs" } },
      { difficulty: { "$eq": "beginner" } }
    ]
  }
});

// Multiple categories
const r2 = await index.query({
  vector:          queryVec,
  topK:            5,
  includeMetadata: true,
  filter: {
    category: { "$in": ["nodejs", "javascript"] }
  }
});

// Exclude security docs
const r3 = await index.query({
  vector:          queryVec,
  topK:            5,
  includeMetadata: true,
  filter: {
    category: { "$nin": ["security"] }
  }
});
```

---

## 3. Namespaces — Data Isolation

### Kya hota hai:
```
Ek index mein multiple isolated spaces

Use cases:
  - Multi-tenant apps (har user ka apna namespace)
  - Multiple projects ek index mein
  - Dev/staging/prod separation
  - Language-based separation (en, hi, fr)
```

### Code:
```javascript
// Namespace-specific index reference
const nodejsNS  = index.namespace("nodejs-docs");
const securityNS = index.namespace("security-docs");

// Upsert in specific namespace
await nodejsNS.upsert([
  { id: "n1", values: await embed("Node.js event loop"), metadata: { text: "..." } }
]);

await securityNS.upsert([
  { id: "s1", values: await embed("JWT authentication"), metadata: { text: "..." } }
]);

// Query only nodejs namespace
const nodejsResults = await nodejsNS.query({
  vector:          queryVec,
  topK:            3,
  includeMetadata: true
});

// Query only security namespace
const secResults = await securityNS.query({
  vector:          queryVec,
  topK:            3,
  includeMetadata: true
});

// Stats per namespace
const stats = await index.describeIndexStats();
console.log("Namespaces:", stats.namespaces);
// { "nodejs-docs": { recordCount: 5 }, "security-docs": { recordCount: 3 } }

// Delete entire namespace
await nodejsNS.deleteAll();
```

---

## 4. Update Vectors

```javascript
// Update metadata only (no re-embedding needed)
await index.update({
  id:       "doc-1",
  metadata: { category: "updated", difficulty: "advanced" }
});

// Update values (re-embed karo)
const newText = "Updated: Node.js runs on Google's V8 engine";
await index.update({
  id:     "doc-1",
  values: await embed(newText),
  metadata: { text: newText, category: "nodejs" }
});
```

---

## 5. Index Stats & Management

```javascript
// Detailed stats
const stats = await index.describeIndexStats();
console.log({
  totalVectors:  stats.totalRecordCount,
  dimension:     stats.dimension,
  namespaces:    stats.namespaces,
  indexFullness: stats.indexFullness  // 0-1 (1 = full)
});

// List all indexes
const indexes = await pc.listIndexes();
indexes.indexes.forEach(idx => {
  console.log(`${idx.name}: ${idx.dimension}d, ${idx.metric}, ${idx.status.state}`);
});

// Describe specific index
const desc = await pc.describeIndex("learning-index");
console.log(desc);

// Delete index (careful!)
// await pc.deleteIndex("old-index");
```

---

## 6. Complete Practice File

```javascript
// day9_pinecone_advanced.js
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const index  = pc.index("learning-index");

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

async function search(query, topK = 3, filter = null, namespace = null) {
  const idx    = namespace ? index.namespace(namespace) : index;
  const qVec   = await embed(query);
  const params = { vector: qVec, topK, includeMetadata: true };
  if (filter) params.filter = filter;

  const results = await idx.query(params);
  console.log(`\nQuery: "${query}"${filter ? ` [filtered]` : ''}${namespace ? ` [ns:${namespace}]` : ''}`);
  console.log("─".repeat(60));

  if (results.matches.length === 0) {
    console.log("  No results");
    return;
  }

  results.matches.forEach((m, i) => {
    const cat  = m.metadata?.category || "?";
    const diff = m.metadata?.difficulty || "?";
    console.log(`${i+1}. [${m.score.toFixed(3)}] [${cat}/${diff}] ${m.metadata?.text?.slice(0, 55)}...`);
  });
}

// ─── Test 1: Basic queries ───────────────────────────────
console.log("=== BASIC QUERIES ===");
await search("How does Node.js handle requests?");
await search("How to secure an API?");

// ─── Test 2: Filtered queries ────────────────────────────
console.log("\n=== FILTERED QUERIES ===");
await search("Best practices", 3, { category: { "$eq": "nodejs" } });
await search("Best practices", 3, { difficulty: { "$eq": "beginner" } });
await search("Best practices", 3, {
  "$and": [
    { category:   { "$eq": "security" } },
    { difficulty: { "$ne": "advanced" } }
  ]
});

// ─── Test 3: Namespaces ──────────────────────────────────
console.log("\n=== NAMESPACES ===");

// Add to namespaces
const nsVectors = [
  { id: "ns-1", values: await embed("Node.js event loop basics"),    metadata: { text: "Event loop", topic: "nodejs" } },
  { id: "ns-2", values: await embed("Express middleware pattern"),   metadata: { text: "Middleware", topic: "nodejs" } },
  { id: "ns-3", values: await embed("JWT token authentication"),     metadata: { text: "JWT auth",   topic: "security" } },
];

await index.namespace("nodejs-ns").upsert(nsVectors.slice(0, 2));
await index.namespace("security-ns").upsert(nsVectors.slice(2));

console.log("Namespaces created");

await search("How to handle requests?", 2, null, "nodejs-ns");
await search("How to authenticate?",    2, null, "security-ns");

// ─── Stats ───────────────────────────────────────────────
console.log("\n=== INDEX STATS ===");
const stats = await index.describeIndexStats();
console.log(`Total vectors: ${stats.totalRecordCount}`);
console.log(`Namespaces:`, Object.keys(stats.namespaces || {}));
```

---

## 7. Quick Summary

```
Batch upsert:
  100 vectors per batch → Fast ingestion
  batchSize = 100 (Pinecone recommended)

Metadata filters:
  $eq, $ne, $gt, $gte, $lt, $lte
  $in, $nin (array)
  $and, $or (combine)

Namespaces:
  index.namespace("name") → Isolated space
  Multi-tenant, multi-project
  deleteAll() → Clear namespace

Update:
  index.update({ id, metadata }) → Metadata only
  index.update({ id, values, metadata }) → Full update

Stats:
  describeIndexStats() → Count, namespaces, fullness
```

---

## 8. Practice Tasks

### Task 1: Batch Upsert
```javascript
// 50 docs batch upsert karo
// batchSize = 25 use karo
// Stats check karo before + after
```

### Task 2: Complex Filter
```javascript
// Ye filter implement karo:
// category IN [nodejs, javascript] AND difficulty = beginner
// Query: "How to write clean code?"
```

### Task 3: Namespaces
```javascript
// 3 namespaces banao: "frontend", "backend", "database"
// Har mein 3 docs add karo
// Alag alag query karo
// Stats mein namespaces dekho
```

---

Kal Day 10 mein Weaviate dekhenge —
Graph + Vector DB, schema-based approach.
