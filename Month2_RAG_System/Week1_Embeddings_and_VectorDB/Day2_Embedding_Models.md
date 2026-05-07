# Day 2 — Embedding Models

Aaj different embedding models compare karenge —
OpenAI, Ollama (free), aur kab kaunsa use karein.

---

## 1. Embedding Models Overview

```
Model                    Company    Dimensions  Cost/1M    Speed
───────────────────────  ─────────  ──────────  ─────────  ──────
text-embedding-3-small   OpenAI     1536        $0.02      Fast
text-embedding-3-large   OpenAI     3072        $0.13      Medium
text-embedding-ada-002   OpenAI     1536        $0.10      Fast
nomic-embed-text         Nomic      768         FREE       Fast
mxbai-embed-large        MixedBread 1024        FREE       Medium
all-minilm               Microsoft  384         FREE       Very Fast
```

---

## 2. Dimensions Ka Matlab

```
Dimensions = Vector ki length (numbers ki count)

384 dimensions:  [0.23, -0.45, 0.12, ...]  (384 numbers)
768 dimensions:  [0.23, -0.45, 0.12, ...]  (768 numbers)
1536 dimensions: [0.23, -0.45, 0.12, ...]  (1536 numbers)
3072 dimensions: [0.23, -0.45, 0.12, ...]  (3072 numbers)

Zyada dimensions:
  + More information capture hoti hai
  + Better accuracy (subtle differences)
  - More storage needed
  - Slower similarity search

Kam dimensions:
  + Less storage
  + Faster search
  - Less accurate
  - Similar words confuse ho sakte hain
```

---

## 3. Ollama Models — Free Alternatives

### Available Models:
```bash
# Ye models Ollama mein available hain:
ollama pull nomic-embed-text    # 274MB — Best for general use
ollama pull mxbai-embed-large   # 670MB — High quality
ollama pull all-minilm          # 46MB  — Fastest, smallest

# List karo:
ollama list
```

### Model Details:
```
nomic-embed-text:
  Dimensions: 768
  Size:       274 MB
  Best for:   General purpose, RAG
  Quality:    Good (comparable to ada-002)

mxbai-embed-large:
  Dimensions: 1024
  Size:       670 MB
  Best for:   High accuracy needed
  Quality:    Excellent (near GPT-3-large)

all-minilm:
  Dimensions: 384
  Size:       46 MB
  Best for:   Fast search, limited resources
  Quality:    Decent for simple tasks
```

---

## 4. Model Comparison — Code

```javascript
// model-comparison.js
import OpenAI from 'openai';

// Ollama client
const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

async function getEmbedding(client, model, text) {
  const start = Date.now();
  const res = await client.embeddings.create({ model, input: text });
  const time = Date.now() - start;
  return {
    vector: res.data[0].embedding,
    dimensions: res.data[0].embedding.length,
    time
  };
}

function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

// Test pairs
const testPairs = [
  { a: "Dog", b: "Cat",           label: "Similar animals" },
  { a: "Dog", b: "Car",           label: "Unrelated" },
  { a: "Node.js", b: "JavaScript",label: "Related tech" },
  { a: "Happy", b: "Sad",         label: "Opposites" },
];

const models = [
  { client: ollama, name: "nomic-embed-text" },
  { client: ollama, name: "mxbai-embed-large" },
  { client: ollama, name: "all-minilm" },
];

console.log("=== Model Comparison ===\n");

for (const pair of testPairs) {
  console.log(`\n"${pair.a}" vs "${pair.b}" (${pair.label})`);
  console.log("─".repeat(50));

  for (const model of models) {
    try {
      const embA = await getEmbedding(model.client, model.name, pair.a);
      const embB = await getEmbedding(model.client, model.name, pair.b);
      const score = cosineSimilarity(embA.vector, embB.vector);

      console.log(`${model.name.padEnd(22)} | dims: ${embA.dimensions} | score: ${score.toFixed(4)} | ${embA.time + embB.time}ms`);
    } catch (e) {
      console.log(`${model.name.padEnd(22)} | ERROR: ${e.message}`);
    }
  }
}
```

---

## 5. Speed Comparison

```javascript
// speed-test.js
import OpenAI from 'openai';

const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama"
});

async function speedTest(model, texts) {
  const start = Date.now();
  await Promise.all(texts.map(t =>
    ollama.embeddings.create({ model, input: t })
  ));
  return Date.now() - start;
}

const texts = Array.from({ length: 10 }, (_, i) =>
  `This is test sentence number ${i + 1} for speed testing`
);

console.log("=== Speed Test (10 texts) ===\n");

const models = ["nomic-embed-text", "mxbai-embed-large", "all-minilm"];

for (const model of models) {
  const time = await speedTest(model, texts);
  console.log(`${model.padEnd(22)}: ${time}ms (${(time/10).toFixed(0)}ms per text)`);
}
```

---

## 6. Quality Test — Semantic Accuracy

```javascript
// quality-test.js
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
  const res = await ollama.embeddings.create({ model, input: text });
  return res.data[0].embedding;
}

// Quality test: Kya model synonyms samajhta hai?
const qualityTests = [
  {
    query:    "How to fix a bug in code?",
    relevant: "Debugging techniques for software errors",
    irrelevant: "How to cook pasta at home"
  },
  {
    query:    "What is machine learning?",
    relevant: "AI algorithms that learn from data",
    irrelevant: "History of ancient Rome"
  },
  {
    query:    "Node.js performance optimization",
    relevant: "Improving JavaScript server speed",
    irrelevant: "Best restaurants in Mumbai"
  }
];

const models = ["nomic-embed-text", "mxbai-embed-large", "all-minilm"];

console.log("=== Quality Test ===");
console.log("(Higher relevant score + Lower irrelevant score = Better)\n");

for (const test of qualityTests) {
  console.log(`Query: "${test.query}"`);
  console.log("─".repeat(55));

  for (const model of models) {
    const qVec = await embed(model, test.query);
    const rVec = await embed(model, test.relevant);
    const iVec = await embed(model, test.irrelevant);

    const relScore = cosineSimilarity(qVec, rVec);
    const irrScore = cosineSimilarity(qVec, iVec);
    const gap      = relScore - irrScore; // Bada gap = better model

    console.log(`${model.padEnd(22)} | relevant: ${relScore.toFixed(3)} | irrelevant: ${irrScore.toFixed(3)} | gap: ${gap.toFixed(3)}`);
  }
  console.log();
}
```

---

## 7. When to Use Which Model

```
Use Case                    Recommended Model        Reason
──────────────────────────  ───────────────────────  ──────────────────────
Learning / Development      nomic-embed-text         Free, good quality
Production (budget)         text-embedding-3-small   Cheap, reliable API
Production (quality)        text-embedding-3-large   Best accuracy
Mobile / Edge device        all-minilm               Tiny (46MB)
Privacy required            Any Ollama model         Data stays local
High accuracy RAG           mxbai-embed-large        Near OpenAI quality
```

---

## 8. Switching Models — Code Pattern

```javascript
// config.js — Easy model switching
const EMBEDDING_CONFIG = {
  development: {
    provider: "ollama",
    model:    "nomic-embed-text",
    baseURL:  "http://localhost:11434/v1",
    apiKey:   "ollama"
  },
  production: {
    provider: "openai",
    model:    "text-embedding-3-small",
    baseURL:  "https://api.openai.com/v1",
    apiKey:   process.env.OPENAI_API_KEY
  }
};

const env    = process.env.NODE_ENV || "development";
const config = EMBEDDING_CONFIG[env];

// embedder.js
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: config.baseURL,
  apiKey:  config.apiKey
});

export async function embed(text) {
  const res = await client.embeddings.create({
    model: config.model,
    input: text
  });
  return res.data[0].embedding;
}

// Usage — same code, different model based on env!
// NODE_ENV=development node app.js  → Ollama (free)
// NODE_ENV=production  node app.js  → OpenAI (paid)
```

---

## 9. Quick Summary

```
Dimensions:
  Zyada = Better quality, more storage
  Kam   = Faster, less storage

Free Models (Ollama):
  nomic-embed-text  → Best free option (768 dims)
  mxbai-embed-large → High quality (1024 dims)
  all-minilm        → Fastest, smallest (384 dims)

Paid Models (OpenAI):
  3-small → Best value ($0.02/1M)
  3-large → Best quality ($0.13/1M)

Rule of thumb:
  Dev/Learning → Ollama (free, local)
  Production   → OpenAI 3-small (cheap, reliable)
  High accuracy→ OpenAI 3-large or mxbai-embed-large
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Models Pull Karo
```bash
ollama pull nomic-embed-text
ollama pull mxbai-embed-large
ollama pull all-minilm
ollama list  # Verify
```

### Task 2: Model Comparison Run Karo
```bash
node model-comparison.js
# Note karo: Kaunsa model best gap deta hai?
```

### Task 3: Speed vs Quality Trade-off
```
all-minilm vs nomic-embed-text:
  Speed difference kitna hai?
  Quality difference kitna hai?
  Kab all-minilm prefer karoge?
```

### Task 4: Config Switch Karo
```javascript
// Ye implement karo:
// NODE_ENV=development → nomic-embed-text
// NODE_ENV=production  → text-embedding-3-small (agar key hai)
// Test karo dono environments mein
```

---

Kal Day 3 mein Vector Databases dekhenge —
ChromaDB locally setup karenge aur documents store + query karenge.
