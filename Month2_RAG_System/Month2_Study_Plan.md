# Month 2: RAG System — Complete Study Plan

RAG = Retrieval Augmented Generation
LLM ko apna data de do — wo us data ke basis pe answer kare.

---

## What is RAG?

```
Problem with plain LLM:
  - Training cutoff ke baad ka data nahi jaanta
  - Tumhara private data nahi jaanta (PDFs, docs, DB)
  - Hallucinate karta hai facts ke liye

RAG Solution:
  User Question
       ↓
  Question ko vector mein convert karo (embedding)
       ↓
  Vector DB mein similar content dhundho
       ↓
  Relevant content + Question → LLM ko bhejo
       ↓
  LLM accurate answer deta hai (tumhare data se)
```

Real-world use cases:
```
- PDF Q&A (legal docs, manuals, research papers)
- Company knowledge base chatbot
- Customer support (product docs se answer)
- Code documentation search
- Personal notes assistant
```

---

## Month 2 Overview

```
Week 1: Embeddings & Vector DB basics
Week 2: Pinecone / Weaviate integration
Week 3: PDF Q&A system banana
Week 4: Production RAG with full pipeline
```

---

## Week 1: Embeddings & Vector DB (Day 1-7)

### Day 1 — What are Embeddings?
```
Topics:
  - Text → Numbers (vectors) kaise hota hai
  - Semantic similarity kya hoti hai
  - Embedding models (text-embedding-3-small, nomic-embed)
  - Cosine similarity calculate karna

Practice:
  - Groq/OpenAI embedding API call karo
  - 2 similar sentences ka similarity score nikalo
```

### Day 2 — Embedding Models
```
Topics:
  - OpenAI text-embedding-3-small vs large
  - Open source: nomic-embed-text (free, local)
  - Sentence Transformers (Python)
  - Dimensions: 384, 768, 1536, 3072

Practice:
  - Same text, different models — similarity compare karo
  - Cost comparison: OpenAI vs free models
```

### Day 3 — Vector Databases Intro
```
Topics:
  - Vector DB kya hota hai (normal DB se fark)
  - Popular options: Pinecone, Weaviate, Chroma, Qdrant
  - Index types: HNSW, IVF
  - Similarity search: cosine, dot product, euclidean

Practice:
  - ChromaDB locally setup karo (no API key needed)
  - 10 documents store karo, query karo
```

### Day 4 — ChromaDB Hands-on
```
Topics:
  - ChromaDB install aur setup
  - Collection create karna
  - Documents add karna (with metadata)
  - Query karna (semantic search)
  - Delete/update documents

Practice:
  - 20 Node.js facts store karo ChromaDB mein
  - "How to handle errors?" query karo
  - Top 3 relevant results dekho
```

### Day 5 — Chunking Strategies
```
Topics:
  - Document chunking kya hota hai aur kyun zaroori hai
  - Fixed size chunking (500 chars)
  - Sentence-based chunking
  - Recursive chunking (LangChain style)
  - Overlap kya hota hai (50-100 chars)
  - Chunk size ka impact on retrieval quality

Practice:
  - Ek long article ko 3 different strategies se chunk karo
  - Compare karo — kaunsa better retrieval deta hai
```

### Day 6 — Retrieval Strategies
```
Topics:
  - Top-K retrieval (k=3, k=5)
  - Similarity threshold (0.7 se upar hi lo)
  - MMR (Maximal Marginal Relevance) — diversity
  - Metadata filtering (sirf "category: nodejs" wale docs)
  - Hybrid search (keyword + semantic)

Practice:
  - Same query, k=3 vs k=10 — quality compare karo
  - Metadata filter add karo
```

### Day 7 — Week 1 Revision + Mini Project
```
Mini Project: Simple Semantic Search Engine
  - 50 programming Q&A store karo ChromaDB mein
  - Query karo natural language mein
  - Top 3 results show karo with similarity score
```

---

## Week 2: Pinecone & Weaviate (Day 8-14)

### Day 8 — Pinecone Setup
```
Topics:
  - Pinecone kya hai, free tier limits
  - Index create karna (dimensions, metric)
  - Upsert vectors
  - Query karna
  - Namespaces (data isolation)

Practice:
  - Pinecone account banao (free)
  - Index create karo
  - 100 vectors upsert karo
  - Query karo
```

### Day 9 — Pinecone Advanced
```
Topics:
  - Metadata filtering in Pinecone
  - Batch upsert (1000 vectors at once)
  - Update & delete vectors
  - Stats check karna
  - Pinecone vs ChromaDB comparison

Practice:
  - Metadata ke saath vectors store karo
  - Filter query: "category = javascript AND difficulty = beginner"
```

### Day 10 — Weaviate Intro
```
Topics:
  - Weaviate kya hai (graph + vector DB)
  - Schema define karna
  - Objects add karna
  - nearText query (built-in embedding)
  - Weaviate Cloud (free sandbox)

Practice:
  - Weaviate Cloud account banao
  - Schema create karo
  - 20 objects add karo
  - nearText search karo
```

### Day 11 — Embeddings Pipeline
```
Topics:
  - Text → Embed → Store pipeline
  - Batch embedding (cost optimize)
  - Caching embeddings (same text dobara embed mat karo)
  - Rate limiting handle karna

Practice:
  - 100 documents ka batch embedding pipeline banao
  - Cache implement karo (already embedded skip karo)
```

### Day 12 — RAG Pipeline Basics
```
Topics:
  - Complete RAG flow code mein:
    Query → Embed → Search → Context → LLM → Answer
  - Context window management
  - Prompt template for RAG
  - Source citation (kahan se answer aaya)

Practice:
  - Basic RAG pipeline Node.js mein banao
  - 10 docs store karo, questions poochho
```

### Day 13 — Evaluation & Quality
```
Topics:
  - RAG quality kaise measure karein
  - Retrieval precision & recall
  - Answer relevance check
  - Hallucination detection
  - Common RAG failures aur fixes

Practice:
  - 10 test questions banao
  - Answers evaluate karo manually
```

### Day 14 — Week 2 Revision + Project
```
Mini Project: Tech FAQ Bot
  - 100 programming FAQs store karo Pinecone mein
  - RAG pipeline se answers do
  - Source show karo (kaunse doc se answer aaya)
```

---

## Week 3: PDF Q&A System (Day 15-21)

### Day 15 — PDF Parsing
```
Topics:
  - PDF se text extract karna (pdf-parse, pdfjs)
  - Tables aur images handle karna
  - Multi-page PDFs
  - Text cleaning (headers, footers remove)
  - Metadata extract karna (title, author, pages)

Practice:
  - Koi bhi PDF upload karo
  - Text extract karo
  - Pages alag alag print karo
```

### Day 16 — PDF Chunking Pipeline
```
Topics:
  - PDF specific chunking (page-aware)
  - Section detection (headings se split)
  - Overlap strategy for PDFs
  - Metadata: page number, section name store karo

Practice:
  - 10 page PDF ko chunk karo
  - Har chunk mein page number store karo
```

### Day 17 — PDF Ingestion Pipeline
```
Topics:
  - PDF upload → Parse → Chunk → Embed → Store
  - Progress tracking (large PDFs)
  - Error handling (corrupted PDFs)
  - Duplicate detection

Practice:
  - Complete ingestion pipeline banao
  - 3 different PDFs ingest karo
```

### Day 18 — PDF Q&A API
```
Topics:
  - Express API: POST /upload (PDF upload)
  - Express API: POST /ask (question poochho)
  - Multer for file upload
  - Session per PDF (alag alag PDFs ke liye alag context)

Practice:
  - Upload endpoint banao
  - Ask endpoint banao
  - Postman se test karo
```

### Day 19 — PDF Q&A UI
```
Topics:
  - Drag & drop PDF upload UI
  - Upload progress bar
  - Chat interface (same as Month 1)
  - Source highlighting (page number show karo)

Practice:
  - Frontend banao
  - PDF upload karo, questions poochho
```

### Day 20 — Multi-PDF Support
```
Topics:
  - Multiple PDFs manage karna
  - PDF list show karna
  - Switch between PDFs
  - Delete PDF (vectors bhi delete karo)

Practice:
  - 3 PDFs upload karo
  - Alag alag se questions poochho
```

### Day 21 — Week 3 Revision + Project
```
Project: Complete PDF Q&A System
  - Upload any PDF
  - Ask questions in natural language
  - Get answers with page references
  - Dark theme UI
```

---

## Week 4: Production RAG (Day 22-28)

### Day 22 — Advanced Chunking
```
Topics:
  - Semantic chunking (meaning-based split)
  - Parent-child chunking
  - Summary chunks
  - Hypothetical Document Embeddings (HyDE)
```

### Day 23 — Re-ranking
```
Topics:
  - Why re-ranking? (vector search not always best)
  - Cross-encoder re-ranking
  - Cohere Rerank API
  - BM25 + semantic hybrid

Practice:
  - Before/after re-ranking quality compare karo
```

### Day 24 — Query Enhancement
```
Topics:
  - Query expansion (synonyms add karo)
  - HyDE (hypothetical answer generate karo, use as query)
  - Multi-query retrieval
  - Step-back prompting

Practice:
  - Same question, 3 query strategies — results compare karo
```

### Day 25 — Conversation Memory in RAG
```
Topics:
  - Chat history + RAG combine karna
  - Contextual compression
  - Follow-up questions handle karna
  - "It" / "that" resolve karna (coreference)

Practice:
  - Multi-turn PDF Q&A banao
  - "Tell me more about that" handle karo
```

### Day 26 — Production Optimizations
```
Topics:
  - Embedding cache (Redis)
  - Async ingestion (queue)
  - Rate limiting
  - Cost optimization
  - Monitoring & logging

Practice:
  - Redis cache add karo embeddings ke liye
```

### Day 27 — Deploy
```
Topics:
  - Railway / Render pe deploy karna
  - Environment variables
  - File storage (AWS S3 / Cloudinary for PDFs)
  - Health checks

Practice:
  - Railway pe deploy karo
  - Live URL share karo
```

### Day 28 — Month 2 Final Project
```
Final Project: "Ask Your Data" System
  Features:
    ✓ Multiple PDF upload
    ✓ Semantic search
    ✓ Chat with history
    ✓ Source citations with page numbers
    ✓ Dark theme UI
    ✓ Deployed on Railway
```

---

## Resources

```
Embeddings:
  https://platform.openai.com/docs/guides/embeddings
  https://huggingface.co/sentence-transformers

Vector DBs:
  ChromaDB:  https://docs.trychroma.com
  Pinecone:  https://docs.pinecone.io
  Weaviate:  https://weaviate.io/developers/weaviate

RAG:
  LangChain JS: https://js.langchain.com/docs
  LlamaIndex:   https://docs.llamaindex.ai

PDF Parsing:
  pdf-parse:    https://www.npmjs.com/package/pdf-parse
  pdfjs-dist:   https://www.npmjs.com/package/pdfjs-dist
```

---

## Prerequisites Check

```
Month 1 complete kiya?
  □ LLM basics samajh aaye?
  □ OpenAI/Groq API use kar sakte ho?
  □ Node.js + Express comfortable ho?
  □ ai-chat-backend project kaam kar raha hai?

Month 2 ke liye install karo:
  npm install chromadb pdf-parse multer
  npm install @pinecone-database/pinecone  (Week 2)
```
