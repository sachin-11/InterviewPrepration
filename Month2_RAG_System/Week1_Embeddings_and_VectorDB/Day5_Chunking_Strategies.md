# Day 5 — Chunking Strategies

RAG mein sabse important decision — document ko kaise todein?
Chunking quality directly affect karta hai retrieval accuracy.

---

## 1. Chunking Kyu Zaroori Hai?

```
Problem:
  Ek 50-page PDF hai.
  Poora PDF ek embedding mein convert karo → 1 vector
  Query: "What is the refund policy?"
  
  50 pages ka ek vector → Meaning diluted ho jaata hai
  Relevant section dhundna mushkil ho jaata hai

Solution: Chunking
  50 pages → 200 small chunks
  Har chunk ka apna vector
  Query → Most relevant chunk milta hai
  Precise answer!
```

### Chunk Size Trade-off:
```
Too Small (50 chars):
  + Very precise
  - Context missing (incomplete sentences)
  - Too many chunks (slow, expensive)

Too Large (5000 chars):
  + Full context
  - Meaning diluted
  - Less precise retrieval

Sweet spot: 200-500 chars (or 1-3 paragraphs)
```

---

## 2. Strategy 1: Fixed Size Chunking

```
Simplest approach — fixed character/word count pe split karo

"This is a long document about Node.js. It covers many topics..."
↓ chunk_size=50, overlap=10
Chunk 1: "This is a long document about Node.js. It covers"
Chunk 2: "It covers many topics about async programming..."
Chunk 3: ...
```

### Code:
```javascript
function fixedSizeChunk(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end   = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) chunks.push(chunk);

    start += chunkSize - overlap; // Overlap for context continuity
  }

  return chunks;
}

// Test
const text = "Node.js is a JavaScript runtime. ".repeat(20);
const chunks = fixedSizeChunk(text, 100, 20);
console.log(`Total chunks: ${chunks.length}`);
console.log(`Chunk 1: "${chunks[0]}"`);
console.log(`Chunk 2: "${chunks[1]}"`); // Overlap dikhega
```

### Pros/Cons:
```
Pros:
  + Simple implement karna
  + Predictable chunk sizes
  + Fast

Cons:
  - Words/sentences cut ho sakte hain
  - Context boundary ignore karta hai
  - "The answer is" → next chunk mein answer!
```

---

## 3. Strategy 2: Sentence-Based Chunking

```
Sentences ko intact rakho — natural boundaries pe split karo

"Node.js is fast. It uses V8 engine. Express is a framework."
↓ sentences_per_chunk=2, overlap=1
Chunk 1: "Node.js is fast. It uses V8 engine."
Chunk 2: "It uses V8 engine. Express is a framework."
```

### Code:
```javascript
function sentenceChunk(text, sentencesPerChunk = 3, overlap = 1) {
  // Sentences split karo
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Short fragments ignore karo

  const chunks = [];

  for (let i = 0; i < sentences.length; i += (sentencesPerChunk - overlap)) {
    const chunk = sentences
      .slice(i, i + sentencesPerChunk)
      .join(' ');

    if (chunk.trim().length > 0) chunks.push(chunk);

    if (i + sentencesPerChunk >= sentences.length) break;
  }

  return chunks;
}

// Test
const article = `Node.js is a JavaScript runtime built on Chrome's V8 engine.
It allows developers to run JavaScript on the server side.
Node.js uses an event-driven, non-blocking I/O model.
This makes it lightweight and efficient for data-intensive applications.
Express.js is the most popular web framework for Node.js.
It provides a minimal and flexible set of features for web applications.`;

const chunks = sentenceChunk(article, 2, 1);
chunks.forEach((c, i) => console.log(`Chunk ${i+1}: "${c}"\n`));
```

### Pros/Cons:
```
Pros:
  + Complete sentences (readable)
  + Natural language boundaries
  + Good for prose/articles

Cons:
  - Variable chunk sizes
  - Very long sentences → Large chunks
  - Code blocks break awkwardly
```

---

## 4. Strategy 3: Recursive Chunking (Best for Most Cases)

```
Hierarchy of separators try karo:
  1. "\n\n" (paragraphs) — pehle try karo
  2. "\n"   (lines)      — agar chunks bade hain
  3. ". "   (sentences)  — aur chote karo
  4. " "    (words)      — last resort
  5. ""     (characters) — absolute last resort

LangChain ka RecursiveCharacterTextSplitter yahi karta hai
```

### Code:
```javascript
function recursiveChunk(text, maxSize = 500, overlap = 50) {
  const separators = ["\n\n", "\n", ". ", " ", ""];

  function split(text, separatorIndex = 0) {
    // Base case: text already small enough
    if (text.length <= maxSize) return [text];

    const separator = separators[separatorIndex];

    // Last separator (characters) — force split
    if (separatorIndex === separators.length - 1) {
      const chunks = [];
      for (let i = 0; i < text.length; i += maxSize - overlap) {
        chunks.push(text.slice(i, i + maxSize));
      }
      return chunks;
    }

    // Split by current separator
    const parts = text.split(separator).filter(p => p.trim());

    const chunks = [];
    let current  = "";

    for (const part of parts) {
      const candidate = current ? current + separator + part : part;

      if (candidate.length <= maxSize) {
        current = candidate;
      } else {
        // Current chunk save karo
        if (current) chunks.push(current.trim());

        // Part bada hai? Recursively split karo
        if (part.length > maxSize) {
          chunks.push(...split(part, separatorIndex + 1));
          current = "";
        } else {
          current = part;
        }
      }
    }

    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  return split(text).filter(c => c.length > 20);
}

// Test with a real document
const document = `
# Node.js Guide

## Introduction
Node.js is a JavaScript runtime built on Chrome's V8 engine.
It allows running JavaScript outside the browser.

## Event Loop
The event loop is the core of Node.js concurrency model.
It processes callbacks from the event queue.
This enables non-blocking I/O operations.

## Async Programming
Node.js supports callbacks, promises, and async/await.
async/await is the modern way to handle asynchronous code.
Always use try/catch with async/await for error handling.
`;

const chunks = recursiveChunk(document, 200, 30);
console.log(`Total chunks: ${chunks.length}\n`);
chunks.forEach((c, i) => {
  console.log(`Chunk ${i+1} (${c.length} chars):`);
  console.log(`"${c}"\n`);
});
```

### Pros/Cons:
```
Pros:
  + Respects natural boundaries
  + Handles different content types
  + Best retrieval quality
  + Industry standard (LangChain uses this)

Cons:
  - More complex code
  - Variable chunk sizes
```

---

## 5. Strategy 4: Semantic Chunking (Advanced)

```
Idea: Similar sentences ek chunk mein rakho
      Jab topic change ho → New chunk start karo

Algorithm:
  1. Har sentence embed karo
  2. Adjacent sentences ka similarity check karo
  3. Similarity drop → Chunk boundary!

"Node.js is fast. V8 engine powers it."  → Chunk 1 (similar)
"Pizza is delicious. Italian food rocks." → Chunk 2 (topic change!)
```

### Code:
```javascript
async function semanticChunk(text, threshold = 0.7) {
  // Sentences split karo
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length === 0) return [text];

  // Sab sentences embed karo
  const embeddings = await Promise.all(sentences.map(embed));

  // Adjacent similarity check karo
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

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}
```

### Pros/Cons:
```
Pros:
  + Semantically coherent chunks
  + Best for mixed-topic documents
  + Natural topic boundaries

Cons:
  - Expensive (embed every sentence)
  - Slow for large documents
  - Threshold tuning needed
```

---

## 6. Overlap — Kyun Zaroori Hai?

```
Without overlap:
  Chunk 1: "...The answer to this question"
  Chunk 2: "is 42. This is important because..."
  
  Query: "What is the answer?"
  → Chunk 1 milega but answer nahi hai!
  → Chunk 2 milega but context nahi hai!

With overlap (50 chars):
  Chunk 1: "...The answer to this question is 42."
  Chunk 2: "The answer to this question is 42. This is important..."
  
  Query: "What is the answer?"
  → Either chunk mein complete answer hai!
```

### Overlap Size Guide:
```
Chunk Size    Recommended Overlap
──────────    ───────────────────
200 chars     20-30 chars
500 chars     50-100 chars
1000 chars    100-200 chars
2000 chars    200-400 chars

Rule: Overlap = 10-20% of chunk size
```

---

## 7. Chunk Size Guide by Content Type

```
Content Type          Chunk Size    Strategy
────────────────────  ──────────    ──────────────────
Short FAQs            100-200       Fixed/Sentence
Blog articles         300-500       Recursive
Technical docs        400-600       Recursive
Legal documents       500-800       Recursive + overlap
Code files            200-400       By function/class
Chat conversations    50-100        By message
```

---

## 8. Metadata with Chunks

```javascript
// Chunk ke saath metadata store karo — retrieval improve hota hai
function chunkWithMetadata(document, docId, strategy = "recursive") {
  const chunks = recursiveChunk(document.text, 400, 50);

  return chunks.map((chunk, i) => ({
    id:       `${docId}-chunk-${i}`,
    text:     chunk,
    metadata: {
      docId:       docId,
      chunkIndex:  i,
      totalChunks: chunks.length,
      source:      document.source || "unknown",
      chunkSize:   chunk.length,
      strategy:    strategy
    }
  }));
}

// Usage
const doc = {
  text:   "Long document text here...",
  source: "nodejs-docs.pdf"
};

const chunks = chunkWithMetadata(doc, "doc-001");
// Each chunk has: id, text, metadata (source, index, etc.)
```

---

## 9. Comparison Table

```
Strategy         Quality   Speed    Memory   Best For
───────────────  ────────  ───────  ───────  ──────────────────────
Fixed Size       Medium    Fast     Low      Simple docs, testing
Sentence-based   Good      Fast     Low      Articles, prose
Recursive        Very Good Medium   Low      Most documents (default)
Semantic         Best      Slow     High     Mixed-topic documents
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Compare Strategies
```javascript
// Same document, 3 strategies:
const doc = `Node.js is a JavaScript runtime.
It uses V8 engine. Express is a framework.
MongoDB is a database. Redis is for caching.
Security is important. Use HTTPS always.`;

const fixed     = fixedSizeChunk(doc, 80, 10);
const sentence  = sentenceChunk(doc, 2, 1);
const recursive = recursiveChunk(doc, 80, 10);

console.log("Fixed:    ", fixed.length, "chunks");
console.log("Sentence: ", sentence.length, "chunks");
console.log("Recursive:", recursive.length, "chunks");

// Kaunsa strategy best chunks deta hai?
```

### Task 2: Overlap Test
```javascript
// Same text, different overlaps:
// overlap=0   → Kya context missing hota hai?
// overlap=50  → Better?
// overlap=100 → Too much duplication?
```

### Task 3: Real Document Chunk Karo
```javascript
// Koi bhi README.md ya documentation file lo
// Recursive chunking apply karo
// ChromaDB mein store karo
// Query karo
```

### Task 4: Metadata Add Karo
```javascript
// Chunks ke saath ye metadata store karo:
// { source, chunkIndex, totalChunks, chunkSize }
// Query results mein source dikhao
```

---

Kal Day 6 mein Retrieval Strategies dekhenge —
Top-K, similarity threshold, MMR, metadata filtering.
