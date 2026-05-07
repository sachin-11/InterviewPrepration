// Day 17 — Ingestion Pipeline: PDF → Parse → Chunk → Embed → Pinecone
import { PDFParse } from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

const INDEX_NAME = "pdf-qa";

// ─── Step 1: Parse PDF ───────────────────────────────────
async function parsePDF(pdfPath) {
  const buffer = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    return textResult.pages.map((p) =>
      p.text.replace(/\s+/g, ' ').trim()
    );
  } finally {
    await parser.destroy();
  }
}

// ─── Step 2: Chunk ───────────────────────────────────────
function recursiveChunk(text, maxSize = 400, overlap = 50) {
  const seps = ["\n\n", "\n", ". ", " "];
  function split(text, si = 0) {
    if (text.length <= maxSize) return [text.trim()].filter(c => c.length > 20);
    if (si >= seps.length) {
      const r = [];
      for (let i = 0; i < text.length; i += maxSize - overlap) r.push(text.slice(i, i + maxSize).trim());
      return r;
    }
    const parts = text.split(seps[si]).filter(p => p.trim());
    const chunks = []; let cur = "";
    for (const p of parts) {
      const cand = cur ? cur + seps[si] + p : p;
      if (cand.length <= maxSize) { cur = cand; }
      else {
        if (cur) chunks.push(cur.trim());
        if (p.length > maxSize) { chunks.push(...split(p, si + 1)); cur = ""; }
        else cur = p;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.filter(c => c.length > 20);
  }
  return split(text);
}

function chunkPages(pages, pdfName) {
  const chunks = [];
  pages.forEach((pageText, pageIdx) => {
    if (pageText.length < 30) return;
    recursiveChunk(pageText, 400, 50).forEach((chunk, i) => {
      chunks.push({
        id:      `${pdfName}-p${pageIdx+1}-c${i+1}`,
        text:    chunk,
        pageNum: pageIdx + 1,
        source:  pdfName
      });
    });
  });
  return chunks;
}

// ─── Step 3: Embed ───────────────────────────────────────
async function embedChunks(chunks) {
  const vectors = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`\r  Embedding ${i+1}/${chunks.length}`);
    const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: chunks[i].text });
    vectors.push({
      id:       chunks[i].id,
      values:   res.data[0].embedding,
      metadata: { text: chunks[i].text, pageNum: chunks[i].pageNum, source: chunks[i].source }
    });
  }
  console.log();
  return vectors;
}

// ─── Step 4: Store in Pinecone ───────────────────────────
async function storeVectors(index, vectors, batchSize = 25) {
  if (vectors.length === 0) return;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await index.upsert({ records: vectors.slice(i, i + batchSize) });
  }
}

// ─── Complete Pipeline ───────────────────────────────────
async function ingestPDF(pdfPath, index) {
  const pdfName = path.basename(pdfPath, '.pdf');
  const start   = Date.now();

  console.log(`\n📄 Ingesting: ${pdfName}`);

  // Parse
  process.stdout.write("  1. Parsing...");
  const pages = await parsePDF(pdfPath);
  console.log(` ✓ ${pages.length} pages`);

  // Chunk
  process.stdout.write("  2. Chunking...");
  const chunks = chunkPages(pages, pdfName);
  console.log(` ✓ ${chunks.length} chunks`);

  // Embed
  console.log("  3. Embedding:");
  const vectors = await embedChunks(chunks);
  console.log(`     ✓ ${vectors.length} vectors`);

  // Store
  process.stdout.write("  4. Storing in Pinecone...");
  await storeVectors(index, vectors);
  console.log(" ✓ Done");

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ⏱ Total: ${elapsed}s`);

  return { pdfName, pages: pages.length, chunks: chunks.length };
}

// ─── Setup Index ─────────────────────────────────────────
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  Day 17: PDF Ingestion Pipeline                 ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// Create index if needed
const existing = await pc.listIndexes();
if (!existing.indexes?.some(i => i.name === INDEX_NAME)) {
  console.log("Creating Pinecone index...");
  await pc.createIndex({
    name: INDEX_NAME, dimension: 768, metric: "cosine",
    spec: { serverless: { cloud: "aws", region: "us-east-1" } }
  });
  await new Promise(r => setTimeout(r, 10000));
  console.log("✓ Index ready\n");
}

const index = pc.index(INDEX_NAME);

// ─── Ingest 3 PDFs ───────────────────────────────────────
const pdfs = [
  './javascript-guide.pdf',
  './database-guide.pdf',
  './api-guide.pdf'
];

const results = [];
for (const pdf of pdfs) {
  const result = await ingestPDF(pdf, index);
  results.push(result);
}

// ─── Summary ─────────────────────────────────────────────
const stats = await index.describeIndexStats();

console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  INGESTION SUMMARY                              ║");
console.log("╚══════════════════════════════════════════════════╝\n");

results.forEach(r =>
  console.log(`  ${r.pdfName.padEnd(20)}: ${r.pages} pages → ${r.chunks} chunks`)
);
console.log(`\n  Total vectors in Pinecone: ${stats.totalRecordCount}`);
console.log("\n✅ All 3 PDFs ingested! Ready for Q&A.");
