// Task 3: Semantic Search — My Favourite Programming Facts
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

// ─── Step 1: Apne 10 favourite programming facts ────────
const myFacts = [
  "Write small functions that do one thing only",
  "JavaScript runs in the browser and on the server via Node.js",
  "Always use HTTPS to secure API communication",
  "Use async/await to handle asynchronous code cleanly",
  "REST APIs should use proper HTTP status codes like 200, 404, 500",
  "Variable names should describe what they hold, not how they are used",
  "Node.js event loop allows handling thousands of requests without blocking",
  "Validate all user inputs before processing to avoid security issues",
  "Use environment variables for secrets — never hardcode API keys",
  "Git helps track changes and collaborate with other developers"
];

// ─── Step 2: Embedding function ─────────────────────────
async function getEmbedding(text) {
  const res = await client.embeddings.create({
    model: "nomic-embed-text",
    input: text
  });
  return res.data[0].embedding;
}

// ─── Step 3: Cosine similarity ──────────────────────────
function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

// ─── Step 4: Semantic Search function ───────────────────
async function semanticSearch(query, facts, topK = 3) {
  console.log(`\nSearching: "${query}"`);
  console.log("─".repeat(55));

  // Query ko vector mein convert karo
  const queryVec = await getEmbedding(query);

  // Sab facts ko vectors mein convert karo
  const factVecs = await Promise.all(facts.map(getEmbedding));

  // Har fact ka similarity score calculate karo
  const scored = facts.map((fact, i) => ({
    fact,
    score: cosineSimilarity(queryVec, factVecs[i])
  }));

  // Score ke hisaab se sort karo (high → low)
  scored.sort((a, b) => b.score - a.score);

  // Top K results print karo
  scored.slice(0, topK).forEach((item, i) => {
    const bar = "█".repeat(Math.round(item.score * 20));
    console.log(`${i + 1}. [${item.score.toFixed(3)}] ${bar}`);
    console.log(`   ${item.fact}`);
  });

  // Threshold check — 0.65 se neeche = not relevant
  const relevant = scored.filter(s => s.score >= 0.65);
  if (relevant.length === 0) {
    console.log("⚠️  No highly relevant facts found (all below 0.65)");
  }

  return scored.slice(0, topK);
}

// ─── Step 5: Test queries ────────────────────────────────
console.log("╔══════════════════════════════════════════════════╗");
console.log("║         SEMANTIC SEARCH — MY FACTS              ║");
console.log("╚══════════════════════════════════════════════════╝");

console.log("\n📚 My 10 Programming Facts:");
myFacts.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

const queries = [
  "How to write clean code?",
  "What makes JavaScript special?",
  "Best practices for APIs?"
];

for (const query of queries) {
  await semanticSearch(query, myFacts, 3);
}

// ─── Bonus: Custom query ─────────────────────────────────
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║         BONUS: Extra Queries                    ║");
console.log("╚══════════════════════════════════════════════════╝");

const bonusQueries = [
  "How to keep passwords safe?",
  "How does Node.js handle many users?",
  "How to name variables properly?"
];

for (const query of bonusQueries) {
  await semanticSearch(query, myFacts, 2);
}
