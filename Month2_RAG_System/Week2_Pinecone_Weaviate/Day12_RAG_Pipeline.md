# Day 12 — RAG Pipeline

RAG = Retrieval Augmented Generation
LLM ko apna data de do — accurate answers milte hain.

---

## 1. RAG Flow

```
User Question
     ↓
1. EMBED question → vector
     ↓
2. SEARCH vector DB → top K relevant chunks
     ↓
3. BUILD context from chunks
     ↓
4. PROMPT = context + question → LLM
     ↓
5. LLM generates ANSWER (from context only)
     ↓
Answer + Sources
```

### Without RAG:
```
Q: "What is our refund policy?"
LLM: "I don't have information about your specific refund policy."
     OR hallucinated answer ← WRONG!
```

### With RAG:
```
Q: "What is our refund policy?"
→ Search docs → "Refunds within 30 days, no questions asked"
→ LLM: "Based on the documentation, refunds are available within 30 days."
✓ Accurate, grounded answer
```

---

## 2. Basic RAG Implementation

```javascript
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const index  = pc.index("learning-index");

// Step 1: Embed
async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

// Step 2: Retrieve
async function retrieve(question, topK = 3, filter = null) {
  const qVec   = await embed(question);
  const params = { vector: qVec, topK, includeMetadata: true };
  if (filter) params.filter = filter;

  const results = await index.query(params);
  return results.matches
    .filter(m => m.score > 0.4)  // Threshold
    .map(m => ({
      text:     m.metadata.text,
      score:    m.score,
      category: m.metadata.category
    }));
}

// Step 3: Generate answer
async function generateAnswer(question, context) {
  const prompt = `You are a helpful assistant. Answer the question using ONLY the provided context.
If the answer is not in the context, say "I don't have information about this."

Context:
${context}

Question: ${question}

Answer:`;

  const response = await groq.chat.completions.create({
    model:      "llama-3.3-70b-versatile",
    messages:   [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.3  // Low temp for factual answers
  });

  return response.choices[0].message.content;
}

// Step 4: Complete RAG
async function rag(question, options = {}) {
  const { topK = 3, filter = null, showSources = true } = options;

  // Retrieve relevant docs
  const docs = await retrieve(question, topK, filter);

  if (docs.length === 0) {
    return { answer: "No relevant information found.", sources: [] };
  }

  // Build context
  const context = docs.map((d, i) => `[${i+1}] ${d.text}`).join('\n');

  // Generate answer
  const answer = await generateAnswer(question, context);

  return { answer, sources: docs };
}

// Test
const result = await rag("How does Node.js handle concurrent requests?");
console.log("Answer:", result.answer);
console.log("\nSources:");
result.sources.forEach((s, i) =>
  console.log(`  ${i+1}. [${s.score.toFixed(3)}] ${s.text}`)
);
```

---

## 3. RAG with Conversation History

```javascript
// Multi-turn RAG — context + history
async function ragWithHistory(question, history = [], options = {}) {
  const docs    = await retrieve(question, options.topK || 3);
  const context = docs.map(d => d.text).join('\n');

  const messages = [
    {
      role:    "system",
      content: `You are a helpful assistant. Answer using ONLY the provided context.
Context:
${context}`
    },
    ...history,  // Previous conversation
    { role: "user", content: question }
  ];

  const response = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    messages,
    max_tokens:  300,
    temperature: 0.3
  });

  const answer = response.choices[0].message.content;

  // Update history
  history.push({ role: "user",      content: question });
  history.push({ role: "assistant", content: answer   });

  return { answer, sources: docs, history };
}

// Multi-turn conversation
let history = [];

const q1 = await ragWithHistory("What is Node.js?", history);
console.log("Q1:", q1.answer);

const q2 = await ragWithHistory("What are its main use cases?", q1.history);
console.log("Q2:", q2.answer);

const q3 = await ragWithHistory("How does it compare to Python?", q2.history);
console.log("Q3:", q3.answer);
```

---

## 4. RAG Prompt Templates

```javascript
// Different prompt styles

// Strict — only from context
const STRICT_PROMPT = `Answer ONLY using the context below.
If not in context, say "I don't know."

Context: {context}
Question: {question}`;

// Helpful — context + general knowledge
const HELPFUL_PROMPT = `Use the context to answer. You may add relevant general knowledge.

Context: {context}
Question: {question}`;

// Structured — JSON output
const STRUCTURED_PROMPT = `Answer the question using the context.
Return JSON: { "answer": "...", "confidence": "high/medium/low", "source_used": true/false }

Context: {context}
Question: {question}`;

function buildPrompt(template, context, question) {
  return template
    .replace('{context}', context)
    .replace('{question}', question);
}
```

---

## 5. Source Citation

```javascript
async function ragWithCitations(question, topK = 3) {
  const docs    = await retrieve(question, topK);
  const context = docs.map((d, i) =>
    `[Source ${i+1}]: ${d.text}`
  ).join('\n\n');

  const prompt = `Answer the question using the sources below.
Cite sources as [Source N] in your answer.

${context}

Question: ${question}
Answer (with citations):`;

  const response = await groq.chat.completions.create({
    model:      "llama-3.3-70b-versatile",
    messages:   [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0.3
  });

  return {
    answer:  response.choices[0].message.content,
    sources: docs.map((d, i) => ({ id: i+1, text: d.text, score: d.score }))
  };
}

// Output example:
// "Node.js uses an event-driven model [Source 1] which allows
//  handling concurrent requests efficiently [Source 2]."
```

---

## 6. RAG Quality Checks

```javascript
// Check if answer is grounded in context
async function checkGrounding(answer, context) {
  const prompt = `Is this answer grounded in the context?
Answer: "${answer}"
Context: "${context}"
Reply with JSON: { "grounded": true/false, "reason": "..." }`;

  const res = await groq.chat.completions.create({
    model:           "llama-3.3-70b-versatile",
    messages:        [{ role: "user", content: prompt }],
    max_tokens:      100,
    response_format: { type: "json_object" }
  });

  return JSON.parse(res.choices[0].message.content);
}
```

---

## 7. Quick Summary

```
RAG Pipeline:
  1. Embed question
  2. Search vector DB (topK=3, threshold=0.4)
  3. Build context from results
  4. Prompt = system + context + question
  5. LLM generates grounded answer

Key settings:
  temperature: 0.3 (factual, not creative)
  topK: 3-5 (enough context, not too noisy)
  threshold: 0.4+ (only relevant docs)

Prompt tips:
  "Answer ONLY using context" → Prevents hallucination
  "If not in context, say I don't know" → Honest fallback
  Cite sources → Verifiable answers

Multi-turn:
  Pass conversation history to LLM
  Context retrieved fresh each turn
```

---

## 8. Practice Tasks

### Task 1: Basic RAG
```javascript
// rag() function implement karo
// 5 questions test karo
// Sources print karo
```

### Task 2: Multi-turn
```javascript
// 3-turn conversation karo:
// Q1: "What is Node.js?"
// Q2: "What are its advantages?"
// Q3: "How does it compare to Python?"
// History maintain karo
```

### Task 3: Citation RAG
```javascript
// ragWithCitations() implement karo
// Answer mein [Source N] citations aane chahiye
```

---

Kal Day 13 mein RAG Evaluation dekhenge —
Retrieval quality, answer relevance, hallucination detection.
