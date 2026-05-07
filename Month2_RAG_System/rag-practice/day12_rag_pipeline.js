// Day 12 — Complete RAG Pipeline: Pinecone + Ollama + Groq
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const index  = pc.index("learning-index");

// ─── Embed ───────────────────────────────────────────────
async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// ─── Retrieve ────────────────────────────────────────────
async function retrieve(question, topK = 3, filter = null) {
  const qVec   = await embed(question);
  const params = { vector: qVec, topK, includeMetadata: true };
  if (filter) params.filter = filter;

  const results = await index.query(params);
  return results.matches
    .filter(m => m.score > 0.4)
    .map(m => ({ text: m.metadata.text, score: m.score, category: m.metadata.category }));
}

// ─── Generate ────────────────────────────────────────────
async function generate(question, context, history = []) {
  const messages = [
    {
      role:    "system",
      content: `You are a helpful technical assistant.
Answer using ONLY the context below. Be concise.
If the answer is not in the context, say "I don't have information about this."

Context:
${context}`
    },
    ...history,
    { role: "user", content: question }
  ];

  const res = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages,
    max_tokens:  250,
    temperature: 0.3
  });

  return res.choices[0].message.content;
}

// ─── RAG function ────────────────────────────────────────
async function rag(question, options = {}) {
  const { topK = 3, filter = null, history = [] } = options;

  const docs = await retrieve(question, topK, filter);

  if (docs.length === 0) {
    return { answer: "No relevant information found in the knowledge base.", sources: [] };
  }

  const context = docs.map((d, i) => `[${i+1}] ${d.text}`).join('\n');
  const answer  = await generate(question, context, history);

  return { answer, sources: docs };
}

// ═══════════════════════════════════════════════════════
// TEST 1: Basic RAG
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TEST 1: Basic RAG                              ║");
console.log("╚══════════════════════════════════════════════════╝");

const questions = [
  "How does Node.js handle concurrent requests?",
  "What is the best way to cache data?",
  "How to secure an API?",
  "What is async/await?",
];

for (const q of questions) {
  const result = await rag(q);
  console.log(`\nQ: ${q}`);
  console.log(`A: ${result.answer}`);
  console.log(`Sources (${result.sources.length}):`);
  result.sources.forEach((s, i) =>
    console.log(`  ${i+1}. [${s.score.toFixed(3)}] ${s.text.slice(0, 55)}...`)
  );
}

// ═══════════════════════════════════════════════════════
// TEST 2: RAG with Category Filter
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 2: RAG with Filter                        ║");
console.log("╚══════════════════════════════════════════════════╝");

const filtered = await rag("How to improve performance?", {
  filter: { category: { "$eq": "performance" } }
});
console.log("\nQ: How to improve performance? [filter: performance]");
console.log(`A: ${filtered.answer}`);

// ═══════════════════════════════════════════════════════
// TEST 3: Multi-turn Conversation
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 3: Multi-turn Conversation                ║");
console.log("╚══════════════════════════════════════════════════╝\n");

let history = [];

const turns = [
  "What is Node.js?",
  "What are its main advantages?",
  "How does it handle async operations?"
];

for (const q of turns) {
  const result = await rag(q, { history });
  console.log(`Q: ${q}`);
  console.log(`A: ${result.answer}\n`);

  // Update history
  history.push({ role: "user",      content: q              });
  history.push({ role: "assistant", content: result.answer  });
}

// ═══════════════════════════════════════════════════════
// TEST 4: Out-of-context question
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TEST 4: Out-of-context (Hallucination test)    ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const outOfContext = await rag("What is the best pizza recipe?");
console.log("Q: What is the best pizza recipe?");
console.log(`A: ${outOfContext.answer}`);
console.log("(Should say: 'I don't have information about this')\n");

console.log("✅ Day 12 complete! RAG pipeline kaam kar raha hai.");
