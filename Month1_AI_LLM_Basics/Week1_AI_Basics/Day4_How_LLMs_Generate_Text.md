# Day 4 — How LLMs Generate Text

Aaj samjhenge ki LLM andar se kaise kaam karta hai —
text generate karne ke parameters aur unka real impact.

---

## 1. LLM Text Kaise Generate Karta Hai?

### Basic Concept:
```
LLM ek time mein ek token generate karta hai.
Har token ke liye — sabhi possible tokens ki probability calculate hoti hai.
Phir ek token "choose" kiya jaata hai.
Ye process repeat hota hai jab tak response complete na ho.
```

### Example — Probability Distribution:
```
Prompt: "The capital of France is"

LLM internally calculate karta hai:
  "Paris"     → 94.5% probability
  "Lyon"      → 2.1%
  "London"    → 1.8%
  "Berlin"    → 0.9%
  "a"         → 0.4%
  ... (baaki sab tokens)

Kaunsa choose hoga? → Ye temperature decide karta hai
```

---

## 2. Temperature — Creativity Control

```
Temperature = Probability distribution ko kitna "flat" ya "sharp" karo

Low temp  → Sharp distribution  → Always highest probability choose
High temp → Flat distribution   → Lower probability tokens bhi chance milta hai
```

### Temperature Values:

#### Temperature 0.0 — Deterministic
```
Hamesha highest probability token choose karo
Same input → Same output (always)

Use karo jab:
  ✓ Code generation
  ✓ Factual questions (capitals, dates, formulas)
  ✓ Data extraction
  ✓ Translation
  ✓ Consistent output chahiye

Example:
  Prompt: "What is 2 + 2?"
  Temp 0: "4"  (hamesha same)
  
  Prompt: "Write a function to add two numbers in Python"
  Temp 0: Same code har baar
```

#### Temperature 0.3-0.5 — Balanced (Slight Creativity)
```
Mostly high probability tokens, thodi variety

Use karo jab:
  ✓ Technical explanations
  ✓ Summaries
  ✓ Q&A chatbots
  ✓ Email writing

Example:
  Prompt: "Complete: The sky is"
  Temp 0.3: "blue and clear"
  Temp 0.3: "partly cloudy today"  (thoda vary)
```

#### Temperature 0.7-1.0 — Creative
```
Significant randomness, diverse outputs

Use karo jab:
  ✓ Story/poem writing
  ✓ Brainstorming ideas
  ✓ Marketing copy
  ✓ Creative content

Example:
  Prompt: "Complete: The sky is"
  Temp 1.0: "a canvas of dreams painted by the gods"
  Temp 1.0: "crying today, just like my heart"
  Temp 1.0: "the limit, or so they say"  (different har baar)
```

#### Temperature 1.5-2.0 — Very Random
```
Bahut zyada randomness — often nonsensical

Avoid karo production mein
Useful for: Experimental, artistic, very abstract content

Example:
  Prompt: "Complete: The sky is"
  Temp 2.0: "dancing purple elephants tomorrow"  ← Nonsensical
```

### Visual Representation:
```
Temperature 0.0:
  Paris ████████████████████ 94.5%
  Lyon  █                    2.1%
  ...   (almost never chosen)

Temperature 1.0:
  Paris ████████████         60%
  Lyon  ████                 15%
  London███                  12%
  ...   (more variety)

Temperature 2.0:
  Paris ████                 30%
  Lyon  ███                  20%
  London███                  18%
  Berlin██                   15%
  ...   (almost equal — very random)
```

---

## 3. Top-P (Nucleus Sampling)

### Kya Hota Hai?
```
Top-P = Cumulative probability threshold

LLM tokens ko probability ke order mein sort karta hai.
Top-P = 0.9 matlab: Sirf wo tokens consider karo jinka
        cumulative probability 90% tak pahunche.
```

### Example:
```
Tokens sorted by probability:
  "Paris"   → 60%  (cumulative: 60%)
  "Lyon"    → 15%  (cumulative: 75%)
  "London"  → 10%  (cumulative: 85%)
  "Berlin"  → 7%   (cumulative: 92%)  ← Top-P 0.9 yahan cut karta hai
  "Rome"    → 4%   (cumulative: 96%)
  ...

Top-P 0.9: Sirf Paris, Lyon, London consider karo (92% tak)
Top-P 0.1: Sirf Paris consider karo (60% tak)
Top-P 1.0: Sab tokens consider karo (default)
```

### Top-P Values:
```
Top-P 0.1:  Very focused — sirf most likely tokens
            Use: Factual, precise answers

Top-P 0.5:  Moderate — top 50% probability mass
            Use: Balanced responses

Top-P 0.9:  Diverse — most tokens included
            Use: Creative writing

Top-P 1.0:  All tokens (default)
            Use: Maximum diversity
```

### Temperature vs Top-P — Kab Kya Use Karein:
```
IMPORTANT RULE:
  Dono ek saath change mat karo!
  Ek hi adjust karo at a time.

Recommendation:
  Temperature adjust karna → Top-P = 1.0 rakho (default)
  Top-P adjust karna       → Temperature = 1.0 rakho (default)

Common setups:
  Precise/Code:    temperature=0.2, top_p=1.0
  Balanced:        temperature=0.7, top_p=1.0
  Creative:        temperature=1.0, top_p=0.9
  Very creative:   temperature=1.2, top_p=0.95
```

---

## 4. Max Tokens

### Kya Hota Hai?
```
max_tokens = Response kitna lamba ho sakta hai (maximum)

Ye sirf OUTPUT tokens limit karta hai.
Input tokens is se affect nahi hote.
```

### Values aur Use Cases:
```
max_tokens = 50    → One-liner answers, yes/no, short facts
max_tokens = 200   → Short paragraphs, quick explanations
max_tokens = 500   → Detailed explanations, short code
max_tokens = 1000  → Long explanations, medium code
max_tokens = 2000  → Detailed articles, complex code
max_tokens = 4096  → Very long responses (max for many models)
```

### Kyu Set Karna Chahiye:
```
1. Cost Control:
   Bina limit ke LLM bahut lamba response de sakta hai
   max_tokens = 200 → Cost predictable rehti hai

2. Speed:
   Kam tokens = faster response
   User experience better hota hai

3. Use-case appropriate:
   Chatbot: max_tokens = 300 (conversational)
   Code gen: max_tokens = 1000 (enough for functions)
   Summary: max_tokens = 150 (concise)
```

### finish_reason — Kyun Ruka?
```javascript
const response = await client.chat.completions.create({...});
console.log(response.choices[0].finish_reason);

// Possible values:
// "stop"          → Natural end (LLM ne khud rok liya)
// "length"        → max_tokens limit hit ho gayi (response cut off!)
// "content_filter"→ Content policy violation
// "tool_calls"    → Function calling triggered

// IMPORTANT: "length" matlab response incomplete hai!
if (response.choices[0].finish_reason === 'length') {
  console.warn('Response was cut off! Increase max_tokens');
}
```

---

## 5. Other Important Parameters

### Frequency Penalty
```
Range: -2.0 to 2.0 (default: 0)

Positive value → Already use hue words ko penalize karo
                 Repetition kam hoti hai

Negative value → Repetition encourage karo

Use karo jab:
  LLM same words baar baar repeat kare
  
Example:
  frequency_penalty = 0:   "The code is good. The code works well."
  frequency_penalty = 1.0: "The code is good. It works well."
```

### Presence Penalty
```
Range: -2.0 to 2.0 (default: 0)

Positive value → Naye topics introduce karne encourage karo
                 Diverse content milta hai

Negative value → Same topics pe rehne encourage karo

Use karo jab:
  Brainstorming mein diverse ideas chahiye
  
Example:
  presence_penalty = 0:   Ek hi topic pe rehta hai
  presence_penalty = 1.0: Naye angles explore karta hai
```

### Stop Sequences
```
Specific strings pe response rok do

stop = ["\n"]        → First newline pe rok do
stop = ["END", "---"]→ In strings pe rok do
stop = ["```"]       → Code block ke baad rok do

Use case:
  Structured output mein useful
  Ek specific section tak hi response chahiye
```

---

## 6. Sab Parameters Ek Saath — Code Example

```javascript
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Different configurations for different use cases

// Config 1: Code Generation (Precise)
const codeConfig = {
  model: "gpt-4o-mini",
  temperature: 0.2,      // Low — consistent code
  max_tokens: 800,       // Enough for functions
  top_p: 1.0,
  frequency_penalty: 0,
  presence_penalty: 0
};

// Config 2: Chatbot (Balanced)
const chatConfig = {
  model: "gpt-4o-mini",
  temperature: 0.7,      // Balanced
  max_tokens: 300,       // Conversational length
  top_p: 1.0,
  frequency_penalty: 0.3 // Avoid repetition
};

// Config 3: Creative Writing
const creativeConfig = {
  model: "gpt-4o-mini",
  temperature: 1.1,      // Creative
  max_tokens: 500,
  top_p: 0.9,
  presence_penalty: 0.6  // Explore new ideas
};

async function generate(prompt, config) {
  const response = await client.chat.completions.create({
    ...config,
    messages: [{ role: "user", content: prompt }]
  });

  return {
    text: response.choices[0].message.content,
    tokens: response.usage.total_tokens,
    finishReason: response.choices[0].finish_reason
  };
}

// Test same prompt with different configs
const prompt = "Write a short description of Node.js";

const precise  = await generate(prompt, codeConfig);
const balanced = await generate(prompt, chatConfig);
const creative = await generate(prompt, creativeConfig);

console.log("Precise:",  precise.text);
console.log("Balanced:", balanced.text);
console.log("Creative:", creative.text);
```

---

## 7. Temperature Experiment — Khud Try Karo

```javascript
// temperature-test.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testTemperature(prompt, temperatures) {
  console.log(`Prompt: "${prompt}"\n`);
  console.log("=".repeat(50));

  for (const temp of temperatures) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: temp,
      max_tokens: 60
    });

    console.log(`\nTemperature ${temp}:`);
    console.log(response.choices[0].message.content);
  }
}

// Test 1: Factual question
await testTemperature(
  "What is the capital of Japan?",
  [0, 0.5, 1.0, 1.5]
);

// Test 2: Creative prompt
await testTemperature(
  "Complete this sentence: The moon is",
  [0, 0.5, 1.0, 1.5]
);

// Test 3: Code (should always be same at temp 0)
await testTemperature(
  "Write a one-line JavaScript function to add two numbers",
  [0, 0, 0]  // Same temp 3 times — should be identical
);
```

---

## 8. Quick Reference Table

```
Parameter          Range      Default   Effect
─────────────────  ─────────  ────────  ──────────────────────────────
temperature        0 - 2.0    1.0       Randomness/creativity
top_p              0 - 1.0    1.0       Vocabulary diversity
max_tokens         1 - 4096   inf       Response length limit
frequency_penalty  -2 to 2    0.0       Penalize repeated words
presence_penalty   -2 to 2    0.0       Encourage new topics
```

### Recommended Settings by Use Case:
```
Use Case           temperature  top_p  max_tokens  freq_pen
─────────────────  ───────────  ─────  ──────────  ────────
Code generation    0.2          1.0    800         0
Factual Q&A        0.3          1.0    300         0
Chatbot            0.7          1.0    400         0.3
Summarization      0.3          1.0    200         0
Creative writing   1.1          0.9    600         0.5
Brainstorming      1.2          0.95   500         0.8
Translation        0.1          1.0    500         0
```

---

## 9. Practice Tasks (Aaj Karo)

### Task 1: OpenAI Playground Experiment
```
https://platform.openai.com/playground open karo

Prompt: "Write a tagline for a coffee shop"

Run karo with:
  Temperature 0   → 5 baar run karo (same result?)
  Temperature 1   → 5 baar run karo (different results?)
  Temperature 1.8 → 5 baar run karo (nonsensical?)

Note karo: Kitna vary karta hai output
```

### Task 2: Code mein Test Karo
```javascript
// Ye script run karo aur output compare karo:

const prompts = [
  { text: "What is 10 + 15?", bestTemp: 0 },
  { text: "Write a poem about rain", bestTemp: 1.0 },
  { text: "Write a Python hello world", bestTemp: 0.2 }
];

// Har prompt ke liye temp 0 aur temp 1 pe run karo
// Kaunsa better result deta hai?
```

### Task 3: Parameter Decision
```
Ye scenarios ke liye best parameters choose karo:

1. Customer support chatbot jo FAQs answer kare
   temperature = ?  max_tokens = ?

2. AI story writer jo unique stories generate kare
   temperature = ?  max_tokens = ?

3. SQL query generator from natural language
   temperature = ?  max_tokens = ?

4. Code bug finder
   temperature = ?  max_tokens = ?

Answers:
1. temp=0.3, max_tokens=300  (consistent, concise)
2. temp=1.1, max_tokens=800  (creative, long)
3. temp=0.1, max_tokens=200  (precise, short)
4. temp=0.2, max_tokens=600  (precise, detailed)
```

---

Kal Day 5 mein System Prompts aur Roles dekhenge —
LLM ka behavior kaise control karein conversation mein.
