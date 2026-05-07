// cli.js — Interactive search interface
import readline from 'readline';
import { search, getIndexDocCount } from './search.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

function printResults(results, query) {
  if (results.length === 0) {
    console.log("\n❌ No results found. Try a different query.\n");
    return;
  }
  console.log(`\n✅ ${results.length} result(s) for: "${query}"\n`);
  results.forEach((r, i) => {
    const stars = "★".repeat(Math.round(r.similarity * 5));
    console.log(`${i+1}. [${r.similarity.toFixed(3)}] ${stars} [${r.category}/${r.difficulty}]`);
    console.log(`   ❓ ${r.question}`);
    console.log(`   💡 ${r.answer}\n`);
  });
}

console.log("╔══════════════════════════════════════════════════╗");
console.log("║   🔍 SEMANTIC SEARCH ENGINE — Programming Q&A  ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log("25 Q&A | Categories: javascript, nodejs, database, security, performance");
console.log("Type 'exit' to quit\n");

const docCount = await getIndexDocCount();
if (docCount === 0) {
  console.log("⚠️  Vector store is empty. Run `npm run ingest` or `node ingest.js`, then try again.\n");
}

const SEARCH_THRESHOLD = 0.25;

while (true) {
  const query = await ask('🔍 Query: ');
  if (query.toLowerCase() === 'exit') break;
  if (!query.trim()) continue;

  const cat  = await ask('📂 Category (js/node/db/sec/perf/all): ');
  const diff = await ask('📊 Difficulty (beginner/intermediate/advanced/all): ');

  const catMap  = { js: "javascript", node: "nodejs", db: "database", sec: "security", perf: "performance" };
  const catValue = cat === 'all' || !cat.trim() ? null : (catMap[cat] || cat);
  const diffValue = diff === 'all' || !diff.trim() ? null : diff;

  // Debug: show what we're searching with
  console.log(`\n🔧 Searching with: category=${catValue || 'all'}, difficulty=${diffValue || 'all'}, threshold=${SEARCH_THRESHOLD}`);

  const results = await search(query, {
    k:          5,
    threshold:  SEARCH_THRESHOLD,
    category:   catValue,
    difficulty: diffValue
  });

  printResults(results, query);
}

rl.close();
console.log("Goodbye! 👋");
