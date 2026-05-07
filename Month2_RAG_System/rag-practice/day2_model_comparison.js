// Day 2 — Model Comparison + Speed + Quality Tests
import OpenAI from 'openai';

const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

async function embed(model, text) {
  const start = Date.now();
  const res   = await ollama.embeddings.create({ model, input: text });
  return { vec: res.data[0].embedding, dims: res.data[0].embedding.length, ms: Date.now() - start };
}

const MODELS = ["nomic-embed-text", "mxbai-embed-large", "all-minilm"];

// ═══════════════════════════════════════════════════════
// TEST 1: Dimensions + Speed
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TEST 1: Dimensions + Speed                     ║");
console.log("╚══════════════════════════════════════════════════╝\n");

for (const model of MODELS) {
  const result = await embed(model, "Hello, this is a test sentence");
  console.log(`${model.padEnd(22)} | dims: ${result.dims} | time: ${result.ms}ms`);
}

// ═══════════════════════════════════════════════════════
// TEST 2: Similarity Scores
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 2: Similarity Scores                      ║");
console.log("╚══════════════════════════════════════════════════╝");

const pairs = [
  { a: "Dog",     b: "Cat",        label: "Similar animals  " },
  { a: "Dog",     b: "Car",        label: "Unrelated        " },
  { a: "Node.js", b: "JavaScript", label: "Related tech     " },
  { a: "Happy",   b: "Sad",        label: "Opposites        " },
];

for (const pair of pairs) {
  console.log(`\n"${pair.a}" vs "${pair.b}" — ${pair.label}`);
  for (const model of MODELS) {
    const a     = await embed(model, pair.a);
    const b     = await embed(model, pair.b);
    const score = cosineSimilarity(a.vec, b.vec);
    const bar   = "█".repeat(Math.round(score * 15));
    console.log(`  ${model.padEnd(22)} ${score.toFixed(4)} ${bar}`);
  }
}

// ═══════════════════════════════════════════════════════
// TEST 3: Quality — Relevant vs Irrelevant gap
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 3: Quality (bigger gap = better model)    ║");
console.log("╚══════════════════════════════════════════════════╝");

const qualityTests = [
  {
    query:      "How to fix a bug in code?",
    relevant:   "Debugging techniques for software errors",
    irrelevant: "How to cook pasta at home"
  },
  {
    query:      "Node.js performance optimization",
    relevant:   "Improving JavaScript server speed",
    irrelevant: "Best restaurants in Mumbai"
  }
];

for (const test of qualityTests) {
  console.log(`\nQuery: "${test.query}"`);
  console.log("─".repeat(60));
  console.log(`${"Model".padEnd(22)} | Relevant | Irrelevant | Gap`);
  console.log("─".repeat(60));

  for (const model of MODELS) {
    const q = await embed(model, test.query);
    const r = await embed(model, test.relevant);
    const i = await embed(model, test.irrelevant);

    const relScore = cosineSimilarity(q.vec, r.vec);
    const irrScore = cosineSimilarity(q.vec, i.vec);
    const gap      = relScore - irrScore;

    console.log(`${model.padEnd(22)} | ${relScore.toFixed(3)}    | ${irrScore.toFixed(3)}      | ${gap.toFixed(3)} ${gap > 0.1 ? "✓" : "✗"}`);
  }
}

console.log("\n✅ Done! Model with biggest gap = best quality");
