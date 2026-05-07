# Day 16 — PDF Chunking Pipeline

PDF text ko meaningful chunks mein todna —
page numbers preserve karo retrieval ke liye.

---

## 1. Why Page-Aware Chunking?

```
Normal chunking:
  Chunk 1: "...end of page 2. Start of page 3..."
  Problem: Page boundary cross ho jaata hai
  Citation: "See page ?" — pata nahi!

Page-aware chunking:
  Page 2 → 2 chunks (both tagged page=2)
  Page 3 → 3 chunks (all tagged page=3)
  Citation: "See page 2" ✓ Accurate!
```

---

## 2. Strategy: Chunk Per Page

```javascript
// Har page ko alag chunk karo
pages.forEach((pageText, pageIdx) => {
  const chunks = recursiveChunk(pageText, 400, 50);

  chunks.forEach((chunk, i) => ({
    id:      `page${pageIdx+1}-chunk${i+1}`,
    text:    chunk,
    pageNum: pageIdx + 1,   // ← Page number preserved!
    source:  "document.pdf"
  }));
});
```

---

## 3. Overlap — Kyun Zaroori Hai?

```
Without overlap:
  Page 3 chunk 1: "...The answer is"
  Page 3 chunk 2: "42. This is important..."
  Query: "What is the answer?" → Miss!

With overlap (50 chars):
  Page 3 chunk 1: "...The answer is 42."
  Page 3 chunk 2: "The answer is 42. This is important..."
  Query: "What is the answer?" → Hit! ✓
```

---

## 4. Section Detection

```javascript
// Headings detect karo → natural chunk boundaries
function detectSections(text) {
  const lines    = text.split('\n');
  const sections = [];
  let current    = { heading: '', content: '' };

  lines.forEach(line => {
    // Heading patterns: ALL CAPS, numbered, short lines
    const isHeading = /^[A-Z][A-Z\s]{5,}$/.test(line.trim()) ||
                      /^\d+\.\s+[A-Z]/.test(line.trim()) ||
                      (line.trim().length < 60 && line.trim().length > 5 &&
                       !line.trim().endsWith('.'));

    if (isHeading && current.content.length > 50) {
      sections.push({ ...current });
      current = { heading: line.trim(), content: '' };
    } else {
      current.content += ' ' + line;
    }
  });

  if (current.content.trim()) sections.push(current);
  return sections;
}
```

---

## 5. Complete Chunking Pipeline

```javascript
// chunk-pdf.js
import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';

const require  = createRequire(import.meta.url);
const pdfParse = require('pdf-parse').default || require('pdf-parse');

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
    const parts  = text.split(separators[sepIdx]).filter(p => p.trim());
    const chunks = [];
    let current  = "";
    for (const part of parts) {
      const candidate = current ? current + separators[sepIdx] + part : part;
      if (candidate.length <= maxSize) { current = candidate; }
      else {
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

export async function chunkPDF(pdfPath, options = {}) {
  const { chunkSize = 400, overlap = 50 } = options;
  const buffer = await fs.readFile(pdfPath);
  const pages  = [];

  await pdfParse(buffer, {
    pagerender: (pageData) =>
      pageData.getTextContent().then(tc => {
        const text = tc.items.map(i => i.str).join(' ')
          .replace(/\s+/g, ' ').trim();
        pages.push(text);
        return text;
      })
  });

  const chunks = [];
  pages.forEach((pageText, pageIdx) => {
    if (pageText.length < 30) return;
    const pageChunks = recursiveChunk(pageText, chunkSize, overlap);
    pageChunks.forEach((chunk, i) => {
      chunks.push({
        id:         `${path.basename(pdfPath, '.pdf')}-p${pageIdx+1}-c${i+1}`,
        text:       chunk,
        pageNum:    pageIdx + 1,
        chunkIndex: i,
        source:     path.basename(pdfPath),
        charCount:  chunk.length
      });
    });
  });

  return chunks;
}
```

---

## 6. Practice Tasks

### Task 1: Run Chunking
```bash
node day16_chunking.js sample.pdf
```
Observe: Kitne chunks per page?

### Task 2: Chunk Size Experiment
```javascript
// Same PDF, different chunk sizes:
// chunkSize=200 → More chunks, smaller
// chunkSize=400 → Balanced
// chunkSize=800 → Fewer chunks, larger
// Kaunsa best hai?
```

### Task 3: Overlap Test
```javascript
// overlap=0   → Chunks independent
// overlap=50  → Slight overlap
// overlap=100 → More overlap
// Print first 2 chunks — overlap dikhta hai?
```

---

Kal Day 17 mein Ingestion Pipeline banayenge —
PDF → Parse → Chunk → Embed → Pinecone store.
