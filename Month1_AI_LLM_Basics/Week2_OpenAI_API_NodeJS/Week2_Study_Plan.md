# Week 2: OpenAI API Integration with Node.js

---

## Day 1 — Setup & First API Call

### OpenAI Account Setup:
```
1. https://platform.openai.com pe account banao
2. API Keys section mein jaao
3. "Create new secret key" click karo
4. Key copy karo (ek baar hi dikhti hai)
```

### Project Setup:
```bash
mkdir ai-project
cd ai-project
npm init -y
npm install openai dotenv
```

### .env file:
```
OPENAI_API_KEY=sk-your-key-here
```

### First API Call:
```javascript
// index.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",       // cheap model for testing
    messages: [
      { role: "user", content: "Say hello in 3 languages" }
    ],
    max_tokens: 100
  });

  console.log(response.choices[0].message.content);
}

main();
```

```bash
node index.js
```

### Response Structure:
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "gpt-4o-mini",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! Bonjour! Namaste!"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 20,
    "total_tokens": 35
  }
}
```

### Practice Task:
- Setup karo aur first call run karo
- response.usage print karo — tokens count dekho

---

## Day 2 — Models & Parameters

### Available Models:
```
Model           Speed    Cost      Best For
──────────────  ───────  ────────  ──────────────────────
gpt-4o          Fast     $$$$      Complex reasoning, code
gpt-4o-mini     Fastest  $         Simple tasks, testing
gpt-4-turbo     Medium   $$$       Balanced
o1              Slow     $$$$$     Math, complex reasoning
```

### Parameters Deep Dive:
```javascript
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [...],
  
  temperature: 0.7,      // 0-2, creativity control
  max_tokens: 500,       // response length limit
  top_p: 1,              // nucleus sampling
  frequency_penalty: 0,  // repeat words avoid karo (0-2)
  presence_penalty: 0,   // naye topics encourage karo (0-2)
  n: 1,                  // kitne responses chahiye
  stop: ["\n", "END"],   // in strings pe stop karo
});
```

### Cost Calculation:
```javascript
// Response ke baad cost calculate karo
const usage = response.usage;
const inputCost  = (usage.prompt_tokens / 1_000_000) * 0.15;   // $0.15/1M
const outputCost = (usage.completion_tokens / 1_000_000) * 0.60; // $0.60/1M
const totalCost  = inputCost + outputCost;

console.log(`Cost: $${totalCost.toFixed(6)}`);
```

### Practice Task:
- Same prompt ko temperature 0 aur 1.5 pe run karo
- Dono responses compare karo
- Cost print karo

---

## Day 3 — Conversation & Chat History

### Multi-turn Conversation:
```javascript
// chat.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const messages = [
  {
    role: "system",
    content: "You are a helpful coding assistant. Keep answers concise."
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat(userInput) {
  // User message history mein add karo
  messages.push({ role: "user", content: userInput });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    max_tokens: 500
  });

  const assistantMessage = response.choices[0].message.content;

  // Assistant response bhi history mein add karo
  messages.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

function askQuestion() {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const response = await chat(input);
    console.log(`\nAssistant: ${response}\n`);
    askQuestion(); // Next question
  });
}

console.log("Chat started! Type 'exit' to quit.\n");
askQuestion();
```

### Context Window Management:
```javascript
// History bahut badi ho jaaye toh trim karo
function trimHistory(messages, maxMessages = 20) {
  const systemMessage = messages[0]; // System prompt rakho
  const recentMessages = messages.slice(-maxMessages); // Last 20 messages
  return [systemMessage, ...recentMessages];
}
```

### Practice Task:
- Chat script run karo
- 5-6 messages ka conversation karo
- Dekho LLM previous messages yaad rakhta hai
- messages array console mein print karo

---

## Day 4 — Streaming Responses

### Streaming kya hota hai?
```
Normal:    Poora response aane ka wait karo (3-5 sec)
Streaming: Response word by word aata hai (ChatGPT jaisa)
```

### Streaming Implementation:
```javascript
// stream.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function streamResponse(prompt) {
  console.log("Assistant: ");

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,  // streaming enable karo
    max_tokens: 500
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(delta); // Word by word print karo
    fullResponse += delta;
  }

  console.log('\n');
  return fullResponse;
}

streamResponse("Explain async/await in JavaScript with an example");
```

### Express API with Streaming:
```javascript
// server.js
import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());

app.post('/chat/stream', async (req, res) => {
  const { message } = req.body;

  // SSE headers set karo
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
    stream: true
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Practice Task:
- Streaming script run karo
- Observe karo word-by-word output
- Express server banao streaming ke saath

---

## Day 5 — Error Handling & Rate Limits

### Common Errors:
```javascript
import OpenAI from 'openai';

async function safeApiCall(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content;

  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          console.error("Invalid API key");
          break;
        case 429:
          console.error("Rate limit exceeded — wait and retry");
          await sleep(60000); // 1 minute wait
          return safeApiCall(prompt); // Retry
        case 500:
          console.error("OpenAI server error — try again later");
          break;
        case 400:
          console.error("Bad request:", error.message);
          break;
        default:
          console.error("API Error:", error.status, error.message);
      }
    }
    throw error;
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

### Retry with Exponential Backoff:
```javascript
async function callWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        throw error;
      }
    }
  }
}
```

### Practice Task:
- Wrong API key se call karo — error dekho
- Error handling wala code implement karo
- Retry logic test karo

---

## Day 6 — Building a Simple AI Utility

### Text Summarizer:
```javascript
// summarizer.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function summarize(text, maxWords = 100) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a text summarizer. 
                  Summarize the given text in under ${maxWords} words.
                  Return only the summary, nothing else.`
      },
      { role: "user", content: text }
    ],
    temperature: 0.3,
    max_tokens: 200
  });

  return response.choices[0].message.content;
}

async function translateText(text, targetLanguage) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Translate the given text to ${targetLanguage}. 
                  Return only the translation.`
      },
      { role: "user", content: text }
    ],
    temperature: 0,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}

// Test
const longText = `Node.js is an open-source, cross-platform JavaScript 
runtime environment that executes JavaScript code outside a web browser. 
Node.js lets developers use JavaScript to write command line tools and 
for server-side scripting.`;

const summary = await summarize(longText, 30);
console.log("Summary:", summary);

const hindi = await translateText(longText, "Hindi");
console.log("Hindi:", hindi);
```

### Practice Task:
- Summarizer banao aur test karo
- Ek "Sentiment Analyzer" banao jo text ka sentiment return kare:
  {sentiment: "positive/negative/neutral", confidence: 0-100, reason: "..."}

---

## Day 7 — Week 2 Revision + Mini Project

### Mini Project: CLI AI Assistant
```javascript
// assistant.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful coding assistant specializing in JavaScript and Node.js.
- Give concise, practical answers
- Always include code examples when relevant
- If asked about bugs, explain the fix clearly`;

const messages = [{ role: "system", content: SYSTEM_PROMPT }];
let totalTokens = 0;

async function chat(userInput) {
  messages.push({ role: "user", content: userInput });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 800,
    temperature: 0.7,
    stream: true
  });

  let fullResponse = '';
  process.stdout.write('\nAssistant: ');

  for await (const chunk of response) {
    const delta = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(delta);
    fullResponse += delta;
  }

  console.log('\n');
  messages.push({ role: "assistant", content: fullResponse });
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("JS/Node.js AI Assistant — type 'exit' to quit\n");

const ask = () => {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === 'exit') { rl.close(); return; }
    if (!input.trim()) { ask(); return; }
    await chat(input);
    ask();
  });
};

ask();
```

### Week 2 Key Concepts:
```
API Setup     → OpenAI client, .env, npm install
Models        → gpt-4o-mini (cheap), gpt-4o (powerful)
Parameters    → temperature, max_tokens, top_p
Conversation  → messages array, history management
Streaming     → stream: true, SSE for web
Error Handling → try/catch, retry with backoff
```

---

Week 3 mein Advanced Prompting aur Function Calling seekhenge.
