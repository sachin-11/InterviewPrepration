// Day 8 — Pinecone: Setup + Index + Upsert + Query
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

const INDEX_NAME = "learning-index";

// ═══════════════════════════════════════════════════════
// STEP 1: Index Create (ek baar hi karna hai)
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 1: Create Index                           ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// Check if index already exists
const existingIndexes = await pc.listIndexes();
const indexExists = existingIndexes.indexes?.some(i => i.name === INDEX_NAME);

if (!indexExists) {
  console.log(`Creating index: ${INDEX_NAME}...`);
  await pc.createIndex({
    name:      INDEX_NAME,
    dimension: 768,        // nomic-embed-text = 768 dims
    metric:    'cosine',
    spec: {
      serverless: {
        cloud:  'aws',
        region: 'us-east-1'
      }
    }
  });

  // Index ready hone ka wait karo
  console.log("Waiting for index to be ready...");
  await new Promise(r => setTimeout(r, 10000));
  console.log("✓ Index created!\n");
} else {
  console.log(`✓ Index "${INDEX_NAME}" already exists\n`);
}

const index = pc.index(INDEX_NAME);

// ═══════════════════════════════════════════════════════
// STEP 2: Vectors Upsert Karo
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 2: Upsert Vectors                         ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const docs = [
  { id: "1",  text: "Node.js is built on Chrome's V8 JavaScript engine",                   category: "nodejs",    difficulty: "beginner"     },
  { id: "2",  text: "Express.js is a minimal web framework for Node.js",                   category: "nodejs",    difficulty: "beginner"     },
  { id: "3",  text: "The event loop allows Node.js to handle concurrent requests",          category: "nodejs",    difficulty: "intermediate" },
  { id: "4",  text: "async/await makes asynchronous code readable and clean",              category: "nodejs",    difficulty: "intermediate" },
  { id: "5",  text: "Worker threads allow CPU-intensive tasks without blocking",            category: "nodejs",    difficulty: "advanced"     },
  { id: "6",  text: "MongoDB stores data as JSON-like documents (NoSQL database)",         category: "database",  difficulty: "beginner"     },
  { id: "7",  text: "Redis is an in-memory data store used for caching and sessions",      category: "database",  difficulty: "beginner"     },
  { id: "8",  text: "JWT tokens are used for stateless authentication in APIs",            category: "security",  difficulty: "intermediate" },
  { id: "9",  text: "Rate limiting prevents DDoS and brute force attacks",                 category: "security",  difficulty: "intermediate" },
  { id: "10", text: "Always validate user input to prevent injection attacks",             category: "security",  difficulty: "beginner"     },
];

console.log(`Embedding ${docs.length} documents...`);
const vectors = await Promise.all(docs.map(async (doc) => {
  const values = await embed(doc.text);
  console.log(`  ✓ ${doc.id}: ${values.length} dims`); // Debug
  return {
    id:       doc.id,
    values,
    metadata: { text: doc.text, category: doc.category, difficulty: doc.difficulty }
  };
}));

console.log(`Total vectors prepared: ${vectors.length}`);
if (vectors.length === 0) {
  console.error("❌ No vectors! Check Ollama is running: ollama serve");
  process.exit(1);
}

await index.upsert({ records: vectors });
console.log(`✓ Upserted ${vectors.length} vectors`);

// Stats
const stats = await index.describeIndexStats();
console.log(`✓ Total vectors in index: ${stats.totalRecordCount}\n`);

// ═══════════════════════════════════════════════════════
// STEP 3: Query Karo
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 3: Query                                  ║");
console.log("╚══════════════════════════════════════════════════╝");

async function search(query, topK = 3, filter = null) {
  const qVec  = await embed(query);
  const params = { vector: qVec, topK, includeMetadata: true };
  if (filter) params.filter = filter;

  const results = await index.query(params);

  console.log(`\nQuery: "${query}"`);
  console.log("─".repeat(60));
  results.matches.forEach((m, i) => {
    console.log(`${i+1}. [${m.score.toFixed(3)}] [${m.metadata.category}] ${m.metadata.text}`);
  });
}

await search("How does Node.js handle async operations?");
await search("How to secure my API?");
await search("What database should I use for caching?");

// ═══════════════════════════════════════════════════════
// STEP 4: Metadata Filter
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 4: Metadata Filter                        ║");
console.log("╚══════════════════════════════════════════════════╝");

await search("How to store data?", 3, { category: { "$eq": "database" } });
await search("Best practices?",    3, { difficulty: { "$eq": "beginner" } });

// ═══════════════════════════════════════════════════════
// STEP 5: Fetch + Delete
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 5: Fetch + Delete                         ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// Fetch specific vectors
const fetched = await index.fetch({ ids: ["1", "2"] });
console.log("Fetched IDs:", Object.keys(fetched.records));

// Stats before delete
console.log(`Count before delete: ${(await index.describeIndexStats()).totalRecordCount}`);

// Delete one
await index.deleteOne({ id: "10" });
await new Promise(r => setTimeout(r, 2000)); // Wait for consistency

console.log(`Count after delete:  ${(await index.describeIndexStats()).totalRecordCount}`);
console.log("\n✅ Day 8 complete! Pinecone kaam kar raha hai.");
