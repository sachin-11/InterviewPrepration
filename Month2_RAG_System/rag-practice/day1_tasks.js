// Day 1 — All 4 Practice Tasks
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

async function getEmbedding(text) {
  const res = await client.embeddings.create({
    model: "nomic-embed-text",
    input: text
  });
  return res.data[0].embedding;
}

function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

// ═══════════════════════════════════════════════════════
// TASK 1: First Embedding Call
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════╗");
console.log("║  TASK 1: First Embedding Call        ║");
console.log("╚══════════════════════════════════════╝\n");

const embedding = await getEmbedding("Hello World");
console.log("Dimensions:", embedding.length);
console.log("First 5 values:", embedding.slice(0, 5).map(v => v.toFixed(4)));
console.log("Min value:", Math.min(...embedding).toFixed(4));
console.log("Max value:", Math.max(...embedding).toFixed(4));

// ═══════════════════════════════════════════════════════
// TASK 2: Similarity Test — 5 pairs
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════╗");
console.log("║  TASK 2: Similarity Test             ║");
console.log("╚══════════════════════════════════════╝\n");

const pairs = [
  { a: "Dog",        b: "Cat",              expected: "High (0.7+)" },
  { a: "Dog",        b: "Automobile",       expected: "Low (0.3-)" },
  { a: "I am happy", b: "I am sad",         expected: "Medium (opposite)" },
  { a: "Node.js",    b: "JavaScript",       expected: "High" },
  { a: "Pizza",      b: "Machine Learning", expected: "Very low" },
];

for (const pair of pairs) {
  const vecA  = await getEmbedding(pair.a);
  const vecB  = await getEmbedding(pair.b);
  const score = cosineSimilarity(vecA, vecB);
  const bar   = "█".repeat(Math.round(score * 20));
  console.log(`"${pair.a}" vs "${pair.b}"`);
  console.log(`  Score: ${score.toFixed(4)} ${bar}`);
  console.log(`  Expected: ${pair.expected}\n`);
}

// ═══════════════════════════════════════════════════════
// TASK 3: Semantic Search — 10 programming facts
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════╗");
console.log("║  TASK 3: Semantic Search             ║");
console.log("╚══════════════════════════════════════╝\n");

const programmingFacts = [
  "Use meaningful variable names to make code readable",
  "JavaScript is the only language that runs natively in browsers",
  "REST APIs use HTTP methods: GET, POST, PUT, DELETE",
  "Always validate user input to prevent security vulnerabilities",
  "Node.js is single-threaded but handles concurrency via event loop",
  "Use environment variables to store sensitive data like API keys",
  "Git commit messages should be clear and descriptive",
  "Functions should do one thing only — Single Responsibility Principle",
  "Always handle errors with try-catch in async functions",
  "Use HTTPS instead of HTTP for secure data transmission"
];

async function semanticSearch(query, topK = 3) {
  const qVec  = await getEmbedding(query);
  const dVecs = await Promise.all(programmingFacts.map(getEmbedding));

  return programmingFacts
    .map((fact, i) => ({ fact, score: cosineSimilarity(qVec, dVecs[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

const queries = [
  "How to write clean code?",
  "What makes JavaScript special?",
  "Best practices for APIs?"
];

for (const q of queries) {
  console.log(`Query: "${q}"`);
  const results = await semanticSearch(q);
  results.forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.fact}`)
  );
  console.log();
}

// ═══════════════════════════════════════════════════════
// TASK 4: Cost Calculator
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════╗");
console.log("║  TASK 4: Cost Calculator             ║");
console.log("╚══════════════════════════════════════╝\n");

const DOCS        = 1000;
const AVG_WORDS   = 200;
const QUERIES_DAY = 500;
const QUERY_WORDS = 20;
const DAYS        = 30;
const TOKEN_RATIO = 1.3;
const PRICE_PER_M = 0.02; // OpenAI text-embedding-3-small

const docTokens   = DOCS * AVG_WORDS * TOKEN_RATIO;
const queryTokens = QUERIES_DAY * QUERY_WORDS * TOKEN_RATIO * DAYS;
const total       = docTokens + queryTokens;
const cost        = (total / 1_000_000) * PRICE_PER_M;

console.log("Scenario: 1000 docs + 500 queries/day (OpenAI)");
console.log("─".repeat(45));
console.log(`Documents (one-time): ${docTokens.toLocaleString()} tokens`);
console.log(`Queries/month:        ${queryTokens.toLocaleString()} tokens`);
console.log(`Total tokens:         ${total.toLocaleString()} tokens`);
console.log(`Monthly cost:         $${cost.toFixed(4)}`);
console.log(`In rupees:            ₹${(cost * 83).toFixed(2)}`);
console.log("\nWith Ollama (local):  ₹0.00 — FREE!");
console.log("Savings:             ₹" + (cost * 83).toFixed(2) + "/month");
