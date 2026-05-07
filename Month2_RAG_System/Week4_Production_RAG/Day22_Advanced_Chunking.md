# Day 22 — Advanced Chunking

Basic recursive chunking se better — production mein quality improve karne ke liye.

---

## 1. Semantic Chunking

### Kya hota hai:
```
Basic chunking: Fixed size pe split karo (topic change ignore)
Semantic chunking: Meaning change hone pe split karo

"Node.js is fast. V8 engine powers it. Express is a framework."
                                         ↑ Topic change here!
Chunk 1: "Node.js is fast. V8 engine powers it."
Chunk 2: "Express is a framework."
```

### Code:
```javascript
import OpenAI from 'openai';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

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

async function semanticChunk(text, threshold = 0.7) {
  // Sentences split karo
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length <= 1) return [text];

  // Sab sentences embed karo
  const embeddings = await Promise.all(sentences.map(embed));

  const chunks = [];
  let currentChunk = [sentences[0]];

  for (let i = 1; i < sentences.length; i++) {
    const sim = cosineSimilarity(embeddings[i-1], embeddings[i]);

    if (sim >= threshold) {
      // Similar → Same chunk
      currentChunk.push(sentences[i]);
    } else {
      // Topic change → New chunk
      chunks.push(currentChunk.join(' '));
      currentChunk = [sentences[i]];
    }
  }

  if (currentChunk.length > 0) chunks.push(currentChunk.join(' '));
  return chunks.filter(c => c.length > 20);
}

// Test
const text = `Node.js is a JavaScript runtime built on V8 engine.
It uses event-driven non-blocking I/O model.
Express.js is a web framework for Node.js.
It provides routing and middleware support.
MongoDB is a NoSQL document database.
It stores data as JSON-like documents.`;

const chunks = await semanticChunk(text, 0.7);
console.log(`Semantic chunks: ${chunks.length}`);
chunks.forEach((c, i) => console.log(`\nChunk ${i+1}: "${c}"`));
```

### Pros/Cons:
```
Pros:
  + Semantically coherent chunks
  + Natural topic boundaries
  + Better retrieval quality

Cons:
  - Expensive (embed every sentence)
  - Slow for large documents
  - Threshold tuning needed
```

---

## 2. Parent-Child Chunking

### Kya hota hai:
```
Problem: Small chunks = precise retrieval but missing context
         Large chunks = full context but imprecise retrieval

Solution: Two levels!
  Parent chunk: Large (500-1000 chars) → Store for context
  Child chunk:  Small (100-200 chars)  → Use for retrieval

Flow:
  Query → Search child chunks (precise)
        → Return parent chunk (full context)
```

### Code:
```javascript
function parentChildChunk(text, parentSize = 800, childSize = 200, overlap = 30) {
  // Parent chunks
  const parents = [];
  for (let i = 0; i < text.length; i += parentSize - overlap) {
    const chunk = text.slice(i, i + parentSize).trim();
    if (chunk.length > 50) parents.push({ id: `parent-${parents.length}`, text: chunk });
  }

  // Child chunks (from each parent)
  const children = [];
  parents.forEach(parent => {
    for (let i = 0; i < parent.text.length; i += childSize - overlap) {
      const chunk = parent.text.slice(i, i + childSize).trim();
      if (chunk.length > 20) {
        children.push({
          id:       `child-${children.length}`,
          text:     chunk,
          parentId: parent.id  // Link to parent!
        });
      }
    }
  });

  return { parents, children };
}

// Usage with Pinecone:
// 1. Children embed + store karo (for retrieval)
// 2. Query → Find relevant children
// 3. Children ke parentId se parent fetch karo
// 4. Parent text → LLM context mein bhejo

const { parents, children } = parentChildChunk(documentText);
console.log(`Parents: ${parents.length}, Children: ${children.length}`);
```

---

## 3. Summary Chunks

### Kya hota hai:
```
Har chunk ka ek summary bhi store karo
Query → Summary se match karo (better semantic match)
       → Original chunk return karo (full context)

Why better?
  Original: "The bcrypt function uses salt rounds to hash passwords..."
  Summary:  "Password hashing with bcrypt"
  
  Query: "How to store passwords securely?"
  → Summary matches better than original text!
```

### Code:
```javascript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function createSummaryChunks(chunks) {
  const summaryChunks = [];

  for (const chunk of chunks) {
    // LLM se summary generate karo
    const res = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages: [{
        role:    "user",
        content: `Summarize in 1 sentence (max 20 words):\n"${chunk.text}"`
      }],
      max_tokens:  50,
      temperature: 0
    });

    const summary = res.choices[0].message.content.trim();

    summaryChunks.push({
      id:           chunk.id + '-summary',
      text:         summary,        // Embed this (for retrieval)
      originalText: chunk.text,     // Return this (for context)
      originalId:   chunk.id
    });
  }

  return summaryChunks;
}

// Store summary embedding, return original text
```

---

## 4. HyDE — Hypothetical Document Embeddings

### Kya hota hai:
```
Problem: Query "How to handle errors?" aur
         Document "Use try/catch blocks for error handling"
         → Different words → Lower similarity!

HyDE Solution:
  1. Query se hypothetical answer generate karo
  2. Hypothetical answer embed karo (not query!)
  3. Search karo

Query: "How to handle errors?"
Hypothetical: "To handle errors in Node.js, use try/catch blocks
               with async/await. Always catch promise rejections..."
→ Hypothetical matches document much better!
```

### Code:
```javascript
async function hydeSearch(query, index, topK = 3) {
  // Step 1: Hypothetical answer generate karo
  const res = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages: [{
      role:    "user",
      content: `Write a short paragraph (50 words) that would answer: "${query}"`
    }],
    max_tokens:  100,
    temperature: 0.5
  });

  const hypothetical = res.choices[0].message.content;
  console.log("Hypothetical:", hypothetical.slice(0, 80) + "...");

  // Step 2: Hypothetical embed karo
  const hydeVec = await embed(hypothetical);

  // Step 3: Search
  const results = await index.query({
    vector:          hydeVec,
    topK,
    includeMetadata: true
  });

  return results.matches;
}

// Compare: Normal vs HyDE
const query = "How to handle errors in async code?";

console.log("\n=== Normal Search ===");
const normalVec = await embed(query);
const normalResults = await index.query({ vector: normalVec, topK: 3, includeMetadata: true });
normalResults.matches.forEach(m => console.log(`[${m.score.toFixed(3)}] ${m.metadata.text.slice(0, 60)}...`));

console.log("\n=== HyDE Search ===");
const hydeResults = await hydeSearch(query, index, 3);
hydeResults.forEach(m => console.log(`[${m.score.toFixed(3)}] ${m.metadata.text.slice(0, 60)}...`));
```

---

## 5. Comparison Table

```
Strategy          Quality   Speed    Memory   Best For
────────────────  ────────  ───────  ───────  ──────────────────────
Recursive         Good      Fast     Low      Default (most cases)
Semantic          Better    Slow     Medium   Mixed-topic documents
Parent-Child      Best      Medium   High     Long documents, PDFs
Summary           Better    Slow     Medium   Technical docs
HyDE              Better    Slow     Low      Vague/short queries
```

---

## 6. Practice Tasks

### Task 1: Semantic Chunking
```javascript
// Same text, recursive vs semantic chunking compare karo
// Kitne chunks? Quality kaisi?
```

### Task 2: Parent-Child
```javascript
// sample.pdf ke liye parent-child chunks banao
// Parents: 600 chars, Children: 150 chars
// Count karo: parents vs children
```

### Task 3: HyDE Test
```javascript
// Same query, normal vs HyDE search
// Scores compare karo
// Kaunsa better results deta hai?
```

---

Kal Day 23 mein Re-ranking dekhenge —
Retrieved results ko better order mein arrange karna.
