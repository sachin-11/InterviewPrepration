# Day 7 — Week 1 Revision + Mini Project

Aaj poore Week 1 ka revision karenge aur
ek complete Semantic Search Engine banayenge.

---

## 1. Week 1 Complete Recap

### Day 1 — Embeddings:
```
Embedding = Text → Numbers (vector)
Similar meaning = Similar vectors = Close in vector space

Cosine similarity: -1 to 1
  0.7+ = Relevant
  0.4-0.7 = Somewhat relevant
  < 0.4 = Not relevant

Model: nomic-embed-text (768 dims, free, Ollama)
```

### Day 2 — Embedding Models:
```
nomic-embed-text  → Free, 768 dims, good quality
mxbai-embed-large → Free, 1024 dims, better quality
all-minilm        → Free, 384 dims, fastest
OpenAI 3-small    → Paid, 1536 dims, production

Dev/Learning → Ollama (free)
Production   → OpenAI 3-small ($0.02/1M)
```

### Day 3 — Vector Databases:
```
Normal DB: Exact match search
Vector DB: Semantic similarity search

ChromaDB:
  Collection = Table
  Document   = Text
  Embedding  = Vector
  Metadata   = Extra info (filterable)
  ID         = Unique identifier
```

### Day 4 — ChromaDB Hands-on:
```
getOrCreateCollection() → Create
add()                   → Insert
query()                 → Search
update()                → Update
delete()                → Delete
count()                 → Stats
peek()                  → Preview
```

### Day 5 — Chunking:
```
Fixed Size:  Simple, words cut ho sakte hain
Sentence:    Natural boundaries, variable size
Recursive:   Best quality, respects structure ← Recommended

Overlap: 10-20% of chunk size
Sweet spot: 200-500 chars per chunk
```

### Day 6 — Retrieval:
```
Top-K:     Simple, always K results
Threshold: Quality filter (0.45 for nomic)
MMR:       Diverse results (lambda=0.7)
Hybrid:    Semantic + Keyword combined
Filter:    Metadata-based narrowing

Best combo: MMR + Threshold + Metadata filter
```

---

## 2. Self Quiz

```
Q1. Embedding kya hota hai? Ek line mein.
Q2. Cosine similarity ka range kya hai?
Q3. nomic-embed-text ke kitne dimensions hain?
Q4. ChromaDB mein Collection kya hota hai?
Q5. Chunking mein overlap kyun zaroori hai?
Q6. MMR ka lambda=0.7 matlab kya hai?
Q7. Threshold 0.45 kab use karein?
Q8. Hybrid search kab better hai Top-K se?
```

### Answers:
```
A1. Text ko numbers (vector) mein convert karna
A2. -1 to 1 (1=identical, 0=no relation, -1=opposite)
A3. 768 dimensions
A4. Table ki tarah — related documents ka group
A5. Chunk boundary pe context missing na ho
A6. 70% relevance + 30% diversity balance
A7. nomic-embed-text ke liye (0.4-0.5 sweet spot)
A8. Specific terms/names search karte waqt (JWT, npm, etc.)
```

---

## 3. Mini Project: Semantic Search Engine

### Kya banayenge:
```
Features:
  ✓ 50 programming Q&A store karo ChromaDB mein
  ✓ Natural language search
  ✓ Category filter (javascript, nodejs, database, etc.)
  ✓ Difficulty filter (beginner, intermediate, advanced)
  ✓ Top 3 results with similarity score
  ✓ Interactive CLI interface
```

### Project Structure:
```
search-engine/
├── data.js          ← 50 Q&A dataset
├── ingest.js        ← Data ChromaDB mein store karo
├── search.js        ← Search logic
└── cli.js           ← Interactive interface
```

---

## 4. Dataset — data.js

```javascript
// data.js
export const qaData = [
  // JavaScript
  { id: "js-1",  q: "What is closure in JavaScript?",
    a: "A closure is a function that has access to variables from its outer scope even after the outer function has returned.",
    category: "javascript", difficulty: "intermediate" },

  { id: "js-2",  q: "What is the difference between let and var?",
    a: "let is block-scoped and not hoisted, while var is function-scoped and hoisted to the top of its function.",
    category: "javascript", difficulty: "beginner" },

  { id: "js-3",  q: "What is event delegation?",
    a: "Event delegation is attaching a single event listener to a parent element to handle events from child elements using event bubbling.",
    category: "javascript", difficulty: "intermediate" },

  { id: "js-4",  q: "What is the prototype chain?",
    a: "The prototype chain is JavaScript's inheritance mechanism where objects inherit properties from their prototype object.",
    category: "javascript", difficulty: "advanced" },

  { id: "js-5",  q: "What is Promise.all?",
    a: "Promise.all takes an array of promises and returns a single promise that resolves when all promises resolve, or rejects if any fails.",
    category: "javascript", difficulty: "intermediate" },

  // Node.js
  { id: "node-1", q: "What is the event loop in Node.js?",
    a: "The event loop is Node.js's mechanism for handling asynchronous operations by processing callbacks from the event queue when the call stack is empty.",
    category: "nodejs", difficulty: "intermediate" },

  { id: "node-2", q: "What is middleware in Express?",
    a: "Middleware are functions that execute during the request-response cycle, having access to req, res, and next objects.",
    category: "nodejs", difficulty: "beginner" },

  { id: "node-3", q: "What are streams in Node.js?",
    a: "Streams are objects that let you read or write data continuously in chunks, useful for handling large files without loading everything into memory.",
    category: "nodejs", difficulty: "intermediate" },

  { id: "node-4", q: "What is clustering in Node.js?",
    a: "Clustering allows Node.js to create child processes that share the same server port, utilizing all CPU cores for better performance.",
    category: "nodejs", difficulty: "advanced" },

  { id: "node-5", q: "What is the difference between process.nextTick and setImmediate?",
    a: "process.nextTick fires before any I/O events in the current iteration, while setImmediate fires in the check phase after I/O events.",
    category: "nodejs", difficulty: "advanced" },

  // Database
  { id: "db-1",  q: "What is the difference between SQL and NoSQL?",
    a: "SQL databases use structured tables with fixed schemas, while NoSQL databases use flexible document, key-value, or graph structures.",
    category: "database", difficulty: "beginner" },

  { id: "db-2",  q: "What is database indexing?",
    a: "Indexing creates a data structure that improves query speed by allowing the database to find rows without scanning the entire table.",
    category: "database", difficulty: "intermediate" },

  { id: "db-3",  q: "What is Redis used for?",
    a: "Redis is an in-memory data store used for caching, session management, pub/sub messaging, and rate limiting due to its high speed.",
    category: "database", difficulty: "beginner" },

  { id: "db-4",  q: "What is database sharding?",
    a: "Sharding is horizontal partitioning of data across multiple database instances to distribute load and improve scalability.",
    category: "database", difficulty: "advanced" },

  { id: "db-5",  q: "What is an ORM?",
    a: "ORM (Object-Relational Mapping) is a technique that lets you query and manipulate database data using object-oriented programming.",
    category: "database", difficulty: "beginner" },

  // Security
  { id: "sec-1", q: "What is SQL injection?",
    a: "SQL injection is an attack where malicious SQL code is inserted into queries, allowing attackers to access or modify database data.",
    category: "security", difficulty: "beginner" },

  { id: "sec-2", q: "What is JWT?",
    a: "JWT (JSON Web Token) is a compact token format used for stateless authentication, containing encoded user information and a signature.",
    category: "security", difficulty: "intermediate" },

  { id: "sec-3", q: "What is CORS?",
    a: "CORS (Cross-Origin Resource Sharing) is a security mechanism that controls which domains can make requests to your API.",
    category: "security", difficulty: "intermediate" },

  { id: "sec-4", q: "What is bcrypt?",
    a: "bcrypt is a password hashing function that adds salt and uses multiple rounds to make brute-force attacks computationally expensive.",
    category: "security", difficulty: "intermediate" },

  { id: "sec-5", q: "What is rate limiting?",
    a: "Rate limiting restricts the number of requests a client can make in a time window to prevent abuse, DDoS attacks, and ensure fair usage.",
    category: "security", difficulty: "beginner" },

  // Performance
  { id: "perf-1", q: "What is caching?",
    a: "Caching stores frequently accessed data in fast storage (memory) to reduce database load and improve response times.",
    category: "performance", difficulty: "beginner" },

  { id: "perf-2", q: "What is lazy loading?",
    a: "Lazy loading defers loading of resources until they are actually needed, improving initial load time and reducing memory usage.",
    category: "performance", difficulty: "intermediate" },

  { id: "perf-3", q: "What is connection pooling?",
    a: "Connection pooling maintains a pool of reusable database connections to avoid the overhead of creating new connections for each request.",
    category: "performance", difficulty: "intermediate" },

  { id: "perf-4", q: "What is load balancing?",
    a: "Load balancing distributes incoming requests across multiple servers to prevent overload and ensure high availability.",
    category: "performance", difficulty: "intermediate" },

  { id: "perf-5", q: "What is CDN?",
    a: "CDN (Content Delivery Network) serves static assets from servers geographically close to users, reducing latency and load times.",
    category: "performance", difficulty: "beginner" },
];
```

---

## 5. Ingest Script — ingest.js

```javascript
// ingest.js
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import { qaData } from './data.js';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

async function ingest() {
  console.log("Setting up collection...");
  try { await chroma.deleteCollection({ name: "qa-search" }); } catch {}

  const col = await chroma.getOrCreateCollection({ name: "qa-search" });

  console.log(`Embedding ${qaData.length} Q&A pairs...`);

  // Q + A combine karke embed karo (better retrieval)
  const texts      = qaData.map(d => `Q: ${d.q}\nA: ${d.a}`);
  const embeddings = await Promise.all(texts.map(embed));

  await col.add({
    ids:        qaData.map(d => d.id),
    embeddings,
    documents:  texts,
    metadatas:  qaData.map(d => ({
      question:   d.q,
      answer:     d.a,
      category:   d.category,
      difficulty: d.difficulty
    }))
  });

  console.log(`✓ Ingested ${await col.count()} documents`);
  console.log("✓ Ready to search!\n");
}

await ingest();
```

---

## 6. Search Logic — search.js

```javascript
// search.js
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

export async function search(query, options = {}) {
  const {
    k          = 3,
    threshold  = 0.4,
    category   = null,
    difficulty = null
  } = options;

  const col  = await chroma.getOrCreateCollection({ name: "qa-search" });
  const qEmb = await embed(query);

  // Build filter
  const filters = [];
  if (category)   filters.push({ category });
  if (difficulty) filters.push({ difficulty });

  const where = filters.length === 0 ? undefined :
                filters.length === 1 ? filters[0] :
                { "$and": filters };

  const params = {
    queryEmbeddings: [qEmb],
    nResults: k,
    include: ["documents", "metadatas", "distances"]
  };
  if (where) params.where = where;

  const results = await col.query(params);

  return results.documents[0]
    .map((doc, i) => ({
      question:   results.metadatas[0][i].question,
      answer:     results.metadatas[0][i].answer,
      category:   results.metadatas[0][i].category,
      difficulty: results.metadatas[0][i].difficulty,
      similarity: 1 - results.distances[0][i]
    }))
    .filter(r => r.similarity >= threshold);
}
```

---

## 7. CLI Interface — cli.js

```javascript
// cli.js
import readline from 'readline';
import { search } from './search.js';

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout
});

const CATEGORIES  = ["javascript", "nodejs", "database", "security", "performance", "all"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced", "all"];

function printResults(results, query) {
  if (results.length === 0) {
    console.log("\n❌ No relevant results found. Try a different query.\n");
    return;
  }

  console.log(`\n✅ Found ${results.length} result(s) for: "${query}"\n`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. [${r.similarity.toFixed(3)}] [${r.category}/${r.difficulty}]`);
    console.log(`   Q: ${r.question}`);
    console.log(`   A: ${r.answer}\n`);
  });
}

async function promptSearch() {
  rl.question('🔍 Search query (or "exit"): ', async (query) => {
    if (query.toLowerCase() === 'exit') {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    if (!query.trim()) { promptSearch(); return; }

    rl.question('📂 Category (javascript/nodejs/database/security/performance/all): ', async (cat) => {
      rl.question('📊 Difficulty (beginner/intermediate/advanced/all): ', async (diff) => {
        const results = await search(query, {
          k:          5,
          threshold:  0.35,
          category:   cat === 'all' || !CATEGORIES.includes(cat) ? null : cat,
          difficulty: diff === 'all' || !DIFFICULTIES.includes(diff) ? null : diff
        });

        printResults(results, query);
        promptSearch();
      });
    });
  });
}

console.log("╔══════════════════════════════════════════════════╗");
console.log("║     SEMANTIC SEARCH ENGINE — Programming Q&A   ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log("25 Q&A pairs across: javascript, nodejs, database, security, performance\n");

promptSearch();
```

---

## 8. Run Karo

```bash
# Step 1: Ingest data
node ingest.js

# Step 2: Search engine start karo
node cli.js

# Example queries to try:
# "How does async work in JavaScript?"
# "How to secure my API?"
# "What database should I use for caching?"
# "How to improve performance?"
# "What is the difference between SQL and NoSQL?"
```

---

## 9. Score Yourself

```
Week 1 complete karke ye sab karna chahiye:

□ Embedding kya hai explain kar sako
□ Cosine similarity manually calculate kar sako
□ ChromaDB mein documents store + query kar sako
□ Chunking strategies ka fark samajh aaye
□ Top-K vs MMR vs Threshold ka fark pata ho
□ Mini project run ho raha ho

Score:
  6/6 → Week 2 (Pinecone/Weaviate) ke liye ready
  4-5 → Weak areas review karo
  < 4 → Day 3-6 files dobara padho
```

---

Week 2 mein Pinecone aur Weaviate cloud vector databases dekhenge.
