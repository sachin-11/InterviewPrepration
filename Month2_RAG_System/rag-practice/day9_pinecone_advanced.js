// Day 9 — Pinecone Advanced: Batch, Filters, Namespaces
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

async function search(query, topK = 3, filter = null, ns = null) {
  const idx    = ns ? index.namespace(ns) : index;
  const qVec   = await embed(query);
  const params = { vector: qVec, topK, includeMetadata: true };
  if (filter) params.filter = filter;

  const results = await idx.query(params);
  const label   = `"${query}"${filter ? ' [filtered]' : ''}${ns ? ` [ns:${ns}]` : ''}`;
  console.log(`\nQuery: ${label}`);
  console.log("─".repeat(65));

  if (!results.matches.length) { console.log("  No results"); return; }
  results.matches.forEach((m, i) => {
    const cat  = m.metadata?.category  || "?";
    const diff = m.metadata?.difficulty || "?";
    console.log(`${i+1}. [${m.score.toFixed(3)}] [${cat}/${diff}] ${String(m.metadata?.text || "").slice(0, 55)}...`);
  });
}

// ═══════════════════════════════════════════════════════
// STEP 1: Batch Upsert — 30 docs
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 1: Batch Upsert (30 docs)                 ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const categories  = ["nodejs", "javascript", "database", "security", "performance"];
const difficulties = ["beginner", "intermediate", "advanced"];

const newDocs = [
  { id: "b1",  text: "JavaScript closures capture variables from outer scope",          cat: "javascript",  diff: "intermediate" },
  { id: "b2",  text: "Promises chain async operations with .then() and .catch()",       cat: "javascript",  diff: "intermediate" },
  { id: "b3",  text: "Arrow functions have lexical this binding in JavaScript",         cat: "javascript",  diff: "beginner"     },
  { id: "b4",  text: "Destructuring assignment extracts values from arrays and objects",cat: "javascript",  diff: "beginner"     },
  { id: "b5",  text: "Spread operator copies arrays and objects in JavaScript",         cat: "javascript",  diff: "beginner"     },
  { id: "b6",  text: "Node.js fs module handles file system operations asynchronously", cat: "nodejs",      diff: "intermediate" },
  { id: "b7",  text: "Express router organizes routes into separate modules",           cat: "nodejs",      diff: "beginner"     },
  { id: "b8",  text: "Node.js child_process spawns external processes",                cat: "nodejs",      diff: "advanced"     },
  { id: "b9",  text: "npm scripts automate build and test tasks in package.json",       cat: "nodejs",      diff: "beginner"     },
  { id: "b10", text: "Node.js Buffer handles binary data efficiently",                  cat: "nodejs",      diff: "intermediate" },
  { id: "b11", text: "PostgreSQL is a powerful open-source relational database",        cat: "database",    diff: "beginner"     },
  { id: "b12", text: "Database transactions ensure ACID properties for data integrity", cat: "database",    diff: "intermediate" },
  { id: "b13", text: "Indexes speed up database queries by creating lookup structures", cat: "database",    diff: "intermediate" },
  { id: "b14", text: "Connection pooling reuses database connections for performance",  cat: "database",    diff: "intermediate" },
  { id: "b15", text: "Database migrations track schema changes over time",              cat: "database",    diff: "beginner"     },
  { id: "b16", text: "HTTPS encrypts data in transit using TLS/SSL certificates",       cat: "security",    diff: "beginner"     },
  { id: "b17", text: "bcrypt hashes passwords with salt to prevent rainbow table attacks",cat: "security",  diff: "intermediate" },
  { id: "b18", text: "CORS headers control cross-origin resource sharing in browsers",  cat: "security",    diff: "intermediate" },
  { id: "b19", text: "Content Security Policy prevents XSS attacks in web apps",       cat: "security",    diff: "advanced"     },
  { id: "b20", text: "OAuth 2.0 enables secure third-party authentication flows",       cat: "security",    diff: "advanced"     },
  { id: "b21", text: "CDN serves static assets from edge servers close to users",       cat: "performance", diff: "beginner"     },
  { id: "b22", text: "Gzip compression reduces HTTP response size significantly",       cat: "performance", diff: "beginner"     },
  { id: "b23", text: "HTTP/2 multiplexing sends multiple requests over one connection", cat: "performance", diff: "intermediate" },
  { id: "b24", text: "Database query optimization reduces slow query execution time",   cat: "performance", diff: "intermediate" },
  { id: "b25", text: "Horizontal scaling adds more servers to handle increased load",   cat: "performance", diff: "advanced"     },
];

// Batch embed + upsert
async function batchUpsert(vectors, batchSize = 25) {
  let total = 0;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert({ records: batch });
    total += batch.length;
    console.log(`  Batch ${Math.ceil((i+1)/batchSize)}: ${total}/${vectors.length} upserted`);
  }
}

console.log("Embedding 25 new docs...");
const newVectors = await Promise.all(newDocs.map(async (d) => ({
  id:       d.id,
  values:   await embed(d.text),
  metadata: { text: d.text, category: d.cat, difficulty: d.diff }
})));

await batchUpsert(newVectors, 13);

const stats = await index.describeIndexStats();
console.log(`\n✓ Total vectors now: ${stats.totalRecordCount}`);

// ═══════════════════════════════════════════════════════
// STEP 2: Advanced Metadata Filters
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 2: Advanced Metadata Filters              ║");
console.log("╚══════════════════════════════════════════════════╝");

const q = "How to write better code?";

// Single filter
await search(q, 3, { category: { "$eq": "javascript" } });

// AND filter
await search(q, 3, {
  "$and": [
    { category:   { "$eq": "nodejs" } },
    { difficulty: { "$eq": "beginner" } }
  ]
});

// IN filter
await search(q, 3, {
  category: { "$in": ["javascript", "nodejs"] }
});

// NOT IN filter
await search(q, 3, {
  category: { "$nin": ["security", "performance"] }
});

// ═══════════════════════════════════════════════════════
// STEP 3: Namespaces
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 3: Namespaces                             ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// Frontend namespace
const frontendVecs = [
  { id: "fe-1", values: await embed("React is a JavaScript library for building UIs"),    metadata: { text: "React UI library",    topic: "react"  } },
  { id: "fe-2", values: await embed("CSS flexbox creates flexible responsive layouts"),   metadata: { text: "CSS flexbox",         topic: "css"    } },
  { id: "fe-3", values: await embed("TypeScript adds static typing to JavaScript"),       metadata: { text: "TypeScript typing",   topic: "ts"     } },
];

// Backend namespace
const backendVecs = [
  { id: "be-1", values: await embed("REST API design uses HTTP methods and status codes"), metadata: { text: "REST API design",     topic: "api"    } },
  { id: "be-2", values: await embed("GraphQL provides flexible data querying"),            metadata: { text: "GraphQL queries",     topic: "graphql"} },
  { id: "be-3", values: await embed("Microservices split apps into small independent services"), metadata: { text: "Microservices", topic: "arch"   } },
];

await index.namespace("frontend").upsert({ records: frontendVecs });
await index.namespace("backend").upsert({ records: backendVecs });
console.log("✓ Namespaces created: frontend, backend");

await search("How to build user interfaces?", 2, null, "frontend");
await search("How to design APIs?",           2, null, "backend");
await search("How to build user interfaces?", 2, null, "backend"); // Wrong namespace

// Stats with namespaces
const nsStats = await index.describeIndexStats();
console.log("\n=== Namespace Stats ===");
Object.entries(nsStats.namespaces || {}).forEach(([ns, data]) => {
  console.log(`  ${ns}: ${data.recordCount} vectors`);
});
console.log(`  (default): ${nsStats.totalRecordCount - Object.values(nsStats.namespaces || {}).reduce((s, n) => s + n.recordCount, 0)} vectors`);

console.log("\n✅ Day 9 complete!");
