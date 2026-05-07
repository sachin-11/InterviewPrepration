// Task 4: Embedding Cost Calculator
// Different scenarios aur models ka cost compare karo

// ─── Pricing (per 1 Million tokens) ─────────────────────
const PRICING = {
  "text-embedding-3-small": 0.02,   // OpenAI — cheapest
  "text-embedding-3-large": 0.13,   // OpenAI — best quality
  "text-embedding-ada-002": 0.10,   // OpenAI — legacy
  "ollama-local":           0.00,   // FREE (local)
};

const USD_TO_INR = 83;
const TOKEN_RATIO = 1.3; // 1 word ≈ 1.3 tokens

// ─── Calculator Function ─────────────────────────────────
function calculateCost({
  docs,
  avgWordsPerDoc,
  queriesPerDay,
  avgWordsPerQuery = 20,
  days = 30,
  model = "text-embedding-3-small"
}) {
  const pricePerM = PRICING[model];

  // Document tokens (one-time ingestion)
  const docTokens = docs * avgWordsPerDoc * TOKEN_RATIO;

  // Query tokens (recurring monthly)
  const queryTokens = queriesPerDay * avgWordsPerQuery * TOKEN_RATIO * days;

  // Total
  const totalTokens = docTokens + queryTokens;

  // Cost
  const docCost   = (docTokens   / 1_000_000) * pricePerM;
  const queryCost = (queryTokens / 1_000_000) * pricePerM;
  const totalCost = docCost + queryCost;

  return {
    docTokens:   Math.round(docTokens),
    queryTokens: Math.round(queryTokens),
    totalTokens: Math.round(totalTokens),
    docCost,
    queryCost,
    totalCost,
    totalCostINR: totalCost * USD_TO_INR
  };
}

function printResult(label, result, model) {
  console.log(`\n📊 ${label}`);
  console.log("─".repeat(50));
  console.log(`Model:              ${model}`);
  console.log(`Doc tokens:         ${result.docTokens.toLocaleString()} (one-time)`);
  console.log(`Query tokens/month: ${result.queryTokens.toLocaleString()}`);
  console.log(`Total tokens:       ${result.totalTokens.toLocaleString()}`);
  console.log(`Doc cost:           $${result.docCost.toFixed(4)}`);
  console.log(`Query cost/month:   $${result.queryCost.toFixed(4)}`);
  console.log(`Total/month:        $${result.totalCost.toFixed(4)} (₹${result.totalCostINR.toFixed(2)})`);
}

// ════════════════════════════════════════════════════════
// SCENARIO 1: Assignment (1000 docs, 500 queries/day)
// ════════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║           EMBEDDING COST CALCULATOR             ║");
console.log("╚══════════════════════════════════════════════════╝");

const scenario1 = calculateCost({
  docs:            1000,
  avgWordsPerDoc:  200,
  queriesPerDay:   500,
  model:           "text-embedding-3-small"
});

console.log("\n🎯 SCENARIO 1: Assignment Values");
console.log("   1000 docs × 200 words + 500 queries/day");
console.log("─".repeat(50));
console.log(`Documents: 1000 × 200 × 1.3 = ${scenario1.docTokens.toLocaleString()} tokens`);
console.log(`Queries:   500 × 20 × 1.3 × 30 = ${scenario1.queryTokens.toLocaleString()} tokens`);
console.log(`Total:     ${scenario1.totalTokens.toLocaleString()} tokens`);
console.log(`Cost:      ${scenario1.totalTokens.toLocaleString()} / 1,000,000 × $0.02 = $${scenario1.totalCost.toFixed(4)}/month`);
console.log(`In rupees: ₹${scenario1.totalCostINR.toFixed(2)}/month ← Very cheap!`);

// ════════════════════════════════════════════════════════
// SCENARIO 2: Small startup
// ════════════════════════════════════════════════════════
const scenario2 = calculateCost({
  docs:            500,
  avgWordsPerDoc:  300,
  queriesPerDay:   100,
  model:           "text-embedding-3-small"
});
printResult("SCENARIO 2: Small Startup (500 docs, 100 queries/day)", scenario2, "text-embedding-3-small");

// ════════════════════════════════════════════════════════
// SCENARIO 3: Medium SaaS product
// ════════════════════════════════════════════════════════
const scenario3 = calculateCost({
  docs:            10000,
  avgWordsPerDoc:  500,
  queriesPerDay:   5000,
  model:           "text-embedding-3-small"
});
printResult("SCENARIO 3: Medium SaaS (10k docs, 5k queries/day)", scenario3, "text-embedding-3-small");

// ════════════════════════════════════════════════════════
// MODEL COMPARISON — Same scenario, different models
// ════════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║           MODEL COMPARISON                      ║");
console.log("║   1000 docs + 500 queries/day                   ║");
console.log("╚══════════════════════════════════════════════════╝");

const baseConfig = { docs: 1000, avgWordsPerDoc: 200, queriesPerDay: 500 };

Object.entries(PRICING).forEach(([model, price]) => {
  const result = calculateCost({ ...baseConfig, model });
  const bar    = price === 0 ? "FREE!" : `$${result.totalCost.toFixed(4)}/month (₹${result.totalCostINR.toFixed(2)})`;
  console.log(`\n  ${model}`);
  console.log(`  Cost: ${bar}`);
});

// ════════════════════════════════════════════════════════
// SAVINGS CALCULATOR — OpenAI vs Ollama
// ════════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║           OLLAMA SAVINGS                        ║");
console.log("╚══════════════════════════════════════════════════╝");

const openaiCost = calculateCost({ ...baseConfig, model: "text-embedding-3-small" });
const ollamaCost = calculateCost({ ...baseConfig, model: "ollama-local" });

const monthlySaving = openaiCost.totalCost - ollamaCost.totalCost;
const yearlySaving  = monthlySaving * 12;

console.log(`\nOpenAI cost/month:  $${openaiCost.totalCost.toFixed(4)} (₹${openaiCost.totalCostINR.toFixed(2)})`);
console.log(`Ollama cost/month:  $0.0000 (₹0.00)`);
console.log(`Monthly savings:    $${monthlySaving.toFixed(4)} (₹${(monthlySaving * USD_TO_INR).toFixed(2)})`);
console.log(`Yearly savings:     $${yearlySaving.toFixed(4)} (₹${(yearlySaving * USD_TO_INR).toFixed(2)})`);
console.log("\n💡 Conclusion: Ollama for learning/dev, OpenAI for production");

// ════════════════════════════════════════════════════════
// BREAK-EVEN POINT — Kab OpenAI worth it hai?
// ════════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║           WHEN IS OPENAI WORTH IT?              ║");
console.log("╚══════════════════════════════════════════════════╝\n");

console.log("Scale          | Ollama | OpenAI small | OpenAI large");
console.log("─".repeat(60));

const scales = [
  { label: "Learning/Dev  ", docs: 100,    queries: 50    },
  { label: "Small project ", docs: 1000,   queries: 500   },
  { label: "Medium SaaS   ", docs: 10000,  queries: 5000  },
  { label: "Large product ", docs: 100000, queries: 50000 },
];

scales.forEach(scale => {
  const ollama = calculateCost({ ...scale, model: "ollama-local" });
  const small  = calculateCost({ ...scale, model: "text-embedding-3-small" });
  const large  = calculateCost({ ...scale, model: "text-embedding-3-large" });

  console.log(
    `${scale.label} | FREE   | $${small.totalCost.toFixed(2).padStart(8)}/mo | $${large.totalCost.toFixed(2).padStart(8)}/mo`
  );
});

console.log("\n✅ Use Ollama when: Learning, development, privacy needed");
console.log("✅ Use OpenAI when: Production, best quality needed, no GPU");
