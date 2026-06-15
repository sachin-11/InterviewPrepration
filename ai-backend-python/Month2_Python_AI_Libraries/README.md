# Month 2 — Python AI Libraries

## Kya Seekhenge Is Module Mein?

| Library | Kya Hai | AI Mein Kahan Use Hota Hai |
|---------|---------|---------------------------|
| **NumPy** | Fast numerical computing | Embeddings, vectors, matrix operations |
| **Pandas** | Data analysis & manipulation | Training data prep, CSV/JSON processing |
| **LangChain** | LLM application framework | Chains, RAG, agents, memory |
| **LangGraph** | Stateful AI agent workflows | Multi-step agents, loops, branching |

## Folder Structure

```
Month2_Python_AI_Libraries/
├── 01_numpy/
│   ├── 01_basics.py          ← Arrays, operations, indexing
│   ├── 02_vectors_for_ai.py  ← Embeddings, cosine similarity
│   └── numpy_notes.md        ← Theory + interview Q&A
│
├── 02_pandas/
│   ├── 01_basics.py          ← DataFrames, Series, loading data
│   ├── 02_data_cleaning.py   ← Missing values, transforms
│   ├── 03_ai_usecase.py      ← Preparing training data
│   └── pandas_notes.md       ← Theory + interview Q&A
│
├── 03_langchain/
│   ├── 01_llm_basics.py      ← LLM calls, prompts
│   ├── 02_chains.py          ← Sequential chains
│   ├── 03_rag_chain.py       ← RAG with retriever
│   ├── 04_memory.py          ← Conversation memory
│   ├── 05_agents.py          ← Tool-using agents
│   └── langchain_notes.md    ← Theory + interview Q&A
│
├── 04_langgraph/
│   ├── 01_basics.py          ← Nodes, edges, state
│   ├── 02_conditional_flow.py← Branching logic
│   ├── 03_agent_loop.py      ← ReAct agent loop
│   └── langgraph_notes.md    ← Theory + interview Q&A
│
└── requirements.txt
```

## Setup

```bash
cd ai-backend-python
python -m venv venv
venv\Scripts\activate
pip install -r Month2_Python_AI_Libraries/requirements.txt
```
