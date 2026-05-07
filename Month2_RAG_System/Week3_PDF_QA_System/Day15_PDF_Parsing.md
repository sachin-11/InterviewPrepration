# Day 15 — PDF Parsing

PDF se text extract karna — RAG ka pehla step.

---

## 1. pdf-parse Library

```bash
npm install pdf-parse
```

### Basic Usage:
```javascript
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

const buffer = await fs.readFile('document.pdf');
const data   = await pdfParse(buffer);

console.log("Pages:",    data.numpages);
console.log("Text:",     data.text.slice(0, 500));
console.log("Metadata:", data.info);
```

### What pdf-parse returns:
```javascript
{
  numpages: 10,           // Total pages
  numrender: 10,
  info: {                 // PDF metadata
    Title:    "My Document",
    Author:   "John",
    Creator:  "Word",
    Producer: "Adobe"
  },
  text: "Full text...",   // All pages combined
  version: "1.10.100"
}
```

---

## 2. Page-by-Page Extraction

```javascript
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

async function extractPages(pdfPath) {
  const buffer = await fs.readFile(pdfPath);
  const pages  = [];

  // Render each page separately
  await pdfParse(buffer, {
    pagerender: (pageData) => {
      return pageData.getTextContent().then(textContent => {
        const text = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        pages.push({
          pageNum: pages.length + 1,
          text
        });

        return text;
      });
    }
  });

  return pages;
}

// Usage
const pages = await extractPages('document.pdf');
pages.forEach(p => {
  console.log(`\n--- Page ${p.pageNum} ---`);
  console.log(p.text.slice(0, 200));
});
```

---

## 3. Text Cleaning

```javascript
function cleanText(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')     // Multiple newlines → double
    .replace(/[ \t]+/g, ' ')         // Multiple spaces → single
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII
    .trim();
}

// Remove headers/footers (common patterns)
function removeHeadersFooters(text) {
  const lines = text.split('\n');
  return lines
    .filter(line => {
      const trimmed = line.trim();
      // Skip page numbers, short lines
      if (/^\d+$/.test(trimmed)) return false;
      if (trimmed.length < 3) return false;
      return true;
    })
    .join('\n');
}
```

---

## 4. Complete Parser

```javascript
// pdf-parser.js
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

export async function parsePDF(pdfPath) {
  const buffer = await fs.readFile(pdfPath);
  const data   = await pdfParse(buffer);

  return {
    title:    data.info?.Title || path.basename(pdfPath, '.pdf'),
    author:   data.info?.Author || 'Unknown',
    pages:    data.numpages,
    text:     cleanText(data.text),
    wordCount: data.text.split(/\s+/).length
  };
}

function cleanText(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
```

---

## 5. Practice Tasks

### Task 1: Install + First Parse
```bash
npm install pdf-parse
```
```javascript
// Koi bhi PDF parse karo
// Print karo: pages, word count, first 500 chars
```

### Task 2: Page Extraction
```javascript
// extractPages() implement karo
// Har page ka text alag print karo
// Kaunsa page sabse zyada text hai?
```

### Task 3: Metadata
```javascript
// PDF ka title, author, creator print karo
// Agar metadata nahi hai toh filename use karo
```

---

Kal Day 16 mein PDF Chunking dekhenge —
Page-aware chunks with page number metadata.
