# Harness, Context & Prompt Engineering
## Simple se Technical tak — Complete Guide

---

# PART 1: HARNESS

## Simple Words mein

**Harness** = Ek **framework/wrapper** jo tumhare AI model ke around hota hai — usse control karta hai, test karta hai, aur safely run karta hai.

Real life analogy:

> Car ka **seatbelt + airbag system** = Harness
> Driver (AI model) freely drive karta hai
> Harness ensure karta hai — crash ho toh damage minimum ho,
> aur sab kuch safely controlled rahe.

Ya aur simple:

> **Cricket net practice** = Harness
> Bowler freely bowl karta hai
> Net ensure karta hai ball bahar nahi jayegi
> Controlled environment mein testing hoti hai

---

## Harness ke Types

### 1. Evaluation Harness (LLM ko test karna)

```
Tumhare paas ek LLM hai.
Tum jaanna chahte ho:
  - Kitna accurate hai?
  - Kahan galti karta hai?
  - Dusre models se better hai ya worse?

Evaluation Harness yahi karta hai.
```

**Most famous: EleutherAI LM Evaluation Harness**

```python
# lm-eval library se kaise use karte hain
from lm_eval import evaluator

results = evaluator.simple_evaluate(
    model="hf",                          # HuggingFace model
    model_args="pretrained=gpt2",        # model name
    tasks=["hellaswag", "arc_easy",      # benchmark tasks
           "mmlu", "truthfulqa"],
    num_fewshot=5,                       # few-shot examples
    batch_size=16,
)

print(results["results"])
# Output:
# hellaswag: 0.7234 accuracy
# arc_easy: 0.6891 accuracy
# mmlu: 0.5123 accuracy
```

**Common Benchmarks jo Harness chalata hai:**

| Benchmark | Kya test karta hai |
|---|---|
| MMLU | General knowledge (57 subjects) |
| HellaSwag | Common sense reasoning |
| HumanEval | Code generation |
| TruthfulQA | Hallucination detect karna |
| GSM8K | Math word problems |
| ARC | Science questions |
| BIG-Bench | 200+ diverse tasks |

---

### 2. Training Harness (Model train karna)

```
Training loop ko manage karna:
  - Data loading
  - Forward pass
  - Loss calculation
  - Backward pass
  - Checkpoint saving
  - Distributed training across GPUs

Yeh sab manage karne wala framework = Training Harness
```

**Popular Training Harnesses:**

```python
# HuggingFace Trainer — sabse popular
from transformers import Trainer, TrainingArguments

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir="./logs",
    evaluation_strategy="epoch",       # har epoch baad evaluate
    save_strategy="epoch",             # checkpoint save
    load_best_model_at_end=True,       # best model load
    fp16=True,                         # mixed precision (faster)
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,   # tumhare custom metrics
)

trainer.train()  # training start
```

**Others:**
- **Axolotl** — fine-tuning harness for LLMs
- **LitGPT** — Lightning AI ka harness
- **TRL** — RLHF/DPO training harness
- **DeepSpeed** — distributed training harness

---

### 3. Agent Harness (AI Agent ko run karna)

```
AI Agent = LLM + Tools + Memory + Loop

Harness manage karta hai:
  - Tool calls execute karna
  - Results wapas LLM ko dena
  - Loop control (kab rukna hai)
  - Error handling
  - Permissions/safety
```

**Claude Code ka harness exactly yahi karta hai:**

```
User message aaya
       ↓
Harness → Claude ko bheja
       ↓
Claude ne tool call maanga (e.g., Read file)
       ↓
Harness → permission check kiya → tool execute kiya
       ↓
Result wapas Claude ko
       ↓
Claude ne aur tool maanga ya final answer diya
       ↓
Harness → user ko dikhaya
```

**Simple Agent Harness code:**

```python
class AgentHarness:
    def __init__(self, llm, tools, max_iterations=10):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.max_iterations = max_iterations

    def run(self, user_query: str) -> str:
        messages = [{"role": "user", "content": user_query}]

        for iteration in range(self.max_iterations):
            # LLM se response lo
            response = self.llm.call(messages)

            # Kya LLM kuch tool use karna chahta hai?
            if response.tool_calls:
                for tool_call in response.tool_calls:
                    tool = self.tools[tool_call.name]

                    # Safety check
                    if not self.is_allowed(tool_call):
                        raise PermissionError(f"Tool {tool_call.name} not allowed")

                    # Tool execute karo
                    result = tool.execute(**tool_call.arguments)

                    # Result messages mein add karo
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result)
                    })

            else:
                # No tool call = final answer
                return response.content

        return "Max iterations reached"
```

---

### 4. Testing Harness (AI output test karna)

```python
# Unit test jaisa — lekin AI ke liye
import pytest

class RAGTestHarness:
    def __init__(self, rag_pipeline):
        self.rag = rag_pipeline
        self.test_cases = []

    def add_test(self, question, expected_keywords, forbidden_words=[]):
        self.test_cases.append({
            "question": question,
            "expected": expected_keywords,
            "forbidden": forbidden_words
        })

    def run_all(self):
        results = []
        for test in self.test_cases:
            answer = self.rag.query(test["question"])

            passed = all(kw.lower() in answer.lower()
                        for kw in test["expected"])
            no_hallucination = not any(w.lower() in answer.lower()
                                      for w in test["forbidden"])

            results.append({
                "question": test["question"],
                "answer": answer,
                "passed": passed and no_hallucination
            })

        pass_rate = sum(r["passed"] for r in results) / len(results)
        print(f"Pass rate: {pass_rate:.1%}")
        return results

# Usage
harness = RAGTestHarness(my_rag_pipeline)
harness.add_test(
    question="What is our refund policy?",
    expected_keywords=["30 days", "full refund"],
    forbidden_words=["I don't know", "unclear"]
)
harness.run_all()
```

---

# PART 2: CONTEXT

## Simple Words mein

**Context** = LLM ko jo kuch bhi dikh raha hai — poori conversation, documents, instructions — sab kuch.

> Analogy: Tumhari **short-term memory**.
> Tum kisi se baat kar rahe ho — tumhe yaad hai:
> - Unhone pehle kya kaha
> - Tum kahan ho
> - Kya topic chal raha hai
>
> LLM ke liye yeh sab = Context

---

## Context Window

**Context Window** = LLM ek baar mein kitna text dekh sakta hai — ek limit hai.

```
Context Window = Input tokens + Output tokens

GPT-4o:          128,000 tokens  (~96,000 words)
Claude Sonnet:   200,000 tokens  (~150,000 words)
Gemini 1.5 Pro:  1,000,000 tokens (~750,000 words)

1 token ≈ 0.75 words (English mein)
```

**Problem:**

```
Agar context window 200K tokens hai:
  System prompt:       2,000 tokens
  Conversation so far: 50,000 tokens
  Documents retrieved: 10,000 tokens
  User query:          100 tokens
  ─────────────────────────────────
  Total:               62,100 tokens  ✅ fits

Lekin 3 ghante baad:
  Conversation so far: 180,000 tokens ❌ overflow!
  Context window se bahar!
```

---

## Context ke Types

### 1. System Context (Instructions)

```
LLM ko batao — tum kaun ho, kaise behave karo.
```

```python
system_prompt = """
You are a helpful customer support agent for TechCorp.
Rules:
- Always be polite and professional
- Never share pricing without manager approval
- If you don't know, say "Let me check and get back to you"
- Language: English only
"""
```

### 2. Conversation Context (History)

```python
messages = [
    {"role": "system",    "content": "You are a helpful assistant"},
    {"role": "user",      "content": "My name is Sachin"},
    {"role": "assistant", "content": "Nice to meet you, Sachin!"},
    {"role": "user",      "content": "What is my name?"},  # current query
]
# LLM ko pata hai naam Sachin hai — kyunki conversation context mein hai
```

### 3. Retrieved Context (RAG)

```python
# Vector DB se laaye documents = retrieved context
retrieved_docs = vector_db.search(user_query, top_k=5)

augmented_prompt = f"""
Answer the question based on the following context:

Context:
{retrieved_docs[0].text}
{retrieved_docs[1].text}
{retrieved_docs[2].text}

Question: {user_query}

Answer:
"""
```

### 4. Tool/Function Context

```python
# Tool call results bhi context mein aate hain
messages = [
    {"role": "user", "content": "What's the weather in Mumbai?"},
    {"role": "assistant", "content": None,
     "tool_calls": [{"name": "get_weather", "args": {"city": "Mumbai"}}]},
    {"role": "tool", "content": "Mumbai: 34°C, Humidity: 78%"},  # tool result = context
    {"role": "assistant", "content": "Mumbai mein abhi 34°C hai..."},
]
```

---

## Context Management Strategies

### Problem: Long conversations context overflow karein toh?

**Strategy 1: Sliding Window**
```python
def get_context_window(messages, max_tokens=180_000):
    # Latest messages rakho, purane hatao
    total_tokens = 0
    selected = []

    for msg in reversed(messages):
        tokens = count_tokens(msg["content"])
        if total_tokens + tokens > max_tokens:
            break
        selected.insert(0, msg)
        total_tokens += tokens

    return selected
```

**Strategy 2: Summarization**
```python
def compress_old_messages(messages, keep_last_n=10):
    if len(messages) <= keep_last_n:
        return messages

    old_messages = messages[:-keep_last_n]
    recent_messages = messages[-keep_last_n:]

    # LLM se hi summary banao
    summary = llm.call([{
        "role": "user",
        "content": f"Summarize this conversation in 3 sentences:\n{old_messages}"
    }])

    return [
        {"role": "system", "content": f"Previous conversation summary: {summary}"},
        *recent_messages
    ]
```

**Strategy 3: Memory Extraction**
```python
# Important facts extract karo aur separately store karo
def extract_facts(conversation):
    facts = llm.call([{
        "role": "user",
        "content": f"""
        Extract key facts from this conversation.
        Return JSON: {{"facts": ["fact1", "fact2"]}}

        Conversation: {conversation}
        """
    }])
    return facts

# Next session mein facts inject karo
def build_context_with_memory(user_query, stored_facts):
    return f"""
    Known facts about this user:
    {stored_facts}

    Current question: {user_query}
    """
```

---

## Context Window Optimization (Cost + Speed)

```
Problem: Bada context = slow response + expensive

1 million tokens input = $3 (Claude Sonnet)
Agar 1000 users kare × 1M tokens = $3000 per run!
```

**Optimization 1: Prompt Caching**

```python
# Anthropic ka prompt caching
# System prompt baar baar repeat hota hai — cache karo
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": very_long_system_prompt,   # 10,000 tokens
        "cache_control": {"type": "ephemeral"}  # CACHE THIS
    }],
    messages=[{"role": "user", "content": user_query}]
)

# Pehli call: 10,000 tokens charge hoga
# Agli calls: cache se aayega = 90% cost reduction!
```

**Optimization 2: Context Compression**

```python
# Documents ko compress karo before sending
def compress_document(doc: str, query: str) -> str:
    return llm.call([{
        "role": "user",
        "content": f"""
        Extract only the parts of this document relevant to: "{query}"
        Keep it under 200 words.

        Document: {doc}
        """
    }])
```

---

# PART 3: PROMPT ENGINEERING

## Simple Words mein

**Prompt Engineering** = LLM se better answers nikalne ki **kala**.

> Analogy: **Kisi expert se sawal poochna**
>
> Bad: "Batao kuch"
> Good: "Main ek Python developer hoon, mujhe Redis caching
>        implement karni hai FastAPI mein, step-by-step
>        production-ready code do with error handling"
>
> Better sawal = better jawab.

---

## Core Techniques

### 1. Zero-Shot Prompting

```python
# Koi example nahi — directly poocho
prompt = "Translate to French: Hello, how are you?"
# Output: "Bonjour, comment allez-vous?"
```

Simple tasks ke liye kafi hai.

---

### 2. Few-Shot Prompting

```python
# Examples do → pattern samjha do
prompt = """
Classify sentiment as positive/negative/neutral.

Review: "This product is amazing!" → positive
Review: "Terrible experience, never again" → negative
Review: "It arrived on time" → neutral

Review: "Best purchase I've made this year!" → """

# LLM samjhega pattern aur bolega: positive
```

**Kitne shots dene chahiye?**
- 1-2 shots: Simple classification
- 3-5 shots: Medium complexity
- 5-10 shots: Complex formatting tasks
- 10+ shots: Usually fine-tuning better hai

---

### 3. Chain of Thought (CoT)

```python
# LLM ko sochne do step by step — accuracy dramatically badhti hai

# WITHOUT CoT:
prompt = "Roger has 5 balls. He buys 2 more cans of 3 balls each. How many balls?"
# LLM answer: 11 (sometimes wrong)

# WITH CoT:
prompt = """
Roger has 5 balls. He buys 2 more cans of 3 balls each. How many balls?

Let's think step by step:
"""
# LLM:
# Step 1: Roger starts with 5 balls
# Step 2: He buys 2 cans × 3 balls = 6 balls
# Step 3: Total = 5 + 6 = 11 balls
# Answer: 11 ✅

# Even simpler — just add:
prompt = "...How many? Let's think step by step."
# This alone improves accuracy by 30-40% on math!
```

---

### 4. Self-Consistency

```python
# Same question multiple times → majority vote

def self_consistent_answer(question: str, n_samples: int = 5) -> str:
    answers = []
    for _ in range(n_samples):
        response = llm.call(
            question + " Let's think step by step.",
            temperature=0.7  # variety ke liye
        )
        answers.append(extract_final_answer(response))

    # Majority answer return karo
    from collections import Counter
    return Counter(answers).most_common(1)[0][0]

# 5 times poocha → 4 baar "42" aaya, 1 baar "40" → return "42"
# Accuracy: Single query se 15-20% better
```

---

### 5. Tree of Thoughts (ToT)

```
Problem ko tree ki tarah explore karo

                    [Problem]
                        |
           ┌────────────┼────────────┐
       [Approach A]  [Approach B]  [Approach C]
           |              |              |
      [A1] [A2]      [B1] [B2]      [C1] [C2]
       ↓    ↓         ↓    ↓         ↓    ↓
     eval  eval     eval  eval     eval  eval
                     ↑
              Best path found! → Continue
```

```python
# Simplified ToT
def tree_of_thoughts(problem: str) -> str:
    # Step 1: Multiple approaches generate karo
    approaches = llm.call(f"""
    Problem: {problem}
    Generate 3 different approaches to solve this.
    Format: 1. ... 2. ... 3. ...
    """)

    # Step 2: Har approach evaluate karo
    best_approach = None
    best_score = 0

    for approach in parse_approaches(approaches):
        score = llm.call(f"""
        Rate this approach on a scale 1-10 for solving: {problem}
        Approach: {approach}
        Just return the number.
        """)

        if int(score) > best_score:
            best_score = int(score)
            best_approach = approach

    # Step 3: Best approach se final answer
    return llm.call(f"""
    Solve this problem using this approach:
    Problem: {problem}
    Approach: {best_approach}
    """)
```

---

### 6. ReAct (Reasoning + Acting)

```
Pattern: Think → Act → Observe → Think → Act → ...

Thought: I need to find the current stock price of Apple
Action: search("Apple AAPL stock price today")
Observation: AAPL is trading at $189.50

Thought: Now I need to calculate 10% of this price
Action: calculate(189.50 * 0.10)
Observation: 18.95

Thought: I have all information needed
Final Answer: 10% of Apple's current stock price is $18.95
```

```python
REACT_PROMPT = """
You are an assistant that solves problems step by step.
At each step, write:
Thought: [your reasoning]
Action: [tool to use and input]
Observation: [result of action]
... (repeat as needed)
Final Answer: [your final answer]

Available tools: {tools}

Question: {question}
"""
```

---

### 7. Role / Persona Prompting

```python
# LLM ko specific role do
prompts = {
    "senior_engineer": """
        You are a Senior Software Engineer with 15 years experience.
        You prioritize: clean code, performance, security.
        You are direct, technical, and don't sugarcoat issues.
        Review this code:
    """,

    "teacher": """
        You are a patient teacher explaining to a 10-year-old.
        Use simple words, analogies, and real-life examples.
        Avoid technical jargon.
        Explain:
    """,

    "devil_advocate": """
        You are a critical reviewer.
        Your job is to find ALL possible problems with this plan.
        Be harsh, thorough, and assume worst-case scenarios.
        Critique this:
    """
}
```

---

### 8. Structured Output Prompting

```python
# LLM se consistent JSON output lo

prompt = """
Extract information from this job posting and return ONLY valid JSON.
No explanation, no markdown, just JSON.

Schema:
{
  "job_title": "string",
  "company": "string",
  "required_skills": ["string"],
  "experience_years": number,
  "salary_range": {"min": number, "max": number} or null,
  "remote": boolean
}

Job Posting:
{job_text}
"""

import json
response = llm.call(prompt)
data = json.loads(response)  # reliably parseable
```

**Better approach — Pydantic + Instructor library:**

```python
from pydantic import BaseModel
from typing import List, Optional
import instructor
import anthropic

class JobPosting(BaseModel):
    job_title: str
    company: str
    required_skills: List[str]
    experience_years: int
    salary_min: Optional[int]
    salary_max: Optional[int]
    remote: bool

client = instructor.from_anthropic(anthropic.Anthropic())

job = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    response_model=JobPosting,   # ← automatically structured!
    messages=[{"role": "user", "content": f"Extract: {job_text}"}]
)

print(job.job_title)      # "Senior Python Developer"
print(job.required_skills) # ["Python", "FastAPI", "PostgreSQL"]
```

---

### 9. System Prompt Best Practices

```python
PRODUCTION_SYSTEM_PROMPT = """
# Role
You are a customer support agent for TechCorp's cloud platform.

# Personality
- Professional but friendly
- Concise — users are busy developers
- If unsure, acknowledge uncertainty honestly

# Capabilities
You can help with:
- Account issues
- Billing questions
- API documentation
- Debugging common errors

# Limitations
You CANNOT:
- Access user accounts directly
- Process refunds (escalate to billing team)
- Discuss competitor products

# Response Format
- Use bullet points for steps
- Code snippets in markdown blocks
- Keep responses under 200 words unless technical depth needed

# Escalation
If issue is complex: "I'll escalate this to our technical team.
                      Ticket #[auto-generated] has been created."
"""
```

**Key principles:**
1. Role pehle define karo
2. Can do / cannot do clearly likho
3. Format specify karo
4. Edge cases handle karo
5. Tone/personality define karo

---

### 10. Advanced: Prompt Chaining

```python
# Complex task ko chhote steps mein todo

def analyze_business_report(report_text: str) -> dict:

    # Step 1: Key metrics extract karo
    metrics = llm.call(f"""
    Extract all numerical metrics from this report.
    Return as JSON: {{"revenue": ..., "growth": ..., "users": ...}}

    Report: {report_text}
    """)

    # Step 2: Trends identify karo
    trends = llm.call(f"""
    Based on these metrics, identify 3 key trends:
    {metrics}

    Format: bulleted list
    """)

    # Step 3: Recommendations do
    recommendations = llm.call(f"""
    Given these trends:
    {trends}

    Provide 3 actionable recommendations for the business.
    Be specific and practical.
    """)

    # Step 4: Executive summary banao
    summary = llm.call(f"""
    Write a 3-sentence executive summary combining:
    Metrics: {metrics}
    Trends: {trends}
    Recommendations: {recommendations}
    """)

    return {
        "metrics": metrics,
        "trends": trends,
        "recommendations": recommendations,
        "summary": summary
    }
```

---

## Prompt Engineering Anti-Patterns (Kya NAHI karna)

```python
# ❌ BAD: Vague instructions
"Write something about machine learning"

# ✅ GOOD: Specific instructions
"Write a 300-word blog intro about supervised learning for
 Python developers who know basic ML but not deep learning"

# ❌ BAD: Negative-only instructions
"Don't be technical, don't use jargon, don't be too long"

# ✅ GOOD: Positive instructions
"Use simple language, real-world analogies, keep under 150 words"

# ❌ BAD: Assuming LLM knows your codebase
"Fix the bug in the auth module"

# ✅ GOOD: Provide context
"Fix this bug in auth.py line 45. Error: 'NoneType has no attribute
 get_token'. The function should return empty string if user not found."

# ❌ BAD: One giant prompt for everything
[500-line mega prompt with 20 different tasks]

# ✅ GOOD: Prompt chaining
[5 focused prompts, each doing one thing well]
```

---

## All Three Together — Complete Picture

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    HARNESS                              │
│  • Request receive karo                                 │
│  • Permissions check karo                              │
│  • Tool calls execute karo                             │
│  • Loop manage karo                                    │
│  • Safety guardrails enforce karo                      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    CONTEXT                              │
│  • System prompt (instructions)                        │
│  • Conversation history                                │
│  • Retrieved documents (RAG)                           │
│  • Tool results                                        │
│  • User's current query                               │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              PROMPT ENGINEERING                         │
│  • How context is structured                           │
│  • Few-shot examples placement                         │
│  • Chain of thought triggers                           │
│  • Output format instructions                          │
│  • Role/persona definition                             │
└─────────────────────┬───────────────────────────────────┘
                      │
                  ┌───▼───┐
                  │  LLM  │
                  └───────┘
```

**Simple explanation:**
- **Harness** = Gadi ka framework (engine, brakes, safety systems)
- **Context** = Gadi ki tank mein kitna petrol hai (information)
- **Prompt Engineering** = Gadi kaise chalani hai (driving skill)

Teeno mil ke ek powerful AI system banate hain.

---

## Interview Quick Answers

**Q: Harness kya hai?**
> Framework jo AI model ko control, test aur safely run karta hai. Evaluation harness model accuracy measure karta hai (LM-Eval), training harness model train karta hai (HuggingFace Trainer), agent harness tool execution manage karta hai.

**Q: Context window kya hai?**
> LLM ek baar mein kitna text process kar sakta hai uski limit. Claude Sonnet = 200K tokens. Overflow management ke liye sliding window, summarization, ya prompt caching use karte hain.

**Q: Prompt Engineering ki top 3 techniques?**
> 1. Chain of Thought — "step by step sochne do" accuracy 30-40% badhta hai
> 2. Few-Shot — examples do pattern samjhane ke liye
> 3. Structured Output — JSON schema specify karo consistent parsing ke liye

---

## Key Numbers

```
Context Windows:
  Claude Sonnet 4.6:  200,000 tokens
  GPT-4o:             128,000 tokens
  Gemini 1.5 Pro:   1,000,000 tokens

Prompt Caching savings:  up to 90% cost on repeated context
CoT improvement:         30-40% on reasoning tasks
Self-Consistency boost:  15-20% additional accuracy
Few-shot sweet spot:     3-5 examples for most tasks

1 token ≈ 0.75 English words
1 page ≈ 500 tokens
1 book ≈ 75,000 tokens
```
