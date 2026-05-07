# Day 3 — Vector Databases & ChromaDB

Aaj vectors ko memory mein store karne ki jagah
proper Vector Database mein store karenge — ChromaDB locally.

---

## 1. Vector Database Kya Hota Hai?

### Normal DB vs Vector DB:
```
Normal Database (SQL/NoSQL):
  Query: "WHERE name = 'John'"
  Search: Exact match
  Use: Structured data

Vector Database:
  Query: "Find documents similar to this text"
  Search: Nearest neighbor (similarity)
  Use: Semantic search, RAG, recommendations

Example:
  Normal DB: "Find all docs with word 'error'"
  Vector DB: "Find all docs about error handling"
             (even if word 'error' not present!)
```

### Why Not Just Use Arrays?
```
Day 1-2 mein humne arrays use kiye:
  const docVecs = await Promise.all(docs.map(embed));
  // Har query pe sab docs dobara embed karo → SLOW!
  // Memory mein sirf current session → LOST on restart!

Vector DB:
  ✓ Vectors persist karta hai (disk pe)
  ✓ Fast similarity search (indexed)
  ✓ Metadata store karta hai
  ✓ Filter + search combine kar sakta hai
  ✓ Millions of vectors handle karta hai
```

### Popular Vector DBs:
```
Database    Type          Best For              Free?
──────────  ────────────  ────────────────────  ──────
ChromaDB    Local/Cloud   Learning, small apps  Yes
Pinecone    Cloud only    Production, scale     Paid
Weaviate    Local/Cloud   Enterprise            Yes
Qdrant      Local/Cloud   High performance      Yes
FAISS       Local only    Research, offline     Yes
pgvector    PostgreSQL    Existing PG users     Yes
```

---

## 2. ChromaDB — Setup

### Install:
```bash
# ChromaDB Node.js client
npm install chromadb chromadb-default-embed
```

### ChromaDB 2 modes mein run hota hai:

#### Mode 1: In-Memory (testing ke liye)
```javascript
import { ChromaClient } from 'chromadb';

const client = new ChromaClient(); // Default: in-memory
// Restart pe data lost!
```

#### Mode 2: Persistent (recommended)
```javascript
import { ChromaClient } from 'chromadb';

const client = new ChromaClient({
  path: "./chroma-data"  // Data yahan save hoga
});
// Restart pe data safe!
```

#### Mode 3: Server (production)
```bash
# Python server run karo
pip install chromadb
chroma run --path ./chroma-data --port 8000
```
```javascript
const client = new ChromaClient({
  path: "http://localhost:8000"
});
```

---

## 3. ChromaDB Core Concepts

```
Collection = Table ki tarah (ek topic ke documents)
  - "nodejs-docs"
  - "company-knowledge-base"
  - "product-faqs"

Document = Text content
  - "Node.js is a JavaScript runtime..."

Embedding = Document ka vector (auto ya manual)

Metadata = Extra info document ke saath
  - { source: "docs.nodejs.org", page: 5, category: "basics" }

ID = Unique identifier for each document
  - "doc-001", "nodejs-intro", etc.
```

---

## 4. Basic ChromaDB Operations

```javascript
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';

// Ollama for embeddings
const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

async function embed(text) {
  const res = await ollama.embeddings.create({
    model: "nomic-embed-text",
    input: text
  });
  return res.data[0].embedding;
}

// ChromaDB client
const chroma = new ChromaClient({ path: "./chroma-data" });

// ─── 1. Collection Create ────────────────────────────────
const collection = await chroma.getOrCreateCollection({
  name: "nodejs-facts",
  metadata: { description: "Node.js programming facts" }
});

console.log("Collection created:", collection.name);

// ─── 2. Documents Add ────────────────────────────────────
const documents = [
  "Node.js is a JavaScript runtime built on Chrome's V8 engine",
  "Express.js is a minimal web framework for Node.js",
  "async/await makes asynchronous code look synchronous",
  "The event loop allows Node.js to handle concurrent requests",
  "npm is the package manager for Node.js with millions of packages",
];

const ids        = documents.map((_, i) => `doc-${i + 1}`);
const embeddings = await Promise.all(documents.map(embed));
const metadatas  = documents.map((_, i) => ({
  index:    i,
  category: i < 2 ? "framework" : "concept"
}));

await collection.add({
  ids,
  embeddings,
  documents,
  metadatas
});

console.log(`Added ${documents.length} documents`);

// ─── 3. Query ────────────────────────────────────────────
const queryText = "How does Node.js handle multiple requests?";
const queryEmb  = await embed(queryText);

const results = await collection.query({
  queryEmbeddings: [queryEmb],
  nResults: 3,
  include: ["documents", "metadatas", "distances"]
});

console.log(`\nQuery: "${queryText}"`);
console.log("─".repeat(50));

results.documents[0].forEach((doc, i) => {
  const distance = results.distances[0][i];
  const similarity = 1 - distance; // ChromaDB distance → similarity
  console.log(`${i + 1}. [${similarity.toFixed(3)}] ${doc}`);
});

// ─── 4. Collection Stats ─────────────────────────────────
const count = await collection.count();
console.log(`\nTotal documents: ${count}`);
```

---

## 5. Metadata Filtering

```javascript
// Sirf specific category ke documents search karo
const results = await collection.query({
  queryEmbeddings: [queryEmb],
  nResults: 3,
  where: { category: "concept" },  // Filter!
  include: ["documents", "distances"]
});

// Multiple conditions
const results2 = await collection.query({
  queryEmbeddings: [queryEmb],
  nResults: 3,
  where: {
    "$and": [
      { category: { "$eq": "framework" } },
      { index:    { "$gte": 0 } }
    ]
  }
});

// Available operators:
// $eq, $ne, $gt, $gte, $lt, $lte
// $in, $nin (array mein hai ya nahi)
// $and, $or
```

---

## 6. CRUD Operations

```javascript
// UPDATE — Document update karo
await collection.update({
  ids:        ["doc-1"],
  documents:  ["Updated: Node.js runs on V8 engine by Google"],
  embeddings: [await embed("Updated: Node.js runs on V8 engine by Google")]
});

// DELETE — Document delete karo
await collection.delete({ ids: ["doc-1"] });

// DELETE with filter
await collection.delete({
  where: { category: "old" }
});

// GET — Specific documents fetch karo
const docs = await collection.get({
  ids:     ["doc-2", "doc-3"],
  include: ["documents", "metadatas"]
});

// PEEK — First N documents dekho
const peek = await collection.peek({ limit: 3 });
console.log(peek.documents);
```

---

## 7. Distance Metrics

```
ChromaDB 3 distance metrics support karta hai:

cosine (default):
  Range: 0 to 2
  0 = identical, 2 = opposite
  similarity = 1 - distance

l2 (Euclidean):
  Range: 0 to infinity
  0 = identical
  Smaller = more similar

ip (Inner Product):
  Range: -infinity to infinity
  Larger = more similar

Collection create karte waqt set karo:
```

```javascript
const collection = await chroma.getOrCreateCollection({
  name: "my-collection",
  metadata: {
    "hnsw:space": "cosine"  // default
    // "hnsw:space": "l2"
    // "hnsw:space": "ip"
  }
});
```

---

## 8. Complete RAG Preview

```javascript
// Ye Day 3 ka mini-RAG hai — full RAG Week 3 mein
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chroma = new ChromaClient({ path: "./chroma-data" });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// Step 1: Knowledge base store karo
async function ingest(docs) {
  const collection = await chroma.getOrCreateCollection({ name: "knowledge" });
  const embeddings = await Promise.all(docs.map(d => embed(d.text)));

  await collection.add({
    ids:        docs.map(d => d.id),
    embeddings,
    documents:  docs.map(d => d.text),
    metadatas:  docs.map(d => d.meta || {})
  });
  console.log(`Ingested ${docs.length} documents`);
}

// Step 2: Question ka answer do
async function ask(question) {
  const collection = await chroma.getOrCreateCollection({ name: "knowledge" });

  // Relevant docs dhundho
  const qEmb    = await embed(question);
  const results = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: 3,
    include: ["documents"]
  });

  const context = results.documents[0].join("\n\n");

  // LLM se answer lo
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Answer based only on the provided context. If not in context, say 'I don't know'."
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }
    ],
    max_tokens: 300
  });

  return {
    answer:  response.choices[0].message.content,
    sources: results.documents[0]
  };
}

// Test
await ingest([
  { id: "1", text: "Node.js uses event-driven, non-blocking I/O model" },
  { id: "2", text: "Express.js is the most popular Node.js web framework" },
  { id: "3", text: "MongoDB is a NoSQL database that stores JSON documents" },
  { id: "4", text: "React is a JavaScript library for building user interfaces" },
  { id: "5", text: "Docker containers package applications with their dependencies" },
]);

const result = await ask("How does Node.js handle I/O operations?");
console.log("\nAnswer:", result.answer);
console.log("\nSources used:");
result.sources.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
```

---

## 9. Quick Summary

```
Vector DB vs Normal DB:
  Normal → Exact match search
  Vector → Semantic similarity search

ChromaDB:
  Collection = Table
  Document   = Text content
  Embedding  = Vector (auto ya manual)
  Metadata   = Extra info (filterable)
  ID         = Unique identifier

Key operations:
  getOrCreateCollection() → Collection banao
  add()                   → Documents add karo
  query()                 → Similar docs dhundho
  update()                → Document update karo
  delete()                → Document delete karo
  count()                 → Total documents

Distance → Similarity:
  similarity = 1 - distance (cosine metric)
  0.8+ = Very relevant
  0.6-0.8 = Relevant
  < 0.6 = Not relevant
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Setup
```bash
npm install chromadb
node -e "const {ChromaClient} = require('chromadb'); console.log('ChromaDB ready!')"
```

### Task 2: Basic CRUD
```javascript
// Ye operations karo:
// 1. Collection "my-first-collection" banao
// 2. 5 documents add karo (apne topics pe)
// 3. Query karo
// 4. count() check karo
// 5. Ek document delete karo
// 6. Dobara count() check karo
```

### Task 3: Metadata Filter
```javascript
// Documents add karo with metadata:
// { category: "frontend" } → React, Vue, CSS docs
// { category: "backend" }  → Node.js, Express, DB docs

// Query: "How to build APIs?"
// Filter: only backend category
// Result: Sirf backend docs aane chahiye
```

### Task 4: Mini RAG
```javascript
// Upar wala mini-RAG code run karo
// 5 apne facts add karo
// 3 questions poochho
// Dekho kya accurate answers aate hain
```

---

Kal Day 4 mein ChromaDB hands-on deep dive karenge —
20 Node.js facts store karenge aur complex queries test karenge.
