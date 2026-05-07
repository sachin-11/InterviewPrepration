// Day 11 — Embeddings Pipeline: Batch + Cache + Rate Limit
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs/promises';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index  = pc.index("learning-index");

// ─── Base embed ──────────────────────────────────────────
async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// ─── Cache ───────────────────────────────────────────────
const CACHE_FILE = './embedding-cache.json';
let cache = {};
let cacheHits = 0, cacheMisses = 0;

async function loadCache() {
  try {
    cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
    console.log(`✓ Cache loaded: ${Object.keys(cache).length} entries`);
  } catch { cache = {}; console.log("✓ Fresh cache started"); }
}

async function saveCache() {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache));
  console.log(`✓ Cache saved: ${Object.keys(cache).length} entries`);
}

async function cachedEmbed(text) {
  const k = crypto.createHash('md5').update(text).digest('hex');
  if (cache[k]) { cacheHits++;  return cache[k]; }
  const emb = await embed(text);
  cache[k]  = emb;
  cacheMisses++;
  return emb;
}

// ─── Rate limiter ────────────────────────────────────────
let lastCall = 0;
async function rateLimitedEmbed(text, rps = 8) {
  const wait = (1000 / rps) - (Date.now() - lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
  return cachedEmbed(text);
}

// ─── Batch pipeline ──────────────────────────────────────
async function runPipeline(docs, batchSize = 10, label = "") {
  cacheHits = 0; cacheMisses = 0;
  const start = Date.now();

  console.log(`\nPipeline${label ? ` [${label}]` : ''}: ${docs.length} docs, batch=${batchSize}`);

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch   = docs.slice(i, i + batchSize);
    const vectors = await Promise.all(batch.map(async (doc) => ({
      id:       doc.id,
      values:   await rateLimitedEmbed(doc.text),
      metadata: { text: doc.text, category: doc.category || "general" }
    })));

    await index.upsert({ records: vectors });
    process.stdout.write(`  ${Math.min(i + batchSize, docs.length)}/${docs.length} `);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n  Time: ${elapsed}s | Cache hits: ${cacheHits} | API calls: ${cacheMisses}`);
  return { elapsed, cacheHits, cacheMisses };
}

// ─── Test docs ───────────────────────────────────────────
const testDocs = [
  { id: "p1",  text: "Node.js event loop handles async operations efficiently",    category: "nodejs"    },
  { id: "p2",  text: "Express middleware processes requests in a pipeline",        category: "nodejs"    },
  { id: "p3",  text: "async/await simplifies promise-based asynchronous code",    category: "nodejs"    },
  { id: "p4",  text: "MongoDB aggregation pipeline transforms documents",          category: "database"  },
  { id: "p5",  text: "Redis pub/sub enables real-time messaging between services", category: "database"  },
  { id: "p6",  text: "JWT tokens contain encoded user claims and signature",       category: "security"  },
  { id: "p7",  text: "bcrypt hashing protects passwords from brute force",         category: "security"  },
  { id: "p8",  text: "CDN edge servers reduce latency for global users",           category: "performance"},
  { id: "p9",  text: "Connection pooling reduces database connection overhead",    category: "performance"},
  { id: "p10", text: "Horizontal scaling distributes load across multiple servers",category: "performance"},
  { id: "p11", text: "React hooks manage state and side effects in components",    category: "frontend"  },
  { id: "p12", text: "TypeScript static typing catches errors at compile time",    category: "frontend"  },
  { id: "p13", text: "Docker containers package apps with their dependencies",     category: "devops"    },
  { id: "p14", text: "CI/CD pipelines automate testing and deployment",            category: "devops"    },
  { id: "p15", text: "Kubernetes orchestrates containerized applications at scale",category: "devops"    },
];

// ═══════════════════════════════════════════════════════
// TEST 1: First run (no cache)
// ═══════════════════════════════════════════════════════
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TEST 1: First Run (no cache)                   ║");
console.log("╚══════════════════════════════════════════════════╝");

await loadCache();
const run1 = await runPipeline(testDocs, 5, "first run");
await saveCache();

// ═══════════════════════════════════════════════════════
// TEST 2: Second run (all cached)
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 2: Second Run (all cached)                ║");
console.log("╚══════════════════════════════════════════════════╝");

await loadCache();
const run2 = await runPipeline(testDocs, 5, "cached run");

// ═══════════════════════════════════════════════════════
// TEST 3: Batch size comparison
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  TEST 3: Batch Size Comparison                  ║");
console.log("╚══════════════════════════════════════════════════╝");

await loadCache();
for (const batchSize of [1, 5, 15]) {
  const result = await runPipeline(testDocs, batchSize, `batch=${batchSize}`);
}

// ═══════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  SUMMARY                                        ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log(`\nRun 1 (no cache):  ${run1.elapsed}s, ${run1.cacheMisses} API calls`);
console.log(`Run 2 (all cached): ${run2.elapsed}s, ${run2.cacheHits} cache hits`);
console.log(`\nSpeedup: ${(run1.elapsed / run2.elapsed).toFixed(1)}x faster with cache`);
console.log(`API calls saved: ${run2.cacheHits} (${((run2.cacheHits/testDocs.length)*100).toFixed(0)}%)`);
