// Day 6 — Retrieval Strategies: Top-K, Threshold, MMR, Hybrid
// ─────────────────────────────────────────────────────────────
// HOW TO USE:
//   Step 1: STEP_1_TOPK       = true  → Run karo, result dekho
//   Step 2: STEP_2_THRESHOLD  = true  → Run karo, result dekho
//   Step 3: STEP_3_MMR        = true  → Run karo, result dekho
//   Step 4: STEP_4_HYBRID     = true  → Run karo, result dekho
//   Step 5: STEP_5_FILTER     = true  → Run karo, result dekho
// ─────────────────────────────────────────────────────────────

const STEP_1_TOPK      = false;   // ← Pehle ye chalao
const STEP_2_THRESHOLD = false;  // ← Phir ye true karo
const STEP_3_MMR       = false;  // ← Phir ye
const STEP_4_HYBRID    = true;  // ← Phir ye
const STEP_5_FILTER    = false;  // ← Last mein ye

// ─────────────────────────────────────────────────────────────

import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
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

// ─── 20 Facts Setup ──────────────────────────────────────
const facts = [
  { id: "1",  text: "Node.js is built on Chrome's V8 JavaScript engine",                   cat: "basics",      diff: "beginner"     },
  { id: "2",  text: "Node.js uses single-threaded event loop for concurrency",              cat: "basics",      diff: "beginner"     },
  { id: "3",  text: "npm is the default package manager for Node.js",                       cat: "basics",      diff: "beginner"     },
  { id: "4",  text: "package.json stores project metadata and dependencies",                cat: "basics",      diff: "beginner"     },
  { id: "5",  text: "Callbacks were the original way to handle async operations",           cat: "async",       diff: "beginner"     },
  { id: "6",  text: "Promises provide cleaner async code with .then() and .catch()",        cat: "async",       diff: "intermediate" },
  { id: "7",  text: "async/await is syntactic sugar over Promises for cleaner code",        cat: "async",       diff: "intermediate" },
  { id: "8",  text: "Promise.all runs multiple async operations in parallel",               cat: "async",       diff: "intermediate" },
  { id: "9",  text: "Worker threads allow CPU-intensive tasks without blocking event loop", cat: "performance", diff: "advanced"     },
  { id: "10", text: "Clustering uses all CPU cores by forking multiple Node processes",     cat: "performance", diff: "advanced"     },
  { id: "11", text: "Streams process data in chunks instead of loading all into memory",    cat: "performance", diff: "intermediate" },
  { id: "12", text: "The --max-old-space-size flag increases Node.js heap memory limit",    cat: "performance", diff: "advanced"     },
  { id: "13", text: "Never store secrets in code — use environment variables instead",      cat: "security",    diff: "beginner"     },
  { id: "14", text: "Always validate and sanitize user input to prevent injection attacks", cat: "security",    diff: "intermediate" },
  { id: "15", text: "Use helmet.js to set secure HTTP headers in Express apps",             cat: "security",    diff: "intermediate" },
  { id: "16", text: "Rate limiting prevents DDoS and brute force attacks on APIs",         cat: "security",    diff: "intermediate" },
  { id: "17", text: "Use meaningful variable names and write self-documenting code",        cat: "practices",   diff: "beginner"     },
  { id: "18", text: "Handle all promise rejections to avoid unhandled rejection crashes",   cat: "practices",   diff: "intermediate" },
  { id: "19", text: "Use linting tools like ESLint to maintain consistent code style",      cat: "practices",   diff: "beginner"     },
  { id: "20", text: "Write unit tests for critical functions using Jest or Mocha",          cat: "practices",   diff: "intermediate" },
];

// Collection setup
try { await chroma.deleteCollection({ name: "retrieval-test" }); } catch {}
const col = await chroma.getOrCreateCollection({ name: "retrieval-test" });
const embs = await Promise.all(facts.map(f => embed(f.text)));
await col.add({
  ids:        facts.map(f => f.id),
  embeddings: embs,
  documents:  facts.map(f => f.text),
  metadatas:  facts.map(f => ({ category: f.cat, difficulty: f.diff }))
});
console.log(`✓ Setup complete: ${await col.count()} docs loaded\n`);

// ─── Helper functions ────────────────────────────────────
async function topK(query, k = 3, filter = null) {
  const qEmb   = await embed(query);
  const params = {
    queryEmbeddings: [qEmb],
    nResults: k,
    include: ["documents", "distances", "metadatas", "embeddings"]
  };
  if (filter) params.where = filter;
  const res = await col.query(params);
  return res.documents[0].map((doc, i) => ({
    text:       doc,
    similarity: 1 - res.distances[0][i],
    metadata:   res.metadatas[0][i],
    embedding:  res.embeddings[0][i]
  }));
}

function printResults(label, results) {
  console.log(`\n📌 ${label}`);
  console.log("─".repeat(65));
  if (results.length === 0) { console.log("  ⚠️  No results"); return; }
  results.forEach((r, i) => {
    const score = r.hybridScore !== undefined
      ? `hybrid:${r.hybridScore.toFixed(3)}`
      : `sim:${r.similarity.toFixed(3)}`;
    const cat = r.metadata?.category || "";
    console.log(`  ${i+1}. [${score}] [${cat}] ${r.text.slice(0, 55)}...`);
  });
}

const QUERY = "How to handle async operations in Node.js?";
console.log(`🔍 Query: "${QUERY}"\n`);

// ═══════════════════════════════════════════════════════
// STEP 1: TOP-K
// Sabse simple — top K similar results return karo
// ═══════════════════════════════════════════════════════
if (STEP_1_TOPK) {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  STEP 1: TOP-K RETRIEVAL                        ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Concept: Query ke liye top K most similar chunks return karo");
  console.log("Problem: Always K results deta hai — even irrelevant ones!\n");

  printResults("k=1 (only best match)",  await topK(QUERY, 1));
  printResults("k=3 (recommended)",      await topK(QUERY, 3));
  printResults("k=5 (more context)",     await topK(QUERY, 5));

  console.log("\n💡 Observation: k=5 mein irrelevant results bhi aa sakte hain");
  console.log("   Next: STEP_2_THRESHOLD = true karke threshold try karo\n");
}

// ═══════════════════════════════════════════════════════
// STEP 2: SIMILARITY THRESHOLD
// Minimum score set karo — neeche wale ignore karo
// ═══════════════════════════════════════════════════════
if (STEP_2_THRESHOLD) {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  STEP 2: SIMILARITY THRESHOLD                   ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Concept: Minimum similarity score set karo");
  console.log("Benefit: Irrelevant results filter ho jaate hain\n");

  for (const threshold of [0.3, 0.45, 0.6]) {
    const results = (await topK(QUERY, 10))
      .filter(r => r.similarity >= threshold);
    printResults(`threshold=${threshold} → ${results.length} results`, results);
  }

  console.log("\n💡 Observation:");
  console.log("   0.3  = Too loose (irrelevant results)");
  console.log("   0.45 = Good balance (recommended for nomic-embed-text)");
  console.log("   0.6  = Too strict (might miss relevant results)");
  console.log("   Next: STEP_3_MMR = true karke diversity try karo\n");
}

// ═══════════════════════════════════════════════════════
// STEP 3: MMR (Maximal Marginal Relevance)
// Diverse results — duplicate chunks avoid karo
// ═══════════════════════════════════════════════════════
if (STEP_3_MMR) {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  STEP 3: MMR — DIVERSE RESULTS                  ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Concept: Relevant + Diverse results select karo");
  console.log("Benefit: Duplicate/similar chunks avoid hote hain\n");

  // MMR implementation
  async function mmr(query, k = 3, lambda = 0.7) {
    const candidates = await topK(query, 15);
    const selected   = [];
    const remaining  = [...candidates];

    while (selected.length < k && remaining.length > 0) {
      let bestScore = -Infinity, bestIdx = 0;
      remaining.forEach((c, idx) => {
        const relevance     = c.similarity;
        const maxSim        = selected.length === 0 ? 0 :
          Math.max(...selected.map(s => cosineSimilarity(c.embedding, s.embedding)));
        const score = lambda * relevance - (1 - lambda) * maxSim;
        if (score > bestScore) { bestScore = score; bestIdx = idx; }
      });
      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }
    return selected;
  }

  printResults("Top-K k=3 (may have duplicates)", await topK(QUERY, 3));
  printResults("MMR lambda=1.0 (pure relevance)", await mmr(QUERY, 3, 1.0));
  printResults("MMR lambda=0.7 (balanced)",       await mmr(QUERY, 3, 0.7));
  printResults("MMR lambda=0.3 (more diverse)",   await mmr(QUERY, 3, 0.3));

  console.log("\n💡 Observation:");
  console.log("   lambda=1.0 = Same as Top-K");
  console.log("   lambda=0.7 = Good balance (recommended)");
  console.log("   lambda=0.3 = Very diverse but less relevant");
  console.log("   Next: STEP_4_HYBRID = true karke hybrid try karo\n");
}

// ═══════════════════════════════════════════════════════
// STEP 4: HYBRID SEARCH
// Semantic + Keyword score combine karo
// ═══════════════════════════════════════════════════════
if (STEP_4_HYBRID) {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  STEP 4: HYBRID SEARCH                          ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Concept: Semantic score + Keyword score = Hybrid score");
  console.log("Benefit: Specific terms (JWT, npm, V8) better match karte hain\n");

  function kwScore(text, query) {
    const words   = query.toLowerCase().split(' ');
    const matches = words.filter(w => text.toLowerCase().includes(w));
    return matches.length / words.length;
  }

  async function hybrid(query, k = 3, alpha = 0.7) {
    const candidates = await topK(query, 15);
    return candidates
      .map(c => ({
        ...c,
        hybridScore: alpha * c.similarity + (1 - alpha) * kwScore(c.text, query)
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, k);
  }

  // Test with specific term query
  const specificQuery = "npm package manager";
  console.log(`Query: "${specificQuery}"\n`);
  printResults("Semantic only (Top-K)", await topK(specificQuery, 3));
  printResults("Hybrid alpha=0.7",      await hybrid(specificQuery, 3, 0.7));
  printResults("Hybrid alpha=0.3",      await hybrid(specificQuery, 3, 0.3));

  console.log("\n💡 Observation:");
  console.log("   Hybrid 'npm' query mein npm wala doc higher rank pe aayega");
  console.log("   alpha=0.7 = 70% semantic + 30% keyword (recommended)");
  console.log("   Next: STEP_5_FILTER = true karke metadata filter try karo\n");
}

// ═══════════════════════════════════════════════════════
// STEP 5: METADATA FILTER
// Category/difficulty ke hisaab se filter karo
// ═══════════════════════════════════════════════════════
if (STEP_5_FILTER) {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  STEP 5: METADATA FILTER                        ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("Concept: Search scope narrow karo metadata se");
  console.log("Benefit: Sirf relevant category ke docs milte hain\n");

  const q = "Best practices for Node.js";
  console.log(`Query: "${q}"\n`);

  printResults("No filter (all categories)",
    await topK(q, 3));

  printResults("Filter: category=practices",
    await topK(q, 3, { category: "practices" }));

  printResults("Filter: difficulty=beginner",
    await topK(q, 3, { difficulty: "beginner" }));

  printResults("Filter: security + intermediate",
    await topK(q, 3, { "$and": [{ category: "security" }, { difficulty: "intermediate" }] }));

  printResults("Filter: category IN [security, practices]",
    await topK(q, 5, { category: { "$in": ["security", "practices"] } }));

  console.log("\n💡 Observation:");
  console.log("   Filter se sirf relevant category ke docs aate hain");
  console.log("   Multi-source RAG mein bahut useful hai");
  console.log("\n✅ All 5 strategies complete!");
  console.log("   Best combo: MMR (lambda=0.7) + Threshold (0.45) + Metadata filter");
}

if (!STEP_1_TOPK && !STEP_2_THRESHOLD && !STEP_3_MMR && !STEP_4_HYBRID && !STEP_5_FILTER) {
  console.log("⚠️  Koi step enable nahi hai!");
  console.log("   File ke top mein STEP_1_TOPK = true karo aur run karo.");
}
