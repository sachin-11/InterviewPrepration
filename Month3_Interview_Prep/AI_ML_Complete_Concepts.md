# AI & ML — Complete Concepts Guide (Interview Ready)
> Hinglish mein samjhaya gaya hai | Updated: June 2026 (2025-26 cutting-edge concepts included)

---

## PART 1: ML FUNDAMENTALS (Base samajhna zaroori hai)

### 1.1 Machine Learning Kya Hai?
Computer ko data se seekhna sikhana — bina explicitly program kiye.

```
Traditional Programming:  Rules + Data  → Output
Machine Learning:         Data + Output → Rules (Model)
```

### 1.2 ML ke 3 Types

| Type | Kya hota hai | Example |
|------|-------------|---------|
| **Supervised** | Labelled data se seekhna | Spam detection, Price prediction |
| **Unsupervised** | Unlabelled data mein patterns dhundhna | Customer segmentation, Clustering |
| **Reinforcement** | Reward/punishment se seekhna | Game AI, Robot control |

### 1.3 Common ML Algorithms

**Regression (number predict karna):**
- Linear Regression — straight line fit
- Polynomial Regression — curve fit

**Classification (category predict karna):**
- Logistic Regression — binary (yes/no)
- Decision Tree — if-else tree jaisa
- Random Forest — bahut saare trees ka vote
- SVM (Support Vector Machine) — boundary line dhundhna
- KNN (K-Nearest Neighbors) — neighbors se puchho

**Clustering (groups banana):**
- K-Means — k clusters mein divide karo
- DBSCAN — density-based clustering

---

## PART 2: DEEP LEARNING

### 2.1 Neural Network Kya Hai?
Human brain se inspired — neurons aur connections.

```
Input Layer → Hidden Layers → Output Layer
    (data)      (features)      (prediction)
```

### 2.2 Key Concepts

**Activation Functions** — neuron ko "fire" karna hai ya nahi:
- ReLU: `max(0, x)` — most popular
- Sigmoid: 0 to 1 range — binary output ke liye
- Softmax — probability distribution (multi-class)

**Backpropagation** — error calculate karke weights update karna (learning)

**Gradient Descent** — loss minimize karna, hill se neeche utarna jaisa
- SGD (Stochastic) — ek sample pe
- Mini-batch — small group pe
- Adam — adaptive, most used today

**Overfitting vs Underfitting:**
```
Underfitting: Model ne kuch seekha hi nahi (too simpl\e)
Overfitting:  Training data ratt liya, new data pe fail (too complex)
Solution:     Dropout, Regularization, More Data
```

### 2.3 CNN (Convolutional Neural Network)
- Images ke liye
- Filters se features detect karta hai (edges, shapes, faces)
- Used in: Image classification, Object detection

### 2.4 RNN / LSTM / GRU
- Sequential data ke liye (text, time series)
- RNN: basic, short memory
- LSTM: Long Short-Term Memory — long dependencies handle kar sakta hai
- GRU: LSTM ka simplified version

---

## PART 3: TRANSFORMERS & LLMs (Most Important 2024-25)

### 3.1 Transformer Architecture
**2017 mein "Attention Is All You Need" paper ne sab badal diya**

```
Input → Tokenize → Embeddings → Attention Layers → Output
```

**Self-Attention:**
- Har word dusre words ko "attend" karta hai
- "The cat sat because it was tired" — model jaanta hai "it" = "cat"

**Multi-Head Attention:**
- Multiple attention mechanisms parallel mein
- Alag aspects ko alag heads handle karte hain

### 3.2 LLM (Large Language Model)

**Kaise kaam karta hai:**
```
Text → Tokens → Next token predict → Repeat → Output
```

**Key Parameters:**
- **Temperature**: 0 = deterministic, 1+ = creative/random
- **Top-p (nucleus sampling)**: probability mass cutoff
- **Max tokens**: kitna lamba output
- **Context window**: kitna text ek baar process ho sakta hai

**Popular LLMs (2025-2026):**
| Model | Company | Context Window | Highlight |
|-------|---------|----------------|-----------|
| GPT-4.1 / o3 / o4-mini | OpenAI | 128K–1M | o3: best reasoning, 4.1: coding |
| Claude Opus 4 / Sonnet 4 | Anthropic | 200K | Hybrid thinking, best coding |
| Gemini 2.5 Pro | Google | 1M+ | Built-in thinking, multimodal |
| Llama 4 Scout / Maverick | Meta | 1M / 128K | Open source MoE, Scout=long ctx |
| DeepSeek V3 / R1 | DeepSeek | 128K | Open source, o1-level reasoning |
| Qwen 3 | Alibaba | 128K | Strong multilingual + reasoning |
| Mistral Small 3.1 | Mistral AI | 128K | Best small open model |
| Phi-4 / Phi-4-mini | Microsoft | 16K | Best quality/size ratio |

### 3.3 Training Process

**Pre-training:**
- Internet ka sara text pe next-token prediction
- Billions of parameters, massive compute

**Fine-tuning:**
- Specific task ke liye further training
- Smaller dataset, task-specific

**RLHF (Reinforcement Learning from Human Feedback):**
- Human raters responses rank karte hain
- Model ko "helpful, harmless, honest" banana
- ChatGPT/Claude yahi use karte hain

**PEFT (Parameter-Efficient Fine-Tuning):**
- LoRA: Low-Rank Adaptation — sirf kuch parameters change karo
- QLoRA: Quantized LoRA — GPU memory save karo
- Prefix Tuning, Prompt Tuning

---

## PART 4: RAG (Retrieval-Augmented Generation)

### 4.1 RAG Kya Hai?
LLM ke saath external knowledge add karna — hallucination reduce karna.

```
User Query
    ↓
Embed Query → Search Vector DB → Get Relevant Docs
    ↓
LLM ko Context + Query dono do
    ↓
Grounded Answer
```

### 4.2 RAG ke Components

**1. Document Loading:** PDF, Word, Web pages
**2. Chunking:** Documents ko pieces mein todna
   - Fixed size: 500 tokens, 50 overlap
   - Semantic: meaning ke basis pe

**3. Embeddings:** Text → Vector (numbers)
   - OpenAI: `text-embedding-3-small/large`
   - Open source: `sentence-transformers`, `BGE`

**4. Vector Database:**
| DB | Best For |
|----|----------|
| Pinecone | Managed, production |
| Weaviate | Open source + managed |
| ChromaDB | Local development |
| pgvector | PostgreSQL add-on |
| Qdrant | High performance |
| FAISS | In-memory, no infra |

**5. Retrieval:**
   - Dense: vector similarity (cosine/dot product)
   - Sparse: BM25 (keyword matching)
   - Hybrid: dono ka combination (best results)

**6. Reranking:** Retrieved chunks ko better sort karna
   - Cohere Rerank
   - Cross-encoder models

### 4.3 Advanced RAG Techniques (2024-25)

**HyDE (Hypothetical Document Embedding):**
- Query se pehle hypothetical answer generate karo
- Usse embed karke search karo
- Better results for complex queries

**Self-RAG:**
- Model decide karta hai kab retrieve karna hai
- Retrieved content ko critique karta hai

**Corrective RAG (CRAG):**
- Low confidence pe web search bhi karta hai

**RAG Fusion:**
- Multiple queries generate karo
- Results merge karo — better coverage

**GraphRAG (Microsoft):**
- Documents ke beech relationships map karo
- Knowledge graph + RAG
- Complex multi-hop questions ke liye

---

## PART 5: AI AGENTS (2024-25 ka Hot Topic)

### 5.1 AI Agent Kya Hai?
LLM jo khud decide karta hai kya steps lene hain aur tools use karta hai.

```
Goal → Plan → Tool Use → Observe → Plan Again → Complete
```

### 5.2 Agent Components

**1. LLM Brain** — reasoning aur decision making

**2. Tools/Functions:**
- Web search
- Code execution
- API calls
- Database queries
- File operations

**3. Memory:**
- Short-term: conversation history
- Long-term: vector DB mein stored memories

**4. Planning:**
- ReAct: Reason + Act alternately
- Chain-of-Thought (CoT)
- Tree-of-Thought (ToT)

### 5.3 Agent Frameworks

**LangChain:**
- Most popular
- Chains, Agents, Tools, Memory
- Python + JavaScript

**LangGraph:**
- LangChain ka upgrade
- Graph-based workflows
- Cyclical flows support (retry, loop)

**CrewAI:**
- Multi-agent orchestration
- Agents with roles (Researcher, Writer, Reviewer)

**AutoGen (Microsoft):**
- Conversational agents
- Human + AI collaboration

**OpenAI Assistants API:**
- Built-in tools: code interpreter, file search
- Managed threads

**Anthropic Claude + Tool Use:**
- Function calling built-in
- Computer use (beta)

### 5.4 Agentic Patterns

**ReAct (Reason + Act):**
```
Thought: Maine kya sochna chahiye?
Action: tool_name(params)
Observation: tool ka result
Thought: Result dekh ke next step
... repeat ...
Final Answer: ...
```

**Multi-Agent:**
```
Orchestrator Agent
    ├── Research Agent (web search)
    ├── Analysis Agent (data processing)
    └── Writer Agent (output generation)
```

**Human-in-the-Loop:**
- Critical decisions pe human approve kare
- Agentic pipeline mein checkpoints

---

## PART 6: PROMPT ENGINEERING

### 6.1 Basic Techniques

**Zero-shot:** Sirf task batao
```
"Translate this to French: Hello world"
```

**Few-shot:** Examples do
```
English: Hello → French: Bonjour
English: Thank you → French: Merci
English: Goodbye → French: ?
```

**Chain-of-Thought (CoT):**
```
"Step by step solve karo: ..."
```

**Self-Consistency:**
- Same problem multiple times solve karo
- Best/most common answer lo

### 6.2 Advanced Techniques (2024-25)

**Meta-Prompting:** Model se hi prompt generate karwao

**Prompt Chaining:** Complex task → smaller steps → chain

**Constitutional AI (Anthropic):** Principles define karo, model self-critique kare

**System Prompts:** Persona, rules, context define karna

---

## PART 7: VECTOR SEARCH & EMBEDDINGS

### 7.1 Embeddings Kya Hain?
Text/Image ko numbers (vectors) mein convert karna
```
"King" → [0.2, 0.8, -0.1, 0.5, ...]  (1536 dimensions)
"Queen" → [0.2, 0.7, -0.1, 0.5, ...]  (similar!)

King - Man + Woman ≈ Queen  (word arithmetic!)
```

### 7.2 Similarity Metrics

**Cosine Similarity:** angle between vectors (most used)
```
Range: -1 to 1, higher = more similar
```

**Dot Product:** magnitude + direction

**Euclidean Distance:** actual distance

### 7.3 Embedding Models (2025)
- `text-embedding-3-large` (OpenAI) — 3072 dims, best quality
- `text-embedding-3-small` (OpenAI) — 1536 dims, fast + cheap
- `voyage-3` (Voyage AI) — excellent for RAG
- `bge-m3` (BAAI) — multilingual, open source

---

## PART 8: MLOPS & PRODUCTION

### 8.1 ML Pipeline
```
Data Collection → EDA → Feature Engineering → Training
       → Evaluation → Deployment → Monitoring → Retrain
```

### 8.2 Key MLOps Tools

**Experiment Tracking:**
- MLflow — open source
- Weights & Biases (W&B) — popular
- Neptune.ai

**Model Registry:** Model versions track karna

**Feature Store:** Features reuse karna across models

**CI/CD for ML:**
- GitHub Actions
- Kubeflow Pipelines

### 8.3 Model Serving
- **REST API:** FastAPI, Flask
- **BentoML:** ML-specific serving
- **Triton Inference Server:** NVIDIA, high performance
- **vLLM:** LLM serving, high throughput
- **Ollama:** Local LLM serving

### 8.4 Monitoring
- **Data Drift:** Input data distribution badal gayi
- **Model Drift:** Performance degrade ho gayi
- **Concept Drift:** Real-world relationship change ho gayi

---

## PART 9: LATEST CONCEPTS (2024-2025)

### 9.1 Multimodal AI
- Text + Image + Audio + Video same model mein
- GPT-4o, Gemini 1.5, Claude 3.5 Sonnet
- **Vision:** Image samajhna, charts read karna
- **Audio:** Speech to text + understanding

### 9.2 Long Context Windows
- 1M+ tokens (Gemini 1.5)
- Entire codebases, books, videos in context
- **Needle in a Haystack:** Test karta hai ki model kahan se kuch dhundh sakta hai

### 9.3 Reasoning Models
- **OpenAI o1/o3:** Chain-of-thought internally
- **DeepSeek R1:** Open source reasoning
- Math, coding, logic mein much better
- Slow but accurate — "think before answering"

### 9.4 Small Language Models (SLMs)
- **Phi-4 (Microsoft):** 14B params, GPT-4 level on benchmarks
- **Gemma 2 (Google):** 2B/9B/27B
- **LLaMA 3.2:** 1B/3B — mobile pe chalate hain
- Edge deployment ke liye — no cloud needed

### 9.5 Function Calling / Tool Use
```json
{
  "tools": [{
    "name": "get_weather",
    "description": "Get weather for a city",
    "parameters": {
      "city": {"type": "string"}
    }
  }]
}
```
Model decide karta hai kab kaunsa tool call karna hai.

### 9.6 Structured Output / JSON Mode
- LLM guaranteed JSON output de sakta hai
- Pydantic models ke saath integrate
- No more parsing errors

### 9.7 AI Safety & Alignment
- **Hallucination:** Confident wrong answers
- **Jailbreaking:** Safety bypass attempts
- **Guardrails:** Input/output filtering
  - LlamaGuard, Nvidia NeMo Guardrails

### 9.8 Quantization
- Model size reduce karna (accuracy thodi kam)
- **FP32 → INT8 → INT4**
- 4-bit quantization: 70B model bhi consumer GPU pe
- Tools: GPTQ, AWQ, llama.cpp

### 9.9 Computer Use (2024)
- Claude 3.5 Sonnet kan actual computer control kar sakta hai
- Screenshot lo → analyze karo → click/type karo
- Agentic automation ka next level

### 9.10 MCP (Model Context Protocol)
- Anthropic ne banaya — open standard
- AI models ko tools/data sources connect karna
- Like "USB-C for AI" — standardized interface

---

## PART 10: KEY METRICS & EVALUATION

### 10.1 Classification Metrics
```
Accuracy    = (TP + TN) / Total
Precision   = TP / (TP + FP)   → jab FP costly ho (spam filter)
Recall      = TP / (TP + FN)   → jab FN costly ho (cancer detection)
F1 Score    = 2 × (P × R)/(P + R)
```

### 10.2 LLM Evaluation
- **BLEU Score:** Generated text vs reference text
- **ROUGE:** Summarization quality
- **Perplexity:** Model kitna "surprised" hota hai
- **Human Eval:** Best but expensive
- **LLM-as-Judge:** GPT-4 se evaluate karwao

### 10.3 RAG Evaluation
- **Faithfulness:** Answer grounded in context hai?
- **Answer Relevancy:** Question ka answer diya?
- **Context Precision:** Retrieved chunks relevant hain?
- **Context Recall:** Relevant info retrieve hui?
- Tools: **RAGAS framework**

---

## PART 11: INTERVIEW CHEAT SHEET

### Commonly Asked Questions:

**Q: Transformer aur RNN mein kya fark hai?**
A: RNN sequential hai (slow, short memory), Transformer parallel process karta hai (fast, attention se long-range dependencies)

**Q: RAG vs Fine-tuning kab use karein?**
```
RAG:         Dynamic data, factual accuracy, no retraining
Fine-tuning: Style/format change, domain-specific tasks, static knowledge
```

**Q: Hallucination kaise reduce karein?**
A: RAG use karo, temperature kam karo, fact-checking layer add karo, grounding karo

**Q: Vector DB aur traditional DB mein kya fark?**
A: Traditional DB exact match karta hai, Vector DB similarity search karta hai

**Q: Embedding kaise choose karein?**
A: Task ke hisaab se — multilingual chahiye? BGE-M3. Best quality? OpenAI. Free? Sentence-transformers.

**Q: LLM ko production mein scale kaise karein?**
A: vLLM/TGI for serving, batching, caching (semantic cache), load balancing, auto-scaling

---

---

## PART 12: 2025-2026 LATEST CONCEPTS (Cutting Edge)

---

### 12.1 REASONING MODELS — "Think Before You Answer"

**Kya hai:** Model inference ke time zyada compute lagata hai — pehle sochta hai, phir answer deta hai.

```
Normal LLM:    Input → Answer  (fast, sometimes wrong)
Reasoning LLM: Input → <think>...</think> → Verified Answer (slow, accurate)
```

**Top Reasoning Models (2025):**
| Model | By | Specialty |
|-------|----|-----------|
| o3 / o4-mini | OpenAI | Math, coding, science |
| Claude 3.7 Sonnet | Anthropic | Hybrid (fast + extended thinking toggle) |
| DeepSeek R1 | DeepSeek | Open source, o1 level, free |
| Gemini 2.0 Flash Thinking | Google | Fast reasoning |
| QwQ-32B | Alibaba | Open source reasoning |

**Test-Time Compute Scaling:**
- Training compute badhane ki jagah → inference compute badha do
- Model zyada "think" kare → better accuracy
- OpenAI o3: compute badhao → benchmark scores badhte hain linearly

**Kab use karein:**
```
Reasoning Models: Math, logic, coding, complex analysis
Regular LLMs:     Summarization, translation, simple Q&A (cheaper + faster)
```

---

### 12.2 HYBRID REASONING (Claude 3.7 ka Innovation)
- Ek hi model mein dono modes:
  - **Normal mode**: fast, cheap
  - **Extended thinking**: slow, thorough
- Developer control kar sakta hai: `thinking: {budget_tokens: 10000}`
- 2025 ka most practical reasoning approach

---

### 12.3 AGENTIC AI — Production Ready Ho Gaya

**2024:** Agents experiment/demo mein the
**2025:** Agents real production use cases mein hain

**Long-Running Agents:**
- Hours/days tak kaam kar sakte hain
- Interruption handle karna, resume karna
- Human approval checkpoints

**Computer Use / Browser Use:**
```
Agent → Screenshot lo → Analyze karo → Click/Type karo → Repeat
```
- Claude Computer Use (Anthropic)
- Browser Use library (open source)
- Stagehand (Browserbase)
- Real browser automation without Selenium code likhna

**Coding Agents (2025 ka biggest trend):**
| Tool | Kya karta hai |
|------|---------------|
| Claude Code | Terminal mein full codebase agent |
| GitHub Copilot Workspace | PR se code changes |
| Devin 2.0 | Autonomous software engineer |
| SWE-Agent | Research-grade coding agent |
| Cursor | AI-first IDE |

**Agentic Patterns 2025:**
```
1. Orchestrator-Subagent: Ek boss, kai workers
2. Parallel Agents: Multiple agents same time par
3. Evaluator-Optimizer: Agent A kaam karo, Agent B review karo
4. Swarm: Agents dynamically assign tasks to each other
```

---

### 12.4 MCP — Model Context Protocol

**Anthropic ne banaya, industry standard ban gaya (2024-25)**

```
Without MCP:  Har tool ka alag integration likhna
With MCP:     Ek standard protocol → plug and play
```

**Architecture:**
```
Claude / LLM
     ↕ MCP Protocol
MCP Server (tool provider)
  ├── File System
  ├── Database
  ├── GitHub
  ├── Slack
  └── Custom APIs
```

**Real World:**
- VS Code, Claude Desktop, Cursor — sab MCP support karte hain
- 1000+ MCP servers already available
- "USB-C for AI" — universal connector

---

### 12.5 MIXTURE OF EXPERTS (MoE)

**Architecture:**
```
Input → Router → Expert 1 (activated)
               → Expert 2 (skip)
               → Expert 3 (activated)
               → Expert N (skip)
```
- 100B parameters model ho, par sirf 20B activate hon per token
- **Fast + cheap** jaise 20B model, **smart** jaise 100B model

**Examples:**
- Mixtral 8x7B — first popular open MoE
- GPT-4 (rumored MoE architecture)
- Gemini 1.5 — MoE based
- DeepSeek V3 — 671B params, 37B active

---

### 12.6 SMALL LANGUAGE MODELS (SLMs) — Edge AI

**2025 mein SLMs ne prove kiya:** Size matters less than training quality

| Model | Params | Highlight |
|-------|--------|-----------|
| Phi-4 | 14B | Microsoft, GPT-4 level math |
| Phi-4-mini | 3.8B | Mobile pe chalta hai |
| Gemma 3 | 1B–27B | Google, multilingual |
| LLaMA 3.2 | 1B/3B | On-device, Apple Silicon |
| Mistral Small 3.1 | 24B | Best small model for tasks |
| SmolLM2 | 135M | Browser mein bhi chalta hai! |

**On-Device AI (2025-26 trend):**
- iPhone, Android mein built-in AI chips
- Apple Intelligence, Galaxy AI
- Privacy: data device pe hi rehta hai
- No internet needed

---

### 12.7 SYNTHETIC DATA — AI se AI Training

**Problem:** Real labeled data bahut costly hai
**Solution:** LLMs se synthetic data generate karo → better models train karo

```
LLM (Teacher) → Generate 1M examples → Train Small Model (Student)
```

**Real Examples:**
- Phi-4: Microsoft ne synthetic data pe mostly train kiya
- DeepSeek R1: Reasoning traces synthetically generated
- Distillation: GPT-4 ke outputs se smaller model train karna

**Techniques:**
- **Self-Play:** Model apne saath khelta hai, data generate karta hai
- **Rejection Sampling:** Bahut generate karo, best rakho
- **Constitutional AI:** Model apni responses critique kare

---

### 12.8 DIRECT PREFERENCE OPTIMIZATION (DPO)

**RLHF ka replacement** — simpler, stable, cheaper

```
RLHF:  Human feedback → Reward Model → RL training (complex, unstable)
DPO:   Human preference pairs → Direct optimization (simple, stable)
```

**Variants (2025):**
- **GRPO** (Group Relative Policy Optimization) — DeepSeek R1 ne use kiya
- **ORPO** — Reference model bhi nahi chahiye
- **SimPO** — Even simpler

---

### 12.9 MULTIMODAL — TEXT + IMAGE + AUDIO + VIDEO

**2025 mein sab kuch multimodal ho gaya:**

**Vision:**
- PDF, charts, screenshots samajhna
- Document parsing — no OCR needed
- GPT-4o, Claude 3.5, Gemini 1.5

**Native Image Generation (2025):**
- GPT-4o ab directly images generate karta hai
- Text + Image input → Text + Image output
- Ek hi model, alag nahi

**Audio/Voice:**
- Real-time voice conversation (GPT-4o voice mode)
- ElevenLabs, PlayHT — realistic TTS
- Whisper large v3 — best open source STT

**Video Understanding:**
- Gemini 1.5: 1 hour video analyze kar sakta hai
- Video-LLaVA, InternVL — open source
- **Sora (OpenAI):** Text → Video generation

---

### 12.10 PROMPT CACHING — Cost 90% Kam Karo

**Kya hai:** Repeated prompt prefix ko cache karo — har baar process mat karo

```
System prompt (1000 tokens) + User message (100 tokens)
Without cache: 1100 tokens charged
With cache:    100 tokens charged (system prompt cached!)
```

**Support karta hai:**
- Anthropic Claude — explicit cache control
- OpenAI — automatic caching
- Google Gemini — context caching

**RAG + Agents mein bohot useful** — same context baar baar aata hai

---

### 12.11 SPECULATIVE DECODING

**LLM inference speed 3-5x fast karna:**

```
Draft Model (small, fast): tokens quickly generate karo
Main Model (large, slow):  verify karo — sahi hai? rakho, galat? discard
```
- Same output quality, much faster
- vLLM mein built-in support

---

### 12.12 LLM OBSERVABILITY & EVALS (Production Must-Have)

**Tools 2025:**
| Tool | Purpose |
|------|---------|
| LangSmith | LangChain traces, evals |
| Langfuse | Open source observability |
| Arize AI | ML + LLM monitoring |
| Helicone | LLM proxy + analytics |
| Braintrust | Eval framework |

**LLM-as-Judge Pattern:**
```python
# GPT-4 se evaluate karwao
judge_prompt = f"""
Rate this response 1-5:
Question: {question}
Response: {response}
Criteria: accuracy, helpfulness
"""
score = gpt4(judge_prompt)
```

---

### 12.13 AI GATEWAY / LLM ROUTER

**Problem:** Multiple LLMs hain, kaunsa use karein?
**Solution:** Router decide karta hai

```
User Query
    ↓
LLM Router (RouteLLM, LiteLLM)
    ├── Simple query → GPT-4o-mini (cheap)
    ├── Complex query → o3 (smart)
    └── Code query → Claude Sonnet (best for code)
```

**LiteLLM:**
- 100+ LLMs ko ek API se call karo
- OpenAI format se sab call karo
- Cost tracking, load balancing

---

### 12.14 KNOWLEDGE DISTILLATION

**Bade model se chota model train karna:**

```
Teacher Model (GPT-4, 100B+)
        ↓ generate outputs
Student Model (7B) trains on teacher's outputs
        ↓
Student ≈ Teacher quality at 10% cost
```

**2025 mein everywhere hai:**
- DeepSeek ne OpenAI outputs se distill kiya
- Phi series: distilled from GPT-4
- Gemma: distilled from Gemini

---

### 12.15 AI REGULATION & SAFETY (2025-26)

**EU AI Act (Enforced 2025):**
- High-risk AI systems: medical, recruitment, law enforcement
- Transparency requirements — "ye AI hai" batana zaroori
- Biometric surveillance restrictions

**Model Cards & Documentation:**
- Model capabilities, limitations clearly document karna
- Training data disclosure

**Red Teaming:**
- Deliberately model ko attack karo — vulnerabilities dhundho
- OpenAI, Anthropic, Google — regular red team exercises

**Alignment Research (2025-26 frontier):**
- **Superalignment:** OpenAI — AI se AI alignment research
- **Interpretability:** Model ke andar kya ho raha hai samajhna
- **Constitutional AI v2:** Better principles

---

### 12.16 WHAT'S COMING IN 2026 (Predictions)

**Almost Certain:**
- GPT-5, Claude 5, Gemini 3 — significantly smarter
- Autonomous agents mainstream production mein
- On-device AI sab phones mein
- 10M+ context windows standard
- AI-generated code = 50%+ of new code

**Likely:**
- AGI debates intensify (OpenAI claims milestone)
- Real-time video generation at scale
- AI personal assistants (truly useful)
- Voice AI replaces many customer service calls

**Frontier Research:**
- World Models — AI jo physics samjhe, environment predict kare
- Embodied AI — robots jo LLMs se powered hain
- Neuromorphic computing — brain-like hardware
- Post-transformer architectures (Mamba, RWKV maturing)

---

### 12.17 ARCHITECTURE ALTERNATIVES TO TRANSFORMERS

**Transformer ki limits:**
- O(n²) attention complexity — context badhao to cost square ho jata hai
- Memory intensive

**Alternatives (2025 research):**

**Mamba (SSM — State Space Models):**
- Linear complexity O(n)
- Long sequences mein faster
- Jamba = Mamba + Transformer hybrid

**RWKV:**
- RNN style, transformer performance
- Constant memory regardless of sequence length

**Liquid Neural Networks (MIT):**
- Small but adaptive
- Used in robotics

> Note: Transformers abhi bhi dominant hain, ye challengers hain

---

### 12.18 VECTOR DB EVOLUTION (2025)

**New Capabilities:**
- **Hybrid Search** (dense + sparse) — production standard ban gaya
- **Multimodal vectors** — text + image same index mein
- **Filtered search** — metadata + vector simultaneously

**2025 Winners:**
- **Qdrant** — fastest, Rust-based, most features
- **pgvector 0.7+** — PostgreSQL mein hi vector search
- **Weaviate** — best multimodal support
- **Turbopuffer** — serverless, S3 pe data

**Trend:** Dedicated vector DB → Existing DB mein vector support
(PostgreSQL + pgvector often enough for <10M vectors)

---

### 12.19 INTERVIEW QUESTIONS — 2025-26 Specific

**Q: Reasoning model aur normal LLM mein kya fark hai?**
A: Reasoning model test-time compute use karta hai — inference ke time chain-of-thought internally run karta hai. Math/logic mein much better, lekin slow aur expensive. Normal LLM fast hai simple tasks ke liye.

**Q: MoE (Mixture of Experts) ka kya benefit hai?**
A: Parameters zyada hote hain (capacity), but har inference pe sirf subset activate hota hai — isliye fast aur cheap. Same compute pe smarter model.

**Q: Synthetic data se kaise better models bante hain?**
A: Quality data ki limit nahi rehti. LLM se diverse, edge-case-rich data generate karo. Phi-4 ne prove kiya — curated synthetic data > raw internet data.

**Q: DPO kya hai aur RLHF se better kyon?**
A: DPO — Direct Preference Optimization. RLHF mein reward model separately train karna padta hai, phir RL — complex aur unstable. DPO directly preference pairs pe optimize karta hai — simpler, stable, same results.

**Q: LLM production mein cost kaise kam karein?**
A: 1) Prompt caching 2) Smaller models jahan possible 3) LLM router 4) Response caching (semantic) 5) Batching 6) Quantization

---

## QUICK REFERENCE

```
Token ≈ 0.75 words
1K tokens ≈ 750 words ≈ 1 page

Pricing (2026 approximate):
  GPT-4.1:          $2 / $8 per 1M tokens (in/out)
  Claude Sonnet 4:  $3 / $15 per 1M tokens
  Gemini 2.5 Pro:   $1.25 / $10 per 1M tokens
  DeepSeek V3:      $0.27 / $1.10 per 1M tokens (!)
  Llama 4 Scout:    $0 (self-hosted) or ~$0.17 via API

Context Window (2026):
  GPT-4.1:         1M tokens  ≈ 2500 pages
  Claude Opus 4:   200K tokens ≈ 500 pages
  Gemini 2.5 Pro:  1M+ tokens ≈ 2500+ pages
  Llama 4 Scout:   1M tokens  ≈ 2500 pages (open source!)

Embedding Dimensions:
  text-embedding-3-small (OpenAI): 1536 dims
  text-embedding-3-large (OpenAI): 3072 dims
  voyage-3 (VoyageAI):             1024 dims (best for RAG)

Training compute rule (Chinchilla):
  Tokens ≈ 20× Parameters
  LLaMA 3 70B: trained on 15T tokens
  DeepSeek V3: 14.8T tokens, 2048 H800 GPUs, ~$6M

Speed benchmarks (2025):
  Groq (LPU):     500+ tokens/sec — fastest API
  Cerebras:       ~2000 tokens/sec — fastest hardware
  vLLM self-host: 100-300 tokens/sec (A100)
  Claude API:     ~80-120 tokens/sec streaming
```

---

---

## PART 13: 2025-2026 NAYE CONCEPTS (Fresh Off The Press)

---

### 13.1 FRONTIER MODELS — 2025-26 Generation

**OpenAI:**
- **GPT-4.5** (Feb 2025) — better emotional intelligence, less hallucination
- **o3** (Apr 2025) — best-in-class reasoning, expensive but accurate
- **o4-mini** (Apr 2025) — cheap reasoning model, ~o3 quality at 10x lower cost
- **GPT-4.1** (Apr 2025) — 1M context, best for long-context coding tasks

**Anthropic:**
- **Claude 3.7 Sonnet** (Feb 2025) — first hybrid thinking model (toggle on/off)
- **Claude Opus 4 / Sonnet 4** (2025) — best coding + reasoning, extended thinking
- **Claude Haiku 4.5** — fastest, cheapest, great for high-volume tasks

**Google:**
- **Gemini 2.0 Flash** (Jan 2025) — fastest Gemini, free tier pe bhi
- **Gemini 2.5 Pro** (Mar 2025) — built-in thinking, #1 on many benchmarks
- **Veo 2** — video generation SOTA

**Meta:**
- **Llama 4 Scout** (Apr 2025) — 17B active params, 1M context, open source
- **Llama 4 Maverick** (Apr 2025) — MoE 400B total/17B active, beats GPT-4o on many tasks

**Others:**
- **DeepSeek V3** (Dec 2024) — 671B MoE, 37B active, top-tier at near-zero cost
- **DeepSeek R1** (Jan 2025) — open source o1-level reasoning, changed the game
- **Qwen 3** (Apr 2025) — Alibaba, strong reasoning + multilingual, Apache license
- **Gemma 3** (Mar 2025) — Google's open model family, 1B to 27B

---

### 13.2 VIBE CODING — 2025 ka Biggest Trend

**Kya hai:** Natural language se complete features/apps banana — bina manually code likhe.

```
Developer: "Add a dark mode toggle with localStorage persistence"
AI Agent: → Creates component → Wires up state → Adds CSS → Tests it
```

**Tools:**
| Tool | Platform | Best For |
|------|----------|----------|
| **Claude Code** | Terminal CLI | Full codebase, autonomous tasks |
| **Cursor** | IDE (VS Code fork) | In-editor AI, fast iteration |
| **Windsurf** | IDE (Codeium) | Cascade agent, whole-project changes |
| **GitHub Copilot Workspace** | GitHub | PR-level code changes |
| **Gemini CLI** | Terminal | Google-ecosystem projects |
| **Devin 2.0** | Web | Autonomous SWE agent |

**2026 Reality Check:**
```
Survey (Stack Overflow 2025): ~80% developers use AI coding tools daily
AI-generated code: estimated 30-40% of new code in production
But: Debugging AI code requires strong fundamentals — job market changed
```

---

### 13.3 LLAMA 4 — Open Source Game Changer

**Architecture Innovation:**
- **Scout:** 17B active (109B total), MoE, 10M token context capability
- **Maverick:** 17B active (400B total), MoE, beats GPT-4o on most benchmarks
- **Behemoth (upcoming):** 2T parameters — training mein hai

```
Llama 4 Scout Context: 1M tokens = 1000 pages document analysis free-mein
Cost: $0 (self-hosted) vs GPT-4 ($15/1M tokens)
```

**Why It Matters:**
- Pehli baar: open source model ne closed model ko beat kiya across-the-board
- Meta ne game completely change kar diya — AI commoditized

---

### 13.4 AI-FIRST IDEs & CODING AGENTS

**Claude Code (Anthropic — 2025):**
```bash
# Terminal mein full agent
claude "fix all TypeScript errors in this repo"
claude "add tests for the payment module"
claude "refactor this to use async/await"
```
- Autonomous: files read/write karta hai, commands run karta hai
- MCP support built-in — tools add kar sakte ho
- `/review`, `/test`, `/commit` — slash commands

**Cursor Composer (Agent Mode):**
- Multi-file edits in one shot
- Codebase context — poori repo samajhta hai
- `.cursorrules` — project-specific AI instructions

**Windsurf Cascade:**
- "Flow" — agent jo actions ka sequence plan karta hai
- Automatic terminal command execution
- Git-aware changes

---

### 13.5 TEST-TIME COMPUTE SCALING — Deep Dive

**Discovery (2024-25):** More inference compute = better answers — similar to more training compute.

```
o3 on ARC-AGI benchmark:
  Low compute:    75% accuracy
  High compute:   88% accuracy (near human)
  → More thinking → More correct
```

**Techniques:**
| Technique | Kya karta hai |
|-----------|---------------|
| **Best-of-N** | N answers generate karo, best rakho |
| **Beam Search** | Multiple paths explore karo simultaneously |
| **MCTS** | Monte Carlo Tree Search — chess AI jaisa |
| **Self-Verification** | Answer generate karo → verify karo → refine |
| **Budget Tokens** | `thinking: {budget_tokens: 10000}` — control thinking depth |

**Practical Impact:**
```python
# Claude extended thinking
response = client.messages.create(
    model="claude-opus-4-8",
    thinking={"type": "enabled", "budget_tokens": 15000},
    messages=[{"role": "user", "content": "Solve this math proof..."}]
)
# thinking blocks automatically included in response
```

---

### 13.6 AGENTIC AI INFRASTRUCTURE (Production Patterns 2025)

**The Problem (2024):** Agents crash, lose state, too expensive, unpredictable
**The Solution (2025):** Proper infrastructure patterns

**Checkpoint & Resume Pattern:**
```python
# Agent state save karo — crash pe resume kar sako
@agent.checkpoint
async def research_phase(query: str) -> ResearchResult:
    # agar ye crash ho → restart pe yahan se shuru
    pass
```

**Human-in-the-Loop (HITL):**
```
Agent → Detects risky action (delete prod DB) → Pause → 
Ask Human → Human approves/rejects → Continue
```

**Agent Observability Stack:**
```
Request → LLM Call → Tool Use → Response
    ↓         ↓          ↓          ↓
LangSmith / Langfuse traces everything with token costs
```

**Parallel Agent Execution (2025 standard):**
```python
# LangGraph parallel nodes
async def parallel_research(state):
    results = await asyncio.gather(
        search_agent(state["query"]),
        analyze_agent(state["data"]),
        summarize_agent(state["context"])
    )
    return {"results": results}
```

---

### 13.7 GEMINI 2.5 PRO — Thinking Model

**Key Features:**
- **Built-in thinking** — toggle nahi karna, automatically deep think karta hai
- **1M+ token context** — entire codebases, long videos
- **Multimodal:** Text + Image + Audio + Video natively
- **Free tier available** — Google AI Studio

**Flash vs Pro:**
```
Gemini 2.0 Flash: Fast, cheap, good enough for most tasks
Gemini 2.5 Pro:   Thinking, best quality, expensive
Flash Thinking:   Middle ground — fast thinking
```

---

### 13.8 INFERENCE OPTIMIZATION (2025 State-of-the-Art)

**vLLM v0.5+ Features:**
- **PagedAttention** — GPU memory efficiently manage karna
- **Continuous Batching** — tokens align kiye bina batch karo
- **Prefix Caching** — system prompts cache karo (automatic)
- **Speculative Decoding** — 3-5x speedup built-in

**Flash Attention 3 (2024):**
```
Flash Attention 2: 2x faster than standard attention
Flash Attention 3: 2x faster than FA2 (H100 optimized)
Impact: Longer contexts at lower cost
```

**Quantization Evolution:**
```
FP32 → FP16 → BF16 → INT8 → INT4 → INT2(experimental)
llama.cpp: CPU pe bhi 70B model run karo GGUF format mein
AWQ: Accuracy + compression best balance
GPTQ: Post-training quantization, production ready
```

---

### 13.9 MULTIMODAL 2025 — Unified Models

**Native Image Generation:**
```
GPT-4o (2025): Text input → Text + Image output
Claude (upcoming): Same model for understanding + generation
→ Alag DALL-E call nahi, ek hi API
```

**Video Generation Mainstream:**
| Model | By | Quality |
|-------|----|---------|
| Sora | OpenAI | Best consistency, slow |
| Veo 2 | Google | Fast, good quality |
| Runway Gen-3 | Runway | Best for film/creative |
| Kling 2.0 | Kuaishou | Best motion physics |
| Wan 2.1 | Alibaba | Open source, best OSS |

**Real-Time Voice AI:**
- **GPT-4o Realtime API** — sub-300ms voice conversation
- **ElevenLabs Conversational AI** — voice agents for customer service
- **Ultravox** — open source voice LLM
- Already replacing 30-40% of tier-1 customer support calls

---

### 13.10 DeepSeek R1 — Open Source Reasoning Revolution

**January 2025 ka bomb:** DeepSeek ne o1 level reasoning model FREE mein diya

**Training Innovation:**
```
Traditional RLHF: Human feedback → Reward Model → RL
DeepSeek R1:      GRPO (Group Relative Policy Optimization)
                  → No separate reward model needed
                  → Pure RL, emerges reasoning naturally
```

**Why It Shocked Everyone:**
- $6M training cost vs OpenAI's estimated $100M+ for o1
- Open weights — anyone download kar sakta hai
- Performance: Math/coding mein o1 ke barabar
- Chinese lab ne US labs ko pace kiya

**Distillation Wave:**
```
DeepSeek R1 → Distill into → Qwen 7B/14B/32B
→ Small reasoning models widely available
```

---

### 13.11 AGENTIC SEARCH & DEEP RESEARCH

**Perplexity / SearchGPT / Gemini Deep Research:**
- LLM + Real-time web search unified
- "Deep Research" — hours ka kaam minutes mein
- Agent automatically 50+ sources read karta hai, report banata hai

**OpenAI Deep Research:**
```
User: "Compare EV market share by country 2020-2025"
Agent: → Searches 40+ sources → Reads papers → Synthesizes → 
       → Charts generate karta hai → Full report in 5 min
```

**Agentic Browsers (2025):**
- **Stagehand** — Browserbase ki tool, computer use simplified
- **Browser Use** — open source, Playwright + LLM
- **Operator (OpenAI)** — autonomous web tasks

---

### 13.12 ANTHROPIC MCP — Ecosystem Explosion

**Stats (2025):**
- 2000+ official MCP servers
- VS Code, Claude Desktop, Cursor, Windsurf — all support natively
- Companies: Stripe, GitHub, Slack, Linear — sab ne MCP servers banaye

**Enterprise MCP Pattern:**
```
Claude Code / Cursor
      ↕ MCP
Internal MCP Gateway
  ├── company-jira (create/read tickets)
  ├── company-confluence (search docs)
  ├── company-github (PR, code review)
  ├── company-datadog (check metrics)
  └── company-pagerduty (incidents)
```

**Security Consideration (2025 learning):**
- MCP server tool poisoning attacks discovered
- Sandboxing required for untrusted MCP servers
- Anthropic working on MCP security standards

---

### 13.13 AI GOVERNANCE & REGULATION (2025 Enforced)

**EU AI Act — Live:**
- **Feb 2025:** Prohibited AI practices banned (social scoring, biometric surveillance)
- **Aug 2025:** GPAI model obligations (GPT-4, Claude level models)
- **Aug 2026:** High-risk system compliance required
- **Fine:** €30M or 6% global turnover

**US Executive Orders:**
- AI safety testing for frontier models
- Government AI use guidelines
- Export controls on advanced AI chips (NVIDIA H100/H200)

**China AI Regulation:**
- Generative AI rules enforced
- Mandatory content filtering
- Real-name registration for AI services

**Model Cards 2.0 (Industry Standard):**
```yaml
model: claude-opus-4
capabilities: [text, code, reasoning, vision]
limitations: [cutoff: 2025-03, no_realtime_data]
safety_evals: [toxicity: 0.02%, bias_score: ...]
intended_use: [coding, analysis, writing]
prohibited_use: [weapons, CSAM, election manipulation]
```

---

### 13.14 HARDWARE EVOLUTION (2025-26)

**NVIDIA:**
- **H200** — HBM3e memory, 2x inference throughput vs H100
- **Blackwell B200** — 4x H100, NVLink 5.0
- **GB200 NVL72** — 72 GPUs as one unit, 1.4 exaFLOPS

**Apple Silicon:**
- **M4 Pro/Max** — Neural Engine 38 TOPS
- **Apple Intelligence** — on-device LLM processing
- MacBook pe 70B model locally run ho sakta hai (quantized)

**AI PCs:**
| Platform | NPU Capability | On-Device AI |
|----------|---------------|-------------|
| Apple M4 | 38 TOPS | Apple Intelligence |
| Snapdragon X Elite | 45 TOPS | Copilot+, Phi-3 mini |
| Intel Core Ultra 2 | 48 TOPS | OpenVINO models |
| AMD Ryzen AI 300 | 50 TOPS | Local SLMs |

**Cloud Inference Chips:**
- **Groq LPU** — 500 tokens/sec (vs ~100 for GPU) — ultra-low latency
- **Cerebras WSE-3** — entire wafer = one chip — fastest LLM inference
- **Amazon Trainium 2** — 4x Trainium 1 — cheaper training on AWS

---

### 13.15 2026 INTERVIEW QUESTIONS — Naye Concepts

**Q: Llama 4 Scout ka 1M context window practically kaise use karein?**
A: Pura codebase context mein load karo (1M ≈ 750K lines of code). Long document analysis, entire book processing. Lekin caution: "lost in the middle" problem — model ke liye middle content hard to attend to. Important content start/end mein rakho.

**Q: Vibe coding se jobs jayenge?**
A: Not immediately — seniors aur more needed (prompts review karna, architecture decide karna, debugging AI output). Junior roles shift hue: less boilerplate writing, more AI output review. New role: "AI Engineer" — tools orchestrate karna, prompts optimize karna.

**Q: DeepSeek ne industry ko kaise affect kiya?**
A: 3 ways: (1) Cost compression — open source strong model available ho gaya (2) Architecture innovation — GRPO/MLA sab ne adopt kiya (3) Geopolitical — US vs China AI race intensified, export controls badhaye.

**Q: Test-time compute vs training compute — kya better hai?**
A: Depends on task. Training compute: general capability improve karo. Test-time compute: specific hard problems ke liye better — math, coding, reasoning. Hybrid best: good base model + extended thinking when needed.

**Q: MCP security risks kya hain?**
A: (1) Tool poisoning — malicious MCP server dangerous tools expose kare (2) Data exfiltration — MCP server sensitive data leak kare (3) Prompt injection via tools. Mitigation: trusted MCP servers hi use karo, sandboxing, least privilege principle.

**Q: Flash Attention 3 ka real-world impact kya hai?**
A: 2x faster than FA2, H100 pe optimize. Long context models (1M tokens) practically feasible ho gaye — pehle GPU memory exhaust ho jaati thi. Result: Gemini/Llama 4 ke long context windows possible hue.

**Q: AI code mein security vulnerabilities kaise handle karein?**
A: (1) Static analysis tools — Semgrep, Snyk AI code scan (2) SAST/DAST in CI/CD (3) LLM-generated code review with security-focused prompts (4) AI code review tools (CodeRabbit, Qodo) (5) Never trust AI-generated auth/crypto code — manual review mandatory.

---

### 13.16 EMERGING PATTERNS (Watch List 2026)

**Long-Context RAG vs Just-Pass-Everything:**
```
Old approach: Chunk → Embed → Retrieve → Generate
New debate:   1M context mein sab daal do (Llama 4 Scout)
Answer:       Hybrid — small docs: full context, large corpus: RAG
```

**Compound AI Systems:**
- Single LLM call → coordinated pipeline of models
- Example: Fast model filter kare → Slow model deep analysis kare
- RouteLLM, Martian — automatic routing

**Memory-Augmented Agents:**
```
Short-term:  Current conversation (in context)
Working:     Task-specific scratchpad (tool calls)
Episodic:    Past conversations (vector DB)
Semantic:    Facts about user/world (knowledge graph)
Procedural:  How to do tasks (fine-tuned behaviors)
```

**AI Collaboration Tools:**
- Multiple AI agents collaborate on one codebase
- Each agent has role: architect, implementer, reviewer, tester
- SWE-Bench Verified: 50%+ solved by best agents (2025)

---

## QUICK REFERENCE (Updated 2026)

```
1. ML Basics (Part 1-2)
        ↓
2. Transformers & LLMs (Part 3)
        ↓
3. Prompt Engineering (Part 6)
        ↓
4. Embeddings & Vector Search (Part 7)
        ↓
5. RAG Systems (Part 4)
        ↓
6. AI Agents (Part 5)
        ↓
7. MLOps & Production (Part 8)
        ↓
8. Latest 2024-25 Concepts (Parts 9, 12) — important for interviews
        ↓
9. 2025-26 Cutting Edge (Part 13) — for senior/AI Engineer roles
```

**For Interview Focus (2026):**
- **Junior AI role:** Parts 1-8 strong hona zaroori
- **Mid-level / Full-stack AI:** Parts 1-9 + RAG/Agents (Parts 4,5,12)
- **Senior AI Engineer:** Everything + Part 13 (MCP, vibe coding, inference infra)
- **ML Engineer:** Parts 1-8 + MLOps deep dive + Part 13.8 (inference optimization)
