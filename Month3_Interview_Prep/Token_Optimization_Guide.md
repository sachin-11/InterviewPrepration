p# Token Bachane Ka Complete Guide
> AI se kaam karwao — kam kharch mein zyada kaam

---

## Sabse Pehle: Token Cost Kahan Jaata Hai?

```
Total Bill = Input Tokens + Output Tokens
             ─────────────   ──────────────
             Tum control     LLM control
             karte ho        karta hai
             (yahan bachao)
```

```
Ek example:
  System Prompt:    500 tokens
  History:        5,000 tokens   ← sabse bada villain
  Context/RAG:    2,000 tokens
  User Message:     100 tokens
  ─────────────────────────────
  Total Input:    7,600 tokens   → $0.023 per call

  1000 calls/day  → $23/day → $690/month 😱
  Token optimize karo → 80% less → $138/month 😊
```

---

## STRATEGY 1: System Prompt Chhota Rakho

```
❌ BURA — 500 tokens waste:
"You are an extremely helpful, polite, and professional
assistant who always responds in a very friendly manner
and makes sure to address all the concerns of the user
carefully and never leaves any question unanswered and
always provides detailed explanations..."

✅ ACHA — 15 tokens:
"Helpful assistant. Be concise and accurate."
```

**Rule:** Har word justify karo — agar remove karein to kuch fark na pade, remove karo.

**Before/After:**
```
Before: 800 token system prompt
After:  150 token system prompt
Saving: 650 tokens × 1000 calls = 650,000 tokens saved/day
```

---

## STRATEGY 2: History Smart Rakho

**Yahi sabse bada token eater hai**

```
❌ GALAT: Poori history har baar bhejo
   50 messages = ~10,000 tokens — har call mein

✅ SAHI Option A — Sliding Window:
   Sirf last 10 messages bhejo = ~2,000 tokens
   Saving: 8,000 tokens per call

✅ SAHI Option B — Summarization (best):
   Old messages → summary → 200 tokens
   + Recent 5 messages → 1,000 tokens
   Total: 1,200 tokens (instead of 10,000)
   Saving: 88%
```

**Summary trick:**
```
50 purane messages ko ek baar summarize karo:
"User Python seekh raha hai, loops cover ho gaye,
ab functions pe hai, beginner level"
= 20 tokens — poori history replace kar di!
```

---

## STRATEGY 3: Prompt Caching — Sabse Bada Saving

**Ye ek feature hai jo log ignore karte hain**

```
Bina caching:
  Call 1: System(1000) + History(500) + Message(100) = 1600 tokens charged
  Call 2: System(1000) + History(500) + Message(100) = 1600 tokens charged
  Call 3: System(1000) + History(500) + Message(100) = 1600 tokens charged

Caching ke saath:
  Call 1: 1600 tokens charged (full)
  Call 2: 100 tokens charged  ← system+history cached!
  Call 3: 100 tokens charged  ← cached!

Saving: 90%+ on repeated parts
```

**Anthropic mein:** `cache_control: ephemeral` lagao system prompt pe
**OpenAI mein:** Automatic hota hai (1024+ token prompts)
**Google Gemini mein:** Context caching manually setup

**When to use:** Jab same system prompt + context baar baar use ho raha ho (agents, chatbots)

---

## STRATEGY 4: Sahi Model Choose Karo

**Har kaam ke liye expensive model mat use karo**

```
Task                          Model               Cost
──────────────────────────────────────────────────────
Simple Q&A, classification  → Haiku / GPT-4o-mini  💚 Cheap
Summarization, extraction   → Sonnet / GPT-4o      💛 Medium
Complex reasoning, coding   → Opus / o3             🔴 Expensive

Example savings:
  Haiku:  $0.00025 per 1K input tokens
  Sonnet: $0.003   per 1K input tokens  (12x more)
  Opus:   $0.015   per 1K input tokens  (60x more!)
```

**Router pattern:**
```
User message aaya
      ↓
Simple hai? → Haiku (90% requests yahan aate hain)
Complex hai? → Sonnet
Code/math?  → Opus ya o3

Result: 70-80% cost reduction
```

---

## STRATEGY 5: Response Length Control Karo

**Output tokens bhi paise lagte hain**

```
❌ Default: LLM jo chahe utna likhe → 800 tokens
✅ Instruction do: "Reply in 2-3 sentences" → 80 tokens

Aur bhi specific:
  "Answer in bullet points, max 5 bullets"
  "One word answer: yes or no"
  "Give only the code, no explanation"
```

**max_tokens parameter:**
```
Simple tasks: max_tokens = 256
Medium tasks: max_tokens = 512
Complex:      max_tokens = 1024
Default mat rehne do (4096) — waste hoga
```

---

## STRATEGY 6: RAG — Poori Book Mat Bhejo, Sirf Page Bhejo

```
❌ GALAT: 100 page document context mein daalo
   = 50,000 tokens — har call mein!

✅ SAHI: RAG use karo
   User query se relevant 3-5 paragraphs nikalo
   = 500 tokens — sirf jo chahiye

Saving: 99% context tokens
```

**Simple RAG logic:**
```
User: "Python mein list kya hota hai?"
      ↓
Search: document mein "list" relevant sections nikalo
      ↓
Sirf woh 3 paragraphs LLM ko bhejo
      ↓
LLM accurate answer de — bina poora document padhe
```

---

## STRATEGY 7: Ek Call Mein Kaam Nikalo

```
❌ GALAT — 3 separate calls:
  Call 1: "Ye text English mein translate karo"
  Call 2: "Ab iska summary banao"
  Call 3: "Tone formal karo"
  = 3x API overhead

✅ SAHI — 1 call:
  "Translate to English, summarize in 3 points,
   use formal tone"
  = 1 call, 1/3 cost
```

**Batch bhi karo:**
```
❌ 100 items → 100 separate API calls
✅ 100 items → 10 calls (10 items each) = 90% fewer calls
```

---

## STRATEGY 8: Structured Output — Parsing Wala Extra Call Hatao

```
❌ GALAT — 2 calls:
  Call 1: "Extract name and age from this text"
          → "The person's name is John and he is 25 years old"
  Call 2: Parse that natural language response

✅ SAHI — 1 call with JSON mode:
  "Extract: {name: string, age: number}"
  → {"name": "John", "age": 25}
  Direct use karo — parsing call nahi chahiye
```

---

## STRATEGY 9: Few-Shot Carefully Use Karo

```
Few-shot examples helpful hain par tokens lagte hain:

❌ 10 examples = 1000 tokens
✅ 2-3 best examples = 300 tokens

Test karo:
  Zero-shot: kaam karta hai? → Use it (0 extra tokens)
  1-shot:    kaam karta hai? → Use it (100 tokens)
  3-shot:    kaam karta hai? → Use it (300 tokens)
  10-shot:   sirf tab jab zaroori ho
```

---

## STRATEGY 10: Semantic Cache — Same Question, Free Answer

```
User A: "Python list kya hai?"     → LLM call → cache
User B: "Python mein list kya hota?"  → similar! → cache se do
User C: "List in Python?"          → same meaning → cache se do

Cost: Teen mein se sirf ek LLM call
Saving: 66% instantly

Tools: GPTCache, Redis semantic cache
Threshold: 0.95 similarity = same question treat karo
```

---

## STRATEGY 11: Context Compress Karo Before Sending

```
Document hai 2000 words ka, but relevant part 200 words:

❌ 2000 words bhejo = 2500 tokens
✅ Pehle filter karo relevant part = 250 tokens

Ya:
❌ Raw text bhejo
✅ Pehle compress karo: remove whitespace, repeated info,
   unnecessary formatting
   → 20-30% size reduction
```

---

## REAL WORLD: Ek Agent Ka Token Budget

```
Typical customer support agent, 1000 calls/day:

WITHOUT optimization:
  System prompt:    800 tokens
  Full history:   8,000 tokens
  Context:        3,000 tokens
  User message:     200 tokens
  ─────────────────────────────
  Per call:      12,000 tokens
  Daily (1000):  12M tokens → $36/day → $1,080/month

WITH optimization:
  System prompt:    100 tokens  (↓87%)
  Last 5 msgs:      800 tokens  (↓90%)
  RAG context:      400 tokens  (↓87%)
  User message:     200 tokens
  Prompt cache:    -800 tokens  (cached parts free)
  ─────────────────────────────
  Per call:       700 tokens
  Daily (1000):   0.7M tokens → $2.10/day → $63/month

SAVING: 94% cost reduction 🎉
```

---

## Quick Reference — Checklist

```
Har project mein ye karo:
  ✅ System prompt audit karo — unnecessary text hatao
  ✅ History: last 5-10 messages only
  ✅ Prompt caching enable karo
  ✅ Task ke hisaab se model choose karo
  ✅ max_tokens set karo
  ✅ RAG use karo large documents ke liye
  ✅ Related tasks batch karo
  ✅ JSON/structured output use karo
  ✅ Semantic cache lagao popular queries ke liye
  ✅ Daily cost track karo (Langfuse / Helicone)
```

---

## Golden Rules

```
1. Measure first — andaaze mat lagao, actual tokens count karo
2. System prompt = always cached rakho
3. History = summary + recent only
4. Model = task ke hisaab se cheapest jo kaam kare
5. Output = sirf utna maango jitna chahiye
6. Cache = same answer baar baar mat nikalo
```
