# Token Optimization — Prompt Engineer & Vibe Coder Guide
> Kam tokens, zyada kaam — practical techniques

---

## Token = Paisa + Speed + Context

```
1 million tokens = ~$3 (Claude Sonnet)
Normal conversation = 2,000–10,000 tokens

Token bachana:
  → Faster response
  → Cheaper API cost
  → Better context window (important for long projects)
```

---

## PART 1: As a Prompt Engineer (App Banate Waqt)

---

### TECHNIQUE 1: System Prompt Surgery

```
❌ BURA — 847 tokens:
"You are an extremely helpful AI assistant who always responds
in a very clear, concise, and professional manner. You should
always be polite and respectful. Never make up information.
Always cite sources when possible. If you don't know something,
say so honestly. Format your responses using markdown when
appropriate..."

✅ ACHA — 31 tokens:
"Expert assistant. Concise, accurate, honest.
Use markdown. Admit uncertainty."

SAVING: 816 tokens × 10,000 calls/day = 8.16M tokens/day = ~$24/day
```

**Rule:** Har word justify karo. Agar remove karne se meaning na badle — remove karo.

---

### TECHNIQUE 2: Dense Prompts

```
❌ VERBOSE — 45 tokens:
"Please review the following Python code and tell me
if there are any bugs or issues you can find in it"

✅ DENSE — 9 tokens:
"Review this Python code for bugs:"

Same kaam. 80% kam tokens.
```

**Pattern:**
```
❌ "Could you please help me to..."   → ✅ Just ask directly
❌ "I would like you to..."           → ✅ Command form use karo
❌ "Can you provide me with..."       → ✅ "Give me..."
❌ Repeated context                   → ✅ Reference karo "as above"
```

---

### TECHNIQUE 3: Output Format Control (Biggest Saving)

```
Output tokens > Input tokens in cost.
LLM ko format batao — warna woh novel likhega.

❌ DEFAULT — 600 token response:
"Tell me about Python decorators"

✅ CONTROLLED — 80 token response:
"Python decorators: definition (1 line) + syntax + 1 example. Max 100 words."
```

**Templates:**
```
"Answer in 2-3 sentences."
"Bullet points only. Max 5 bullets."
"One word: yes or no."
"Give only the code, no explanation."
"JSON only: {field1: type, field2: type}"
"Max 150 words."
```

**Code mein:**
```python
llm = ChatOpenAI(
    model="gpt-4o-mini",
    max_tokens=256,    # ← DEFAULT 4096 mat rehne do — waste!
)
```

---

### TECHNIQUE 4: Prompt Caching — 90% Saving

```
Bina caching:
  Call 1: System(1000) + History(500) + Question(100) = 1600 tokens
  Call 2: System(1000) + History(500) + Question(100) = 1600 tokens
  Call 3: System(1000) + History(500) + Question(100) = 1600 tokens

Caching ke saath:
  Call 1: 1600 tokens (full charge)
  Call 2:  100 tokens ← system+history CACHED!
  Call 3:  100 tokens ← cached!

Saving: 94%
```

**Anthropic SDK mein:**
```python
import anthropic
client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are a helpful coding assistant...",
            "cache_control": {"type": "ephemeral"}  # ← YE LAGAO
        }
    ],
    messages=[
        {"role": "user", "content": user_question}  # fresh har baar
    ]
)

# cache_read_input_tokens check karo response mein
print(response.usage.cache_read_input_tokens)  # ye free hote hain
```

**When to use:** Same system prompt + context baar baar repeat ho raha ho.
**Requirement:** 1024+ tokens hone chahiye cache hone ke liye.

---

### TECHNIQUE 5: History Management

```
❌ GALAT — Poori history bhejo:
  50 messages = ~10,000 tokens — HAR CALL MEIN

✅ SAHI — Sliding window:
  Sirf last 5-10 messages = ~2,000 tokens
  Saving: 8,000 tokens/call

✅ BEST — Summary + Recent:
  Old 45 messages → compress → 200 token summary
  + Last 5 messages = 1,000 tokens
  Total: 1,200 tokens (instead of 10,000)
  Saving: 88%
```

**Code:**
```python
def get_optimized_history(full_history: list, max_recent: int = 5) -> list:
    if len(full_history) <= max_recent:
        return full_history
    
    old_messages = full_history[:-max_recent]
    recent_messages = full_history[-max_recent:]
    
    # Old messages summarize karo (ek LLM call)
    summary = summarize_history(old_messages)
    
    return [
        {"role": "system", "content": f"Conversation summary: {summary}"},
        *recent_messages
    ]
```

---

### TECHNIQUE 6: Model Routing — Sahi Kaam Ke Liye Sahi Model

```
Task                         Model              Cost per 1M tokens
──────────────────────────────────────────────────────────────────
Classify, translate, typo  → Haiku / GPT-4o-mini  $0.25  💚
Summarize, explain code    → Sonnet / GPT-4o       $3.00  💛
Complex reasoning, design  → Opus / o3             $15.00 🔴

Haiku vs Opus = 60x cost difference!
```

**Smart Router:**
```python
def choose_model(task_type: str) -> str:
    routing = {
        "classify":   "claude-haiku-4-5-20251001",   # cheapest
        "translate":  "claude-haiku-4-5-20251001",
        "summarize":  "claude-sonnet-4-6",
        "code_review":"claude-sonnet-4-6",
        "architecture":"claude-opus-4-7",             # complex only
        "debug_hard": "claude-opus-4-7",
    }
    return routing.get(task_type, "claude-sonnet-4-6")

# 90% requests → Haiku = massive savings
```

---

### TECHNIQUE 7: RAG — Poori Book Nahi, Sirf Relevant Page

```
❌ GALAT: 100 page PDF ko context mein daalo
   = 50,000 tokens HAR CALL MEIN

✅ SAHI: RAG (Retrieval Augmented Generation)
   User query se match karo → sirf 3-5 relevant paragraphs bhejo
   = 500 tokens

Saving: 99% context tokens
```

**Flow:**
```
User: "Python list kya hai?"
           ↓
Vector Search: document mein "list" relevant sections nikalo
           ↓
Top 3 chunks (500 tokens) → LLM ko bhejo
           ↓
LLM accurate answer deta hai — bina poora doc padhe
```

---

### TECHNIQUE 8: Batch Processing

```
❌ 100 items → 100 separate API calls = 100x overhead

✅ Batch karo:
   10 items per call → sirf 10 API calls
   
Example:
  "Translate these 10 sentences to Hindi: [list]"
  Instead of 10 separate translate calls
```

**Code:**
```python
# Bad
for item in items:  # 100 API calls
    result = llm.invoke(f"Process: {item}")

# Good
batches = [items[i:i+10] for i in range(0, len(items), 10)]
for batch in batches:  # 10 API calls
    result = llm.invoke(f"Process each item:\n" + "\n".join(batch))
```

---

### TECHNIQUE 9: Structured Output — Extra Parsing Call Hatao

```
❌ GALAT — 2 calls:
  Call 1: "Extract name and age from this text"
          → "The person's name is John and he is 25 years old."
  Call 2: Natural language ko parse karo manually

✅ SAHI — 1 call:
  "Extract as JSON: {name: string, age: number}"
  → {"name": "John", "age": 25}
  Direct use karo!
```

---

## PART 2: As a Vibe Coder (Claude Code Use Karte Waqt)

---

### TECHNIQUE 1: Specific Context Do — Pura Codebase Nahi

```
❌ BAD — Claude ko sab scan karna padta hai:
"Mera app slow hai, fix karo"

✅ GOOD — Targeted file + function:
"ai-backend-python/04_langgraph/01_basics.py mein
step_two function slow hai, optimize karo."

Why matters: Vague prompt → Claude pura codebase read karta hai
             = zyada tokens + slower response
```

---

### TECHNIQUE 2: Ek Kaam Ek Baar

```
❌ WASTE — Claude verbose ho jaata hai:
"Ye code explain karo, phir improve karo,
phir tests likho, phir docs bhi add karo"

✅ EFFICIENT — Step by step:
Step 1: "Sirf bug fix karo"      → done ✅
Step 2: "Ab tests likho"         → done ✅
Step 3: "Ab ek line comment add karo" → done ✅

Ek baar mein sab maango toh Claude har cheez pe paragraph likhta hai
```

---

### TECHNIQUE 3: /clear Ka Smart Use

```
Jab ek task khatam ho → /clear karo

Why: Old conversation context har nayi message pe load hota hai
     = extra tokens har baar

Pattern:
  Task 1 (bug fix) → complete → /clear
  Task 2 (new feature) → fresh start → kam tokens
```

---

### TECHNIQUE 4: Output Instructions Dene Ki Aadat

```
Har important prompt ke end mein ye add karo:

"No explanation needed."
"Only show changed lines."
"Skip imports, just the function."
"One-line answer."
"Just the code."

Example:
❌ "How do I reverse a string in Python?"
   → Claude writes 3 paragraphs + 5 examples

✅ "Python string reverse. Code only."
   → result = s[::-1]
```

---

### TECHNIQUE 5: CLAUDE.md File — Token Free Context

```
CLAUDE.md project mein rakho:
  - Project structure
  - Coding conventions
  - Common patterns
  - What to avoid

Benefit: Claude ko baar baar context explain nahi karna
         = conversation mein tokens bachte hain
```

**Example CLAUDE.md:**
```markdown
# Project: AI Backend Python

## Stack
- Python 3.12, LangChain, LangGraph
- No comments unless non-obvious
- Hinglish is fine for explanations

## Patterns
- Use TypedDict for LangGraph state
- Always set max_tokens in LLM calls
- Prefer RunnableLambda over custom classes
```

---

### TECHNIQUE 6: Reference Existing Code, Mat Copy Karo

```
❌ SLOW — Poora code paste karo:
"Ye code dekho: [500 lines paste] — isko fix karo"

✅ FAST — File reference do:
"03_langchain/02_chains.py line 94-115 mein MockLLM class
ka __or__ method theek se kaam nahi karta, fix karo"

Claude file khud read karta hai — tumhe paste nahi karna
```

---

## REAL WORLD: Before vs After

```
Customer Support Agent — 1000 calls/day:

WITHOUT OPTIMIZATION:
  System prompt:    800 tokens
  Full history:   8,000 tokens
  Full context:   3,000 tokens
  User message:     200 tokens
  ───────────────────────────
  Per call:      12,000 tokens
  Daily:         12M tokens → $36/day → $1,080/month

WITH OPTIMIZATION:
  System prompt:    100 tokens  (prompt surgery)
  Last 5 msgs:      800 tokens  (sliding window)
  RAG context:      400 tokens  (relevant only)
  User message:     200 tokens
  Cache savings:   -800 tokens  (cached parts free)
  ───────────────────────────
  Per call:         700 tokens
  Daily:           0.7M tokens → $2.10/day → $63/month

SAVING: 94% cost reduction 🎉
```

---

## Quick Checklist — Har Project Mein

```
PROMPT ENGINEERING:
  ✅ System prompt audit — unnecessary words hatao
  ✅ Prompt caching enable karo (cache_control: ephemeral)
  ✅ History: last 5-10 messages only + summary
  ✅ Model routing: task ke hisaab se cheapest model
  ✅ max_tokens explicitly set karo
  ✅ RAG use karo large documents ke liye
  ✅ Batch related tasks
  ✅ JSON/structured output use karo

VIBE CODING:
  ✅ Specific file + function reference do
  ✅ Ek kaam ek message mein
  ✅ Task complete hone par /clear karo
  ✅ "No explanation" / "code only" add karo
  ✅ CLAUDE.md mein project context rakho
  ✅ File paste mat karo — path do
```

---

## Golden Rules

```
1. Measure first — token count karo, andaaze mat lagao
2. System prompt = hamesha cached rakho
3. History = summary + recent only
4. Model = task ke hisaab se sabse sasta jo kaam kare
5. Output = sirf utna maango jitna chahiye
6. Cache = same answer baar baar mat nikalo
7. Vague prompt = Claude zyada tokens use karta hai
```
