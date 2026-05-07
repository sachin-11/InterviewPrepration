# Day 10 — Weaviate Intro

Weaviate = Vector DB + Graph DB combined.
Pinecone se alag — schema-based, self-hosted ya cloud.

---

## 1. Weaviate vs Pinecone

```
Feature          Pinecone          Weaviate
───────────────  ────────────────  ──────────────────────
Type             Cloud only        Local + Cloud
Schema           Flexible          Strict (defined upfront)
Built-in embed   No                Yes (multiple providers)
Graph features   No                Yes (cross-references)
Query language   Simple filter     GraphQL
Free tier        100k vectors      Weaviate Cloud (sandbox)
Self-host        No                Yes (Docker)
Best for         Simple RAG        Complex data relationships
```

---

## 2. Weaviate Setup — 2 Options

### Option A: Weaviate Cloud (Recommended for learning)
```
1. https://console.weaviate.cloud pe jaao
2. "Create cluster" → Free sandbox
3. Cluster URL aur API key copy karo
```

### Option B: Docker (Local)
```bash
docker run -d \
  -p 8080:8080 \
  -p 50051:50051 \
  cr.weaviate.io/semitechnologies/weaviate:latest
```

### Install SDK:
```bash
npm install weaviate-client
```

---

## 3. Core Concepts

```
Collection (Class) = Table/Schema
  - Name: "Article", "Product", "Document"
  - Properties: fields with types
  - Vectorizer: embedding model

Object = Row/Document
  - Properties: actual data
  - Vector: embedding (auto ya manual)
  - UUID: unique identifier

Tenant = Namespace (multi-tenancy)
```

---

## 4. Connect + Schema Create

```javascript
import weaviate from 'weaviate-client';
import dotenv from 'dotenv';
dotenv.config();

// Weaviate Cloud connect
const client = await weaviate.connectToWeaviateCloud(
  process.env.WEAVIATE_URL,
  {
    authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
  }
);

// Connection check
const ready = await client.isReady();
console.log("Weaviate ready:", ready);

// Collection create
const collection = await client.collections.create({
  name: "ProgrammingFact",
  properties: [
    { name: "text",       dataType: weaviate.configure.dataType.TEXT   },
    { name: "category",   dataType: weaviate.configure.dataType.TEXT   },
    { name: "difficulty", dataType: weaviate.configure.dataType.TEXT   },
  ],
  // No built-in vectorizer — manual embeddings use karenge
  vectorizers: weaviate.configure.vectorizer.none()
});

console.log("Collection created:", collection.name);
```

---

## 5. Objects Add Karo

```javascript
// Manual embeddings ke saath
import OpenAI from 'openai';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

const col = client.collections.get("ProgrammingFact");

const docs = [
  { text: "Node.js uses event-driven non-blocking I/O",  category: "nodejs",   difficulty: "beginner"     },
  { text: "Express.js is a minimal Node.js framework",   category: "nodejs",   difficulty: "beginner"     },
  { text: "async/await simplifies asynchronous code",    category: "nodejs",   difficulty: "intermediate" },
  { text: "MongoDB stores data as JSON documents",       category: "database", difficulty: "beginner"     },
  { text: "Redis is used for caching and sessions",      category: "database", difficulty: "beginner"     },
];

// Batch insert
const objects = await Promise.all(docs.map(async (doc) => ({
  properties: { text: doc.text, category: doc.category, difficulty: doc.difficulty },
  vectors:    await embed(doc.text)
})));

const result = await col.data.insertMany(objects);
console.log(`Inserted: ${result.allResponses.length} objects`);
```

---

## 6. nearVector Query

```javascript
// Manual embedding se search
const queryText = "How does Node.js handle async operations?";
const queryVec  = await embed(queryText);

const results = await col.query.nearVector(queryVec, {
  limit:              3,
  returnMetadata:     ["distance", "certainty"],
  returnProperties:   ["text", "category", "difficulty"]
});

console.log(`\nQuery: "${queryText}"`);
results.objects.forEach((obj, i) => {
  const certainty = obj.metadata?.certainty?.toFixed(3) || "?";
  console.log(`${i+1}. [${certainty}] [${obj.properties.category}] ${obj.properties.text}`);
});
```

---

## 7. Filters

```javascript
import { Filters } from 'weaviate-client';

// Single filter
const r1 = await col.query.nearVector(queryVec, {
  limit:            3,
  filters:          Filters.and(
    col.filter.byProperty("category").equal("nodejs")
  ),
  returnProperties: ["text", "category", "difficulty"]
});

// Multiple filters
const r2 = await col.query.nearVector(queryVec, {
  limit:   3,
  filters: Filters.and(
    col.filter.byProperty("category").equal("nodejs"),
    col.filter.byProperty("difficulty").equal("beginner")
  ),
  returnProperties: ["text", "category", "difficulty"]
});

// OR filter
const r3 = await col.query.nearVector(queryVec, {
  limit:   3,
  filters: Filters.or(
    col.filter.byProperty("category").equal("nodejs"),
    col.filter.byProperty("category").equal("database")
  ),
  returnProperties: ["text", "category", "difficulty"]
});
```

---

## 8. CRUD Operations

```javascript
// GET all objects
const all = await col.query.fetchObjects({ limit: 10 });
console.log("Total:", all.objects.length);

// GET by UUID
const obj = await col.query.fetchObjectById(uuid);

// UPDATE
await col.data.update({
  id:         uuid,
  properties: { difficulty: "advanced" }
});

// DELETE by UUID
await col.data.deleteById(uuid);

// DELETE by filter
await col.data.deleteMany(
  col.filter.byProperty("category").equal("old")
);

// DELETE collection
await client.collections.delete("ProgrammingFact");
```

---

## 9. Weaviate vs Pinecone — When to Use

```
Use Pinecone when:
  ✓ Simple vector search
  ✓ No schema needed
  ✓ Cloud-only is fine
  ✓ Large scale (billions)
  ✓ Quick setup

Use Weaviate when:
  ✓ Complex data relationships
  ✓ Self-hosting needed (privacy)
  ✓ GraphQL queries needed
  ✓ Built-in vectorizers wanted
  ✓ Multi-tenancy needed
```

---

## 10. Practice Tasks

### Task 1: Setup
```
1. Weaviate Cloud account banao (free sandbox)
   https://console.weaviate.cloud
2. Cluster URL + API key copy karo
3. .env mein add karo:
   WEAVIATE_URL=https://xxx.weaviate.network
   WEAVIATE_API_KEY=your-key
4. npm install weaviate-client
```

### Task 2: Collection + Insert
```javascript
// "TechDoc" collection banao
// Properties: title, content, category, source
// 10 objects insert karo
// Count check karo
```

### Task 3: Query + Filter
```javascript
// nearVector query karo
// Filter: category = "nodejs"
// Top 3 results print karo
```

---

Kal Day 11 mein Embeddings Pipeline dekhenge —
Batch embedding, caching, rate limiting.
