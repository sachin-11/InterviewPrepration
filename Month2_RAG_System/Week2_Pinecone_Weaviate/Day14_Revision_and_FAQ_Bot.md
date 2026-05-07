# Day 14 — Week 2 Revision + Tech FAQ Bot

Aaj Week 2 ka revision karenge aur ek complete Tech FAQ Bot banayenge.

---

## 1. Week 2 Complete Recap

### Day 8 — Pinecone Setup:
```
Index create: dimension=768, metric=cosine, serverless
Upsert: { id, values, metadata }
Query:  { vector, topK, includeMetadata, filter }
Fetch:  { ids: ["1", "2"] }
Delete: deleteOne("id") / deleteMany(filter)
```

### Day 9 — Pinecone Advanced:
```
Batch upsert: 100 vectors per batch
Filters: $eq, $ne, $in, $nin, $and, $or
Namespaces: index.namespace("name") → isolated space
Stats: describeIndexStats() → count, namespaces
```

### Day 10 — Weaviate:
```
Schema-based, self-hosted or cloud
Collection create with properties
nearVector query with Filters
Multi-tenant support
```

### Day 11 — Embeddings Pipeline:
```
Batch embed: 10 at a time → 10x faster
Cache: MD5 hash → skip re-embedding
Rate limit: 8 req/sec for Ollama
Pipeline: load cache → embed → upsert → save cache
```

### Day 12 — RAG Pipeline:
```
Flow: Question → Embed → Search → Context → LLM → Answer
temperature: 0.3 (factual)
topK: 3-5, threshold: 0.4+
Multi-turn: pass history to LLM
Citations: [Source N] in answer
```

### Day 13 — Evaluation:
```
Recall:    Relevant docs mein se kitne mile?
Precision: Retrieved docs mein se kitne relevant?
KW Score:  Expected keywords in answer?
Faithful:  Answer context se grounded?

Good scores: Recall>0.7, Precision>0.6, KW>0.5
```

---

## 2. Self Quiz

```
Q1. Pinecone index create karte waqt dimension kyun match karna zaroori hai?
Q2. Namespace kab use karein?
Q3. Embedding cache ka kya fayda hai?
Q4. RAG mein temperature 0.3 kyun use karte hain?
Q5. Retrieval recall aur precision mein kya fark hai?
Q6. Hallucination rokne ke liye prompt mein kya likhte hain?
Q7. Batch upsert kyun better hai one-by-one se?
Q8. topK=10 vs topK=3 — kab kaunsa use karein?
```

### Answers:
```
A1. Embedding model ka output dimension match karna padta hai
    nomic=768, OpenAI 3-small=1536 — mismatch = error

A2. Multi-tenant apps, multiple projects, dev/prod separation

A3. Same text dobara embed nahi hota → API calls save, faster

A4. Factual answers chahiye, creative nahi
    Low temp = deterministic, accurate

A5. Recall = relevant docs mein se kitne mile (coverage)
    Precision = retrieved docs mein se kitne relevant (quality)

A6. "Answer ONLY using context. If not in context, say I don't know."

A7. 100 docs × 1 call = 100 calls (slow)
    10 batches × 10 docs = 10 calls (10x faster)

A8. topK=3 → Precise, less noise (most cases)
    topK=10 → More context, complex questions
```

---

## 3. Tech FAQ Bot — Project

### Features:
```
✓ 50 tech Q&A store karo Pinecone mein
✓ RAG pipeline se answers do
✓ Source citations show karo
✓ Category filter support
✓ CLI interface
```

### Project Structure:
```
faq-bot/
├── data.js     ← 50 Q&A dataset
├── ingest.js   ← Pinecone mein store karo
├── bot.js      ← RAG + CLI interface
└── .env
```

---

## 4. Score Yourself

```
Week 2 complete karke ye sab karna chahiye:

□ Pinecone index create + upsert + query kar sako
□ Metadata filters use kar sako ($eq, $in, $and)
□ Namespaces samajh aaye
□ Embedding pipeline with cache implement kar sako
□ RAG pipeline end-to-end kaam kare
□ Evaluation metrics calculate kar sako
□ FAQ Bot run ho raha ho

Score:
  7/7 → Week 3 (PDF Q&A System) ke liye ready
  5-6 → Weak areas review karo
  < 5 → Day 11-13 files dobara padho
```

---

## 5. Resources

```
Pinecone Docs:  https://docs.pinecone.io
Weaviate Docs:  https://weaviate.io/developers/weaviate
RAG Guide:      https://www.pinecone.io/learn/retrieval-augmented-generation
Evaluation:     https://docs.ragas.io (RAGAS framework)
```

---

Week 3 mein PDF Q&A System banayenge —
PDF upload → parse → chunk → embed → ask questions.
