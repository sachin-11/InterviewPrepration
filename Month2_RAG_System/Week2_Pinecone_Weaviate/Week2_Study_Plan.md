# Week 2: Pinecone & Weaviate — Cloud Vector DBs

---

## Overview

```
Day 8:  Pinecone setup + first index
Day 9:  Pinecone advanced (batch, filters, namespaces)
Day 10: Weaviate intro + schema
Day 11: Embeddings pipeline (batch + cache)
Day 12: RAG pipeline basics
Day 13: Evaluation & quality
Day 14: Week 2 revision + Tech FAQ Bot project
```

---

## Why Cloud Vector DBs?

```
ChromaDB (Week 1):
  ✓ Free, local, easy setup
  ✗ Not production-ready
  ✗ No global access
  ✗ You manage the server

Pinecone / Weaviate (Week 2):
  ✓ Fully managed (no server to run)
  ✓ Globally accessible
  ✓ Auto-scaling
  ✓ Production-grade reliability
  ✓ Free tiers available
```

---

## Day 8 — Pinecone Setup
```
Topics: Account, API key, index create, upsert, query
Practice: First index + 10 vectors
```

## Day 9 — Pinecone Advanced
```
Topics: Batch upsert, metadata filters, namespaces, stats
Practice: 100 vectors + complex filters
```

## Day 10 — Weaviate Intro
```
Topics: Schema, objects, nearText query, Weaviate Cloud
Practice: Schema create + 20 objects + search
```

## Day 11 — Embeddings Pipeline
```
Topics: Batch embedding, caching, rate limiting
Practice: 100 docs pipeline with cache
```

## Day 12 — RAG Pipeline
```
Topics: Query → Embed → Search → Context → LLM → Answer
Practice: Basic RAG with Pinecone + Groq
```

## Day 13 — Evaluation
```
Topics: Retrieval precision, answer relevance, hallucination
Practice: 10 test questions evaluate karo
```

## Day 14 — Revision + Project
```
Project: Tech FAQ Bot
  - 100 FAQs store karo Pinecone mein
  - RAG pipeline se answers do
  - Source citations show karo
```

---

## Prerequisites

```bash
npm install @pinecone-database/pinecone
```

```
.env:
  PINECONE_API_KEY=your-key
  GROQ_API_KEY=your-key
```

Pinecone account: https://app.pinecone.io (free)
