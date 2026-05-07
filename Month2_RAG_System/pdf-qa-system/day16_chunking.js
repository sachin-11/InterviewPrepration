// Day 16 — PDF Chunking: Page-aware chunks with metadata
import { PDFParse } from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';

// ─── Recursive chunker ───────────────────────────────────
function recursiveChunk(text, maxSize = 400, overlap = 50) {
  const separators = ["\n\n", "\n", ". ", " "];

  function split(text, sepIdx = 0) {
    if (text.length <= maxSize) return [text.trim()].filter(c => c.length > 20);
    if (sepIdx >= separators.length) {
      const chunks = [];
      for (let i = 0; i < text.length; i += maxSize - overlap)
        chunks.push(text.slice(i, i + maxSize).trim());
      return chunks;
    }

    const parts   = text.split(separators[sepIdx]).filter(p => p.trim());
    const chunks  = [];
    let current   = "";

    for (const part of parts) {
      const candidate = current ? current + separators[sepIdx] + part : part;
      if (candidate.length <= maxSize) {
        current = candidate;
      } else {
        if (current) chunks.push(current.trim());
        if (part.length > maxSize) { chunks.push(...split(part, sepIdx + 1)); current = ""; }
        else current = part;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(c => c.length > 20);
  }

  return split(text);
}

// ─── Page-aware chunking ─────────────────────────────────
async function chunkPDF(pdfPath, chunkSize = 400, overlap = 50) {
  const buffer = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  let pages;

  try {
    const textResult = await parser.getText();
    pages = textResult.pages.map((p) =>
      p.text.replace(/\s+/g, ' ').trim()
    );
  } finally {
    await parser.destroy();
  }

  // Chunk each page separately (preserve page numbers)
  const allChunks = [];

  pages.forEach((pageText, pageIdx) => {
    if (pageText.length < 30) return; // Skip empty pages

    const chunks = recursiveChunk(pageText, chunkSize, overlap);

    chunks.forEach((chunk, chunkIdx) => {
      allChunks.push({
        id:         `page${pageIdx + 1}-chunk${chunkIdx + 1}`,
        text:       chunk,
        pageNum:    pageIdx + 1,
        chunkIndex: chunkIdx,
        totalChunks: chunks.length,
        charCount:  chunk.length,
        source:     path.basename(pdfPath)
      });
    });
  });

  return allChunks;
}

// ─── Test ────────────────────────────────────────────────
const PDF_PATH = process.argv[2] || './sample.pdf';

console.log(`Chunking: ${PDF_PATH}\n`);
const chunks = await chunkPDF(PDF_PATH, 300, 40);

console.log(`Total chunks: ${chunks.length}\n`);
console.log("=== Chunk Summary ===");

// Group by page
const byPage = {};
chunks.forEach(c => {
  byPage[c.pageNum] = (byPage[c.pageNum] || 0) + 1;
});

Object.entries(byPage).forEach(([page, count]) =>
  console.log(`  Page ${page}: ${count} chunk(s)`)
);

console.log("\n=== First 3 Chunks ===");
chunks.slice(0, 3).forEach(c => {
  console.log(`\n[${c.id}] Page ${c.pageNum} | ${c.charCount} chars`);
  console.log(`"${c.text.slice(0, 120)}..."`);
});

console.log("\n=== Chunk Stats ===");
const sizes = chunks.map(c => c.charCount);
console.log(`Min size: ${Math.min(...sizes)} chars`);
console.log(`Max size: ${Math.max(...sizes)} chars`);
console.log(`Avg size: ${Math.round(sizes.reduce((a,b)=>a+b,0)/sizes.length)} chars`);
