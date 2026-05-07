# Day 4 — ChromaDB Hands-On Deep Dive

Aaj 20 Node.js facts store karenge aur complex queries,
filters, CRUD operations sab practically test karenge.

---

## 1. What We'll Build Today

```
20 Node.js facts → ChromaDB mein store
                 → Semantic search
                 → Category filter
                 → Difficulty filter
                 → CRUD operations
                 → Similarity threshold
                 → Batch operations
```

---

## 2. Practice File — day4_chromadb_deep_dive.js

```javascript
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// ─── 20 Node.js Facts ────────────────────────────────────
const facts = [
  // Basics
  { id: "1",  text: "Node.js is built on Chrome's V8 JavaScript engine",                    category: "basics",      difficulty: "beginner"     },
  { id: "2",  text: "Node.js uses single-threaded event loop for concurrency",               category: "basics",      difficulty: "beginner"     },
  { id: "3",  text: "npm is the default package manager for Node.js",                        category: "basics",      difficulty: "beginner"     },
  { id: "4",  text: "package.json stores project metadata and dependencies",                 category: "basics",      difficulty: "beginner"     },

  // Async
  { id: "5",  text: "Callbacks were the original way to handle async operations in Node.js", category: "async",       difficulty: "beginner"     },
  { id: "6",  text: "Promises provide cleaner async code with .then() and .catch()",         category: "async",       difficulty: "intermediate" },
  { id: "7",  text: "async/await is syntactic sugar over Promises for cleaner code",         category: "async",       difficulty: "intermediate" },
  { id: "8",  text: "Promise.all runs multiple async operations in parallel",                category: "async",       difficulty: "intermediate" },

  // Performance
  { id: "9",  text: "Worker threads allow CPU-intensive tasks without blocking event loop",  category: "performance", difficulty: "advanced"     },
  { id: "10", text: "Clustering uses all CPU cores by forking multiple Node processes",      category: "performance", difficulty: "advanced"     },
  { id: "11", text: "Streams process data in chunks instead of loading all into memory",     category: "performance", difficulty: "intermediate" },
  { id: "12", text: "The --max-old-space-size flag increases Node.js heap memory limit",     category: "performance", difficulty: "advanced"     },

  // Security
  { id: "13", text: "Never store secrets in code — use environment variables instead",       category: "security",    difficulty: "beginner"     },
  { id: "14", text: "Always validate and sanitize user input to prevent injection attacks",  category: "security",    difficulty: "intermediate" },
  { id: "15", text: "Use helmet.js to set secure HTTP headers in Express apps",              category: "security",    difficulty: "intermediate" },
  { id: "16", text: "Rate limiting prevents DDoS and brute force attacks on APIs",          category: "security",    difficulty: "intermediate" },

  // Best Practices
  { id: "17", text: "Use meaningful variable names and write self-documenting code",         category: "practices",   difficulty: "beginner"     },
  { id: "18", text: "Handle all promise rejections to avoid unhandled rejection crashes",    category: "practices",   difficulty: "intermediate" },
  { id: "19", text: "Use linting tools like ESLint to maintain consistent code style",       category: "practices",   difficulty: "beginner"     },
  { id: "20", text: "Write unit tests for critical functions using Jest or Mocha",           category: "practices",   difficulty: "intermediate" },
];
```

---

## 3. Setup + Ingest

```javascript
// Collection setup
try { await chroma.deleteCollection({ name: "nodejs-deep" }); } catch {}

const collection = await chroma.getOrCreateCollection({
  name: "nodejs-deep",
  metadata: { "hnsw:space": "cosine" }
});

// Batch embed + add
console.log("Embedding 20 facts...");
const embeddings = await Promise.all(facts.map(f => embed(f.text)));

await collection.add({
  ids:        facts.map(f => f.id),
  embeddings,
  documents:  facts.map(f => f.text),
  metadatas:  facts.map(f => ({
    category:   f.category,
    difficulty: f.difficulty
  }))
});

console.log(`✓ Total: ${await collection.count()} documents\n`);
```

---

## 4. Complex Queries

```javascript
async function search(query, options = {}) {
  const { filter, n = 3, threshold = 0.4 } = options;
  const qEmb = await embed(query);

  const params = {
    queryEmbeddings: [qEmb],
    nResults: n,
    include: ["documents", "metadatas", "distances"]
  };
  if (filter) params.where = filter;

  const results = await collection.query(params);

  console.log(`Query: "${query}"${filter ? ` [filter: ${JSON.stringify(filter)}]` : ''}`);
  console.log("─".repeat(60));

  results.documents[0].forEach((doc, i) => {
    const sim  = (1 - results.distances[0][i]).toFixed(3);
    const meta = results.metadatas[0][i];

    if (parseFloat(sim) >= threshold) {
      console.log(`✓ [${sim}] [${meta.category}/${meta.difficulty}] ${doc}`);
    } else {
      console.log(`✗ [${sim}] Below threshold — ${doc.slice(0, 40)}...`);
    }
  });
  console.log();
}

// Test queries
await search("How to handle async operations?");
await search("How to improve Node.js performance?");
await search("How to keep my app secure?");

// With category filter
await search("How to write better code?", {
  filter: { category: "practices" }
});

// Only beginner topics
await search("What should I learn first in Node.js?", {
  filter: { difficulty: "beginner" }
});

// Advanced topics only
await search("How to scale Node.js?", {
  filter: { difficulty: "advanced" }
});
```

---

## 5. CRUD Operations Test

```javascript
// ─── UPDATE ──────────────────────────────────────────────
console.log("=== UPDATE TEST ===");
const oldDoc = await collection.get({ ids: ["1"] });
console.log("Before:", oldDoc.documents[0]);

const newText = "Node.js is built on Google's V8 engine and runs JavaScript server-side";
await collection.update({
  ids:        ["1"],
  documents:  [newText],
  embeddings: [await embed(newText)]
});

const updated = await collection.get({ ids: ["1"] });
console.log("After: ", updated.documents[0]);

// ─── DELETE ──────────────────────────────────────────────
console.log("\n=== DELETE TEST ===");
console.log("Count before delete:", await collection.count());

await collection.delete({ ids: ["20"] });
console.log("Count after delete: ", await collection.count());

// ─── GET specific docs ───────────────────────────────────
console.log("\n=== GET SPECIFIC DOCS ===");
const specific = await collection.get({
  ids:     ["5", "6", "7"],
  include: ["documents", "metadatas"]
});
specific.documents.forEach((doc, i) => {
  console.log(`${specific.ids[i]}: ${doc.slice(0, 60)}...`);
});

// ─── PEEK ────────────────────────────────────────────────
console.log("\n=== PEEK (first 3) ===");
const peek = await collection.peek({ limit: 3 });
peek.documents.forEach((doc, i) => {
  console.log(`${peek.ids[i]}: ${doc.slice(0, 50)}...`);
});
```

---

## 6. Similarity Threshold Analysis

```javascript
// Kaunsa threshold sahi hai?
console.log("=== THRESHOLD ANALYSIS ===");

const query    = "How to handle errors in async code?";
const qEmb     = await embed(query);
const allResults = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 20,  // Sab results lo
  include: ["documents", "distances"]
});

console.log(`Query: "${query}"\n`);
console.log("Score  | Relevant? | Document");
console.log("─".repeat(70));

allResults.documents[0].forEach((doc, i) => {
  const sim      = (1 - allResults.distances[0][i]).toFixed(3);
  const relevant = parseFloat(sim) >= 0.45 ? "✓ YES" : "✗ NO ";
  console.log(`${sim}  | ${relevant}    | ${doc.slice(0, 45)}...`);
});

console.log("\nConclusion: 0.45+ = relevant for nomic-embed-text");
```

---

## 7. Category Stats

```javascript
// Har category mein kitne docs hain?
console.log("\n=== COLLECTION STATS ===");

const categories = ["basics", "async", "performance", "security", "practices"];

for (const cat of categories) {
  const result = await collection.get({
    where:   { category: cat },
    include: ["documents"]
  });
  console.log(`${cat.padEnd(12)}: ${result.documents.length} docs`);
}

console.log(`\nTotal: ${await collection.count()} docs`);
```

---

## 8. Quick Summary

```
Aaj kya seekha:

1. 20 documents batch embed + store karna
2. Complex semantic queries with filters
3. Similarity threshold — 0.45+ = relevant (nomic model)
4. CRUD: update, delete, get, peek
5. Category/difficulty based filtering
6. Collection stats nikalna

Key numbers (nomic-embed-text):
  0.6+  = Very relevant
  0.45+ = Relevant
  0.3-  = Not relevant (ignore karo)

Production tips:
  - Threshold 0.5+ rakho for better precision
  - Metadata filters use karo to narrow results
  - Batch embed karo (faster than one-by-one)
  - Collection names descriptive rakho
```

---

## 9. Practice Tasks (Aaj Karo)

### Task 1: Run the Code
```bash
# ChromaDB server chal raha ho
node day4_chromadb_deep_dive.js
```

### Task 2: Apne Facts Add Karo
```javascript
// 5 apne favourite programming facts add karo
// Alag category aur difficulty ke saath
// Query karo aur results dekho
```

### Task 3: Threshold Experiment
```javascript
// Same query, different thresholds:
// threshold: 0.3 → Kitne results?
// threshold: 0.5 → Kitne results?
// threshold: 0.7 → Kitne results?
// Kaunsa best balance deta hai?
```

### Task 4: Multi-filter Query
```javascript
// Ye filter try karo:
where: {
  "$and": [
    { category:   { "$eq": "security" } },
    { difficulty: { "$eq": "intermediate" } }
  ]
}
// Expected: helmet.js, input validation, rate limiting
```

---

Kal Day 5 mein Chunking Strategies dekhenge —
Large documents ko kaise todein RAG ke liye.
