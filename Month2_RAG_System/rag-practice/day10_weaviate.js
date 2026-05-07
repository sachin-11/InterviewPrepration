// Day 10 — Weaviate: Connect + Schema + Insert + Query
// Setup: npm install weaviate-client
// .env: WEAVIATE_URL=https://xxx.weaviate.network
//       WEAVIATE_API_KEY=your-key

import weaviate, { Filters } from 'weaviate-client';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// ─── Connect ─────────────────────────────────────────────
console.log("Connecting to Weaviate...");
const client = await weaviate.connectToWeaviateCloud(
  process.env.WEAVIATE_URL,
  { authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY) }
);

const ready = await client.isReady();
console.log(`✓ Weaviate ready: ${ready}\n`);

// ─── Collection Create ───────────────────────────────────
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 1: Create Collection                      ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// Delete if exists (fresh start)
try { await client.collections.delete("ProgrammingFact"); } catch {}

const collection = await client.collections.create({
  name: "ProgrammingFact",
  properties: [
    { name: "text",       dataType: weaviate.configure.dataType.TEXT },
    { name: "category",   dataType: weaviate.configure.dataType.TEXT },
    { name: "difficulty", dataType: weaviate.configure.dataType.TEXT },
  ],
  vectorizers: weaviate.configure.vectorizer.none() // Manual embeddings
});

console.log(`✓ Collection created: ${collection.name}`);

// ─── Insert Objects ──────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 2: Insert Objects                         ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const docs = [
  { text: "Node.js uses event-driven non-blocking I/O model",          category: "nodejs",      difficulty: "beginner"     },
  { text: "Express.js is a minimal and flexible Node.js framework",    category: "nodejs",      difficulty: "beginner"     },
  { text: "async/await makes asynchronous code readable and clean",    category: "nodejs",      difficulty: "intermediate" },
  { text: "Worker threads handle CPU-intensive tasks in Node.js",      category: "nodejs",      difficulty: "advanced"     },
  { text: "MongoDB stores data as flexible JSON-like documents",       category: "database",    difficulty: "beginner"     },
  { text: "Redis is an in-memory store for caching and sessions",      category: "database",    difficulty: "beginner"     },
  { text: "PostgreSQL is a powerful relational database",              category: "database",    difficulty: "beginner"     },
  { text: "JWT tokens enable stateless authentication in APIs",        category: "security",    difficulty: "intermediate" },
  { text: "Rate limiting prevents DDoS and brute force attacks",       category: "security",    difficulty: "intermediate" },
  { text: "Always validate user input to prevent injection attacks",   category: "security",    difficulty: "beginner"     },
];

console.log("Embedding + inserting 10 objects...");
const col = client.collections.get("ProgrammingFact");

const objects = await Promise.all(docs.map(async (doc) => ({
  properties: { text: doc.text, category: doc.category, difficulty: doc.difficulty },
  vectors:    await embed(doc.text)
})));

const result = await col.data.insertMany(objects);
console.log(`✓ Inserted: ${result.allResponses.length} objects`);

// ─── nearVector Query ────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 3: nearVector Query                       ║");
console.log("╚══════════════════════════════════════════════════╝");

async function search(query, limit = 3, filter = null) {
  const qVec   = await embed(query);
  const params = {
    limit,
    returnMetadata:   ["certainty", "distance"],
    returnProperties: ["text", "category", "difficulty"]
  };
  if (filter) params.filters = filter;

  const results = await col.query.nearVector(qVec, params);

  console.log(`\nQuery: "${query}"${filter ? " [filtered]" : ""}`);
  console.log("─".repeat(60));
  results.objects.forEach((obj, i) => {
    const score = obj.metadata?.certainty?.toFixed(3) || "?";
    const cat   = obj.properties.category;
    const diff  = obj.properties.difficulty;
    console.log(`${i+1}. [${score}] [${cat}/${diff}] ${obj.properties.text}`);
  });
}

await search("How does Node.js handle async operations?");
await search("How to store data efficiently?");
await search("How to secure my application?");

// ─── Filtered Query ──────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 4: Filtered Query                         ║");
console.log("╚══════════════════════════════════════════════════╝");

// Single filter
await search("Best practices?", 3,
  col.filter.byProperty("category").equal("nodejs")
);

// AND filter
await search("Best practices?", 3,
  Filters.and(
    col.filter.byProperty("category").equal("nodejs"),
    col.filter.byProperty("difficulty").equal("beginner")
  )
);

// OR filter
await search("How to store data?", 3,
  Filters.or(
    col.filter.byProperty("category").equal("database"),
    col.filter.byProperty("category").equal("security")
  )
);

// ─── Stats ───────────────────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 5: Collection Stats                       ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const all = await col.query.fetchObjects({ limit: 100 });
console.log(`Total objects: ${all.objects.length}`);

// Category breakdown
const cats = {};
all.objects.forEach(obj => {
  const cat = obj.properties.category;
  cats[cat] = (cats[cat] || 0) + 1;
});
Object.entries(cats).forEach(([cat, count]) =>
  console.log(`  ${cat.padEnd(12)}: ${count} objects`)
);

await client.close();
console.log("\n✅ Day 10 complete! Weaviate kaam kar raha hai.");
