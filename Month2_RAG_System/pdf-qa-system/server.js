// PDF Q&A Server — Ask Your Data (Month 2 capstone): multi-PDF, RAG, chat history
import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, 'data', 'pdfs-registry.json');

async function loadRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { pdfs: [] };
  }
}

async function saveRegistry(data) {
  await fs.mkdir(join(__dirname, 'data'), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/** Avoid Pinecone id collisions when two uploads share the same basename. */
function uniquePdfName(baseName, existingNames) {
  const set = new Set(existingNames);
  if (!set.has(baseName)) return baseName;
  let n = 2;
  while (set.has(`${baseName}-${n}`)) n++;
  return `${baseName}-${n}`;
}

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
}

const app    = express();
const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const PORT   = process.env.PORT || 3001;
const INDEX  = "pdf-qa";

app.use(express.json());
app.use(express.static(join(__dirname, 'public'))); // UI serve karo

// ─── Multer ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: './uploads/',
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ─── Helpers ─────────────────────────────────────────────
async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

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

async function ingestPDF(filePath, pdfName) {
  const buffer = await fs.readFile(filePath);
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

  const chunks = [];
  pages.forEach((pageText, pi) => {
    if (pageText.length < 30) return;
    recursiveChunk(pageText).forEach((chunk, ci) => {
      chunks.push({ id: `${pdfName}-p${pi+1}-c${ci+1}`, text: chunk, pageNum: pi+1, source: pdfName });
    });
  });

  if (chunks.length === 0) return { pages: pages.length, chunks: 0 };

  const index = pc.index(INDEX);
  for (let i = 0; i < chunks.length; i += 25) {
    const vecs = await Promise.all(chunks.slice(i, i+25).map(async c => ({
      id:       c.id,
      values:   await embed(c.text),
      metadata: { text: c.text, pageNum: c.pageNum, source: c.source }
    })));
    await index.upsert({ records: vecs });
  }

  return { pages: pages.length, chunks: chunks.length };
}

// ─── Routes ──────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/upload', upload.array('pdf', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No PDF uploaded' });
  const results = [];
  try {
    for (const file of req.files) {
      const baseName = path.basename(file.originalname, '.pdf')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      const reg = await loadRegistry();
      const pdfName = uniquePdfName(baseName, reg.pdfs.map((p) => p.pdfName));
      const ingested = await ingestPDF(file.path, pdfName);
      reg.pdfs.push({
        pdfName,
        pages: ingested.pages,
        chunks: ingested.chunks,
        uploadedAt: new Date().toISOString()
      });
      await saveRegistry(reg);
      results.push({
        pdfName,
        pages: ingested.pages,
        chunks: ingested.chunks
      });
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/ask', async (req, res) => {
  const { question, pdfName, topK = 5, history = [] } = req.body;
  if (!question) return res.status(400).json({ error: 'question required' });
  try {
    const index = pc.index(INDEX);
    const qVec = await embed(question);
    const params = { vector: qVec, topK, includeMetadata: true };
    if (pdfName) params.filter = { source: { $eq: pdfName } };

    const results = await index.query(params);
    const matches = results.matches.filter((m) => m.score > 0.35);

    if (!matches.length) {
      return res.json({
        answer: 'No relevant information found in your uploaded PDFs for this question.',
        sources: []
      });
    }

    const context = matches
      .map(
        (m, i) =>
          `[${i + 1}] (document: ${m.metadata.source}, page ${m.metadata.pageNum}): ${m.metadata.text}`
      )
      .join('\n\n');

    const past = sanitizeHistory(history);
    const llmRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You answer questions using ONLY the Sources below. Cite using the bracketed numbers like [1], [2]. ' +
            'If the answer is not contained in the Sources, say you do not have that information. ' +
            'Prior user/assistant turns help interpret follow-up questions; do not invent facts beyond the Sources.\n\n' +
            `Sources:\n${context}`
        },
        ...past,
        { role: 'user', content: question }
      ],
      max_tokens: 500,
      temperature: 0.2
    });

    res.json({
      answer: llmRes.choices[0].message.content,
      sources: matches.map((m) => {
        const t = String(m.metadata.text || '');
        return {
          text: t.length > 120 ? `${t.slice(0, 120)}...` : t,
          pageNum: m.metadata.pageNum,
          source: m.metadata.source,
          score: parseFloat(m.score.toFixed(3))
        };
      })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pdfs', async (_, res) => {
  try {
    const reg = await loadRegistry();
    const stats = await pc.index(INDEX).describeIndexStats();
    res.json({
      pdfs: reg.pdfs,
      totalVectors: stats.totalRecordCount ?? 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/pdfs/:name', async (req, res) => {
  try {
    const index = pc.index(INDEX);
    const pdfName = decodeURIComponent(req.params.name);
    await index.deleteMany({ filter: { source: { $eq: pdfName } } });
    const reg = await loadRegistry();
    reg.pdfs = reg.pdfs.filter((p) => p.pdfName !== pdfName);
    await saveRegistry(reg);
    res.json({ success: true, message: `${pdfName} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((_, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`PDF Q&A Server → http://localhost:${PORT}`);
});
