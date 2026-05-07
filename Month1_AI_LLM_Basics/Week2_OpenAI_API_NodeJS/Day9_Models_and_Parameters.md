# Day 9 — Models & Parameters in Code

Aaj practically dekhenge — temperature, max_tokens, top_p
sab code mein kaise use karte hain aur kya fark padta hai.

---

## 1. Available Models — Code mein

```javascript
// models.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Model constants — magic strings avoid karo
const MODELS = {
  MINI:   'gpt-4o-mini',   // Cheap, fast — daily use
  GPT4O:  'gpt-4o',        // Powerful — complex tasks
  TURBO:  'gpt-4-turbo',   // Balanced
};

async function askModel(question, model = MODELS.MINI) {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: question }],
    max_tokens: 200
  });

  return {
    model:  response.model,
    answer: response.choices[0].message.content,
    tokens: response.usage.total_tokens
  };
}

// Same question, different models
const question = "Explain closures in JavaScript in 2 sentences";

const mini  = await askModel(question, MODELS.MINI);
const gpt4o = await askModel(question, MODELS.GPT4O);

console.log("GPT-4o-mini:", mini.answer);
console.log("GPT-4o:     ", gpt4o.answer);
console.log("\nTokens - mini:", mini.tokens, "| gpt4o:", gpt4o.tokens);
```

### Model Comparison Table:
```
Model           Speed    Cost/1M input   Best For
──────────────  ───────  ──────────────  ──────────────────────
gpt-4o-mini     Fastest  $0.15           Testing, simple tasks
gpt-4o          Fast     $5.00           Complex reasoning, code
gpt-4-turbo     Medium   $10.00          Balanced (older)
o1-mini         Slow     $3.00           Math, logic problems
```

---

## 2. Temperature — Code mein

```javascript
// temperature-demo.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateWithTemp(prompt, temperature) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: 80
  });
  return response.choices[0].message.content;
}

// Same prompt, different temperatures
const prompt = "Write a one-line tagline for a coffee shop";

console.log("=== Temperature Comparison ===\n");

const t0  = await generateWithTemp(prompt, 0);
const t05 = await generateWithTemp(prompt, 0.5);
const t1  = await generateWithTemp(prompt, 1.0);
const t15 = await generateWithTemp(prompt, 1.5);

console.log("Temp 0.0:", t0);
console.log("Temp 0.5:", t05);
console.log("Temp 1.0:", t1);
console.log("Temp 1.5:", t15);

// Run this 3 times — temp 0 will always be same, others will vary
```

### Expected Output:
```
Temp 0.0: "Fuel your day, one cup at a time."   (always same)
Temp 0.5: "Where every sip tells a story."
Temp 1.0: "Life's too short for bad coffee."
Temp 1.5: "Brewing dreams since your alarm clock failed you."
```

### Temperature by Use Case — Code:
```javascript
// Configs for different use cases
const configs = {
  // Code generation — precise, consistent
  code: {
    temperature: 0.2,
    max_tokens: 800,
    top_p: 1.0
  },

  // Chatbot — natural, balanced
  chat: {
    temperature: 0.7,
    max_tokens: 400,
    top_p: 1.0
  },

  // Creative writing — diverse, imaginative
  creative: {
    temperature: 1.1,
    max_tokens: 600,
    top_p: 0.9
  },

  // Factual Q&A — accurate, deterministic
  factual: {
    temperature: 0.1,
    max_tokens: 300,
    top_p: 1.0
  }
};

async function ask(prompt, useCase = 'chat') {
  const config = configs[useCase];
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    ...config  // Spread config
  });
  return response.choices[0].message.content;
}

// Usage
const code     = await ask("Write a function to reverse a string", 'code');
const creative = await ask("Write a poem about debugging", 'creative');
const factual  = await ask("What is the capital of Japan?", 'factual');

console.log("Code:\n",     code);
console.log("Creative:\n", creative);
console.log("Factual:\n",  factual);
```

---

## 3. max_tokens — Code mein

```javascript
// max-tokens-demo.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askWithLimit(question, maxTokens) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: question }],
    max_tokens: maxTokens
  });

  const choice = response.choices[0];

  return {
    answer:       choice.message.content,
    finishReason: choice.finish_reason,
    tokensUsed:   response.usage.completion_tokens,
    wasCutOff:    choice.finish_reason === 'length'
  };
}

const question = "Explain the history of JavaScript in detail";

const short  = await askWithLimit(question, 50);
const medium = await askWithLimit(question, 200);
const long   = await askWithLimit(question, 500);

console.log("--- 50 tokens ---");
console.log(short.answer);
console.log("Cut off?", short.wasCutOff);  // true — response incomplete

console.log("\n--- 200 tokens ---");
console.log(medium.answer);
console.log("Cut off?", medium.wasCutOff);

console.log("\n--- 500 tokens ---");
console.log(long.answer);
console.log("Cut off?", long.wasCutOff);  // false — complete response
```

### finish_reason Check — Important:
```javascript
// Production mein hamesha check karo
async function safeAsk(question, maxTokens = 500) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: question }],
    max_tokens: maxTokens
  });

  const choice = response.choices[0];

  // Response cut off hua toh warn karo
  if (choice.finish_reason === 'length') {
    console.warn(`Response cut off at ${maxTokens} tokens. Consider increasing max_tokens.`);
  }

  return choice.message.content;
}
```

---

## 4. Top-P — Code mein

```javascript
// top-p-demo.js
async function generateWithTopP(prompt, topP) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0,  // Temperature fixed rakho jab top_p change karo
    top_p: topP,
    max_tokens: 80
  });
  return response.choices[0].message.content;
}

const prompt = "Suggest a unique name for a tech startup";

const focused  = await generateWithTopP(prompt, 0.1);  // Very focused
const balanced = await generateWithTopP(prompt, 0.5);  // Balanced
const diverse  = await generateWithTopP(prompt, 0.9);  // Diverse

console.log("Top-P 0.1 (focused): ", focused);
console.log("Top-P 0.5 (balanced):", balanced);
console.log("Top-P 0.9 (diverse): ", diverse);
```

### IMPORTANT Rule — Code mein:
```javascript
// WRONG — dono change mat karo
const response = await client.chat.completions.create({
  temperature: 1.5,  // Changed
  top_p: 0.3,        // Also changed — AVOID
});

// CORRECT — sirf ek change karo
// Option A: Temperature adjust karo
const response = await client.chat.completions.create({
  temperature: 1.2,
  top_p: 1.0,        // Default rakho
});

// Option B: Top-P adjust karo
const response = await client.chat.completions.create({
  temperature: 1.0,  // Default rakho
  top_p: 0.8,        // Adjust karo
});
```

---

## 5. Frequency & Presence Penalty — Code mein

```javascript
// penalties-demo.js

// Frequency penalty — repeated words avoid karo
async function noRepetition(prompt) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    frequency_penalty: 1.5,  // High — strongly avoid repetition
    max_tokens: 150
  });
  return response.choices[0].message.content;
}

// Presence penalty — naye topics explore karo
async function exploreDiverse(prompt) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    presence_penalty: 1.5,  // High — explore new ideas
    max_tokens: 150
  });
  return response.choices[0].message.content;
}

// Test
const normal    = await ask("List 5 benefits of Node.js");
const noRepeat  = await noRepetition("List 5 benefits of Node.js");
const diverse   = await exploreDiverse("List 5 benefits of Node.js");

// noRepeat version mein same words repeat nahi honge
// diverse version mein zyada varied points aayenge
```

---

## 6. Stop Sequences — Code mein

```javascript
// stop-sequences-demo.js

// Response ko specific string pe rok do
async function generateUntilStop(prompt, stopSequences) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    stop: stopSequences,
    max_tokens: 300
  });

  return {
    content:      response.choices[0].message.content,
    finishReason: response.choices[0].finish_reason
    // finish_reason = "stop" means stop sequence hit hua
  };
}

// Example 1: Numbered list — sirf 3 items tak
const result1 = await generateUntilStop(
  "List benefits of TypeScript:\n1.",
  ["4."]  // "4." pe rok do — sirf 3 items milenge
);
console.log(result1.content);

// Example 2: Code block ke baad rok do
const result2 = await generateUntilStop(
  "Write a hello world in Python with explanation",
  ["```\n"]  // Code block end pe rok do
);
console.log(result2.content);
```

---

## 7. All Parameters Together — Complete Example

```javascript
// complete-params.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function smartAsk(prompt, {
  model             = 'gpt-4o-mini',
  temperature       = 0.7,
  maxTokens         = 500,
  topP              = 1.0,
  frequencyPenalty  = 0,
  presencePenalty   = 0,
  stop              = null,
  systemPrompt      = 'You are a helpful assistant.'
} = {}) {

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens:        maxTokens,
    top_p:             topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty:  presencePenalty,
    stop,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: prompt }
    ]
  });

  const choice = response.choices[0];

  return {
    answer:       choice.message.content,
    finishReason: choice.finish_reason,
    usage:        response.usage,
    cost: (
      (response.usage.prompt_tokens     / 1e6 * 0.15) +
      (response.usage.completion_tokens / 1e6 * 0.60)
    ).toFixed(6)
  };
}

// Use cases
const codeResult = await smartAsk(
  "Write a function to validate email in JavaScript",
  {
    temperature:  0.2,
    maxTokens:    400,
    systemPrompt: "You are a JavaScript expert. Write clean, production-ready code."
  }
);

const creativeResult = await smartAsk(
  "Write a short poem about debugging at 3am",
  {
    temperature:     1.1,
    maxTokens:       200,
    presencePenalty: 0.8
  }
);

console.log("Code:\n",     codeResult.answer);
console.log("Cost: $",     codeResult.cost);
console.log("\nPoem:\n",   creativeResult.answer);
console.log("Cost: $",     creativeResult.cost);
```

---

## 8. Parameter Quick Reference

```javascript
client.chat.completions.create({
  // Required
  model:    'gpt-4o-mini',  // Which model
  messages: [...],          // Conversation

  // Output control
  max_tokens:  500,   // Max response length (default: model max)
  n:           1,     // How many responses (default: 1)
  stop:        null,  // Stop sequences (string or array)

  // Randomness
  temperature:       0.7,  // 0-2, creativity (default: 1)
  top_p:             1.0,  // 0-1, vocabulary diversity (default: 1)

  // Repetition
  frequency_penalty: 0,    // -2 to 2, penalize repeated words (default: 0)
  presence_penalty:  0,    // -2 to 2, encourage new topics (default: 0)

  // Streaming
  stream: false,  // true for word-by-word output

  // Format
  response_format: { type: 'json_object' }  // Force JSON output
});
```

---

## 9. Practice Tasks (Aaj Karo)

### Task 1: Temperature Experiment
```javascript
// Same prompt, 4 temperatures run karo
const prompt = "Give me a creative project idea for a Node.js beginner";
const temps  = [0, 0.5, 1.0, 1.5];

for (const temp of temps) {
  const result = await generateWithTemp(prompt, temp);
  console.log(`\nTemp ${temp}:\n${result}`);
}

// Observe: Kaunsa temperature best ideas deta hai?
```

### Task 2: max_tokens Impact
```javascript
// Dekho response kab cut off hota hai
const limits = [20, 50, 100, 300];
const q = "Explain what is Node.js and why developers use it";

for (const limit of limits) {
  const result = await askWithLimit(q, limit);
  console.log(`\n--- ${limit} tokens ---`);
  console.log(result.answer);
  console.log("Complete?", !result.wasCutOff);
}
```

### Task 3: Best Config Dhundho
```
Ye tasks ke liye best parameters choose karo aur test karo:

1. SQL query generator
   temperature = ?  max_tokens = ?  top_p = ?

2. Motivational quote generator
   temperature = ?  max_tokens = ?  presence_penalty = ?

3. Code bug explainer for beginners
   temperature = ?  max_tokens = ?  system prompt = ?

Run karo aur results compare karo.
```

### Task 4: Cost Comparison
```javascript
// Same question, 2 models pe run karo
const question = "Explain async/await in JavaScript";

const miniResult  = await smartAsk(question, { model: 'gpt-4o-mini' });
const gpt4oResult = await smartAsk(question, { model: 'gpt-4o' });

console.log("Mini cost:  $", miniResult.cost);
console.log("GPT-4o cost:$", gpt4oResult.cost);
console.log("Difference: ", (gpt4oResult.cost / miniResult.cost).toFixed(0), "x more expensive");

// Quality compare karo — worth the extra cost?
```

---

Kal Day 10 mein Conversation & Chat History implement karenge —
Multi-turn conversations aur history management code mein.
