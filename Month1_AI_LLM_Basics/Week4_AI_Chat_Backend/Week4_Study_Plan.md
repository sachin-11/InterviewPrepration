# Week 4: Build AI Chat Backend

---

## Day 1 — Project Architecture

### Kya banayenge?
```
Production-ready AI Chat Backend with:
  - REST API (Express.js)
  - Conversation history (per user)
  - Streaming support
  - Rate limiting
  - Multiple AI personas
  - Chat history storage
```

### Folder Structure:
```
ai-chat-backend/
├── src/
│   ├── routes/
│   │   └── chat.js          # Chat API routes
│   ├── services/
│   │   ├── openai.js        # OpenAI wrapper
│   │   └── conversation.js  # History management
│   ├── middleware/
│   │   ├── rateLimit.js     # Rate limiting
│   │   └── validate.js      # Input validation
│   ├── config/
│   │   └── personas.js      # AI personas
│   └── app.js               # Express app
├── .env
├── package.json
└── README.md
```

### package.json:
```json
{
  "name": "ai-chat-backend",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "openai": "^4.0.0",
    "express": "^4.18.0",
    "dotenv": "^16.0.0",
    "express-rate-limit": "^7.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## Day 2 — Core Services

### OpenAI Service:
```javascript
// src/services/openai.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getChatCompletion(messages, options = {}) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 1000,
    stream = false
  } = options;

  return await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream
  });
}

export async function getStreamingCompletion(messages, options = {}) {
  return getChatCompletion(messages, { ...options, stream: true });
}
```

### Conversation Service:
```javascript
// src/services/conversation.js

// In-memory store (production mein Redis/DB use karo)
const conversations = new Map();

export function getConversation(sessionId) {
  return conversations.get(sessionId) || [];
}

export function addMessage(sessionId, role, content) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  conversations.get(sessionId).push({ role, content });
}

export function clearConversation(sessionId) {
  conversations.delete(sessionId);
}

// Context window manage karo — max 20 messages rakho
export function getTrimmedHistory(sessionId, systemPrompt, maxMessages = 20) {
  const history = getConversation(sessionId);
  const recent = history.slice(-maxMessages);
  return [{ role: 'system', content: systemPrompt }, ...recent];
}
```

### Personas Config:
```javascript
// src/config/personas.js
export const personas = {
  default: {
    name: "Assistant",
    systemPrompt: "You are a helpful, friendly AI assistant. Be concise and clear."
  },
  coder: {
    name: "Code Expert",
    systemPrompt: `You are an expert software engineer.
    - Always provide working code examples
    - Explain code with comments
    - Suggest best practices
    - Point out potential bugs`
  },
  teacher: {
    name: "Teacher",
    systemPrompt: `You are a patient teacher.
    - Explain concepts simply
    - Use real-world analogies
    - Break down complex topics step by step
    - Encourage questions`
  },
  reviewer: {
    name: "Code Reviewer",
    systemPrompt: `You are a strict code reviewer.
    Return feedback as JSON:
    {
      "issues": [{"type": "bug/security/performance", "line": "", "description": ""}],
      "suggestions": [],
      "rating": 1-10,
      "summary": ""
    }`
  }
};
```

---

## Day 3 — API Routes

### Chat Routes:
```javascript
// src/routes/chat.js
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getChatCompletion, getStreamingCompletion } from '../services/openai.js';
import { getTrimmedHistory, addMessage, clearConversation } from '../services/conversation.js';
import { personas } from '../config/personas.js';

const router = Router();

// POST /chat — Normal response
router.post('/', async (req, res) => {
  try {
    const { message, sessionId = uuidv4(), persona = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const selectedPersona = personas[persona] || personas.default;
    const messages = getTrimmedHistory(sessionId, selectedPersona.systemPrompt);

    // User message add karo
    addMessage(sessionId, 'user', message);
    messages.push({ role: 'user', content: message });

    const response = await getChatCompletion(messages);
    const assistantMessage = response.choices[0].message.content;

    // Assistant response save karo
    addMessage(sessionId, 'assistant', assistantMessage);

    res.json({
      sessionId,
      message: assistantMessage,
      persona: selectedPersona.name,
      usage: response.usage
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

// POST /chat/stream — Streaming response
router.post('/stream', async (req, res) => {
  try {
    const { message, sessionId = uuidv4(), persona = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Session-Id', sessionId);

    const selectedPersona = personas[persona] || personas.default;
    const messages = getTrimmedHistory(sessionId, selectedPersona.systemPrompt);

    addMessage(sessionId, 'user', message);
    messages.push({ role: 'user', content: message });

    const stream = await getStreamingCompletion(messages);
    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
    }

    addMessage(sessionId, 'assistant', fullResponse);
    res.write(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
  }
});

// DELETE /chat/:sessionId — Clear conversation
router.delete('/:sessionId', (req, res) => {
  clearConversation(req.params.sessionId);
  res.json({ message: 'Conversation cleared' });
});

export default router;
```

---

## Day 4 — Middleware & Validation

### Rate Limiting:
```javascript
// src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,              // 20 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Please wait before sending more messages',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Rate limit exceeded' }
});
```

### Input Validation:
```javascript
// src/middleware/validate.js
export function validateChatInput(req, res, next) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message field is required' });
  }

  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'message must be a string' });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({ error: 'message cannot be empty' });
  }

  if (message.length > 4000) {
    return res.status(400).json({ error: 'message too long (max 4000 chars)' });
  }

  // Sanitize
  req.body.message = message.trim();
  next();
}
```

---

## Day 5 — Main App & Testing

### Express App:
```javascript
// src/app.js
import express from 'express';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import { chatRateLimit } from './middleware/rateLimit.js';
import { validateChatInput } from './middleware/validate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat routes with middleware
app.use('/chat', chatRateLimit, validateChatInput, chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Chat Backend running on http://localhost:${PORT}`);
});
```

### API Testing (curl):
```bash
# Normal chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Node.js?", "persona": "coder"}'

# Streaming chat
curl -X POST http://localhost:3000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain async/await", "sessionId": "user123"}'

# Continue conversation (same sessionId)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Give me an example", "sessionId": "user123"}'

# Clear conversation
curl -X DELETE http://localhost:3000/chat/user123

# Health check
curl http://localhost:3000/health
```

---

## Day 6 — Persistent Storage with File System

### Save Conversations to JSON (Simple):
```javascript
// src/services/storage.js
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = './data/conversations';

// Directory ensure karo
await fs.mkdir(STORAGE_DIR, { recursive: true }).catch(() => {});

export async function saveConversation(sessionId, messages) {
  const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
  await fs.writeFile(filePath, JSON.stringify({
    sessionId,
    updatedAt: new Date().toISOString(),
    messages
  }, null, 2));
}

export async function loadConversation(sessionId) {
  try {
    const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data).messages;
  } catch {
    return []; // File nahi mili toh empty array
  }
}

export async function deleteConversation(sessionId) {
  const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
  await fs.unlink(filePath).catch(() => {});
}
```

---

## Day 7 — Week 4 Revision + Final Project

### Complete API Endpoints Summary:
```
POST   /chat              → Normal AI response
POST   /chat/stream       → Streaming AI response
DELETE /chat/:sessionId   → Clear conversation
GET    /health            → Server health check
```

### .env file:
```
OPENAI_API_KEY=sk-your-key-here
PORT=3000
NODE_ENV=development
```

### Run karo:
```bash
npm install
node src/app.js
```

### Month 1 Complete Summary:
```
Week 1: LLM kya hai, tokens, prompts, temperature
Week 2: OpenAI API setup, models, streaming, error handling
Week 3: Advanced prompting, JSON mode, function calling, embeddings
Week 4: Production chat backend with Express.js
```

### Next Steps (Month 2):
```
- Vector databases (Pinecone, Weaviate)
- RAG (Retrieval Augmented Generation)
- LangChain / LlamaIndex
- Fine-tuning models
- Deploy to production (Railway, Render, AWS)
```

### Resources:
```
OpenAI Docs:     https://platform.openai.com/docs
OpenAI Cookbook: https://cookbook.openai.com
LangChain Docs:  https://js.langchain.com/docs
Node.js Docs:    https://nodejs.org/docs



OPen AI key = sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (store in .env, never commit)
```
