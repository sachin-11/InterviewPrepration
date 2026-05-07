# Day 7 — Week 1 Revision + Quiz

Aaj poore week ka revision karenge aur khud ko test karenge.
Agar koi concept unclear lage toh us din ki file dobara padho.

---

## 1. Week 1 — Complete Summary

### Day 1: AI & LLM
```
AI      = Machines ko intelligent behavior dena
Narrow AI = Sirf ek kaam (LLM, Chess, Image recognition)
AGI     = General intelligence — abhi exist nahi karta

LLM     = Large Language Model
          Internet data pe trained neural network
          Text prediction machine — "next token kya hoga?"

Training: Data collect → Tokenize → Train → Fine-tune (RLHF)

Popular LLMs:
  GPT-4o      → OpenAI, general purpose
  Claude 3.5  → Anthropic, long context
  Gemini 1.5  → Google, multimodal
  Llama 3     → Meta, open source

Hallucination = LLM confident hokar galat info deta hai
```

### Day 2: Tokens
```
Token   = Text ka basic unit (word ya word-part)
          "Hello" = 1 token
          "Unbelievable" = 3 tokens (Un + belie + vable)
          Hindi text = 5x zyada tokens than English

3 reasons tokens matter:
  1. Cost    → OpenAI charges per token
  2. Context → Max tokens per request (GPT-4o = 128K)
  3. Speed   → Zyada tokens = slow response

Pricing (GPT-4o-mini):
  Input:  $0.15 per 1M tokens
  Output: $0.60 per 1M tokens

Rule of thumb:
  1 token ≈ 4 characters ≈ ¾ word
```

### Day 3: Prompts
```
Prompt = LLM ko diya gaya input (instruction + context)

4 parts:
  System  → LLM ka role define karo
  User    → Actual task/question
  Context → Background information
  Examples→ Few-shot patterns

Prompt types:
  Zero-shot  → Koi example nahi, seedha kaam
  Few-shot   → Examples dekar pattern sikhao
  CoT        → "Think step by step" — complex reasoning
  Role       → Persona assign karo
```

### Day 4: Temperature & Parameters
```
Temperature = Randomness/creativity control
  0.0  → Deterministic (code, facts)
  0.5  → Balanced (chatbot)
  1.0  → Creative (stories, brainstorming)
  2.0  → Very random (avoid)

Top-P = Vocabulary diversity
  0.1  → Focused (top 10% tokens only)
  1.0  → All tokens (default)
  Rule: Temperature ya Top-P — ek hi change karo

max_tokens = Response length limit
finish_reason = "length" → Response cut off hua!

Other params:
  frequency_penalty → Repetition avoid
  presence_penalty  → New topics encourage
```

### Day 5: System Prompts & Roles
```
3 roles:
  system    → Developer ka instruction (hidden from user)
  user      → Human ka message
  assistant → LLM ka response (history ke liye)

System prompt:
  - Poori conversation mein apply hota hai
  - LLM ka persona, tone, rules define karta hai
  - Har API call mein tokens count hote hain

LLM ki memory nahi hoti:
  - Har request stateless hai
  - Poori conversation history manually bhejna padta hai
  - History trim karo context overflow se bachne ke liye
```

### Day 6: Prompt Engineering Best Practices
```
DO's:
  ✓ Specific instructions
  ✓ Output format specify karo
  ✓ Role assign karo
  ✓ Examples do (few-shot)
  ✓ Constraints batao
  ✓ "Think step by step" for complex tasks

DON'Ts:
  ✗ Vague instructions
  ✗ Multiple unrelated tasks
  ✗ Assume LLM context jaanta hai
  ✗ Negative instructions ("don't use X")
  ✗ Sensitive data in prompts

Production template:
  Role → Context → Task → Requirements → Output Format → Example
```

---

## 2. Key Concepts Quick Reference

```
Concept         Definition                              Use Case
──────────────  ──────────────────────────────────────  ──────────────────────
LLM             Text prediction neural network          AI applications
Token           Basic text unit (word/part)             Cost & context measure
Prompt          Input to LLM                            All LLM interactions
Temperature     Randomness control (0-2)                Code=0.2, Creative=1.1
Top-P           Vocabulary diversity (0-1)              Alternative to temp
max_tokens      Response length limit                   Cost & speed control
System prompt   LLM behavior definition                 Persona, rules, format
Context window  Max tokens per request                  Memory limit
Few-shot        Examples in prompt                      Pattern teaching
CoT             Step-by-step reasoning                  Complex problems
Hallucination   Confident wrong answer                  Always verify facts
```

---

## 3. Self Quiz — Khud Test Karo

Pehle khud answer karo, phir neeche check karo.

### Basic Level:
```
Q1. LLM ka full form kya hai?

Q2. "Hello World" mein kitne tokens hain?

Q3. GPT-4o ka context window kitna hai?

Q4. Temperature 0 kab use karein?

Q5. LLM ki apni memory kyun nahi hoti?
```

### Intermediate Level:
```
Q6. Few-shot prompting kya hota hai? Example do.

Q7. Top-P 0.1 aur Top-P 0.9 mein kya fark hai?

Q8. finish_reason "length" ka matlab kya hai?

Q9. System prompt aur User prompt mein 2 differences batao.

Q10. Negative instruction ka positive alternative kya hoga?
     "Don't use for loops"
```

### Advanced Level:
```
Q11. Ek chatbot ke liye best temperature kya hoga aur kyun?

Q12. Hindi text English se zyada tokens kyun leta hai?

Q13. Context window overflow hone pe kya karna chahiye?

Q14. Production prompt template ke 6 parts kaunse hain?

Q15. Ek API call mein 300 input tokens aur 500 output tokens hain.
     GPT-4o-mini pe cost kitni hogi?
```

---

## 4. Quiz Answers

### Basic Level:
```
A1. Large Language Model

A2. 2 tokens — ["Hello", " World"]

A3. 128,000 tokens (~96,000 words)

A4. Jab consistent/deterministic output chahiye
    Code generation, factual answers, translation

A5. Kyunki har API request stateless hoti hai
    LLM ko koi previous conversation yaad nahi rehti
    History manually messages array mein bhejna padta hai
```

### Intermediate Level:
```
A6. Few-shot = Kuch examples dekar LLM ko pattern sikhana
    Example:
      "English to French:
       Hello → Bonjour
       Goodbye → Au revoir
       Thank you → ?"
    LLM pattern follow karta hai → "Merci"

A7. Top-P 0.1 → Sirf top 10% probable tokens consider karo
                Very focused, less variety
    Top-P 0.9 → Top 90% probable tokens consider karo
                More diverse, creative output

A8. finish_reason "length" = Response max_tokens limit pe cut off hua
    Response incomplete hai — max_tokens badhao

A9. System vs User prompt differences:
    1. System: Developer likhta hai | User: End user likhta hai
    2. System: Hidden from user    | User: User directly dekhta hai
    3. System: Poori conversation  | User: Single message
    4. System: Ek baar set hota hai| User: Har message mein

A10. Positive version:
     "Use array methods like map, filter, reduce instead of loops"
```

### Advanced Level:
```
A11. Chatbot ke liye temperature = 0.7
     Kyun: Balanced — consistent enough for accuracy,
           creative enough for natural conversation
           Too low (0) = robotic, repetitive
           Too high (1.5) = unpredictable, off-topic

A12. Hindi text zyada tokens kyun:
     LLM mainly English data pe trained hai
     Hindi characters ko BPE algorithm zyada pieces mein todta hai
     Same meaning = 5x zyada tokens = 5x zyada cost

A13. Context window overflow solutions:
     1. Last N messages rakho (sliding window)
     2. Old conversation summarize karo
     3. Sirf relevant history rakho
     4. System prompt concise rakho

A14. Production prompt template 6 parts:
     1. Role (You are a...)
     2. Context (Background info)
     3. Task (What to do)
     4. Requirements (Specific rules)
     5. Output Format (JSON/Markdown/etc)
     6. Example (Input → Output)

A15. Cost calculation:
     Input:  300 tokens × $0.15/1M = $0.000045
     Output: 500 tokens × $0.60/1M = $0.000300
     Total:  $0.000345 per call (~0.03 paisa)
```

---

## 5. Score Yourself

```
15/15 → Week 2 ke liye fully ready
12-14 → Good! Weak areas ek baar review karo
8-11  → Theek hai, Day 1-6 files ek baar aur padho
< 8   → Week 1 dobara karo before moving to Week 2
```

---

## 6. Practical Revision Task

Ye sab khud se karo bina file dekhe:

```
Task 1: Ek production-ready system prompt likho for:
  "A JavaScript interview assistant that asks one question
   at a time, rates answers 1-10, gives hints if stuck"

Task 2: Ye prompt improve karo:
  "Write code for login"

Task 3: Batao — kaunsa temperature use karoge aur kyun:
  a) SQL query generator
  b) Creative story writer
  c) Customer support bot
  d) Code bug finder

Task 4: Calculate karo:
  System prompt: 150 tokens
  User message:  50 tokens
  AI response:   300 tokens
  Daily calls:   2000
  Model: GPT-4o-mini
  Monthly cost = ?
```

### Task 4 Answer:
```
Per call tokens:
  Input:  150 + 50 = 200 tokens
  Output: 300 tokens

Daily:
  Input:  200 × 2000 = 400,000 tokens
  Output: 300 × 2000 = 600,000 tokens

Monthly (×30):
  Input:  12,000,000 tokens × $0.15/1M = $1.80
  Output: 18,000,000 tokens × $0.60/1M = $10.80
  Total:  $12.60/month ✓
```

---

## 7. Week 2 Preview

```
Week 2: OpenAI API Integration with Node.js

Day 8:  Setup & First API Call
Day 9:  Models & Parameters in code
Day 10: Conversation & Chat History
Day 11: Streaming Responses
Day 12: Error Handling & Rate Limits
Day 13: Building AI Utilities
Day 14: Week 2 Revision + Mini Project

Prerequisites check karo:
  □ Node.js installed? (node --version)
  □ npm installed? (npm --version)
  □ OpenAI account banaya?
  □ API key ready?
  □ VS Code ya koi editor ready?
```

---

Week 1 complete! Week 2 ke liye ready ho jao.
