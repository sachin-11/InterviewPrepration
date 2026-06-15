# CLAUDE.md — Agent Project Template
> Copy this file as CLAUDE.md to the root of any Next.js + Python agent project.
> Fill in [BRACKETS] with actual project details.

---

```markdown
# CLAUDE.md

## Project Overview

[PROJECT_NAME] — [ONE LINE DESCRIPTION]

Example: "SmartSupport — AI customer support agent that handles tickets,
escalates to humans, and learns from resolved cases."

**Status:** [Active Development / Beta / Production]
**Owner:** [Your Name] — [your@email.com]

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui components
- Zustand (client state)
- TanStack Query (server state + caching)

### Backend (Python)
- FastAPI
- LangGraph (agent orchestration)
- LangChain (LLM calls, chains)
- Anthropic SDK / OpenAI SDK
- PostgreSQL + pgvector (vector search)
- Redis (caching, session, queue)
- Celery (background tasks)

### Infrastructure
- Docker + Docker Compose (local dev)
- [AWS / GCP / Railway / Render] (production)
- GitHub Actions (CI/CD)

---

## Project Structure

```
project-root/
├── CLAUDE.md                 ← you are here
├── docker-compose.yml        ← local dev stack
├── .env.example              ← copy to .env
│
├── frontend/                 ← Next.js app
│   ├── app/
│   │   ├── (auth)/           ← auth routes (grouped)
│   │   ├── (dashboard)/      ← main app routes
│   │   ├── api/              ← Next.js API routes (thin — just proxy to Python)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               ← shadcn components (don't edit)
│   │   └── [feature]/        ← feature-specific components
│   ├── lib/
│   │   ├── api.ts            ← all backend API calls here
│   │   └── utils.ts
│   └── types/
│       └── index.ts          ← shared TypeScript types
│
├── backend/                  ← Python FastAPI
│   ├── main.py               ← FastAPI app entry
│   ├── api/
│   │   ├── routes/           ← route handlers (thin)
│   │   └── deps.py           ← FastAPI dependencies
│   ├── agents/               ← LangGraph agents
│   │   ├── [agent_name]/
│   │   │   ├── graph.py      ← StateGraph definition
│   │   │   ├── nodes.py      ← individual node functions
│   │   │   ├── state.py      ← TypedDict state definition
│   │   │   └── tools.py      ← agent tools
│   ├── services/             ← business logic (no HTTP here)
│   ├── models/               ← SQLAlchemy models
│   ├── schemas/              ← Pydantic request/response schemas
│   └── core/
│       ├── config.py         ← settings (pydantic-settings)
│       └── database.py       ← DB connection
│
└── tests/
    ├── frontend/             ← Jest + React Testing Library
    └── backend/              ← pytest
```

---

## Agent Architecture

### How the Agent Works

```
User Message (Frontend)
        ↓
   FastAPI Route
        ↓
   LangGraph Graph
   ┌─────────────────────────────────┐
   │  [classify_intent]              │
   │       ↓                         │
   │  ┌────┴────┐                    │
   │  ↓         ↓                    │
   │ [tool_A] [tool_B]               │
   │  ↓         ↓                    │
   │  └────┬────┘                    │
   │       ↓                         │
   │  [generate_response]            │
   │       ↓                         │
   │  [satisfied?] ──No──→ [retry]   │
   │       ↓ Yes                     │
   └──────END───────────────────────-┘
        ↓
   SSE Stream to Frontend
```

### State Definition Pattern

```python
# backend/agents/[name]/state.py
from typing import TypedDict, Annotated, List
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # Annotated[list, operator.add] = APPEND (not replace)
    messages: Annotated[List[BaseMessage], operator.add]
    
    # These REPLACE on each update
    current_step: str
    user_id: str
    session_id: str
    error: str | None
    is_done: bool
```

### Node Pattern

```python
# backend/agents/[name]/nodes.py

def classify_node(state: AgentState) -> dict:
    # 1. State se data nikalo
    last_msg = state["messages"][-1].content
    
    # 2. LLM call (minimize tokens — see Token Rules below)
    result = classifier_chain.invoke({"message": last_msg})
    
    # 3. Sirf changed fields return karo
    return {
        "messages": [AIMessage(content=result)],
        "current_step": "classified"
    }
```

---

## Development Commands

```bash
# Full stack start
docker-compose up

# Frontend only
cd frontend && npm run dev        # http://localhost:3000

# Backend only
cd backend && uvicorn main:app --reload   # http://localhost:8000

# Backend tests
cd backend && pytest -v

# Frontend tests
cd frontend && npm run test

# Type check
cd frontend && npm run type-check
cd backend && mypy .

# Lint
cd frontend && npm run lint
cd backend && ruff check .

# Database migrations
cd backend && alembic upgrade head

# Generate migration
cd backend && alembic revision --autogenerate -m "description"
```

---

## API Design

### Convention
- **Backend** owns all business logic — FastAPI at `/api/v1/...`
- **Next.js API routes** = thin proxy only (auth check + forward)
- **Never** put business logic in Next.js API routes

### Endpoint Pattern
```
GET    /api/v1/[resource]          ← list
GET    /api/v1/[resource]/:id      ← single item
POST   /api/v1/[resource]          ← create
PATCH  /api/v1/[resource]/:id      ← partial update
DELETE /api/v1/[resource]/:id      ← delete

Agent endpoints:
POST   /api/v1/agent/run           ← start agent run
GET    /api/v1/agent/stream/:id    ← SSE stream for results
GET    /api/v1/agent/runs/:id      ← get run status/result
```

### Streaming (SSE) Pattern
```python
# backend: stream agent output
@router.get("/agent/stream/{run_id}")
async def stream_agent(run_id: str):
    async def event_generator():
        async for event in agent_graph.astream(state):
            yield f"data: {json.dumps(event)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

```typescript
// frontend: consume SSE
const response = await fetch(`/api/v1/agent/stream/${runId}`)
const reader = response.body?.getReader()
// process chunks...
```

---

## Coding Conventions

### Python
- Type hints everywhere — no `Any` without a comment explaining why
- Pydantic for all request/response schemas
- `async/await` for all I/O (DB, LLM, HTTP)
- `ruff` for linting, `black` for formatting
- No business logic in route handlers — delegate to `services/`
- Raise `HTTPException` only in routes, not in services

```python
# Good
async def get_user(user_id: str, db: AsyncSession) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")  # service raises ValueError
    return user

# Route handles HTTP concerns
@router.get("/users/{user_id}")
async def get_user_route(user_id: str, db = Depends(get_db)):
    try:
        return await user_service.get_user(user_id, db)
    except ValueError as e:
        raise HTTPException(404, str(e))  # route converts to HTTP error
```

### TypeScript / Next.js
- Strict mode on — no `any`, no `// @ts-ignore`
- Server Components by default — `"use client"` only when needed
- All API calls go through `lib/api.ts` — never fetch directly in components
- Zod for runtime validation of API responses

```typescript
// lib/api.ts — all backend calls here
export const agentApi = {
  run: (input: AgentInput) =>
    apiClient.post<AgentRun>('/api/v1/agent/run', input),
  getResult: (runId: string) =>
    apiClient.get<AgentResult>(`/api/v1/agent/runs/${runId}`),
}

// Component — never fetch directly
const { data } = useQuery({
  queryKey: ['agent-run', runId],
  queryFn: () => agentApi.getResult(runId),
})
```

---

## Token Optimization Rules

> These rules are non-negotiable in this project.

### 1. System Prompts
- Max 200 tokens for system prompts
- Audit before PR merge — no fluff
- Always use `cache_control: ephemeral` on system prompts

### 2. LLM Calls in Nodes
```python
# Always set max_tokens
llm = ChatAnthropic(
    model="claude-haiku-4-5-20251001",  # default to cheapest
    max_tokens=512,                      # explicit limit
)

# Prompt caching for repeated context
messages = [
    {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
    {"type": "text", "text": user_message},  # fresh each time
]
```

### 3. Model Selection
```
classify / route intent    → claude-haiku-4-5   (cheapest)
summarize / extract data   → claude-sonnet-4-6  (balanced)
complex reasoning / code   → claude-opus-4-7    (expensive — justify in PR)
```

### 4. History in State
- Never pass full message history to LLM
- Last 5 messages + summary only

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # if using OpenAI

# Next.js (prefix with NEXT_PUBLIC_ for client-side)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Observability (optional but recommended)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...      # LangSmith
```

---

## Error Handling

### Backend
```python
# Global error classes — backend/core/exceptions.py
class AgentError(Exception): pass
class ToolError(AgentError): pass
class LLMError(AgentError): pass

# In nodes — never crash silently
def risky_node(state: AgentState) -> dict:
    try:
        result = do_something()
        return {"messages": [AIMessage(content=result)]}
    except Exception as e:
        return {"error": str(e), "current_step": "error"}

# Graph has error handler node
graph.add_conditional_edges("risky_node", handle_error_or_continue)
```

### Frontend
```typescript
// All errors go through error boundary + toast
// Never show raw error messages to user
// Log full error, show friendly message
```

---

## Testing Strategy

```
Unit tests:
  - Each agent node independently (mock LLM)
  - Service functions
  - Utility functions

Integration tests:
  - Full agent graph run (mock LLM, real DB)
  - API endpoints (TestClient)
  - Critical user flows

DO NOT mock the database — use test DB instead.
DO mock LLM calls — cost + flakiness.
```

```python
# Example node test
def test_classify_node():
    state = {
        "messages": [HumanMessage(content="I need a refund")],
        "current_step": "start",
    }
    with mock_llm(returns="billing"):
        result = classify_node(state)
    assert result["current_step"] == "classified"
```

---

## What NOT to Do

```
❌ Never hardcode API keys (use .env)
❌ Never put logic in Next.js API routes (just proxy)
❌ Never pass full chat history to LLM (token waste)
❌ Never use Opus by default (60x more expensive than Haiku)
❌ Never use `any` in TypeScript
❌ Never make synchronous DB calls in async Python code
❌ Never catch Exception silently — always log or surface error
❌ Never expose internal error messages to frontend users
❌ Never commit .env files
❌ Never skip type hints in Python
```

---

## Common Gotchas

```
1. LangGraph state: Annotated[List, operator.add] = APPEND
   Plain field = REPLACE
   Confusing these breaks state silently.

2. Next.js App Router: fetch() is cached by default.
   Dynamic data mein cache: 'no-store' add karo.

3. FastAPI async: db.query() sync mat use karo async route mein.
   Use AsyncSession + await db.execute(select(...))

4. Redis session: TTL set karna mat bhulo.

5. SSE in Next.js: Edge runtime use karo for streaming routes.
```

---

## Observability

```python
# LangSmith for agent tracing (free tier available)
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"

# Every LangGraph run automatically traced:
# - Which nodes ran
# - Tokens used per node
# - Latency breakdown
# - Full state at each step
```

**Recommended tools:**
- **LangSmith** — agent traces, token usage
- **Sentry** — error tracking (frontend + backend)
- **Helicone / Langfuse** — LLM cost monitoring

---

## PR Checklist

Before opening any PR:
```
  ✅ Type check passes (mypy + tsc)
  ✅ Tests pass
  ✅ No new `any` types
  ✅ No hardcoded secrets
  ✅ New LLM calls have max_tokens set
  ✅ New system prompts are under 200 tokens
  ✅ Expensive model usage justified in PR description
  ✅ .env.example updated if new env var added
  ✅ Migration added if DB schema changed
```
```

---

## How to Use This Template

1. Copy the content inside the code block above
2. Save as `CLAUDE.md` in your project root
3. Fill in all `[BRACKETS]` with actual values
4. Update the Architecture diagram for your specific agent flow
5. Remove sections that don't apply

**Why CLAUDE.md matters:**
- Claude reads this automatically on every conversation
- No need to re-explain project context = fewer tokens
- Consistent decisions across all AI-assisted sessions
- New team member onboarding in 5 minutes
