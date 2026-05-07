
// Day 13 — RAG Evaluation: Retrieval + Answer + Faithfulness
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const index  = pc.index("learning-index");

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

async function retrieve(question, topK = 3) {
  const qVec   = await embed(question);
  const results = await index.query({ vector: qVec, topK, includeMetadata: true });
  return results.matches
    .filter(m => m.score > 0.4)
    .map(m => ({ text: m.metadata.text, score: m.score }));
}

async function rag(question, topK = 3) {
  const docs    = await retrieve(question, topK);
  if (!docs.length) return { answer: "I don't have information about this.", sources: [] };

  const context = docs.map((d, i) => `[${i+1}] ${d.text}`).join('\n');
  const res     = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: `Answer ONLY using context. If not in context, say "I don't have information about this."\n\nContext:\n${context}` },
      { role: "user",   content: question }
    ],
    max_tokens:  200,
    temperature: 0.2
  });

  return { answer: res.choices[0].message.content, sources: docs };
}

// ─── Metrics ─────────────────────────────────────────────
function recall(retrieved, relevant) {
  if (!relevant.length) return 1;
  const hits = retrieved.filter(d => relevant.some(r => d.text.toLowerCase().includes(r.toLowerCase())));
  return hits.length / relevant.length;
}

function precision(retrieved, relevant) {
  if (!retrieved.length) return 0;
  const hits = retrieved.filter(d => relevant.some(r => d.text.toLowerCase().includes(r.toLowerCase())));
  return hits.length / retrieved.length;
}

function f1(p, r) {
  return (p + r === 0) ? 0 : 2 * p * r / (p + r);
}

function kwScore(answer, keywords) {
  const a = answer.toLowerCase();
  return keywords.filter(k => a.includes(k.toLowerCase())).length / keywords.length;
}

// ─── Test cases ──────────────────────────────────────────
const testCases = [
  { q: "How does Node.js handle concurrent requests?",  expected: ["event loop"],          relevant: ["event loop", "concurrent", "async"] },
  { q: "What is Redis used for?",                       expected: ["caching"],              relevant: ["Redis", "cache", "memory"]          },
  { q: "How to secure an API?",                         expected: ["JWT", "rate limiting"], relevant: ["JWT", "authentication", "rate"]     },
  { q: "What is async/await?",                          expected: ["promises"],             relevant: ["async", "await", "promise"]         },
  { q: "How to improve Node.js performance?",           expected: ["worker", "cluster"],    relevant: ["worker", "cluster", "stream"]       },
];

// ═══════════════════════════════════════════════════════
// TEST 1: Retrieval Evaluation
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TEST 1: Retrieval Evaluation                   ║");
console.log("╚══════════════════════════════════════════════════╝\n");

console.log("Question                                    | Recall | Prec  | F1");
console.log("─".repeat(70));

let totalR = 0, totalP = 0;

for (const tc of testCases) {
  const docs = await retrieve(tc.q, 3);
  const r    = recall(docs, tc.relevant);
  const p    = precision(docs, tc.relevant);
  const f    = f1(p, r);

  totalR += r; totalP += p;
  console.log(`${tc.q.slice(0, 42).padEnd(43)}| ${r.toFixed(2)}   | ${p.toFixed(2)}  | ${f.toFixed(2)}`);
}

const avgR = totalR / testCases.length;
const avgP = totalP / testCases.length;
console.log("─".repeat(70));
console.log(`${"AVERAGE".padEnd(43)}| ${avgR.toFixed(2)}   | ${avgP.toFixed(2)}  | ${f1(avgP, avgR).toFixed(2)}`);

// ═══════════════════════════════════════════════════════
// TEST 2: Answer Quality
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 2: Answer Quality (Keyword Score)         ║");
console.log("╚══════════════════════════════════════════════════╝\n");

let totalKW = 0;

for (const tc of testCases) {
  const result = await rag(tc.q);
  const kw     = kwScore(result.answer, tc.expected);
  totalKW += kw;

  const mark = kw >= 0.5 ? "✓" : "✗";
  console.log(`${mark} [${kw.toFixed(2)}] Q: ${tc.q.slice(0, 45)}...`);
  console.log(`       A: ${result.answer.slice(0, 80)}...`);
  console.log(`       Expected keywords: ${tc.expected.join(", ")}\n`);
}

console.log(`Average KW Score: ${(totalKW / testCases.length).toFixed(2)}`);

// ═══════════════════════════════════════════════════════
// TEST 3: Hallucination Test
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 3: Hallucination Test                     ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const outOfContextQ = [
  "What is the best pizza recipe?",
  "Who won the cricket world cup 2024?",
  "What is the weather in Mumbai today?"
];

for (const q of outOfContextQ) {
  const result = await rag(q);
  const refused = result.answer.toLowerCase().includes("don't have") ||
                  result.answer.toLowerCase().includes("not in context") ||
                  result.answer.toLowerCase().includes("no information");

  console.log(`Q: ${q}`);
  console.log(`A: ${result.answer.slice(0, 100)}`);
  console.log(`Hallucination check: ${refused ? "✓ Correctly refused" : "✗ Possible hallucination!"}\n`);
}

// ═══════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  EVALUATION SUMMARY                             ║");
console.log("╚══════════════════════════════════════════════════╝\n");

console.log(`Retrieval Recall:    ${avgR.toFixed(2)} ${avgR > 0.7 ? "✓ Good" : "✗ Needs improvement"}`);
console.log(`Retrieval Precision: ${avgP.toFixed(2)} ${avgP > 0.6 ? "✓ Good" : "✗ Needs improvement"}`);
console.log(`Answer KW Score:     ${(totalKW/testCases.length).toFixed(2)} ${totalKW/testCases.length > 0.5 ? "✓ Good" : "✗ Needs improvement"}`);
console.log("\nImprovement tips:");
console.log("  Low recall    → Increase topK, lower threshold");
console.log("  Low precision → Better chunking, metadata filter");
console.log("  Hallucination → Stricter prompt, lower temperature");
