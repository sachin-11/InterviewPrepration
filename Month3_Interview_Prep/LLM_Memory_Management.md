# LLM Memory Management — Kaise Yaad Rakhta Hai?
> LLM ko koi bhi cheez naturally yaad nahi rehti — sab kuch hum engineers manage karte hain

---

## QUICK DECISION GUIDE (Pehle ye padho)

```
Tumhara agent kaisa hai?
│
├── Simple chatbot (ek session, khatam)
│       → Sirf Context Window kaafi hai
│
├── Multi-session (user kal wapis aaye)
│       → Context Window + Redis history
│
├── Personal assistant (user preferences yaad rakho)
│       → Redis + Entity Store + Vector DB
│
└── Enterprise agent (lakhon users, complex tasks)
        → Full Memory Stack (sab kuch)
```

---

## PART 1: Sabse Pehle — LLM Kya Bhool Jaata Hai?

### The Core Problem

```
User:  "Mera naam Sachin hai"
LLM:   "Hello Sachin!"

--- New API call ---

User:  "Mera naam kya hai?"
LLM:   "Mujhe nahi pata, aapne nahi bataya" 😐
```

**Kyun?** LLM ek **stateless function** hai:

```
f(input) → output

Har baar naya call = blank slate
Koi bhi previous call ki memory nahi
```

Ye ek calculator ki tarah hai — result deta hai, but next calculation mein previous result yaad nahi.

---

## PART 2: Memory Ke 4 Types

```
┌─────────────────────────────────────────────────┐
│              LLM MEMORY TYPES                   │
│                                                 │
│  1. IN-CONTEXT     │  2. EXTERNAL               │
│  (Context Window)  │  (Redis, DB, Vector DB)    │
│                    │                            │
│  3. IN-WEIGHTS     │  4. IN-CACHE               │
│  (Training data)   │  (KV Cache)                │
└─────────────────────────────────────────────────┘
```

---

### Type 1: In-Context Memory (Short-Term)

**Kya hai:** Context window mein saari conversation daalo — LLM "yaad" rakhega

```python
messages = [
    {"role": "system",    "content": "You are a helpful assistant"},
    {"role": "user",      "content": "Mera naam Sachin hai"},
    {"role": "assistant", "content": "Hello Sachin!"},
    {"role": "user",      "content": "Mera naam kya hai?"},  # ← new message
]

response = llm(messages)
# LLM: "Aapka naam Sachin hai!" ✅
```

**Kaise kaam karta hai:**
```
[System Prompt] + [Message 1] + [Reply 1] + [Message 2] + [Reply 2] + ... + [New Message]
                ↑────────────────────────────────────────────────────────────↑
                                 Context Window (128K tokens)
```

**Limits:**
```
GPT-4o:    128,000 tokens  ≈  96,000 words  ≈  ~300 pages
Claude:    200,000 tokens  ≈ 150,000 words  ≈  ~500 pages
Gemini:  1,000,000 tokens  ≈ 750,000 words  ≈ ~2500 pages

Agar conversation limit se zyada badi → oldest messages cut ho jaate hain
```

---

### Type 2: External Memory (Long-Term) — Ye Sabse Important Hai

Bade conversations ke liye — data bahar store karo, zaroorat pe laao.

**3 sub-types hain:**

#### 2A. Conversation History (Database mein)
```python
# PostgreSQL mein store karo
CREATE TABLE conversations (
    id          UUID PRIMARY KEY,
    session_id  VARCHAR(100),
    role        VARCHAR(20),    -- 'user' ya 'assistant'
    content     TEXT,
    created_at  TIMESTAMP
);

# Har message save karo
def save_message(session_id, role, content):
    db.execute("""
        INSERT INTO conversations (session_id, role, content)
        VALUES (%s, %s, %s)
    """, (session_id, role, content))

# Purani history laao
def get_history(session_id, last_n=20):
    return db.query("""
        SELECT role, content FROM conversations
        WHERE session_id = %s
        ORDER BY created_at DESC
        LIMIT %s
    """, (session_id, last_n))
```

**Flow:**
```
User message aaya
       ↓
DB se last 20 messages laao
       ↓
Context window mein daalo
       ↓
LLM ko bhejo → Reply aaya
       ↓
Dono (user + assistant) DB mein save karo
```

---

#### 2B. Semantic Memory (Vector DB mein) — Intelligent Memory

**Problem with simple DB:** 10,000 messages hain — sab context mein dalna impossible

**Solution:** Sirf relevant cheezein laao — vector similarity se

```python
from sentence_transformers import SentenceTransformer
import chromadb

embedder = SentenceTransformer("all-MiniLM-L6-v2")
vector_db = chromadb.Client()
collection = vector_db.create_collection("memories")

# Memory save karna
def save_memory(user_id: str, text: str):
    embedding = embedder.encode(text).tolist()
    collection.add(
        documents=[text],
        embeddings=[embedding],
        ids=[f"{user_id}_{hash(text)}"],
        metadatas=[{"user_id": user_id}]
    )

# Relevant memory retrieve karna
def get_relevant_memories(user_id: str, query: str, top_k=5):
    query_embedding = embedder.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": user_id}
    )
    return results["documents"][0]

# Example
save_memory("sachin", "Sachin ko Python aur AI pasand hai")
save_memory("sachin", "Sachin Pune mein rehta hai")
save_memory("sachin", "Sachin ka birthday 15 March hai")

# Jab user pooche:
query = "Mujhe koi gift suggest karo"
memories = get_relevant_memories("sachin", query)
# Returns: ["Sachin ko Python aur AI pasand hai", "Sachin ka birthday 15 March hai"]
# Relevant memories! "Pune" wali nahi aayi kyunki gift se related nahi
```

---

#### 2C. Entity Memory — Important Facts Track Karna

Specific entities (log, jagah, cheezein) ke baare mein facts store karo:

```python
# entities.json / Redis mein
{
  "user_id": "sachin",
  "entities": {
    "name":       "Sachin",
    "location":   "Pune",
    "job":        "Software Engineer",
    "interests":  ["Python", "AI", "System Design"],
    "project":    "Interview Preparation",
    "last_topic": "MLOps"
  }
}

# Update hota rehta hai conversation ke saath
def update_entity(user_id, key, value):
    redis.hset(f"entities:{user_id}", key, value)

def get_entities(user_id):
    return redis.hgetall(f"entities:{user_id}")
```

```python
# LangChain mein built-in entity memory
from langchain.memory import ConversationEntityMemory

memory = ConversationEntityMemory(llm=llm)
# Automatically entities extract karta hai aur track karta hai
```

---

### Type 3: In-Weights Memory (Training mein store)

**Kya hai:** Model ne training mein jo seekha — wo "yaad" hai permanently

```
"Paris France ki capital hai" → Training data mein tha → Model ko pata hai
"2024 Olympics Paris mein tha" → Training ke baad hua → Model ko nahi pata
```

- **Change nahi hoti** bina retraining ke
- Cutoff date ke baad ki knowledge nahi hoti
- Yahi reason hai RAG ka — bahar se fresh knowledge inject karo

---

### Type 4: In-Cache Memory (KV Cache)

**Kya hai:** Computation save karna — same tokens bar baar process mat karo

```
Normal:  [System Prompt 1000 tokens] process karo → answer do
         [System Prompt 1000 tokens] process karo → answer do  (REPEAT!)
         [System Prompt 1000 tokens] process karo → answer do  (REPEAT!)

KV Cache: [System Prompt 1000 tokens] ek baar process karo → CACHE karo
          Next calls mein cache se lo → 10x faster + 90% cheaper
```

**Anthropic prompt caching:**
```python
response = anthropic.messages.create(
    model="claude-sonnet-4-6",
    system=[
        {
            "type": "text",
            "text": """You are an expert assistant with following knowledge:
            [2000 tokens of context...]""",
            "cache_control": {"type": "ephemeral"}  # ← YE LAGAO
        }
    ],
    messages=[{"role": "user", "content": user_message}]
)
# First call:  2100 tokens charged (full)
# 2nd+ calls: 100 tokens charged (sirf user message)
```

---

## PART 3: Real Agent mein Memory Kaise Kaam Karta Hai

### Complete Memory Architecture

```
User: "Mujhe Python list comprehension samjhao"
                    ↓
┌───────────────────────────────────────────┐
│           MEMORY MANAGER                 │
│                                          │
│  1. Entity Store se laao:                │
│     user_level: "intermediate"           │
│     language: "Python"                   │
│                                          │
│  2. Vector DB se relevant memories:      │
│     "User ne loops seekhe the"           │
│     "User ko for loops pata hain"        │
│                                          │
│  3. Recent history (last 5 messages):    │
│     [conversation context]               │
└───────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────┐
│           CONTEXT WINDOW                 │
│                                          │
│  System: You are a Python tutor...       │
│                                          │
│  [Memories]:                             │
│  - User is intermediate level            │
│  - User knows for loops                  │
│                                          │
│  [Recent Chat]: ...last 5 messages...    │
│                                          │
│  User: Mujhe list comprehension samjhao  │
└───────────────────────────────────────────┘
                    ↓
              LLM Response
                    ↓
        ┌───────────────────────┐
        │   MEMORY UPDATER      │
        │   - Save new message  │
        │   - Extract entities  │
        │   - Update vector DB  │
        └───────────────────────┘
```

---

### Code: Complete Memory System

```python
# memory_system.py
import redis
import json
from anthropic import Anthropic
from sentence_transformers import SentenceTransformer
import chromadb
from datetime import datetime

client = Anthropic()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
embedder = SentenceTransformer("all-MiniLM-L6-v2")
chroma = chromadb.Client()
collection = chroma.get_or_create_collection("long_term_memory")


class AgentMemory:
    
    def __init__(self, user_id: str):
        self.user_id = user_id
    
    # ─── SHORT TERM: Recent conversation ───────────────────
    
    def add_message(self, role: str, content: str):
        key = f"history:{self.user_id}"
        message = json.dumps({"role": role, "content": content, 
                               "time": datetime.now().isoformat()})
        redis_client.rpush(key, message)
        redis_client.ltrim(key, -50, -1)   # Last 50 messages rakho
        redis_client.expire(key, 86400 * 7) # 7 din baad expire
    
    def get_recent_messages(self, n: int = 10) -> list:
        key = f"history:{self.user_id}"
        raw = redis_client.lrange(key, -n, -1)
        return [json.loads(m) for m in raw]
    
    # ─── ENTITY MEMORY: Important facts ────────────────────
    
    def update_entity(self, key: str, value: str):
        redis_client.hset(f"entities:{self.user_id}", key, value)
    
    def get_all_entities(self) -> dict:
        return redis_client.hgetall(f"entities:{self.user_id}") or {}
    
    # ─── LONG TERM: Vector DB ──────────────────────────────
    
    def save_long_term(self, memory: str):
        embedding = embedder.encode(memory).tolist()
        collection.add(
            documents=[memory],
            embeddings=[embedding],
            ids=[f"{self.user_id}_{hash(memory)}"],
            metadatas=[{"user_id": self.user_id, 
                        "created": datetime.now().isoformat()}]
        )
    
    def recall_relevant(self, query: str, top_k: int = 3) -> list:
        query_emb = embedder.encode(query).tolist()
        results = collection.query(
            query_embeddings=[query_emb],
            n_results=top_k,
            where={"user_id": self.user_id}
        )
        return results["documents"][0] if results["documents"] else []
    
    # ─── CONTEXT BUILDER ───────────────────────────────────
    
    def build_context(self, current_query: str) -> str:
        entities  = self.get_all_entities()
        memories  = self.recall_relevant(current_query)
        
        context_parts = []
        
        if entities:
            entity_text = "\n".join([f"- {k}: {v}" for k, v in entities.items()])
            context_parts.append(f"User ke baare mein:\n{entity_text}")
        
        if memories:
            memory_text = "\n".join([f"- {m}" for m in memories])
            context_parts.append(f"Relevant memories:\n{memory_text}")
        
        return "\n\n".join(context_parts)


# ─── Agent jo Memory use karta hai ───────────────────────

class MemoryAgent:
    
    def __init__(self, user_id: str):
        self.memory = AgentMemory(user_id)
    
    async def chat(self, user_message: str) -> str:
        
        # 1. Memory se context laao
        context     = self.memory.build_context(user_message)
        history     = self.memory.get_recent_messages(n=10)
        
        # 2. Messages build karo
        system = f"""You are a helpful assistant.

{context}"""
        
        messages = [
            *[{"role": m["role"], "content": m["content"]} for m in history],
            {"role": "user", "content": user_message}
        ]
        
        # 3. LLM call
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=messages
        )
        assistant_reply = response.content[0].text
        
        # 4. Memory update karo
        self.memory.add_message("user",      user_message)
        self.memory.add_message("assistant", assistant_reply)
        
        # 5. Important facts extract karo aur save karo
        await self._extract_and_save(user_message)
        
        return assistant_reply
    
    async def _extract_and_save(self, message: str):
        # LLM se hi extract karwao important facts
        extract_prompt = f"""From this message, extract any important personal facts in JSON.
If none, return {{}}.

Message: "{message}"

Format: {{"name": "...", "location": "...", "interest": "..."}}"""
        
        result = client.messages.create(
            model="claude-haiku-4-5",    # Cheap model for extraction
            max_tokens=200,
            messages=[{"role": "user", "content": extract_prompt}]
        )
        
        try:
            facts = json.loads(result.content[0].text)
            for key, value in facts.items():
                if value:
                    self.memory.update_entity(key, value)
                    self.memory.save_long_term(f"User ka {key}: {value}")
        except json.JSONDecodeError:
            pass


# ─── Usage ───────────────────────────────────────────────

agent = MemoryAgent(user_id="sachin_001")

# Conversation
reply1 = await agent.chat("Hi! Mera naam Sachin hai, main Pune mein rehta hun")
# Memory saves: name=Sachin, location=Pune

reply2 = await agent.chat("Mujhe Python seekhni hai")
# Memory saves: interest=Python
# Context mein: "User ka naam Sachin hai, Pune mein rehta hai"

reply3 = await agent.chat("Koi project suggest karo")
# Context mein: name, location, interest sab hai
# LLM: "Sachin, Python ke liye ek beginner project..."
```

---

## PART 4: Memory Problems Aur Solutions

### Problem 1: Context Window Full Ho Jaata Hai

```
10,000 message conversation → 128K tokens se zyada → ERROR
```

**Solutions:**

#### A. Sliding Window
```python
# Sirf last N messages rakho
def get_messages(session_id, limit=20):
    return db.query(
        "SELECT * FROM messages WHERE session_id=? ORDER BY created_at DESC LIMIT ?",
        (session_id, limit)
    )
# Simple but loses old context
```

#### B. Summarization (Best approach)
```python
async def summarize_and_compress(messages: list) -> str:
    old_messages = messages[:-10]   # Last 10 chhod do
    recent = messages[-10:]
    
    # Purane messages ko summarize karo
    summary = await llm.invoke(f"""
        Summarize this conversation in bullet points,
        keeping all important facts:
        
        {format_messages(old_messages)}
    """)
    
    return [
        {"role": "system", "content": f"Previous conversation summary:\n{summary}"},
        *recent                     # Fresh recent messages
    ]

# Result: 10,000 messages → 200 token summary + 10 recent messages
```

#### C. MemGPT / Paged Memory Architecture
```
┌──────────────────────────────────────────────┐
│              CONTEXT WINDOW                  │
│  [System] [Working Memory] [Recent 5 msgs]   │
│                ↑                             │
│         Agent updates this                   │
└──────────────────────────────────────────────┘
         ↕ (agent controls)
┌──────────────────────────────────────────────┐
│              ARCHIVAL MEMORY                 │
│         (Vector DB — unlimited)              │
│  Agent search karta hai jab zaroorat ho      │
└──────────────────────────────────────────────┘
```

---

### Problem 2: Galat Memory Recall

**Problem:** Irrelevant memories context mein aa jaati hain

```python
# Bad: Sab memories daalo
all_memories = get_all_memories(user_id)  # 1000 memories 😰

# Good: Relevant filter karo
relevant = vector_search(query, top_k=5)   # Only 5 most relevant ✅

# Better: Score threshold lagao
results = vector_search(query, top_k=10)
filtered = [r for r in results if r.score > 0.75]  # Only high confidence
```

---

### Problem 3: Memory Contradiction

**Problem:** 
```
Memory 1: "User Python seekh raha hai"
Memory 2: "User ko Python aati hai"  ← contradiction!
```

**Solution:**
```python
async def add_memory_with_dedup(user_id: str, new_memory: str):
    # Similar existing memories check karo
    similar = vector_search(new_memory, top_k=3, threshold=0.9)
    
    if similar:
        # LLM se resolve karwao
        resolution = await llm.invoke(f"""
        Existing: "{similar[0]}"
        New info: "{new_memory}"
        
        Which is correct, or how to merge? Give one sentence.
        """)
        # Old delete, new add
        delete_memory(similar[0].id)
        save_memory(user_id, resolution)
    else:
        save_memory(user_id, new_memory)
```

---

### Problem 4: Memory Privacy / Multi-user Isolation

```python
# GALAT: User A ki memory User B ko dikh jaaye
memories = collection.query(query_embeddings=[emb])  # ❌ sab users ki

# SAHI: Har user isolated
memories = collection.query(
    query_embeddings=[emb],
    where={"user_id": current_user_id}   # ✅ sirf is user ki
)

# Redis mein bhi prefix lagao
key = f"memory:{user_id}:{session_id}"   # user namespaced
```

---

## PART 5: Popular Memory Libraries

### LangChain Memory Types
```python
from langchain.memory import (
    ConversationBufferMemory,          # Simple: sab rakho
    ConversationBufferWindowMemory,    # Last N messages
    ConversationSummaryMemory,         # Summarize old messages
    ConversationSummaryBufferMemory,   # Hybrid: summary + recent
    ConversationEntityMemory,          # Entity tracking
    VectorStoreRetrieverMemory,        # Vector DB backed
)

# Best for production:
memory = ConversationSummaryBufferMemory(
    llm=llm,
    max_token_limit=2000,    # 2000 tokens ke baad summarize karo
    return_messages=True
)
```

### Mem0 (2024 — Dedicated Memory Layer)
```python
from mem0 import Memory

m = Memory()

# Add memory
m.add("Sachin ko Python pasand hai", user_id="sachin")
m.add("Sachin interview prep kar raha hai", user_id="sachin")

# Search
results = m.search("tech interests", user_id="sachin")
# Returns: ["Sachin ko Python pasand hai"]

# Update
m.update(memory_id, "Sachin ko Python aur AI pasand hai")

# Get all
all_memories = m.get_all(user_id="sachin")
```

**Mem0 automatically:**
- Contradictions resolve karta hai
- Related memories merge karta hai
- Importance ke hisaab se rank karta hai

---

## PART 6: Memory Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│                    FULL FLOW                            │
│                                                         │
│  User Message                                           │
│       ↓                                                 │
│  ┌─────────────────────┐                                │
│  │   MEMORY RETRIEVAL  │                                │
│  │  1. Entity Store    │ → "name: Sachin, job: Dev"     │
│  │  2. Vector Search   │ → "Python, AI, Pune"           │
│  │  3. Recent History  │ → Last 10 messages             │
│  └─────────────────────┘                                │
│       ↓                                                 │
│  ┌─────────────────────┐                                │
│  │   CONTEXT WINDOW    │                                │
│  │  System + Memories  │                                │
│  │  + History          │                                │
│  │  + New Message      │                                │
│  └─────────────────────┘                                │
│       ↓                                                 │
│      LLM                                               │
│       ↓                                                 │
│    Response                                             │
│       ↓                                                 │
│  ┌─────────────────────┐                                │
│  │   MEMORY STORAGE    │                                │
│  │  1. Save to Redis   │ ← short term                   │
│  │  2. Extract facts   │ ← entity update                │
│  │  3. Save to VectorDB│ ← long term                    │
│  └─────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

---

## PART 7: Alag Alag Agent Types Ke Liye Memory Strategy

### Customer Support Agent
```
SHORT TERM (Redis):
  - Current ticket ka conversation
  - User ne kya problem bataya
  - Konse steps try kiye

LONG TERM (Vector DB):
  - User ki past tickets
  - "Is user ne pehle bhi yahi problem report ki thi"

ENTITY STORE:
  - account_type: premium
  - open_tickets: 2
  - last_contact: 3 days ago

KYA NAHI CHAHIYE:
  - Doosre users ki history (privacy!)
  - 6 month purani conversations (irrelevant)
```

---

### Coding Assistant Agent
```
SHORT TERM:
  - Current file ka context
  - Recent errors aur fixes
  - Current task description

LONG TERM:
  - User ke coding patterns ("ye user tabs use karta hai spaces nahi")
  - Past bugs aur unke solutions
  - Tech stack preferences

ENTITY STORE:
  - language: Python
  - framework: FastAPI
  - style: functional programming

KYA NAHI CHAHIYE:
  - Doosre projects ka code (confusing)
  - Outdated library versions
```

---

### Personal AI Assistant (Like Jarvis)
```
SHORT TERM:
  - Aaj ka conversation
  - Current task / to-do

LONG TERM:
  - Life events ("birthday 15 March hai")
  - Preferences ("coffee nahi chai pasand")
  - Goals ("interview prep kar raha hai")
  - Past decisions ("March mein job switch kiya")

ENTITY STORE:
  - name, location, job, family, health goals
  - daily routine, work schedule

KYA NAHI CHAHIYE:
  - Trivial small talk
  - Temporary states ("kal mood kharab tha")
```

---

## PART 8: Memory Token Budget

**Concept:** Context window finite hai — memory ke liye budget fix karo

```
Total Context Window: 128,000 tokens
─────────────────────────────────────
System Prompt:           2,000 tokens  (fixed)
Entity Facts:            1,000 tokens  (fixed)
Long-term Memories:      2,000 tokens  (top 5-10 memories)
Recent History:         10,000 tokens  (last 15-20 messages)
Current User Message:      500 tokens  (variable)
LLM Response (reserved): 4,000 tokens
─────────────────────────────────────
Total Used:             ~19,500 tokens  ← safe budget
Buffer:                108,500 tokens   ← complex tasks ke liye
```

**Rule:** Memory jo import nahi, wo token waste hai — quality over quantity.

---

## PART 9: Kya Yaad Karo, Kya Bhool Jao (Forgetting Strategy)

### Yaad KARO (important):
```
✅ User ka naam, location, profession
✅ Preferences ("vegetarian hun", "dark mode use karta hun")
✅ Long-term goals ("job switch karna hai 6 months mein")
✅ Important decisions ("PostgreSQL choose kiya MongoDB ke bajaaye")
✅ Repeated pain points ("har baar Redis setup mein problem")
✅ Project-specific context
```

### Bhool JAO (noise):
```
❌ Greetings ("Hi", "Thanks", "Okay")
❌ Temporary states ("aaj tired hun")
❌ Trivial chit-chat
❌ Old outdated info ("Python 2 use karta tha" — 5 saal pehle)
❌ Contradicted facts (naya fact save karo, purana delete karo)
❌ Resolved issues ("wo bug fix ho gaya tha")
```

**Implementation:**
```
Memory save karne se pehle pooch:
"Kya ye fact 1 hafte baad bhi relevant hoga?"
  → Haan: Long-term mein save karo
  → Nahi: Sirf short-term (Redis) mein rakho, expire hone do
```

---

## PART 10: Memory Quality — Kaise Pata Chale Memory Sahi Kaam Kar Rahi Hai?

### Test karo:
```
Test 1: Continuity Test
  Session 1: "Mera naam Sachin hai"
  Session 2: "Mera naam kya hai?"
  Expected: "Aapka naam Sachin hai" ✅
  Fail:     "Mujhe nahi pata" ❌

Test 2: Relevance Test
  User pooche: "Python tips do"
  Context mein aana chahiye: Python interest
  Context mein NAHI aana chahiye: user ki location ❌

Test 3: Contradiction Test
  Memory 1: "Python beginner hai"
  Memory 2: "Python mein 3 saal experience hai"
  Expected: Latest fact rakho, purana delete karo ✅

Test 4: Privacy Test
  User A ka data User B ko kabhi nahi dikhna chahiye ✅
```

---

## PART 11: Memory Design Checklist (Apna Agent Banate Waqt)

```
PLANNING:
  □ Konsa memory type use karunga? (context only / redis / vector)
  □ User isolation kaise karunga? (user_id prefix)
  □ Token budget kya hoga?
  □ Expiry strategy kya hai? (7 days? 30 days? permanent?)

IMPLEMENTATION:
  □ Short-term: Redis list mein messages
  □ Entity: Redis hash mein key-value facts
  □ Long-term: Vector DB mein embedded memories
  □ Context builder: teeno ko milao before LLM call
  □ Memory updater: response ke baad save karo

QUALITY:
  □ Relevance filter hai? (similarity threshold)
  □ Contradiction handling hai?
  □ Duplicate prevention hai?
  □ Privacy isolation hai?

PRODUCTION:
  □ Memory expiry set hai (avoid unlimited growth)
  □ Cost track kar rahe ho? (vector DB queries bhi cost karti hain)
  □ Fallback hai agar memory service down ho?
```

---

## PART 12: Memory Libraries Comparison

| Library | Best For | Complexity | Cost |
|---------|----------|------------|------|
| **Plain Redis** | Simple history | Low | Cheap |
| **LangChain Memory** | LangChain agents | Medium | Cheap |
| **Mem0** | Production apps | Low (managed) | Paid |
| **Zep** | Enterprise | Medium | Paid |
| **Custom (Redis + ChromaDB)** | Full control | High | Cheap |

**Recommendation:**
```
Learning / Side project  → Custom (Redis + ChromaDB) — control milta hai
Startup / Quick product  → Mem0 — fast to build
Enterprise               → Zep ya Custom — scalable
```

---

## PART 13: Interview Questions

**Q: LLM ko memory kyun nahi hoti by default?**
A: LLM ek stateless function hai — har API call independent hoti hai. Server pe koi state save nahi hoti. Isliye memory hum bahar manage karte hain (Redis, DB, Vector DB).

**Q: Long conversation handle karne ke liye best approach?**
A: Summarization — last N messages rakho fresh, purani conversation ko LLM se summarize karwao. Summary + recent messages = full context without token overflow.

**Q: Short-term aur long-term memory mein fark?**
A: Short-term = Redis mein conversation history, fast, temporary (7 days). Long-term = Vector DB mein embedded memories, semantic search se retrieve, permanent.

**Q: Memory across users kaise isolate karte hain?**
A: User ID ko namespace ki tarah use karo — Redis keys mein prefix, Vector DB mein metadata filter. Kabhi bhi global query mat karo.

**Q: Mem0 kya hai aur kab use karein?**
A: Dedicated memory layer library — contradiction resolution, auto-merging, importance ranking sab handle karta hai. Jab khud memory system banana tedious lage tab use karo.

**Q: Token budget kya hota hai memory ke liye?**
A: Context window finite hoti hai — memory ke liye fixed allocation karo (e.g., 2K tokens entities, 2K memories, 10K recent history). Baaki LLM response ke liye reserve. Quality over quantity — irrelevant memory token waste hai.

**Q: Agent mein kya yaad karna chahiye aur kya nahi?**
A: Yaad karo: permanent preferences, goals, important decisions, user profile. Bhool jao: greetings, temporary states, resolved issues, trivial chit-chat. Rule — "kya ye 1 hafte baad bhi relevant hoga?"
