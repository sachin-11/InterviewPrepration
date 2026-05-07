// Day 3 — ChromaDB: Store + Query + Filter + Mini RAG
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// ═══════════════════════════════════════════════════════
// STEP 1: Collection Create + Documents Add
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 1: Create Collection + Add Documents      ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// Old collection delete karo (fresh start)
try { await chroma.deleteCollection({ name: "nodejs-kb" }); } catch {}

const collection = await chroma.getOrCreateCollection({
  name: "nodejs-kb",
  metadata: { description: "Node.js Knowledge Base" }
});

const docs = [
  { id: "1", text: "Node.js is a JavaScript runtime built on Chrome's V8 engine", meta: { category: "basics",     topic: "nodejs"   } },
  { id: "2", text: "Express.js is a minimal and flexible Node.js web framework",  meta: { category: "framework",  topic: "express"  } },
  { id: "3", text: "The event loop allows Node.js to handle concurrent requests",  meta: { category: "internals",  topic: "eventloop"} },
  { id: "4", text: "async/await makes asynchronous code readable and clean",       meta: { category: "basics",     topic: "async"    } },
  { id: "5", text: "npm is the package manager with millions of open source packages", meta: { category: "tools", topic: "npm"      } },
  { id: "6", text: "MongoDB stores data as JSON-like documents (NoSQL)",           meta: { category: "database",   topic: "mongodb"  } },
  { id: "7", text: "REST APIs use HTTP methods: GET POST PUT DELETE",              meta: { category: "api",        topic: "rest"     } },
  { id: "8", text: "JWT tokens are used for stateless authentication in APIs",     meta: { category: "security",   topic: "jwt"      } },
  { id: "9", text: "Worker threads allow CPU-intensive tasks without blocking",    meta: { category: "internals",  topic: "workers"  } },
  { id: "10",text: "Redis is an in-memory data store used for caching",           meta: { category: "database",   topic: "redis"    } },
];

const embeddings = await Promise.all(docs.map(d => embed(d.text)));

await collection.add({
  ids:        docs.map(d => d.id),
  embeddings,
  documents:  docs.map(d => d.text),
  metadatas:  docs.map(d => d.meta)
});

console.log(`✓ Added ${docs.length} documents`);
console.log(`✓ Total in collection: ${await collection.count()}`);

// ═══════════════════════════════════════════════════════
// STEP 2: Basic Query
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 2: Basic Semantic Query                   ║");
console.log("╚══════════════════════════════════════════════════╝");

async function query(text, n = 3) {
  const qEmb    = await embed(text);
  const results = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: n,
    include: ["documents", "metadatas", "distances"]
  });

  console.log(`\nQuery: "${text}"`);
  console.log("─".repeat(55));
  results.documents[0].forEach((doc, i) => {
    const sim = (1 - results.distances[0][i]).toFixed(3);
    const cat = results.metadatas[0][i].category;
    console.log(`${i+1}. [${sim}] [${cat}] ${doc}`);
  });
}

await query("How does Node.js handle many requests at once?");
await query("How to secure an API?");
await query("What database should I use for caching?");

// ═══════════════════════════════════════════════════════
// STEP 3: Metadata Filter
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 3: Metadata Filter                        ║");
console.log("╚══════════════════════════════════════════════════╝");

const qEmb = await embed("How to store data?");

// Only database category
const filtered = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 3,
  where:   { category: "database" },
  include: ["documents", "metadatas", "distances"]
});

console.log('\nQuery: "How to store data?" (filter: category=database)');
console.log("─".repeat(55));
filtered.documents[0].forEach((doc, i) => {
  const sim = (1 - filtered.distances[0][i]).toFixed(3);
  console.log(`${i+1}. [${sim}] ${doc}`);
});

// ═══════════════════════════════════════════════════════
// STEP 4: Mini RAG
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 4: Mini RAG (ChromaDB + Llama)            ║");
console.log("╚══════════════════════════════════════════════════╝");

async function ragAnswer(question) {
  // Relevant docs dhundho
  const qe      = await embed(question);
  const results = await collection.query({
    queryEmbeddings: [qe],
    nResults: 3,
    include: ["documents"]
  });

  const context = results.documents[0].join("\n");

  // Llama se answer lo
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "Answer using only the context provided. Be concise." },
      { role: "user",   content: `Context:\n${context}\n\nQuestion: ${question}` }
    ],
    max_tokens: 150
  });

  console.log(`\nQ: ${question}`);
  console.log(`A: ${res.choices[0].message.content}`);
  console.log(`Sources: ${results.documents[0].map((d,i) => `\n  ${i+1}. ${d.slice(0,50)}...`).join('')}`);
}

await ragAnswer("How does Node.js handle concurrent requests?");
await ragAnswer("What is the best way to cache data?");
