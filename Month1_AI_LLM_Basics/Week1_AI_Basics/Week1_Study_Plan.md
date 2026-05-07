# Week 1: AI Basics (LLM, Tokens, Prompts)

---

## Day 1 — What is AI & LLM?

### AI kya hota hai?
- Artificial Intelligence = machines ko insaan jaisi sochne ki ability dena
- Types:
  - Narrow AI: Sirf ek kaam (e.g., Chess, Image recognition)
  - General AI: Sab kuch (abhi exist nahi karta)
  - LLM is a type of Narrow AI — text generation ke liye

### LLM (Large Language Model) kya hota hai?
```
LLM = Bahut bada neural network jo text predict karta hai

Training:
  Internet ka sara text (books, websites, code) → Model train hota hai
  Model seekhta hai: "is word ke baad kaunsa word aata hai?"

Result:
  Input:  "The capital of India is"
  Output: "New Delhi"
```

### Popular LLMs:
```
Model         Company       Best For
────────────  ────────────  ──────────────────────
GPT-4o        OpenAI        General purpose, coding
Claude 3.5    Anthropic     Long context, writing
Gemini 1.5    Google        Multimodal (text+image)
Llama 3       Meta          Open source, self-host
Mistral       Mistral AI    Lightweight, fast
```

### Practice Task:
- ChatGPT ya Claude open karo
- Poochho: "Explain recursion like I'm 10 years old"
- Observe karo kaise response generate hota hai

---

## Day 2 — Tokens: LLM ki Currency

### Token kya hota hai?
```
LLM text ko words mein nahi, tokens mein process karta hai.
Token = word ka ek piece

"Hello"        → 1 token
"Hello world"  → 2 tokens
"Unbelievable" → 3 tokens (Un + belie + vable)
"ChatGPT"      → 2 tokens (Chat + GPT)
```

### Tokenization Example:
```
Text: "I love programming in JavaScript"

Tokens: ["I", " love", " programming", " in", " Java", "Script"]
Count:  6 tokens

Hindi text zyada tokens leta hai:
"मैं प्रोग्रामिंग करता हूं" → ~15-20 tokens (same meaning)
```

### Tokens ka importance:
```
1. Cost: OpenAI charges per token
   GPT-4o: $5 per 1 million input tokens
   
2. Context Window: Model ek baar mein kitne tokens process kar sakta hai
   GPT-4o:       128,000 tokens (~100,000 words)
   Claude 3.5:   200,000 tokens
   Gemini 1.5:   1,000,000 tokens

3. Speed: Zyada tokens = slow response
```

### Token Calculator:
```
Rule of thumb:
  1 token ≈ 4 characters (English)
  1 token ≈ ¾ word
  100 tokens ≈ 75 words
  1000 tokens ≈ 750 words ≈ 1.5 pages
```

### Practice Task:
- https://platform.openai.com/tokenizer open karo
- Apna koi paragraph paste karo
- Dekho kitne tokens bante hain

---

## Day 3 — Prompts: LLM se Baat Karna

### Prompt kya hota hai?
```
Prompt = Jo tum LLM ko input dete ho (instruction + context)

Bad Prompt:   "Write code"
Good Prompt:  "Write a Node.js function that takes an array of numbers
               and returns the sum. Include error handling for non-numeric values."
```

### Prompt ke Parts:
```
1. System Prompt:  LLM ka role define karo
2. User Message:   Actual question/task
3. Context:        Background information
4. Examples:       Few-shot examples (optional)
```

### Prompt Types:

#### Zero-shot Prompting:
```
Koi example nahi dete, seedha kaam bolte hain

Prompt: "Translate 'Hello' to French"
Output: "Bonjour"
```

#### Few-shot Prompting:
```
Kuch examples deke pattern sikhate hain

Prompt:
  "English to French:
   Hello → Bonjour
   Goodbye → Au revoir
   Thank you → ?"

Output: "Merci"
```

#### Chain of Thought (CoT):
```
LLM ko step-by-step sochne ke liye bolte hain

Prompt: "Solve this step by step: If I have 5 apples and give 2 to my
         friend, then buy 3 more, how many do I have? Think step by step."

Output:
  Step 1: Start with 5 apples
  Step 2: Give 2 away → 5 - 2 = 3
  Step 3: Buy 3 more → 3 + 3 = 6
  Answer: 6 apples
```

### Practice Task:
- Same question 3 baar poochho different prompts se:
  1. "Explain sorting"
  2. "Explain sorting algorithms to a beginner with a real-life example"
  3. "You are a teacher. Explain bubble sort step by step with code example in Python"
- Compare the responses

---

## Day 4 — How LLMs Generate Text

### Temperature & Randomness:
```
Temperature = LLM ki creativity/randomness

Temperature 0.0:  Deterministic (same input = same output, always)
                  Use for: Code generation, factual answers

Temperature 0.5:  Balanced
                  Use for: General purpose

Temperature 1.0:  Creative/Random
                  Use for: Story writing, brainstorming

Temperature 2.0:  Very random (often nonsensical)
```

Example:
```
Prompt: "Complete: The sky is"

Temp 0.0: "blue"          (always same)
Temp 0.5: "clear today"   (slightly varied)
Temp 1.0: "a canvas of dreams"  (creative)
```

### Top-P (Nucleus Sampling):
```
Top-P = Kitne probable words mein se choose kare

Top-P 0.1: Sirf top 10% probable words consider karo (focused)
Top-P 0.9: Top 90% probable words consider karo (diverse)

Recommendation:
  Temperature ya Top-P — ek hi change karo, dono nahi
  Default: Temperature=1, Top-P=1
```

### Max Tokens:
```
Response kitna lamba ho sakta hai

max_tokens = 100   → Short response
max_tokens = 2000  → Detailed response
max_tokens = 4096  → Very long response

Cost control ke liye max_tokens set karo
```

### Practice Task:
- OpenAI Playground (platform.openai.com/playground) open karo
- Same prompt ko temperature 0 aur temperature 1 pe run karo
- Difference observe karo

---

## Day 5 — System Prompts & Roles

### Message Roles:
```
OpenAI API mein 3 roles hote hain:

1. system:    LLM ka behavior define karo
2. user:      Human ka message
3. assistant: LLM ka response (conversation history ke liye)
```

### System Prompt ka Power:
```json
{
  "role": "system",
  "content": "You are a senior Node.js developer. 
               Always write clean, production-ready code.
               Include error handling and comments.
               Use async/await instead of callbacks."
}
```

Iske baad jo bhi poochho, LLM usi style mein answer dega.

### Conversation History:
```json
[
  {"role": "system",    "content": "You are a helpful assistant"},
  {"role": "user",      "content": "What is Node.js?"},
  {"role": "assistant", "content": "Node.js is a JavaScript runtime..."},
  {"role": "user",      "content": "What are its main use cases?"}
]
```

LLM ko poori history bhejni padti hai — khud koi memory nahi hoti.

### Practice Task:
- Ek system prompt likho jo ek "Strict Code Reviewer" ko define kare
- Usse koi code snippet review karwao
- Phir system prompt change karo "Friendly Mentor" ke liye
- Same code review karwao — difference dekho

---

## Day 6 — Prompt Engineering Best Practices

### Do's:
```
✓ Specific aur clear instructions do
✓ Output format specify karo (JSON, bullet points, code)
✓ Role assign karo ("You are an expert...")
✓ Examples do (few-shot)
✓ Constraints batao ("in under 100 words", "only use Python")
✓ Step-by-step sochne ke liye kaho complex problems mein
```

### Don'ts:
```
✗ Vague instructions mat do ("write something about AI")
✗ Multiple unrelated tasks ek prompt mein mat daalo
✗ Assume mat karo LLM context jaanta hai
✗ Negative instructions avoid karo ("don't use loops")
  Better: "use recursion instead of loops"
```

### Prompt Template (Production mein use karo):
```
You are a [ROLE].

Context: [BACKGROUND INFORMATION]

Task: [WHAT TO DO]

Requirements:
- [REQUIREMENT 1]
- [REQUIREMENT 2]

Output Format: [JSON/MARKDOWN/PLAIN TEXT]

Example:
Input: [EXAMPLE INPUT]
Output: [EXAMPLE OUTPUT]
```

### Practice Task:
- Ek prompt banao jo:
  - Role: JavaScript code reviewer
  - Task: Review karo aur bugs dhundho
  - Output: JSON format mein {bugs: [], suggestions: [], rating: 1-10}
  - Example bhi do

---

## Day 7 — Week 1 Revision + Quiz

### Key Concepts Recap:
```
LLM     → Large Language Model, text prediction machine
Token   → Text ka basic unit, cost aur context ka measure
Prompt  → LLM ko diya gaya input/instruction
Temp    → Randomness control (0=deterministic, 1=creative)
Top-P   → Vocabulary diversity control
System  → LLM ka role/behavior define karta hai
Context → LLM ki memory (conversation history)
```

### Self Quiz:
```
1. GPT-4o ka context window kitna hai?
2. "Hello World" mein kitne tokens hain?
3. Temperature 0 kab use karein?
4. Few-shot prompting kya hota hai?
5. LLM ki apni memory kyun nahi hoti?

Answers:
1. 128,000 tokens
2. 2 tokens
3. Jab consistent/deterministic output chahiye (code, facts)
4. Kuch examples dekar pattern sikhana
5. Kyunki har request stateless hoti hai, history manually bhejna padta hai
```

### Resources:
- OpenAI Docs: https://platform.openai.com/docs
- Prompt Engineering Guide: https://www.promptingguide.ai
- OpenAI Tokenizer: https://platform.openai.com/tokenizer
- OpenAI Playground: https://platform.openai.com/playground

---

Week 2 mein OpenAI API ko Node.js se integrate karenge — actual code likhenge.
