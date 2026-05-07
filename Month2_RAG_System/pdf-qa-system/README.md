# PDF Q&A System

Upload any PDF and ask questions in natural language.
Answers come with page references.

## Features
- Drag & drop PDF upload
- Multiple PDFs — switch between them
- RAG pipeline (Pinecone + Ollama + Groq/Llama)
- Page citations in answers
- Delete PDFs
- Dark theme UI

## Tech Stack
- Node.js + Express
- pdf-parse (PDF text extraction)
- Ollama nomic-embed-text (embeddings, free)
- Pinecone (vector database)
- Groq Llama 3.3 (LLM, free)

## Setup

```bash
npm install
```

`.env` file:
```
PINECONE_API_KEY=your-key
GROQ_API_KEY=your-key
PORT=3001
```

## Run

```bash
# Create sample PDFs (optional)
node create_pdfs.js

# Start server
node server.js
```

Open: http://localhost:3001

## How it works

```
PDF Upload → Parse pages → Chunk text → Embed (Ollama) → Store (Pinecone)
Question  → Embed → Search Pinecone → Context → Llama → Answer + Page refs
```
