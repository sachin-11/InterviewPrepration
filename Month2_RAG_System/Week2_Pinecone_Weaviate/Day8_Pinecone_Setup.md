# Day 8 — Pinecone Setup & First Index

Pinecone = Production-grade cloud vector database
ChromaDB local tha — Pinecone cloud pe hai, globally accessible.

---

## 1. Pinecone vs ChromaDB

```
Feature          ChromaDB          Pinecone
───────────────  ────────────────  ──────────────────────
Type             Local/Self-hosted Cloud only
Setup            pip install       Account + API key
Scale            Millions          Billions of vectors
Speed            Good              Excellent (optimized)
Cost             Free              Free tier + paid
Persistence      Local disk        Cloud (always on)
Production       Small apps        Enterprise grade
Managed          No (you manage)   Yes (fully managed)
```

### Free Tier Limits:
```
Pinecone Free:
  1 index
  100,000 vectors
  Unlimited queries
  No credit card needed
```

---

## 2. Pinecone Account Setup

```
1. https://app.pinecone.io pe jaao
2. Sign up (Google se bhi ho sakta hai)
3. Dashboard → API Keys → Copy key
4. Region note karo (us-east-1, eu-west-1, etc.)
```

---

## 3. Install & Configure

```bash
npm install @pinecone-database/pinecone dotenv
```

```
# .env
PINECONE_API_KEY=your-key-here
GROQ_API_KEY=your-groq-key
```

---

## 4. Index Create Karo

```javascript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Index create karo
await pc.createIndex({
  name:      'my-index',
  dimension: 768,          // nomic-embed-text = 768 dims
  metric:    'cosine',     // similarity metric
  spec: {
    serverless: {
      cloud:  'aws',
      region: 'us-east-1'
    }
  }
});

console.log("Index created!");
```

### Dimension must match embedding model:
```
nomic-embed-text  → dimension: 768
mxbai-embed-large → dimension: 1024
OpenAI 3-small    → dimension: 1536
OpenAI 3-large    → dimension: 3072
```

---

## 5. Vectors Upsert Karo

```javascript
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// Index reference lo
const index = pc.index('my-index');

// Documents
const docs = [
  { id: "1", text: "Node.js is built on Chrome's V8 engine",    category: "nodejs"    },
  { id: "2", text: "Express.js is a web framework for Node.js", category: "nodejs"    },
  { id: "3", text: "MongoDB stores data as JSON documents",      category: "database"  },
  { id: "4", text: "Redis is used for caching",                  category: "database"  },
  { id: "5", text: "JWT is used for authentication",             category: "security"  },
];

// Embed + upsert
const vectors = await Promise.all(docs.map(async (doc) => ({
  id:       doc.id,
  values:   await embed(doc.text),    // Vector
  metadata: {                          // Extra info
    text:     doc.text,
    category: doc.category
  }
})));

await index.upsert(vectors);
console.log(`Upserted ${vectors.length} vectors`);

// Stats check karo
const stats = await index.describeIndexStats();
console.log("Total vectors:", stats.totalRecordCount);
```

---

## 6. Query Karo

```javascript
// Query
const queryText = "How to handle data storage?";
const queryVec  = await embed(queryText);

const results = await index.query({
  vector:          queryVec,
  topK:            3,
  includeMetadata: true,
  includeValues:   false  // Vectors return mat karo (bandwidth save)
});

console.log(`\nQuery: "${queryText}"`);
results.matches.forEach((match, i) => {
  console.log(`${i+1}. [${match.score.toFixed(3)}] ${match.metadata.text}`);
});
```

### With Metadata Filter:
```javascript
const filtered = await index.query({
  vector:          queryVec,
  topK:            3,
  includeMetadata: true,
  filter: {
    category: { "$eq": "database" }
  }
});
```

---

## 7. CRUD Operations

```javascript
// UPDATE (upsert same ID = update)
await index.upsert([{
  id:       "1",
  values:   await embed("Updated: Node.js runs on V8 by Google"),
  metadata: { text: "Updated text", category: "nodejs" }
}]);

// DELETE
await index.deleteOne("1");

// DELETE multiple
await index.deleteMany(["1", "2", "3"]);

// DELETE with filter
await index.deleteMany({ filter: { category: "old" } });

// FETCH specific vectors
const fetched = await index.fetch(["1", "2"]);
console.log(fetched.records);
```

---

## 8. Namespaces — Data Isolation

```javascript
// Alag alag users/projects ke liye namespaces
const userIndex = pc.index('my-index').namespace('user-123');
const adminIndex = pc.index('my-index').namespace('admin');

// Upsert in namespace
await userIndex.upsert(vectors);

// Query in namespace
const results = await userIndex.query({ vector: qVec, topK: 3 });

// Delete entire namespace
await userIndex.deleteAll();
```

---

## 9. Quick Summary

```
Pinecone setup:
  1. Account banao → API key lo
  2. Index create karo (dimension match karo!)
  3. Vectors upsert karo (id + values + metadata)
  4. Query karo (topK + filter)

Key differences from ChromaDB:
  - No local server needed
  - Always available (cloud)
  - Faster at scale
  - Namespaces for isolation
  - match.score (not distance) → Higher = better
```

---

## 10. Practice Tasks

### Task 1: Setup
```
1. Pinecone account banao
2. API key copy karo
3. .env mein add karo
4. npm install @pinecone-database/pinecone
```

### Task 2: First Index
```javascript
// Index banao:
// name: "learning-index"
// dimension: 768
// metric: cosine
// serverless: aws, us-east-1
```

### Task 3: Upsert + Query
```javascript
// 10 docs upsert karo
// 3 queries run karo
// Stats check karo
```

---

Kal Day 9 mein Pinecone advanced features dekhenge —
batch upsert, metadata filtering, namespaces.




pcsk_2NEyWq_LjddQVqNRUnggqY5GQCBhG3Jowi6NRNGN38GrNWUUqUQh5vJotM89LXvihzNzNG



c21xeXlGNUNtTXRqckQyT19ySW9RL1NmaWR0ME1laWQ4aURPazFwV1JOcGJHcit2Sm5hcmVoUVYxRWU0PV92MjAw
