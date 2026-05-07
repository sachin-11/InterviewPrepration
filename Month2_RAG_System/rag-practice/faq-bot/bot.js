// bot.js — Tech FAQ Bot with RAG + CLI
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const index  = pc.index("faq-bot");

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

async function retrieve(question, topK = 3, category = null) {
  const qVec   = await embed(question);
  const params = { vector: qVec, topK, includeMetadata: true };
  if (category) params.filter = { category: { "$eq": category } };

  const results = await index.query(params);
  return results.matches
    .filter(m => m.score > 0.35)
    .map(m => ({ question: m.metadata.question, answer: m.metadata.answer, score: m.score, category: m.metadata.category }));
}

async function ragAnswer(question, category = null) {
  const docs = await retrieve(question, 3, category);

  if (!docs.length) {
    return { answer: "I don't have information about this in my knowledge base.", sources: [] };
  }

  const context = docs.map((d, i) =>
    `[Source ${i+1}] Q: ${d.question}\nA: ${d.answer}`
  ).join('\n\n');

  const res = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages: [
      {
        role:    "system",
        content: `You are a helpful tech FAQ assistant.
Answer using ONLY the provided sources. Cite sources as [Source N].
If not in sources, say "I don't have information about this."

Sources:
${context}`
      },
      { role: "user", content: question }
    ],
    max_tokens:  300,
    temperature: 0.2
  });

  return { answer: res.choices[0].message.content, sources: docs };
}

// ─── CLI ─────────────────────────────────────────────────
const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const CATS = ["nodejs", "javascript", "database", "security", "performance"];

console.log("╔══════════════════════════════════════════════════╗");
console.log("║   🤖 TECH FAQ BOT — Powered by RAG + Llama     ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log("50 FAQs | Categories: nodejs, javascript, database, security, performance");
console.log("Type 'exit' to quit\n");

while (true) {
  const question = await ask("❓ Your question: ");
  if (question.toLowerCase() === "exit") break;
  if (!question.trim()) continue;

  const catInput = await ask("📂 Category (nodejs/js/db/sec/perf/all): ");
  const catMap   = { js: "javascript", db: "database", sec: "security", perf: "performance" };
  const category = catInput === "all" || !catInput.trim() ? null : (catMap[catInput] || catInput);

  process.stdout.write("\n🔍 Searching...\n");
  const result = await ragAnswer(question, category);

  console.log(`\n💡 Answer:\n${result.answer}`);

  if (result.sources.length) {
    console.log(`\n📚 Sources (${result.sources.length}):`);
    result.sources.forEach((s, i) =>
      console.log(`  ${i+1}. [${s.score.toFixed(3)}] [${s.category}] ${s.question}`)
    );
  }
  console.log();
}

rl.close();
console.log("Goodbye! 👋");
