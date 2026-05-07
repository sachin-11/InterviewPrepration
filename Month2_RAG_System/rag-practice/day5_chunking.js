// Day 5 — Chunking Strategies: Fixed, Sentence, Recursive
import OpenAI from 'openai';
import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

// ─── Strategy 1: Fixed Size ──────────────────────────────
function fixedSizeChunk(text, chunkSize = 300, overlap = 50) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end   = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) chunks.push(chunk);
    start += chunkSize - overlap;
  }
  return chunks;
}

// ─── Strategy 2: Sentence-based ─────────────────────────
function sentenceChunk(text, sentencesPerChunk = 3, overlap = 1) {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const chunks = [];
  for (let i = 0; i < sentences.length; i += (sentencesPerChunk - overlap)) {
    const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
    if (chunk.trim().length > 0) chunks.push(chunk.trim());
    if (i + sentencesPerChunk >= sentences.length) break;
  }
  return chunks;
}

// ─── Strategy 3: Recursive ──────────────────────────────
function recursiveChunk(text, maxSize = 400, overlap = 50) {
  const separators = ["\n\n", "\n", ". ", " ", ""];

  function split(text, sepIdx = 0) {
    if (text.length <= maxSize) return [text];
    if (sepIdx === separators.length - 1) {
      const chunks = [];
      for (let i = 0; i < text.length; i += maxSize - overlap)
        chunks.push(text.slice(i, i + maxSize));
      return chunks;
    }

    const parts   = text.split(separators[sepIdx]).filter(p => p.trim());
    const chunks  = [];
    let current   = "";

    for (const part of parts) {
      const candidate = current ? current + separators[sepIdx] + part : part;
      if (candidate.length <= maxSize) {
        current = candidate;
      } else {
        if (current) chunks.push(current.trim());
        if (part.length > maxSize) { chunks.push(...split(part, sepIdx + 1)); current = ""; }
        else current = part;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  return split(text).filter(c => c.length > 20);
}

// ─── Test Document ───────────────────────────────────────
const document = `
Node.js Introduction

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.
It allows developers to run JavaScript code outside of a web browser.
Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.

Event Loop

The event loop is the core mechanism that allows Node.js to perform non-blocking operations.
Despite JavaScript being single-threaded, the event loop enables handling multiple concurrent operations.
When an async operation completes, its callback is added to the event queue.
The event loop continuously checks if the call stack is empty and processes queued callbacks.

Async Programming

Node.js supports three patterns for async programming: callbacks, promises, and async/await.
Callbacks were the original approach but led to callback hell with deeply nested code.
Promises provide a cleaner way to handle async operations with .then() and .catch() chains.
async/await is syntactic sugar over promises that makes async code look synchronous.
Always use try/catch blocks when using async/await to handle errors properly.

Performance

Worker threads allow CPU-intensive tasks to run without blocking the event loop.
Clustering enables using all available CPU cores by forking multiple Node.js processes.
Streams process data in chunks rather than loading everything into memory at once.
Caching with Redis can dramatically reduce database load and improve response times.
`;

// ═══════════════════════════════════════════════════════
// COMPARE ALL STRATEGIES
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  CHUNKING STRATEGY COMPARISON                   ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const fixed     = fixedSizeChunk(document, 200, 30);
const sentence  = sentenceChunk(document, 2, 1);
const recursive = recursiveChunk(document, 200, 30);

console.log(`Document length: ${document.length} chars\n`);
console.log(`Fixed Size:    ${fixed.length} chunks (avg ${Math.round(fixed.reduce((s,c)=>s+c.length,0)/fixed.length)} chars)`);
console.log(`Sentence:      ${sentence.length} chunks (avg ${Math.round(sentence.reduce((s,c)=>s+c.length,0)/sentence.length)} chars)`);
console.log(`Recursive:     ${recursive.length} chunks (avg ${Math.round(recursive.reduce((s,c)=>s+c.length,0)/recursive.length)} chars)`);

// Show first 2 chunks of each
console.log("\n--- Fixed Size (first 2 chunks) ---");
fixed.slice(0, 2).forEach((c, i) => console.log(`Chunk ${i+1} [${c.length}]: "${c.slice(0,80)}..."`));

console.log("\n--- Sentence (first 2 chunks) ---");
sentence.slice(0, 2).forEach((c, i) => console.log(`Chunk ${i+1} [${c.length}]: "${c.slice(0,80)}..."`));

console.log("\n--- Recursive (first 2 chunks) ---");
recursive.slice(0, 2).forEach((c, i) => console.log(`Chunk ${i+1} [${c.length}]: "${c.slice(0,80)}..."`));

// ═══════════════════════════════════════════════════════
// STORE RECURSIVE CHUNKS IN CHROMADB + QUERY
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STORE + QUERY (Recursive Chunks)               ║");
console.log("╚══════════════════════════════════════════════════╝\n");

try { await chroma.deleteCollection({ name: "chunking-test" }); } catch {}
const col = await chroma.getOrCreateCollection({ name: "chunking-test" });

// Store with metadata
const chunksWithMeta = recursive.map((chunk, i) => ({
  id:   `chunk-${i}`,
  text: chunk,
  meta: { chunkIndex: i, totalChunks: recursive.length, chunkSize: chunk.length, source: "nodejs-guide" }
}));

const embeddings = await Promise.all(chunksWithMeta.map(c => embed(c.text)));
await col.add({
  ids:        chunksWithMeta.map(c => c.id),
  embeddings,
  documents:  chunksWithMeta.map(c => c.text),
  metadatas:  chunksWithMeta.map(c => c.meta)
});

console.log(`✓ Stored ${recursive.length} chunks\n`);

// Query
async function queryChunks(query) {
  const qEmb    = await embed(query);
  const results = await col.query({
    queryEmbeddings: [qEmb],
    nResults: 2,
    include: ["documents", "metadatas", "distances"]
  });

  console.log(`Query: "${query}"`);
  results.documents[0].forEach((doc, i) => {
    const sim  = (1 - results.distances[0][i]).toFixed(3);
    const meta = results.metadatas[0][i];
    console.log(`  [${sim}] chunk-${meta.chunkIndex}: "${doc.slice(0, 70)}..."`);
  });
  console.log();
}

await queryChunks("How does Node.js handle concurrent requests?");
await queryChunks("What is async/await?");
await queryChunks("How to improve performance?");

console.log("✅ Done! Recursive chunking gives best results for structured docs.");
