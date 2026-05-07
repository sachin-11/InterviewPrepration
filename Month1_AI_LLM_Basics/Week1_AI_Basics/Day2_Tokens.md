# Day 2 — Tokens: LLM ki Currency

---

## 1. Token Kya Hota Hai?

```
LLM text ko words mein nahi, tokens mein process karta hai.
Token = text ka ek chhota piece (word, word-part, ya character)
```

Simple analogy:
```
Jaise rupaye mein paisa hota hai:
  1 rupaya = 100 paisa

Waise text mein tokens hote hain:
  1 sentence = N tokens

LLM ke liye token = basic unit of processing
```

### Examples:
```
Text              Tokens                          Count
────────────────  ──────────────────────────────  ─────
"Hello"           ["Hello"]                       1
"Hello world"     ["Hello", " world"]             2
"Unbelievable"    ["Un", "belie", "vable"]        3
"ChatGPT"         ["Chat", "GPT"]                 2
"I love coding"   ["I", " love", " coding"]       3
"2024"            ["2024"]                        1
"$100.50"         ["$", "100", ".", "50"]         4
```

Note: Space bhi token ka part hota hai — " world" (space+world = 1 token)

---

## 2. Tokenization Kaise Kaam Karta Hai?

### BPE (Byte Pair Encoding) — OpenAI use karta hai:
```
Algorithm:
  1. Sabse common character pairs dhundho
  2. Unhe ek token mein merge karo
  3. Repeat karo jab tak vocabulary ready na ho

Example:
  Training data mein "ing" bahut common hai
  → "ing" ek single token ban jaata hai

  "programming" → ["program", "ming"]  (2 tokens)
  "running"     → ["run", "ning"]      (2 tokens)
```

### Vocabulary Size:
```
GPT-4 vocabulary = ~100,000 unique tokens
Matlab 100,000 different "pieces" hain jisse sab text banta hai

Common words = 1 token each
  "the", "is", "are", "have" → 1 token

Rare/long words = multiple tokens
  "cryptocurrency" → ["crypto", "currency"]  → 2 tokens
  "antidisestablishmentarianism" → 6+ tokens
```

---

## 3. Tokenization Examples — Detail

### English Text:
```
"I love programming in JavaScript"
→ ["I", " love", " program", "ming", " in", " Java", "Script"]
→ 7 tokens

"The quick brown fox"
→ ["The", " quick", " brown", " fox"]
→ 4 tokens
```

### Code Tokenization:
```javascript
// Code bhi tokenize hota hai
"const x = 10;"
→ ["const", " x", " =", " ", "10", ";"]
→ 6 tokens

"function add(a, b) { return a + b; }"
→ ~12 tokens
```

### Hindi/Urdu Text (Non-English = More Tokens):
```
English: "I love programming"     → 3 tokens
Hindi:   "मैं प्रोग्रामिंग करता हूं" → ~15-20 tokens

Kyun?
  LLM mainly English data pe trained hai
  Non-English characters ko zyada pieces mein todna padta hai
  
  Practical impact:
    Hindi mein same content → 5x zyada tokens → 5x zyada cost
```

### Special Characters:
```
"Hello!" → ["Hello", "!"]          → 2 tokens
"@user"  → ["@", "user"]           → 2 tokens
"https://example.com" → ~5 tokens
Emoji "😊" → 1-3 tokens (depends on model)
```

---

## 4. Tokens ka Importance — 3 Reasons

### Reason 1: COST 💰

```
OpenAI pricing (March 2024):

Model           Input               Output
──────────────  ──────────────────  ──────────────────
GPT-4o          $5 / 1M tokens      $15 / 1M tokens
GPT-4o-mini     $0.15 / 1M tokens   $0.60 / 1M tokens
GPT-4-turbo     $10 / 1M tokens     $30 / 1M tokens
```

Cost calculation example:
```
Ek API call:
  System prompt:  200 tokens
  User message:   100 tokens
  AI response:    500 tokens
  ─────────────────────────
  Input tokens:   300
  Output tokens:  500

GPT-4o cost:
  Input:  300 / 1,000,000 × $5  = $0.0015
  Output: 500 / 1,000,000 × $15 = $0.0075
  Total:  $0.009 per call (~1 paisa)

1000 calls/day:
  $9/day → $270/month

GPT-4o-mini same call:
  Input:  300 / 1,000,000 × $0.15 = $0.000045
  Output: 500 / 1,000,000 × $0.60 = $0.0003
  Total:  ~$0.00035 per call (33x cheaper!)
```

### Reason 2: CONTEXT WINDOW 🪟

```
Context Window = Model ek baar mein kitne tokens "dekh" sakta hai

Isme include hota hai:
  System prompt + Conversation history + Current message + Response

Model           Context Window    Approx Words
──────────────  ────────────────  ─────────────
GPT-4o          128,000 tokens    ~96,000 words
Claude 3.5      200,000 tokens    ~150,000 words
Gemini 1.5 Pro  1,000,000 tokens  ~750,000 words
GPT-4o-mini     128,000 tokens    ~96,000 words
```

Real-world context examples:
```
128,000 tokens ≈
  - 300 pages ki book
  - 1000 emails
  - 10,000 lines of code
  - 6 hours ki conversation

1,000,000 tokens (Gemini) ≈
  - Poori Harry Potter series (7 books)
  - 10 hours ki video transcript
```

Context window overflow problem:
```
Conversation bahut lamba ho jaaye toh:
  Old messages context se bahar ho jaate hain
  LLM unhe "bhool" jaata hai

Solution:
  - Conversation summarize karo
  - Sirf relevant history rakho
  - Sliding window use karo (last N messages)
```

### Reason 3: SPEED ⚡

```
Tokens directly affect response time:

Input tokens:
  Zyada input → LLM zyada process karta hai → slow

Output tokens:
  Zyada output → LLM zyada generate karta hai → slow
  ~30-50 tokens/second (GPT-4o)

Example:
  Short response (100 tokens)  → ~2-3 seconds
  Long response (1000 tokens)  → ~20-30 seconds

Optimization:
  max_tokens parameter set karo
  Unnecessary context mat bhejo
  Concise system prompts likho
```

---

## 5. Token Calculator — Rules of Thumb

```
English text ke liye:
  1 token  ≈ 4 characters
  1 token  ≈ ¾ word (0.75 words)
  
  Reverse:
  1 word   ≈ 1.3 tokens

Quick estimates:
  100 tokens  ≈ 75 words   ≈ half a paragraph
  500 tokens  ≈ 375 words  ≈ 1 page
  1000 tokens ≈ 750 words  ≈ 1.5 pages
  4000 tokens ≈ 3000 words ≈ 6 pages
```

### Practical Estimation:
```
Scenario: Customer support chatbot

System prompt:     ~300 tokens  (instructions, persona)
User message:      ~50 tokens   (average question)
Conversation hist: ~500 tokens  (last 5 exchanges)
AI response:       ~200 tokens  (answer)
─────────────────────────────────────────────
Total per call:    ~1050 tokens

Cost (GPT-4o-mini):
  Input:  850 × $0.15/1M  = $0.000128
  Output: 200 × $0.60/1M  = $0.000120
  Total:  ~$0.000248 per message

1000 messages/day = $0.25/day = $7.5/month ✓ Very cheap!
```

---

## 6. Token Optimization Tips

### Tip 1: Concise System Prompts
```
Bad (verbose):
  "You are a very helpful and friendly AI assistant who always tries
   to provide the most accurate and detailed information possible to
   help users with their questions and concerns..."
  → ~40 tokens

Good (concise):
  "You are a helpful assistant. Be concise and accurate."
  → ~12 tokens

Savings: 28 tokens × 1000 calls = 28,000 tokens saved/day
```

### Tip 2: max_tokens Set Karo
```javascript
// Bina limit ke — LLM bahut lamba response de sakta hai
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [...],
  max_tokens: 500  // Response 500 tokens se zyada nahi hoga
});
```

### Tip 3: Conversation History Trim Karo
```javascript
// Sirf last 10 messages rakho
function trimHistory(messages, maxMessages = 10) {
  const system = messages[0];           // System prompt hamesha rakho
  const recent = messages.slice(-maxMessages); // Last 10 messages
  return [system, ...recent];
}
```

### Tip 4: Sahi Model Choose Karo
```
Simple task (summarize, translate) → GPT-4o-mini (33x cheaper)
Complex task (reasoning, code)     → GPT-4o
Very long document                 → Claude 3.5 (200K context)
```

---

## 7. Tokens vs Characters vs Words

```
Text: "Hello, how are you doing today?"

Characters: 34 (including spaces and punctuation)
Words:       7
Tokens:      8  (["Hello", ",", " how", " are", " you", " doing", " today", "?"])

Comparison:
  Characters > Tokens > Words (roughly)
  
  But for code:
  "function() {}" 
  Characters: 14
  Tokens:     5   (["function", "(", ")", " ", "{}"])
  Words:      1
```

---

## 8. Hands-on: Token Count in Node.js

```javascript
// npm install tiktoken
import { encoding_for_model } from 'tiktoken';

function countTokens(text, model = 'gpt-4o') {
  const enc = encoding_for_model(model);
  const tokens = enc.encode(text);
  enc.free(); // Memory free karo
  return tokens.length;
}

// Test
const texts = [
  "Hello world",
  "I love programming in JavaScript",
  "मैं प्रोग्रामिंग करता हूं",
  "function add(a, b) { return a + b; }"
];

texts.forEach(text => {
  console.log(`"${text}" → ${countTokens(text)} tokens`);
});

// Output:
// "Hello world" → 2 tokens
// "I love programming in JavaScript" → 6 tokens
// "मैं प्रोग्रामिंग करता हूं" → 17 tokens
// "function add(a, b) { return a + b; }" → 12 tokens
```

### Cost Calculator Function:
```javascript
function estimateCost(inputText, outputText, model = 'gpt-4o-mini') {
  const pricing = {
    'gpt-4o':      { input: 5,    output: 15   },  // per 1M tokens
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10,   output: 30   }
  };

  const inputTokens  = countTokens(inputText);
  const outputTokens = countTokens(outputText);
  const price = pricing[model];

  const inputCost  = (inputTokens  / 1_000_000) * price.input;
  const outputCost = (outputTokens / 1_000_000) * price.output;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost:   `$${inputCost.toFixed(6)}`,
    outputCost:  `$${outputCost.toFixed(6)}`,
    totalCost:   `$${(inputCost + outputCost).toFixed(6)}`
  };
}

console.log(estimateCost(
  "What is Node.js?",
  "Node.js is a JavaScript runtime built on Chrome's V8 engine..."
));
```

---

## 9. Quick Summary Table

```
Concept          Explanation                          Impact
───────────────  ───────────────────────────────────  ──────────────────
Token            Text ka basic unit (word/part)       Cost ka base
Context Window   Max tokens per request               Memory limit
Input tokens     Prompt + history tokens              Cost (cheaper)
Output tokens    AI response tokens                   Cost (expensive)
Token limit      max_tokens parameter                 Speed + cost control
BPE              Tokenization algorithm               Non-English = more tokens
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: OpenAI Tokenizer
```
https://platform.openai.com/tokenizer open karo

Ye texts paste karo aur tokens count karo:
1. "Hello, my name is John and I love coding"
2. Same sentence Hindi mein likhke compare karo
3. Apna koi code snippet paste karo
4. Ek emoji paste karo — kitne tokens?

Note karo: Har token alag color mein highlight hota hai
```

### Task 2: Cost Estimate Karo
```
Scenario:
  Tum ek chatbot banate ho
  System prompt: 200 tokens
  Average user message: 30 tokens
  Average AI response: 150 tokens
  Daily users: 500
  Messages per user: 5

Calculate karo:
  1. Tokens per conversation
  2. Total daily tokens
  3. Monthly cost on GPT-4o-mini
  4. Monthly cost on GPT-4o

Answer:
  Tokens per conv = (200+30) × 5 + 150 × 5 = 1150 + 750 = 1900
  Daily tokens    = 500 × 1900 = 950,000
  Monthly tokens  = 950,000 × 30 = 28.5M tokens

  GPT-4o-mini:
    Input:  ~19.5M × $0.15/1M = $2.93
    Output: ~9M    × $0.60/1M = $5.40
    Total:  ~$8.33/month ✓

  GPT-4o:
    Input:  ~19.5M × $5/1M  = $97.5
    Output: ~9M    × $15/1M = $135
    Total:  ~$232.5/month
```

### Task 3: Token Optimization
```
Ye system prompt optimize karo (tokens kam karo, meaning same rakho):

Original (count karo):
"You are an extremely helpful, knowledgeable, and friendly AI assistant
 who specializes in answering questions about programming and software
 development. You always provide clear, accurate, and detailed explanations
 with practical code examples when appropriate."

Optimized version khud likho — target: 50% tokens mein same meaning
```

---

Kal Day 3 mein Prompts dekhenge —
LLM se effectively kaise baat karein, prompt engineering basics.
