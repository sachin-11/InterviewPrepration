// ingest.js — Store 50 FAQs in Pinecone
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { faqs } from './data.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

const INDEX = "faq-bot";

// Create index if not exists
const existing = await pc.listIndexes();
if (!existing.indexes?.some(i => i.name === INDEX)) {
  console.log("Creating index...");
  await pc.createIndex({
    name: INDEX, dimension: 768, metric: "cosine",
    spec: { serverless: { cloud: "aws", region: "us-east-1" } }
  });
  await new Promise(r => setTimeout(r, 10000));
}

const index = pc.index(INDEX);

// Embed Q+A combined (better retrieval)
console.log(`Embedding ${faqs.length} FAQs...`);
const vectors = await Promise.all(faqs.map(async (faq, i) => {
  process.stdout.write(`\r  ${i+1}/${faqs.length}`);
  return {
    id:       faq.id,
    values:   await embed(`Q: ${faq.q}\nA: ${faq.a}`),
    metadata: { question: faq.q, answer: faq.a, category: faq.cat }
  };
}));

// Batch upsert
for (let i = 0; i < vectors.length; i += 25) {
  await index.upsert(vectors.slice(i, i + 25));
}

const stats = await index.describeIndexStats();
console.log(`\n✓ Ingested ${stats.totalRecordCount} FAQs`);
console.log("✓ Run: node bot.js to start the FAQ bot!");
