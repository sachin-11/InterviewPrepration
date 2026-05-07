# Week 3: PDF Q&A System

---

## Overview

```
Day 15: PDF Parsing — text extract karna
Day 16: PDF Chunking Pipeline — page-aware chunks
Day 17: PDF Ingestion Pipeline — parse → chunk → embed → store
Day 18: PDF Q&A API — Express endpoints
Day 19: PDF Q&A UI — drag & drop + chat
Day 20: Multi-PDF Support
Day 21: Week 3 Revision + Complete Project
```

---

## What We'll Build

```
User uploads PDF
      ↓
Parse text (pdf-parse)
      ↓
Chunk into pieces (recursive, page-aware)
      ↓
Embed each chunk (Ollama)
      ↓
Store in Pinecone (with page metadata)
      ↓
User asks question
      ↓
RAG → Answer with page citations
```

---

## Prerequisites

```bash
npm install pdf-parse multer express
```

---

## Day 15 — PDF Parsing
```
Topics: pdf-parse, text extraction, page numbers, metadata
Practice: Any PDF → extract text → print pages
```

## Day 16 — PDF Chunking
```
Topics: Page-aware chunking, section detection, overlap
Practice: 10-page PDF → chunks with page numbers
```

## Day 17 — Ingestion Pipeline
```
Topics: Upload → Parse → Chunk → Embed → Store
Practice: 3 PDFs ingest karo
```

## Day 18 — Q&A API
```
Topics: POST /upload, POST /ask, Multer
Practice: Postman se test karo
```

## Day 19 — UI
```
Topics: Drag & drop upload, chat interface, page citations
Practice: Browser mein PDF upload + questions
```

## Day 20 — Multi-PDF
```
Topics: Multiple PDFs manage, switch, delete
Practice: 3 PDFs upload, alag alag query
```

## Day 21 — Final Project
```
Complete PDF Q&A System:
  ✓ Upload any PDF
  ✓ Ask questions in natural language
  ✓ Answers with page references
  ✓ Dark theme UI
```
