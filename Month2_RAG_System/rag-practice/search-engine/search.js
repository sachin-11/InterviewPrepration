// search.js — Search logic
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';

const ollama = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });
const chroma = new ChromaClient({ host: "localhost", port: 8000 });

async function embed(text) {
  const res = await ollama.embeddings.create({ model: "nomic-embed-text", input: text });
  return res.data[0].embedding;
}

export async function getIndexDocCount() {
  const col = await chroma.getOrCreateCollection({
    name: "qa-search",
    metadata: { "hnsw:space": "cosine" }
  });
  return col.count();
}

export async function search(query, { k = 3, threshold = 0.25, category = null, difficulty = null } = {}) {
  const col  = await chroma.getOrCreateCollection({
    name: "qa-search",
    metadata: { "hnsw:space": "cosine" }
  });
  const qEmb = await embed(query);

  const filters = [];
  if (category)   filters.push({ category });
  if (difficulty) filters.push({ difficulty });

  const where = filters.length === 0 ? undefined :
                filters.length === 1 ? filters[0] :
                { "$and": filters };

  const params = { queryEmbeddings: [qEmb], nResults: k, include: ["metadatas", "distances"] };
  if (where) params.where = where;

  const res = await col.query(params);

  return res.metadatas[0]
    .map((meta, i) => ({
      question:   meta.question,
      answer:     meta.answer,
      category:   meta.category,
      difficulty: meta.difficulty,
      similarity: 1 - res.distances[0][i]
    }))
    .filter(r => r.similarity >= threshold);
}
