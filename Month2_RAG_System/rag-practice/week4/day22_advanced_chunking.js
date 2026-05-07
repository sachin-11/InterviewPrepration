// Day 22 — Advanced Chunking: Semantic, Parent-Child, HyDE
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index  = pc.index("learning-index");

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

// ─── Recursive chunking (baseline) ──────────────────────
function recursiveChunk(text, maxSize = 300) {
  const seps = ["\n\n", "\n", ". ", " "];
  function split(text, si = 0) {
    if (text.length <= maxSize) return [text.trim()].filter(c => c.length > 20);
    if (si >= seps.length) return [text.slice(0, maxSize).trim()];
    const parts = text.split(seps[si]).filter(p => p.trim());
    const chunks = []; let cur = "";
    for (const p of parts) {
      const cand = cur ? cur + seps[si] + p : p;
      if (cand.length <= maxSize) { cur = cand; }
      else { if (cur) chunks.push(cur.trim()); cur = p.length > maxSize ? (chunks.push(...split(p, si+1)), "") : p; }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.filter(c => c.length > 20);
  }
  return split(text);
}

// ─── Semantic chunking ───────────────────────────────────
async function semanticChunk(text, threshold = 0.7) {
  const sentences = text.replace(/([.!?])\s+/g, '$1\n').split('\n')
    .map(s => s.trim()).filter(s => s.length > 15);
  if (sentences.length <= 1) return [text];

  const embeddings = await Promise.all(sentences.map(embed));
  const chunks = []; let current = [sentences[0]];

  for (let i = 1; i < sentences.length; i++) {
    const sim = cosineSimilarity(embeddings[i-1], embeddings[i]);
    if (sim >= threshold) current.push(sentences[i]);
    else { chunks.push(current.join(' ')); current = [sentences[i]]; }
  }
  if (current.length) chunks.push(current.join(' '));
  return chunks.filter(c => c.length > 20);
}

// ─── Parent-Child chunking ───────────────────────────────
function parentChildChunk(text, parentSize = 600, childSize = 150, overlap = 30) {
  const parents = [];
  for (let i = 0; i < text.length; i += parentSize - overlap) {
    const chunk = text.slice(i, i + parentSize).trim();
    if (chunk.length > 50) parents.push({ id: `p${parents.length}`, text: chunk });
  }

  const children = [];
  parents.forEach(parent => {
    for (let i = 0; i < parent.text.length; i += childSize - overlap) {
      const chunk = parent.text.slice(i, i + childSize).trim();
      if (chunk.length > 20) children.push({ id: `c${children.length}`, text: chunk, parentId: parent.id });
    }
  });

  return { parents, children };
}

// ─── HyDE Search ─────────────────────────────────────────
async function hydeSearch(query, topK = 3) {
  const res = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: `Write a 40-word paragraph answering: "${query}"` }],
    max_tokens: 80, temperature: 0.5
  });
  const hypothetical = res.choices[0].message.content;
  const hydeVec      = await embed(hypothetical);
  const results      = await index.query({ vector: hydeVec, topK, includeMetadata: true });
  return { hypothetical, matches: results.matches };
}

// ─── Test document ───────────────────────────────────────
const doc = `Node.js is a JavaScript runtime built on Chrome's V8 engine. It uses event-driven non-blocking I/O. This makes it lightweight and efficient for data-intensive applications.

Express.js is the most popular web framework for Node.js. It provides routing, middleware, and HTTP utilities. Middleware functions execute during the request-response cycle.

MongoDB is a NoSQL document database. It stores data as flexible JSON-like documents. Mongoose provides an elegant ODM for MongoDB with schema validation.

Security is critical in Node.js applications. Always validate user input to prevent injection attacks. Use JWT tokens for stateless authentication. Implement rate limiting to prevent DDoS attacks.`;

// ═══════════════════════════════════════════════════════
// TEST 1: Recursive vs Semantic Chunking
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TEST 1: Recursive vs Semantic Chunking         ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const recursive = recursiveChunk(doc, 200);
const semantic  = await semanticChunk(doc, 0.65);

console.log(`Recursive: ${recursive.length} chunks`);
recursive.forEach((c, i) => console.log(`  ${i+1}. [${c.length}c] "${c.slice(0, 60)}..."`));

console.log(`\nSemantic:  ${semantic.length} chunks`);
semantic.forEach((c, i) => console.log(`  ${i+1}. [${c.length}c] "${c.slice(0, 60)}..."`));

// ═══════════════════════════════════════════════════════
// TEST 2: Parent-Child Chunking
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 2: Parent-Child Chunking                  ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const { parents, children } = parentChildChunk(doc, 400, 120, 20);
console.log(`Parents: ${parents.length} | Children: ${children.length}`);
console.log(`\nParent 0 (${parents[0].text.length} chars):`);
console.log(`"${parents[0].text.slice(0, 100)}..."`);
console.log(`\nChildren of parent 0:`);
children.filter(c => c.parentId === 'p0').forEach((c, i) =>
  console.log(`  Child ${i+1} [${c.text.length}c]: "${c.text.slice(0, 60)}..."`)
);

// ═══════════════════════════════════════════════════════
// TEST 3: HyDE vs Normal Search
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 3: HyDE vs Normal Search                  ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const query = "How to handle errors in async code?";

// Normal search
const normalVec     = await embed(query);
const normalResults = await index.query({ vector: normalVec, topK: 3, includeMetadata: true });

console.log(`Query: "${query}"\n`);
console.log("Normal Search:");
normalResults.matches.forEach((m, i) =>
  console.log(`  ${i+1}. [${m.score.toFixed(3)}] ${String(m.metadata?.text || "").slice(0, 55)}...`)
);

// HyDE search
const hydeResult = await hydeSearch(query, 3);
console.log(`\nHyDE Hypothetical: "${hydeResult.hypothetical.slice(0, 80)}..."`);
console.log("\nHyDE Search:");
hydeResult.matches.forEach((m, i) =>
  console.log(`  ${i+1}. [${m.score.toFixed(3)}] ${String(m.metadata?.text || "").slice(0, 55)}...`)
);

console.log("\n✅ Day 22 complete!");
