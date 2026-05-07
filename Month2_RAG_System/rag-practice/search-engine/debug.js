// debug.js — Check actual similarity scores
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

const col = await chroma.getOrCreateCollection({
  name: "qa-search",
  metadata: { "hnsw:space": "cosine" }
});

// Check total docs
console.log("Total docs:", await col.count());

// Check what's stored
const peek = await col.peek({ limit: 3 });
console.log("\nSample metadata:", peek.metadatas);

// Raw query without any filter
const qEmb = await embed("how does async work?");
const results = await col.query({
  queryEmbeddings: [qEmb],
  nResults: 5,
  include: ["metadatas", "distances"]
});

console.log("\n=== Raw scores (no filter) ===");
results.metadatas[0].forEach((meta, i) => {
  const sim = 1 - results.distances[0][i];
  console.log(`[${sim.toFixed(4)}] [${meta.category}] ${meta.question}`);
});

// With category filter
console.log("\n=== With category=javascript filter ===");
try {
  const filtered = await col.query({
    queryEmbeddings: [qEmb],
    nResults: 5,
    where: { category: "javascript" },
    include: ["metadatas", "distances"]
  });
  filtered.metadatas[0].forEach((meta, i) => {
    const sim = 1 - filtered.distances[0][i];
    console.log(`[${sim.toFixed(4)}] ${meta.question}`);
  });
} catch(e) {
  console.log("Filter error:", e.message);
}
