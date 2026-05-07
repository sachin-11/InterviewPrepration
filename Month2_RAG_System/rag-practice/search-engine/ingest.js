// ingest.js — Store Q&A data into ChromaDB
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import { qaData } from './data.js';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

console.log("🚀 Starting ingestion...\n");

try { await chroma.deleteCollection({ name: "qa-search" }); } catch {}
const col = await chroma.getOrCreateCollection({
  name: "qa-search",
  metadata: { "hnsw:space": "cosine" }  // cosine similarity use karo
});

console.log(`Embedding ${qaData.length} Q&A pairs...`);

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
console.log("✓ Run: node cli.js to start searching!\n");
