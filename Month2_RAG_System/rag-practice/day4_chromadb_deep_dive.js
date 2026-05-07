// Day 4 — ChromaDB Deep Dive: 20 facts + complex queries + CRUD
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

// ─── 20 Node.js Facts ────────────────────────────────────
const facts = [
  { id: "1",  text: "Node.js is built on Chrome's V8 JavaScript engine",                    category: "basics",      difficulty: "beginner"     },
  { id: "2",  text: "Node.js uses single-threaded event loop for concurrency",               category: "basics",      difficulty: "beginner"     },
  { id: "3",  text: "npm is the default package manager for Node.js",                        category: "basics",      difficulty: "beginner"     },
  { id: "4",  text: "package.json stores project metadata and dependencies",                 category: "basics",      difficulty: "beginner"     },
  { id: "5",  text: "Callbacks were the original way to handle async operations in Node.js", category: "async",       difficulty: "beginner"     },
  { id: "6",  text: "Promises provide cleaner async code with .then() and .catch()",         category: "async",       difficulty: "intermediate" },
  { id: "7",  text: "async/await is syntactic sugar over Promises for cleaner code",         category: "async",       difficulty: "intermediate" },
  { id: "8",  text: "Promise.all runs multiple async operations in parallel",                category: "async",       difficulty: "intermediate" },
  { id: "9",  text: "Worker threads allow CPU-intensive tasks without blocking event loop",  category: "performance", difficulty: "advanced"     },
  { id: "10", text: "Clustering uses all CPU cores by forking multiple Node processes",      category: "performance", difficulty: "advanced"     },
  { id: "11", text: "Streams process data in chunks instead of loading all into memory",     category: "performance", difficulty: "intermediate" },
  { id: "12", text: "The --max-old-space-size flag increases Node.js heap memory limit",     category: "performance", difficulty: "advanced"     },
  { id: "13", text: "Never store secrets in code — use environment variables instead",       category: "security",    difficulty: "beginner"     },
  { id: "14", text: "Always validate and sanitize user input to prevent injection attacks",  category: "security",    difficulty: "intermediate" },
  { id: "15", text: "Use helmet.js to set secure HTTP headers in Express apps",              category: "security",    difficulty: "intermediate" },
  { id: "16", text: "Rate limiting prevents DDoS and brute force attacks on APIs",          category: "security",    difficulty: "intermediate" },
  { id: "17", text: "Use meaningful variable names and write self-documenting code",         category: "practices",   difficulty: "beginner"     },
  { id: "18", text: "Handle all promise rejections to avoid unhandled rejection crashes",    category: "practices",   difficulty: "intermediate" },
  { id: "19", text: "Use linting tools like ESLint to maintain consistent code style",       category: "practices",   difficulty: "beginner"     },
  { id: "20", text: "Write unit tests for critical functions using Jest or Mocha",           category: "practices",   difficulty: "intermediate" },
];

// ═══════════════════════════════════════════════════════
// STEP 1: Setup + Ingest
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 1: Ingest 20 Facts                        ║");
console.log("╚══════════════════════════════════════════════════╝\n");

try { await chroma.deleteCollection({ name: "nodejs-deep" }); } catch {}

const collection = await chroma.getOrCreateCollection({
  name: "nodejs-deep",
  metadata: { "hnsw:space": "cosine" }
});

console.log("Embedding 20 facts (batch)...");
const embeddings = await Promise.all(facts.map(f => embed(f.text)));

await collection.add({
  ids:        facts.map(f => f.id),
  embeddings,
  documents:  facts.map(f => f.text),
  metadatas:  facts.map(f => ({ category: f.category, difficulty: f.difficulty }))
});

console.log(`✓ Total: ${await collection.count()} documents\n`);

// ═══════════════════════════════════════════════════════
// STEP 2: Semantic Queries
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  STEP 2: Semantic Queries                       ║");
console.log("╚══════════════════════════════════════════════════╝");

async function search(query, options = {}) {
  const { filter, n = 3, threshold = 0.4 } = options;
  const qEmb = await embed(query);
  const params = { queryEmbeddings: [qEmb], nResults: n, include: ["documents", "metadatas", "distances"] };
  if (filter) params.where = filter;

  const results = await collection.query(params);

  console.log(`\nQuery: "${query}"${filter ? ` [${JSON.stringify(filter)}]` : ''}`);
  console.log("─".repeat(65));

  results.documents[0].forEach((doc, i) => {
    const sim  = (1 - results.distances[0][i]).toFixed(3);
    const meta = results.metadatas[0][i];
    const mark = parseFloat(sim) >= threshold ? "✓" : "✗";
    console.log(`${mark} [${sim}] [${meta.category}/${meta.difficulty}]`);
    console.log(`  ${doc}`);
  });
}

await search("How to handle async operations?");
await search("How to improve Node.js performance?");
await search("How to keep my app secure?");

// ═══════════════════════════════════════════════════════
// STEP 3: Filtered Queries
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 3: Filtered Queries                       ║");
console.log("╚══════════════════════════════════════════════════╝");

await search("Best coding practices", { filter: { category: "practices" } });
await search("What to learn first?",  { filter: { difficulty: "beginner" } });
await search("How to scale Node.js?", { filter: { difficulty: "advanced" } });

// Multi-filter
await search("How to secure APIs?", {
  filter: { "$and": [{ category: "security" }, { difficulty: "intermediate" }] }
});

// ═══════════════════════════════════════════════════════
// STEP 4: CRUD Operations
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 4: CRUD Operations                        ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// UPDATE
const before = await collection.get({ ids: ["1"] });
console.log("UPDATE — Before:", before.documents[0]);

const newText = "Node.js is built on Google's V8 engine and runs JavaScript on the server";
await collection.update({ ids: ["1"], documents: [newText], embeddings: [await embed(newText)] });

const after = await collection.get({ ids: ["1"] });
console.log("UPDATE — After: ", after.documents[0]);

// DELETE
console.log(`\nDELETE — Count before: ${await collection.count()}`);
await collection.delete({ ids: ["20"] });
console.log(`DELETE — Count after:  ${await collection.count()}`);

// GET specific
console.log("\nGET — Async docs (5,6,7):");
const specific = await collection.get({ ids: ["5", "6", "7"], include: ["documents"] });
specific.documents.forEach((doc, i) => console.log(`  ${specific.ids[i]}: ${doc.slice(0, 55)}...`));

// PEEK
console.log("\nPEEK — First 3:");
const peek = await collection.peek({ limit: 3 });
peek.documents.forEach((doc, i) => console.log(`  ${peek.ids[i]}: ${doc.slice(0, 50)}...`));

// ═══════════════════════════════════════════════════════
// STEP 5: Threshold Analysis
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 5: Threshold Analysis                     ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const tQuery = "How to handle errors in async code?";
const tEmb   = await embed(tQuery);
const all    = await collection.query({
  queryEmbeddings: [tEmb],
  nResults: 19,
  include: ["documents", "distances"]
});

console.log(`Query: "${tQuery}"\n`);
console.log("Score  | Relevant? | Document");
console.log("─".repeat(70));

all.documents[0].forEach((doc, i) => {
  const sim = (1 - all.distances[0][i]).toFixed(3);
  const rel = parseFloat(sim) >= 0.45 ? "✓ YES" : "✗ NO ";
  console.log(`${sim}  | ${rel}    | ${doc.slice(0, 45)}...`);
});

// ═══════════════════════════════════════════════════════
// STEP 6: Category Stats
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  STEP 6: Collection Stats                       ║");
console.log("╚══════════════════════════════════════════════════╝\n");

for (const cat of ["basics", "async", "performance", "security", "practices"]) {
  const r = await collection.get({ where: { category: cat }, include: ["documents"] });
  console.log(`${cat.padEnd(12)}: ${r.documents.length} docs`);
}
console.log(`${"TOTAL".padEnd(12)}: ${await collection.count()} docs`);
