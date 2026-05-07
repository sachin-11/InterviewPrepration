# Day 8 — Setup & First API Call

Aaj pehli baar actual code likhke OpenAI API se baat karenge.
Theory khatam — ab hands-on time!

---

## 1. OpenAI Account Setup

```
Step 1: https://platform.openai.com pe jaao
Step 2: Sign up / Login karo
Step 3: Left sidebar mein "API Keys" click karo
Step 4: "Create new secret key" button click karo
Step 5: Key ka naam do (e.g., "my-project")
Step 6: Key copy karo — IMPORTANT: sirf ek baar dikhti hai!
        Agar bhool gaye → delete karke nayi banao
```

### API Key Safety Rules:
```
✓ .env file mein store karo
✓ .gitignore mein .env add karo
✓ Kisi ko share mat karo
✓ GitHub pe push mat karo (public repo mein)

✗ Code mein directly mat likhna:
  const client = new OpenAI({ apiKey: "sk-abc123" })  ← NEVER
```

### Billing Setup:
```
OpenAI API free nahi hai — credit card add karna padega
  1. Platform → Settings → Billing
  2. "Add payment method" click karo
  3. $5-10 credit add karo (testing ke liye kaafi hai)

GPT-4o-mini bahut cheap hai:
  $5 credit ≈ 33 million input tokens ≈ months of testing
```

---

## 2. Project Setup

### Folder banao aur initialize karo:
```bash
mkdir ai-project
cd ai-project
npm init -y
npm install openai dotenv
```

### package.json mein type add karo (ES modules ke liye):
```json
{
  "name": "ai-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "dotenv": "^16.0.0",
    "openai": "^4.0.0"
  }
}
```

### .env file banao:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

### .gitignore banao:
```
node_modules/
.env
```

### Final folder structure:
```
ai-project/
├── index.js
├── .env          ← API key (never commit)
├── .gitignore
└── package.json
```

---

## 3. First API Call

```javascript
// index.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config(); // .env file load karo

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",      // Cheap model — testing ke liye perfect
    messages: [
      { role: "user", content: "Say hello in 3 languages" }
    ],
    max_tokens: 100
  });

  // Response print karo
  console.log(response.choices[0].message.content);
}

main();
```

### Run karo:
```bash
node index.js
```

### Expected Output:
```
Hello! (English)
Bonjour! (French)
Namaste! (Hindi)
```

---

## 4. Response Structure — Samjho

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! Bonjour! Namaste!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 20,
    "total_tokens": 35
  }
}
```

### Har field ka matlab:
```
id              → Unique ID for this API call (debugging ke liye)
object          → Always "chat.completion"
model           → Kaunsa model use hua
choices         → Array of responses (usually 1)
  index         → Response number (0-based)
  message.role  → Always "assistant"
  message.content → Actual AI response — ye use karo
  finish_reason → Kyun ruka:
                  "stop"   = Natural end (good)
                  "length" = max_tokens hit (response cut off!)
usage           → Token count
  prompt_tokens    → Input tokens (system + user messages)
  completion_tokens→ Output tokens (AI response)
  total_tokens     → prompt + completion
```

---

## 5. Response se Data Nikalna

```javascript
// index.js — improved version
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: "Say hello in 3 languages" }
    ],
    max_tokens: 100
  });

  // 1. AI ka response
  const message = response.choices[0].message.content;
  console.log("Response:", message);

  // 2. Finish reason check karo
  const finishReason = response.choices[0].finish_reason;
  console.log("Finish reason:", finishReason);
  if (finishReason === 'length') {
    console.warn("Warning: Response was cut off! Increase max_tokens.");
  }

  // 3. Token usage
  const usage = response.usage;
  console.log("\nToken Usage:");
  console.log("  Input tokens: ", usage.prompt_tokens);
  console.log("  Output tokens:", usage.completion_tokens);
  console.log("  Total tokens: ", usage.total_tokens);

  // 4. Cost calculate karo (GPT-4o-mini pricing)
  const inputCost  = (usage.prompt_tokens  / 1_000_000) * 0.15;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
  const totalCost  = inputCost + outputCost;
  console.log(`\nCost: $${totalCost.toFixed(6)} (~${(totalCost * 83).toFixed(4)} rupees)`);
}

main();
```

### Output:
```
Response: Hello! (English) Bonjour! (French) Namaste! (Hindi)
Finish reason: stop

Token Usage:
  Input tokens:  15
  Output tokens: 20
  Total tokens:  35

Cost: $0.000015 (~0.0012 rupees)
```

---

## 6. System Prompt Add Karo

```javascript
// system-prompt.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askWithPersona(question) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a concise JavaScript expert. Answer in max 2 sentences. Always include a one-line code example."
      },
      {
        role: "user",
        content: question
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });

  return response.choices[0].message.content;
}

// Test
const answer = await askWithPersona("What is a Promise in JavaScript?");
console.log(answer);
```

---

## 7. Common Errors aur Fixes

### Error 1: Invalid API Key
```
Error: 401 Incorrect API key provided

Fix:
  1. .env file check karo — key sahi hai?
  2. dotenv.config() call ho raha hai?
  3. process.env.OPENAI_API_KEY print karo — undefined toh nahi?
  
  console.log(process.env.OPENAI_API_KEY); // Debug ke liye
```

### Error 2: Module not found
```
Error: Cannot find package 'openai'

Fix:
  npm install openai dotenv
```

### Error 3: ES Module Error
```
Error: require() of ES Module not supported

Fix:
  package.json mein add karo:
  "type": "module"
  
  Ya file ka naam .mjs rakho
```

### Error 4: .env not loading
```
process.env.OPENAI_API_KEY is undefined

Fix:
  1. dotenv.config() file ke top pe call karo
  2. .env file project root mein hai?
  3. .env mein spaces nahi hone chahiye:
     OPENAI_API_KEY=sk-abc  ← correct
     OPENAI_API_KEY = sk-abc ← wrong (spaces)
```

### Error 5: Insufficient Credits
```
Error: 429 You exceeded your current quota

Fix:
  platform.openai.com → Billing → Add credits
```

---

## 8. Multiple Questions — Reusable Function

```javascript
// reusable.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function ask(question, options = {}) {
  const {
    model       = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens   = 300,
    system      = 'You are a helpful assistant.'
  } = options;

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: question }
    ]
  });

  return {
    answer: response.choices[0].message.content,
    tokens: response.usage.total_tokens,
    cost:   ((response.usage.prompt_tokens / 1e6 * 0.15) +
             (response.usage.completion_tokens / 1e6 * 0.60)).toFixed(6)
  };
}

// Usage
const q1 = await ask("What is Node.js?");
console.log(q1.answer);
console.log(`Tokens: ${q1.tokens}, Cost: $${q1.cost}`);

const q2 = await ask("Write a hello world in Python", {
  system: "You are a Python expert. Give code only, no explanation.",
  temperature: 0.2,
  maxTokens: 100
});
console.log(q2.answer);
```

---

## 9. Practice Tasks (Aaj Karo)

### Task 1: Basic Setup
```
1. OpenAI account banao (agar nahi hai)
2. API key generate karo
3. Project setup karo (npm init, install packages)
4. First API call run karo
5. response.usage print karo
```

### Task 2: Explore Response
```javascript
// Ye print karo aur samjho:
console.log("Full response:", JSON.stringify(response, null, 2));
console.log("Model used:", response.model);
console.log("Finish reason:", response.choices[0].finish_reason);
console.log("Input tokens:", response.usage.prompt_tokens);
console.log("Output tokens:", response.usage.completion_tokens);
```

### Task 3: Different Questions Test Karo
```javascript
// Ye 3 questions run karo aur tokens compare karo:
const questions = [
  "What is 2+2?",                          // Short answer
  "Explain recursion with an example",      // Medium answer
  "Write a complete REST API in Node.js"    // Long answer
];

// Har question ke tokens aur cost print karo
// Observe: Longer response = more tokens = more cost
```
system prompt 
### Task 4: System Prompt Test
```javascript
// Same question, 2 different system prompts:

// Prompt 1: Expert
system: "You are a senior developer. Be technical and concise."

// Prompt 2: Teacher
system: "You are a teacher for beginners. Use simple words and analogies."

// Question: "What is an API?"
// Compare the responses
```

---

Kal Day 9 mein Models aur Parameters code mein use karenge —
temperature, max_tokens, top_p sab practically dekhenge.
