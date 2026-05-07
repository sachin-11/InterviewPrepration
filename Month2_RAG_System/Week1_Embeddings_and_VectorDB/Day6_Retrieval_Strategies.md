# Day 6 — Retrieval Strategies

Chunks store ho gaye — ab unhe effectively retrieve karna seekhenge.
Retrieval quality = RAG quality. Ye sabse important step hai.

---

## 1. Top-K Retrieval

### Kya hota hai:
```
Query ke liye top K most similar chunks return karo

k=1  → Sirf best match
k=3  → Top 3 matches (recommended)
k=5  → Top 5 matches
k=10 → Top 10 matches
```

### K ka impact:
```
Small K (1-2):
  + Fast, cheap (less tokens to LLM)
  + Precise context
  - Miss kar sakta hai relevant info

Large K (8-10):
  + More context, less chance of missing
  - Noisy (irrelevant chunks bhi aa jaate hain)
  - Expensive (more tokens to LLM)
  - LLM confused ho sakta hai

Sweet spot: K=3 to 5
```

### Code:
```javascript
async function topKRetrieval(query, k = 3) {
  const qEmb    = await embed(query);
  const results = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: k,
    include: ["documents", "distances", "metadatas"]
  });

  return results.documents[0].map((doc, i) => ({
    text:       doc,
    similarity: 1 - results.distances[0][i],
    metadata:   results.metadatas[0][i]
  }));
}

// Compare k=1, k=3, k=5
const query = "How does Node.js handle async operations?";

for (const k of [1, 3, 5]) {
  const results = await topKRetrieval(query, k);
  console.log(`\nK=${k}:`);
  results.forEach((r, i) =>
    console.log(`  ${i+1}. [${r.similarity.toFixed(3)}] ${r.text.slice(0, 60)}...`)
  );
}
```

---

## 2. Similarity Threshold

### Kya hota hai:
```
Minimum similarity score set karo
Score se neeche wale chunks ignore karo

Without threshold:
  K=3 → Always 3 results (even if irrelevant!)
  
With threshold (0.5):
  K=3 → 0, 1, 2, ya 3 results (only relevant ones)
```

### Code:
```javascript
async function thresholdRetrieval(query, k = 5, threshold = 0.5) {
  const qEmb    = await embed(query);
  const results = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: k,
    include: ["documents", "distances"]
  });

  // Filter by threshold
  const filtered = results.documents[0]
    .map((doc, i) => ({
      text:       doc,
      similarity: 1 - results.distances[0][i]
    }))
    .filter(r => r.similarity >= threshold);

  return filtered;
}

// Test different thresholds
const query = "How to secure Node.js APIs?";

for (const threshold of [0.3, 0.5, 0.7]) {
  const results = await thresholdRetrieval(query, 10, threshold);
  console.log(`Threshold ${threshold}: ${results.length} results`);
  results.forEach(r =>
    console.log(`  [${r.similarity.toFixed(3)}] ${r.text.slice(0, 55)}...`)
  );
  console.log();
}
```

### Threshold Guide (nomic-embed-text):
```
0.3  → Very loose (many results, some irrelevant)
0.45 → Balanced (recommended for most cases)
0.6  → Strict (fewer but highly relevant)
0.7+ → Very strict (might miss relevant chunks)

Note: Different models ke liye different thresholds!
  nomic-embed-text: 0.4-0.5
  OpenAI 3-small:   0.6-0.7
  mxbai-embed-large: 0.5-0.6
```

---

## 3. MMR — Maximal Marginal Relevance

### Problem with Top-K:
```
Query: "How to handle errors in Node.js?"

Top-3 results (without MMR):
  1. [0.85] Always use try/catch with async/await
  2. [0.83] Handle promise rejections with try/catch  ← DUPLICATE!
  3. [0.81] Use try/catch blocks for error handling   ← DUPLICATE!

All 3 say the same thing — no diversity!
```

### MMR Solution:
```
Balance relevance + diversity

Algorithm:
  1. Most relevant chunk select karo
  2. Next chunk: Relevant to query BUT different from selected chunks
  3. Repeat until K chunks selected

Result:
  1. [0.85] Always use try/catch with async/await
  2. [0.79] Use error middleware in Express for centralized handling
  3. [0.72] Log errors with proper context for debugging
  
  Diverse! Each chunk adds new information.
```

### Code:
```javascript
function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

async function mmrRetrieval(query, k = 3, lambda = 0.5, fetchK = 10) {
  // Step 1: Fetch more candidates than needed
  const qEmb    = await embed(query);
  const results = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: fetchK,
    include: ["documents", "distances", "embeddings"]
  });

  const candidates = results.documents[0].map((doc, i) => ({
    text:       doc,
    similarity: 1 - results.distances[0][i],
    embedding:  results.embeddings[0][i]
  }));

  // Step 2: MMR selection
  const selected = [];
  const remaining = [...candidates];

  while (selected.length < k && remaining.length > 0) {
    let bestScore = -Infinity;
    let bestIdx   = 0;

    remaining.forEach((candidate, idx) => {
      // Relevance to query
      const relevance = candidate.similarity;

      // Max similarity to already selected chunks
      const maxSimilarity = selected.length === 0 ? 0 :
        Math.max(...selected.map(s =>
          cosineSimilarity(candidate.embedding, s.embedding)
        ));

      // MMR score: balance relevance and diversity
      // lambda=1 → pure relevance, lambda=0 → pure diversity
      const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx   = idx;
      }
    });

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

// Compare Top-K vs MMR
const query = "How to handle errors in Node.js?";

console.log("=== Top-K Results ===");
const topK = await topKRetrieval(query, 3);
topK.forEach((r, i) => console.log(`${i+1}. [${r.similarity.toFixed(3)}] ${r.text.slice(0, 60)}...`));

console.log("\n=== MMR Results (lambda=0.5) ===");
const mmr = await mmrRetrieval(query, 3, 0.5);
mmr.forEach((r, i) => console.log(`${i+1}. [${r.similarity.toFixed(3)}] ${r.text.slice(0, 60)}...`));
```

### Lambda Values:
```
lambda = 1.0 → Pure relevance (same as Top-K)
lambda = 0.7 → Mostly relevant, some diversity (recommended)
lambda = 0.5 → Balanced (good default)
lambda = 0.3 → More diverse, less relevant
lambda = 0.0 → Pure diversity (random-ish)
```

---

## 4. Metadata Filtering

### Basic Filter:
```javascript
// Sirf specific source ke chunks
const results = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 3,
  where: { source: "nodejs-docs" }
});

// Sirf specific difficulty
const results2 = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 3,
  where: { difficulty: "beginner" }
});
```

### Advanced Filters:
```javascript
// Multiple conditions
const results = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 5,
  where: {
    "$and": [
      { category:   { "$in": ["security", "practices"] } },
      { difficulty: { "$ne": "advanced" } }
    ]
  }
});

// Numeric filters
const results2 = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 5,
  where: {
    "$and": [
      { chunkSize: { "$gte": 100 } },
      { chunkSize: { "$lte": 500 } }
    ]
  }
});

// OR condition
const results3 = await collection.query({
  queryEmbeddings: [qEmb],
  nResults: 5,
  where: {
    "$or": [
      { category: "security" },
      { category: "performance" }
    ]
  }
});
```

---

## 5. Hybrid Search (Keyword + Semantic)

```
Problem with pure semantic search:
  Query: "JWT token expiry"
  Semantic: Finds "authentication" docs (good)
  But misses: Exact "JWT" mentions (bad for specific terms)

Hybrid solution:
  Semantic score + Keyword score → Combined ranking
```

### Simple Hybrid Implementation:
```javascript
function keywordScore(text, query) {
  const queryWords = query.toLowerCase().split(' ');
  const textLower  = text.toLowerCase();
  const matches    = queryWords.filter(w => textLower.includes(w));
  return matches.length / queryWords.length; // 0 to 1
}

async function hybridSearch(query, k = 3, alpha = 0.7) {
  // alpha = weight for semantic (1-alpha = keyword weight)
  const qEmb    = await embed(query);
  const results = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: k * 3, // Fetch more, then re-rank
    include: ["documents", "distances"]
  });

  const reranked = results.documents[0].map((doc, i) => {
    const semanticScore = 1 - results.distances[0][i];
    const kwScore       = keywordScore(doc, query);
    const hybridScore   = alpha * semanticScore + (1 - alpha) * kwScore;

    return { text: doc, semanticScore, kwScore, hybridScore };
  });

  return reranked
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, k);
}

// Test
const results = await hybridSearch("JWT token authentication", 3);
results.forEach(r => {
  console.log(`Hybrid: ${r.hybridScore.toFixed(3)} | Semantic: ${r.semanticScore.toFixed(3)} | KW: ${r.kwScore.toFixed(3)}`);
  console.log(`  ${r.text.slice(0, 60)}...`);
});
```

---

## 6. Complete Retrieval Pipeline

```javascript
// Production-ready retrieval function
async function retrieve(query, options = {}) {
  const {
    k          = 3,
    threshold  = 0.4,
    filter     = null,
    strategy   = "topk",  // "topk", "mmr", "hybrid"
    lambda     = 0.7,     // MMR lambda
    alpha      = 0.7,     // Hybrid alpha
  } = options;

  let results;

  switch (strategy) {
    case "mmr":
      results = await mmrRetrieval(query, k, lambda);
      break;
    case "hybrid":
      results = await hybridSearch(query, k, alpha);
      break;
    default:
      results = await topKRetrieval(query, k, filter);
  }

  // Apply threshold
  results = results.filter(r =>
    (r.similarity || r.hybridScore || 0) >= threshold
  );

  return results;
}

// Usage
const r1 = await retrieve("How to handle errors?", { strategy: "topk", k: 3 });
const r2 = await retrieve("How to handle errors?", { strategy: "mmr",  k: 3 });
const r3 = await retrieve("JWT authentication",    { strategy: "hybrid", k: 3 });
```

---

## 7. Quick Summary

```
Top-K:
  Simple, fast
  Always returns K results (even irrelevant)
  Best for: Simple RAG, testing

Threshold:
  Filter by minimum similarity
  Variable result count
  Best for: Production (quality over quantity)

MMR:
  Diverse results (no duplicates)
  lambda controls relevance vs diversity
  Best for: Long documents, many similar chunks

Metadata Filter:
  Narrow search scope
  Combine with any strategy
  Best for: Multi-source RAG, categorized docs

Hybrid:
  Semantic + keyword combined
  alpha controls balance
  Best for: Technical terms, specific names

Recommended defaults:
  strategy: "mmr"
  k: 3-5
  threshold: 0.45
  lambda: 0.7
```

---

## 8. Practice Tasks (Aaj Karo)

### Task 1: Top-K Comparison
```javascript
// Same query, k=1, k=3, k=5, k=10
// Observe: Quality vs quantity trade-off
```

### Task 2: Threshold Experiment
```javascript
// threshold=0.3, 0.5, 0.7
// Count results at each threshold
// Kaunsa threshold best balance deta hai?
```

### Task 3: MMR vs Top-K
```javascript
// Query: "How to write clean code?"
// Top-K results: Kitne duplicate hain?
// MMR results: Zyada diverse?
```

### Task 4: Build Complete Retriever
```javascript
// retrieve() function implement karo
// Support: topk, mmr, hybrid strategies
// Test all 3 on same query
// Compare results
```

---

Kal Day 7 — Week 1 Revision + Mini Project:
Simple Semantic Search Engine banayenge.
