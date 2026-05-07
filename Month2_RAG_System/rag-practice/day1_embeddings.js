// Day 1 — Embeddings with Ollama (nomic-embed-text)
// Ollama locally run hona chahiye: ollama serve
import OpenAI from 'openai';

// Ollama client — same OpenAI SDK, sirf baseURL change
const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

// Single text ka embedding nikalo
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: "nomic-embed-text",
    input: text
  });
  return response.data[0].embedding;
}

// Cosine similarity
function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

// ─── TEST 1: Basic embedding info ───────────────────────
console.log("=== TEST 1: Embedding Info ===");
const vec = await getEmbedding("Hello World");
console.log("Dimensions:", vec.length);
console.log("First 5 values:", vec.slice(0, 5).map(v => v.toFixed(4)));
console.log("Min:", Math.min(...vec).toFixed(4));
console.log("Max:", Math.max(...vec).toFixed(4));

// ─── TEST 2: Similarity comparison ──────────────────────
console.log("\n=== TEST 2: Similarity Scores ===");
const query = "How do I handle errors in Node.js?";

const sentences = [
  "Try-catch blocks handle errors in JavaScript",
  "Node.js uses async/await for error management",
  "Python is a great programming language",
  "The weather in Mumbai is hot today"
];

const queryVec = await getEmbedding(query);
const sentVecs = await Promise.all(sentences.map(getEmbedding));

console.log(`Query: "${query}"\n`);
sentences.forEach((s, i) => {
  const score = cosineSimilarity(queryVec, sentVecs[i]);
  const bar   = "█".repeat(Math.round(score * 20));
  console.log(`${score.toFixed(4)} ${bar}`);
  console.log(`       "${s}"\n`);
});

// ─── TEST 3: Semantic Search ─────────────────────────────
console.log("=== TEST 3: Semantic Search ===");

const docs = [
  "Node.js is a JavaScript runtime built on Chrome's V8 engine",
  "Express.js is a minimal web framework for Node.js",
  "MongoDB is a NoSQL document database",
  "React is a JavaScript library for building user interfaces",
  "JWT tokens are used for authentication in web apps",
  "async/await handles asynchronous operations in JavaScript",
  "npm is the package manager for Node.js",
  "REST API uses HTTP methods like GET POST PUT DELETE",
  "Docker is a platform for containerizing applications",
  "Git is a distributed version control system"
];

async function semanticSearch(userQuery, topK = 3) {
  const qVec   = await getEmbedding(userQuery);
  const dVecs  = await Promise.all(docs.map(getEmbedding));

  return docs
    .map((doc, i) => ({ doc, score: cosineSimilarity(qVec, dVecs[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

const testQueries = [
  "How to build a web server?",
  "How to store data?",
  "How to handle async code?"
];

for (const q of testQueries) {
  console.log(`\nQuery: "${q}"`);
  const results = await semanticSearch(q);
  results.forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.doc}`)
  );
}
