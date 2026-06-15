# Agent + RAG Project Memory

Ye memory file future Codex/AI assistant context ke liye hai. Agar conversation context reset ho jaye, to is file ko read karke project ka direction, decisions aur next steps samjhe ja sakte hain.

## User Goal

User Python me ek enterprise-level AI Agent + RAG project banana chahta hai. Goal sirf demo chatbot banana nahi hai, balki real production-style project banana hai jo resume/interview aur practical learning dono ke liye useful ho.

## Selected Example Project

Project name:

```text
Enterprise HR Policy Assistant
```

Project idea:

Company employees ke liye ek AI assistant jo HR policy documents, leave policy, insurance policy, reimbursement rules, onboarding docs, internal FAQs aur HR tickets se answer de.

Example user queries:

- "Mujhe 3 din sick leave leni hai, process kya hai?"
- "Maternity leave policy kya hai?"
- "Laptop reimbursement limit kitni hai?"
- "Mere manager ko leave request email draft kar do."
- "Kya contractor ko health insurance milta hai?"
- "Latest work from home policy kya hai?"

## Enterprise-Level Definition

Ye project enterprise-level tab maana jayega jab:

- Authentication and authorization implemented ho.
- Employee role, country, department aur employee type ke hisaab se access control ho.
- RAG answer source-grounded ho, hallucination avoid ho.
- Sensitive actions ke liye human approval flow ho.
- Logs, traces, token usage, cost aur errors monitor ho.
- Evaluation dataset se prompt/model/retriever changes test hon.
- CI/CD, Docker, staging aur production deployment support ho.
- Security prompt, retrieval aur tools teeno level par apply ho.

Important:

```text
Sirf PDF upload karke answer generate karna enterprise-level nahi hai.
Enterprise-level = RAG + Agent + Security + Evaluation + Observability + DevOps.
```

## Recommended MVP Tech Stack

Initial learning/MVP version ke liye:

```text
Backend: FastAPI
Agent workflow: LangGraph
RAG framework: LangChain or lightweight custom pipeline
LLM: OpenAI or Azure OpenAI
Vector store: Chroma or FAISS
Documents: Local PDFs / Markdown files
Database: SQLite
Testing: pytest
UI: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui
Icons: lucide-react
```

## Enterprise Tech Stack

Production-style enterprise version ke liye:

```text
Backend API:
  FastAPI
  Uvicorn
  Pydantic
  pydantic-settings

Agent:
  LangGraph
  LangChain tools

RAG:
  LangChain or custom Python pipeline
  PyMuPDF or Unstructured for PDF parsing
  BeautifulSoup for HTML parsing
  Hybrid search
  Reranking

LLM:
  OpenAI
  Azure OpenAI
  Anthropic
  or local model through vLLM

Embeddings:
  OpenAI embeddings
  Azure OpenAI embeddings
  sentence-transformers for local embeddings

Vector DB:
  PostgreSQL + pgvector
  Qdrant
  Pinecone
  Weaviate
  Milvus

Keyword Search:
  PostgreSQL full-text search
  Elasticsearch
  OpenSearch

Database:
  PostgreSQL
  SQLAlchemy
  Alembic

Cache and Jobs:
  Redis
  Celery
  RabbitMQ optional

Auth:
  OAuth2 / JWT
  Auth0
  Okta
  Azure AD
  Keycloak
  Role-based access control

Observability:
  OpenTelemetry
  Prometheus
  Grafana
  LangSmith
  Arize Phoenix
  Structured JSON logs

Evaluation:
  pytest
  RAGAS
  DeepEval
  custom golden dataset

DevOps:
  Docker
  Docker Compose
  GitHub Actions / GitLab CI / Azure DevOps
  Kubernetes or cloud container service
  AWS S3 / Azure Blob Storage / GCS
  Secrets manager
```

## UI Decision

Recommended UI stack:

```text
Frontend: Next.js + React + TypeScript
Styling: Tailwind CSS
Components: shadcn/ui
Icons: lucide-react
API state: TanStack Query
Auth UI: Auth0 / NextAuth/Auth.js / Azure AD depending on final auth choice
```

Required UI screens:

- Login page
- Chat interface
- Source citations panel
- Retrieved documents preview
- User profile/role indicator
- Admin document upload page
- Indexing status page
- Feedback buttons: helpful / not helpful
- Human approval modal for sensitive actions
- Admin audit/logs dashboard

MVP UI can start with:

```text
Chat interface + source citations + document upload + basic feedback
```

## Approx Token Estimate

Simple MVP:

```text
50k - 120k tokens
```

Production-style enterprise version:

```text
250k - 600k+ tokens
```

Suggested phased approach:

```text
Phase 1 MVP: 60k - 100k tokens
Phase 2 Enterprise features: 150k - 250k tokens
Phase 3 Monitoring/evals/deployment polish: 100k - 250k tokens
```

## Suggested Phases

### Phase 1: MVP

Build:

- FastAPI backend
- Basic chat API
- Local document ingestion
- Chunking
- Embeddings
- Chroma/FAISS vector search
- Basic RAG answer with citations
- Simple LangGraph agent flow
- Next.js chat UI
- Basic document upload
- pytest tests for retriever and API

### Phase 2: Enterprise Core

Add:

- Auth and user roles
- Metadata filtering
- Employee profile simulation
- Approval flow for actions
- Tool calling
- Admin dashboard
- Better error handling
- Golden evaluation dataset
- Docker Compose

### Phase 3: Production Hardening

Add:

- PostgreSQL + pgvector
- Redis/Celery background indexing
- OpenTelemetry traces
- LangSmith/Arize Phoenix tracing
- Prometheus/Grafana metrics
- CI/CD pipeline
- Secrets management
- Security guardrails
- Load testing and cost tracking

## Initial Project Structure Idea

```text
hr_policy_assistant/
  backend/
    app/
      main.py
      config.py
      api/
        chat_routes.py
        document_routes.py
        schemas.py
      agent/
        state.py
        graph.py
        nodes.py
        tools.py
        prompts.py
      rag/
        loaders.py
        chunking.py
        embeddings.py
        retriever.py
        vector_store.py
        reranker.py
      security/
        auth.py
        permissions.py
        pii.py
      evaluation/
        golden_dataset.csv
        run_eval.py
      tests/
        test_retriever.py
        test_agent_flow.py
        test_permissions.py
    requirements.txt
    Dockerfile
  frontend/
    app/
    components/
    lib/
    package.json
  docker-compose.yml
  README.md
```

## Important Design Rules To Remember

- Agent sirf tab use karna jab multi-step reasoning ya tool action needed ho.
- Simple Q&A ke liye plain RAG enough ho sakta hai.
- Retrieval me metadata filtering mandatory hai.
- Prompt injection ko ignore nahi karna.
- Tool input/output validate karna.
- Destructive/sensitive actions ke liye approval flow lagana.
- Logs me PII, API keys, secrets store nahi karne.
- Prompt/model/retriever changes ke baad evaluation run karna.
- UI me citations clearly show karna.
- Unknown information par model ko guess nahi karne dena.

## Existing Guide File

Main detailed guide yahan hai:

```text
ai-backend-python/Month2_Python_AI_Libraries/ENTERPRISE_AGENT_RAG_GUIDE.md
```

Is memory file ko future me pehle read karna chahiye, phir detailed guide read karni chahiye.

## Next Recommended Step

Next step:

```text
Phase 1 MVP scaffold create karo:
FastAPI backend + Next.js frontend + basic RAG ingestion/chat flow.
```

Preferred starting stack:

```text
FastAPI + LangGraph + LangChain + Chroma + OpenAI + Next.js + Tailwind + shadcn/ui
```

## Module-Wise Build Plan

Project ko module-wise banana hai taaki har context/window me ek manageable part complete ho sake. Har module ke end me code, tests aur short notes update hone chahiye.

Recommended order:

```text
Module 0: Project Scaffold And Setup
Module 1: Backend Foundation
Module 2: Document Ingestion
Module 3: Chunking And Metadata
Module 4: Embeddings And Vector Store
Module 5: Basic RAG Retriever
Module 6: Chat API With Citations
Module 7: Agent Workflow With LangGraph
Module 8: Tools And Approval Flow
Module 9: Security And Permissions
Module 10: Evaluation And Tests
Module 11: Frontend Chat UI
Module 12: Admin Document Upload UI
Module 13: Observability And Logs
Module 14: Docker And Local DevOps
Module 15: Enterprise Upgrade Path
```

### Module 0: Project Scaffold And Setup

Goal:

Create base monorepo structure for backend and frontend.

Build:

- `hr_policy_assistant/backend`
- `hr_policy_assistant/frontend`
- backend virtual environment instructions
- `requirements.txt`
- `.env.example`
- `README.md`
- basic folder structure

Deliverables:

- Project folders ready
- Setup instructions ready
- No real RAG yet

Suggested prompt:

```text
AGENT_RAG_PROJECT_MEMORY.md read karo aur Module 0: Project Scaffold And Setup implement karo.
```

### Module 1: Backend Foundation

Goal:

FastAPI backend ka base ready karna.

Build:

- `app/main.py`
- health check endpoint
- config management using `pydantic-settings`
- common response schemas
- basic error handling
- CORS setup for frontend

Deliverables:

- `GET /health`
- backend run command
- basic tests

Suggested prompt:

```text
Memory file read karo aur Module 1: Backend Foundation build karo.
```

### Module 2: Document Ingestion

Goal:

Local HR documents load karne ka system banana.

Build:

- PDF loader
- Markdown/text loader
- sample HR policy docs
- document object schema
- source metadata extraction

Deliverables:

- `rag/loaders.py`
- sample docs folder
- loader tests

Suggested prompt:

```text
Module 2: Document Ingestion build karo. Local PDF/Markdown docs load karne ka system chahiye.
```

### Module 3: Chunking And Metadata

Goal:

Loaded docs ko meaningful chunks me convert karna.

Build:

- chunk schema
- section-aware chunking
- token/character based fallback chunking
- metadata preservation
- chunk IDs

Deliverables:

- `rag/chunking.py`
- chunking tests
- sample output notes

Suggested prompt:

```text
Module 3: Chunking And Metadata implement karo.
```

### Module 4: Embeddings And Vector Store

Goal:

Chunks ko embeddings me convert karke vector store me save karna.

Build:

- embedding provider abstraction
- OpenAI embedding support
- local/mock embedding option for tests
- Chroma or FAISS vector store
- indexing script

Deliverables:

- `rag/embeddings.py`
- `rag/vector_store.py`
- `scripts/index_documents.py`
- tests with mock embeddings

Suggested prompt:

```text
Module 4: Embeddings And Vector Store build karo. Test ke liye mock embeddings bhi chahiye.
```

### Module 5: Basic RAG Retriever

Goal:

User query ke liye relevant chunks retrieve karna.

Build:

- retriever class
- top-k search
- metadata filters
- simple score threshold
- formatted context builder

Deliverables:

- `rag/retriever.py`
- retriever tests
- example retrieval command

Suggested prompt:

```text
Module 5: Basic RAG Retriever implement karo with metadata filtering.
```

### Module 6: Chat API With Citations

Goal:

RAG based chat endpoint banana jo answer + sources return kare.

Build:

- `POST /chat`
- request/response schema
- prompt template
- LLM client abstraction
- answer with citations
- no-answer fallback

Deliverables:

- `api/chat_routes.py`
- `agent/prompts.py`
- chat API tests using fake LLM

Suggested prompt:

```text
Module 6: Chat API With Citations build karo. Fake LLM tests bhi add karo.
```

### Module 7: Agent Workflow With LangGraph

Goal:

Simple RAG chain ko stateful agent workflow me convert karna.

Build:

- agent state
- graph nodes
- intent classification node
- retrieval node
- answer generation node
- response validation node

Deliverables:

- `agent/state.py`
- `agent/graph.py`
- `agent/nodes.py`
- LangGraph tests

Suggested prompt:

```text
Module 7: Agent Workflow With LangGraph implement karo.
```

### Module 8: Tools And Approval Flow

Goal:

Agent ko tools dena aur sensitive actions me approval add karna.

Build:

- employee profile tool
- email draft tool
- HR ticket draft/create tool
- approval-required response
- direct execution block for sensitive tools

Deliverables:

- `agent/tools.py`
- approval flow tests
- tool schemas

Suggested prompt:

```text
Module 8: Tools And Approval Flow build karo.
```

### Module 9: Security And Permissions

Goal:

Enterprise-style access control add karna.

Build:

- fake auth/JWT-style user context for MVP
- role-based permissions
- country/employee type metadata filters
- PII masking utility
- prompt injection guard notes/rules

Deliverables:

- `security/auth.py`
- `security/permissions.py`
- `security/pii.py`
- permission tests

Suggested prompt:

```text
Module 9: Security And Permissions implement karo.
```

### Module 10: Evaluation And Tests

Goal:

RAG/Agent quality test karne ka basic evaluation system banana.

Build:

- golden dataset CSV
- eval runner
- retrieval hit check
- answer contains source check
- refusal behavior tests

Deliverables:

- `evaluation/golden_dataset.csv`
- `evaluation/run_eval.py`
- test report format

Suggested prompt:

```text
Module 10: Evaluation And Tests build karo.
```

### Module 11: Frontend Chat UI

Goal:

Next.js chat UI banana.

Build:

- chat page
- message list
- source citations panel
- loading state
- error state
- feedback buttons

Deliverables:

- working frontend chat
- API integration with backend
- responsive layout

Suggested prompt:

```text
Module 11: Frontend Chat UI build karo using Next.js, Tailwind, shadcn/ui.
```

### Module 12: Admin Document Upload UI

Goal:

Admin ke liye docs upload/index status page banana.

Build:

- upload UI
- document list
- indexing status
- re-index button
- upload API integration

Deliverables:

- admin documents page
- backend document routes if missing

Suggested prompt:

```text
Module 12: Admin Document Upload UI build karo.
```

### Module 13: Observability And Logs

Goal:

Debugging aur monitoring ke liye structured logs add karna.

Build:

- request ID
- structured JSON logs
- token/cost placeholders
- retrieved chunk IDs logging
- tool call logging
- latency tracking

Deliverables:

- `observability/logging.py`
- middleware
- logging tests where useful

Suggested prompt:

```text
Module 13: Observability And Logs implement karo.
```

### Module 14: Docker And Local DevOps

Goal:

Project ko local Docker setup me run karna.

Build:

- backend Dockerfile
- frontend Dockerfile
- docker-compose
- environment examples
- local run docs

Deliverables:

- `docker-compose.yml`
- working local commands
- README update

Suggested prompt:

```text
Module 14: Docker And Local DevOps setup karo.
```

### Module 15: Enterprise Upgrade Path

Goal:

MVP se enterprise stack me migrate karne ka plan/code hooks ready karna.

Build:

- Chroma/FAISS to pgvector migration notes
- local auth to SSO notes
- local docs to cloud storage notes
- Redis/Celery indexing plan
- production deployment checklist

Deliverables:

- `docs/ENTERPRISE_UPGRADE_PATH.md`
- architecture diagram notes
- checklist

Suggested prompt:

```text
Module 15: Enterprise Upgrade Path documentation banao.
```

## How User Should Continue Module By Module

User har new context me ye pattern use kare:

```text
AGENT_RAG_PROJECT_MEMORY.md read karo.
Ab Module X: <module name> implement karo.
Previous modules ko break mat karna.
Tests run karo aur final me kya bana uska short summary do.
```

Assistant ko har module ke start me:

- memory file read karni hai
- existing project structure inspect karna hai
- previous user changes preserve karne hain
- module ke scope tak hi changes rakhne hain
- tests run karne hain, agar dependencies/network issue ho to clearly mention karna hai
