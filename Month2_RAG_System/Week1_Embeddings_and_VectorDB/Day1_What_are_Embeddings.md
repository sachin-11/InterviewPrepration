# Day 1 — What are Embeddings?

Aaj samjhenge ki text ko numbers mein kaise convert karte hain
aur ye RAG ka sabse important foundation hai.

---

## 1. Embedding Kya Hota Hai?

```
Simple definition:
  Text → Numbers ki list (vector)

"Hello"       → [0.23, -0.45, 0.12, 0.87, ...]  (1536 numbers)
"Hi there"    → [0.21, -0.43, 0.14, 0.85, ...]  (similar numbers!)
"Pizza"       → [0.89, 0.12, -0.67, 0.34, ...]  (very different)
```

### Real-life Analogy:
```
Socho ek map pe cities hain:
  Mumbai aur Pune → close to each other (similar region)
  Mumbai aur London → far apart (different region)

Embeddings mein:
  "Dog" aur "Puppy" → close vectors (similar meaning)
  "Dog" aur "Car"   → far vectors (different meaning)

Distance = Meaning ka fark
```

### Ye RAG mein kyun zaroori hai:
```
User: "How do I handle errors in Node.js?"

Without embedding:
  Keyword search → "error" word dhundho → exact match only

With embedding:
  Meaning search → "error handling", "try catch", "exception"
  sab relevant docs milenge — exact words match na ho toh bhi!
```

---

## 2. Text → Vector Kaise Hota Hai?

### Neural Network Process:
```
Step 1: Text ko tokens mein todo
        "Node.js is great" → ["Node", ".js", " is", " great"]

Step 2: Har token ko initial number assign karo (token ID)
        ["Node"=1234, ".js"=567, " is"=89, " great"=432]

Step 3: Neural network se pass karo
        Billions of parameters → context samjho
        "bank" (river) vs "bank" (money) → alag vectors

Step 4: Final vector nikalo
        [0.23, -0.45, 0.12, ...] (1536 dimensions)
```

### Dimensions kya hote hain:
```
Vector = list of numbers
Dimension = list ki length

text-embedding-3-small → 1536 dimensions
text-embedding-3-large → 3072 dimensions
nomic-embed-text       → 768 dimensions

Zyada dimensions = zyada information capture = better quality
                   but zyada storage aur slow
```

---

## 3. Semantic Similarity

### Kya hoti hai?
```
Semantic = meaning based
Similarity = kitne similar hain

"I love coding"  aur  "Programming is my passion"
  → Different words, same meaning → High similarity (0.92)

"I love coding"  aur  "The weather is nice"
  → Different words, different meaning → Low similarity (0.12)
```

### Similarity Score:
```
Score range: -1 to 1  (cosine similarity)
  1.0  = Identical meaning
  0.8+ = Very similar
  0.5  = Somewhat related
  0.0  = No relation
 -1.0  = Opposite meaning

Practical threshold:
  RAG mein 0.7+ wale docs hi use karo
```

---

## 4. Cosine Similarity — Math Samjho

### Simple Explanation:
```
2 vectors ke beech ka angle measure karo

Angle 0°  → cos(0)  = 1.0  → Same direction → Very similar
Angle 90° → cos(90) = 0.0  → Perpendicular  → No relation
Angle 180°→ cos(180)= -1.0 → Opposite       → Opposite meaning
```

### Formula:
```
cosine_similarity(A, B) = (A · B) / (|A| × |B|)

A · B   = dot product (element-wise multiply, then sum)
|A|, |B| = magnitude (length of vector)
```

### Code mein:
```javascript
function cosineSimilarity(vecA, vecB) {
  // Dot product
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);

  // Magnitudes
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  return dotProduct / (magA * magB);
}

// Simple example (2D vectors)
const vec1 = [1, 0];   // Points right
const vec2 = [1, 0];   // Same direction
const vec3 = [0, 1];   // Points up (perpendicular)

console.log(cosineSimilarity(vec1, vec2)); // 1.0 (identical)
console.log(cosineSimilarity(vec1, vec3)); // 0.0 (no relation)
```

---

## 5. Embedding Models

### OpenAI Models:
```
Model                      Dimensions  Cost/1M tokens  Best For
─────────────────────────  ──────────  ──────────────  ──────────────
text-embedding-3-small     1536        $0.02           General use, cheap
text-embedding-3-large     3072        $0.13           High accuracy needed
text-embedding-ada-002     1536        $0.10           Legacy (avoid)
```

### Free/Open Source Models:
```
Model                   Dimensions  Where to run    Quality
──────────────────────  ──────────  ──────────────  ──────────
nomic-embed-text        768         Ollama (local)  Good
all-MiniLM-L6-v2        384         Local (Python)  Fast, decent
bge-large-en-v1.5       1024        Local           Very good
mxbai-embed-large       1024        Ollama          Excellent
```

### Groq mein embedding:
```
Groq abhi embedding API provide nahi karta directly.
Options:
  1. OpenAI embedding API use karo (cheap — $0.02/1M)
  2. Ollama locally run karo (free, offline)
  3. Hugging Face Inference API (free tier)
```

---

## 6. Practical Code — Embedding API Call

### Setup:
```bash
mkdir rag-practice
cd rag-practice
npm init -y
# package.json mein "type": "module" add karo
npm install openai dotenv
```

### embeddings.js:
```javascript
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Single text ka embedding nikalo
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return response.data[0].embedding; // Array of 1536 numbers
}

// Cosine similarity calculate karo
function cosineSimilarity(vecA, vecB) {
  const dot  = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

// Test
const sentences = [
  "How do I handle errors in Node.js?",        // Query
  "Try-catch blocks are used for error handling in JavaScript",  // Relevant
  "Node.js uses async/await for error management",               // Relevant
  "Python is a great programming language",                      // Not relevant
  "The weather in Mumbai is hot today"                           // Not relevant
];

console.log("Getting embeddings...\n");

const embeddings = await Promise.all(sentences.map(getEmbedding));
const queryEmbedding = embeddings[0];

console.log(`Query: "${sentences[0]}"\n`);
console.log("Similarity scores:");
console.log("─".repeat(60));

for (let i = 1; i < sentences.length; i++) {
  const score = cosineSimilarity(queryEmbedding, embeddings[i]);
  const bar   = "█".repeat(Math.round(score * 20));
  console.log(`${score.toFixed(4)} ${bar} "${sentences[i]}"`);
}
```

### Expected Output:
```
Query: "How do I handle errors in Node.js?"

Similarity scores:
────────────────────────────────────────────────────────────
0.8923 █████████████████  "Try-catch blocks are used for error handling..."
0.8456 ████████████████   "Node.js uses async/await for error management"
0.2341 ████               "Python is a great programming language"
0.0892 █                  "The weather in Mumbai is hot today"
```

---

## 7. Batch Embeddings — Multiple Texts at Once

```javascript
// Ek API call mein multiple texts embed karo (cheaper + faster)
async function getBatchEmbeddings(texts) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts  // Array of strings
  });

  // Sort by index (order preserve karo)
  return response.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}

// Usage
const texts = [
  "What is Node.js?",
  "How does Express work?",
  "What is MongoDB?"
];

const embeddings = await getBatchEmbeddings(texts);
console.log(`Got ${embeddings.length} embeddings`);
console.log(`Each has ${embeddings[0].length} dimensions`);

// Cost check
const response = await client.embeddings.create({
  model: "text-embedding-3-small",
  input: texts
});
const tokens = response.usage.total_tokens;
const cost   = (tokens / 1_000_000) * 0.02;
console.log(`Tokens: ${tokens} | Cost: $${cost.toFixed(6)}`);
```

---

## 8. Semantic Search — Mini Implementation

```javascript
// semantic-search.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Knowledge base — ye documents store honge
const documents = [
  "Node.js is a JavaScript runtime built on Chrome's V8 engine",
  "Express.js is a minimal web framework for Node.js",
  "MongoDB is a NoSQL document database",
  "React is a JavaScript library for building user interfaces",
  "Docker is a platform for containerizing applications",
  "Git is a distributed version control system",
  "REST API uses HTTP methods like GET, POST, PUT, DELETE",
  "JWT tokens are used for authentication in web apps",
  "async/await is used to handle asynchronous operations in JavaScript",
  "npm is the package manager for Node.js"
];

async function getEmbedding(text) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return res.data[0].embedding;
}

function cosineSimilarity(a, b) {
  const dot  = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

async function semanticSearch(query, topK = 3) {
  // Query embed karo
  const queryVec = await getEmbedding(query);

  // Sab documents embed karo
  const docVecs = await Promise.all(documents.map(getEmbedding));

  // Similarity calculate karo
  const results = documents.map((doc, i) => ({
    text:       doc,
    similarity: cosineSimilarity(queryVec, docVecs[i])
  }));

  // Sort by similarity, top K lo
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// Test queries
const queries = [
  "How to build a web server?",
  "How to store data?",
  "How to handle async code?"
];

for (const query of queries) {
  console.log(`\nQuery: "${query}"`);
  console.log("─".repeat(50));

  const results = await semanticSearch(query, 3);
  results.forEach((r, i) => {
    console.log(`${i + 1}. [${r.similarity.toFixed(3)}] ${r.text}`);
  });
}
```

---

## 9. Key Takeaways

```
1. Embedding = Text ka numerical representation (vector)
2. Similar meaning = Similar vectors = Close in vector space
3. Cosine similarity = Vectors ke beech angle measure karna
4. Score 0.7+ = Relevant, 0.3- = Not relevant
5. Batch embedding = Cheaper + Faster than one-by-one
6. OpenAI text-embedding-3-small = Best value for money
7. Groq mein embedding nahi → OpenAI ya local model use karo
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: First Embedding Call
```javascript
// Ye run karo:
const embedding = await getEmbedding("Hello World");
console.log("Dimensions:", embedding.length);      // 1536
console.log("First 5 values:", embedding.slice(0, 5));
console.log("Min value:", Math.min(...embedding));
console.log("Max value:", Math.max(...embedding));
```

### Task 2: Similarity Test
```
Ye pairs test karo aur similarity score note karo:

Pair 1: "Dog" vs "Cat"              → Expected: High (0.7+)
Pair 2: "Dog" vs "Automobile"       → Expected: Low (0.3-)
Pair 3: "I am happy" vs "I am sad"  → Expected: Medium (opposite)
Pair 4: "Node.js" vs "JavaScript"   → Expected: High
Pair 5: "Pizza" vs "Machine Learning" → Expected: Very low
```

### Task 3: Build Semantic Search
```
10 apne favourite programming facts likho.
Semantic search implement karo.
Ye queries test karo:
  - "How to write clean code?"
  - "What makes JavaScript special?"
  - "Best practices for APIs?"
```

### Task 4: Cost Calculate Karo
```
Agar tumhara app:
  - 1000 documents store kare (avg 200 words each)
  - 500 queries/day

text-embedding-3-small pe monthly cost kitni hogi?
(1 word ≈ 1.3 tokens)

Answer:
  Documents: 1000 × 200 × 1.3 = 260,000 tokens (one time)
  Queries:   500 × 20 × 1.3 × 30 = 390,000 tokens/month
  Total:     650,000 tokens
  Cost:      650,000 / 1,000,000 × $0.02 = $0.013/month ← Very cheap!
```

---

Kal Day 2 mein different embedding models compare karenge
aur free alternatives practically use karenge.
