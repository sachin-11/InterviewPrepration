# MLOps & AI Agent Deployment — Real World Guide
> Sirf theory nahi, actual production mein kaise kaam karta hai

---

## PART 1: MLOps Kya Hai Aur Kyun Chahiye?

### Problem Statement (Without MLOps)
```
Data Scientist: "Model ready hai, 95% accuracy!"
Engineer:       "Production mein kaise deploy karein?"
Manager:        "2 weeks baad accuracy 70% kyon ho gayi?"
Everyone:       "Pata nahi..." 😰
```

### MLOps = ML + DevOps
```
DevOps:  Code → Test → Deploy → Monitor
MLOps:   Data + Code + Model → Test → Deploy → Monitor → Retrain
```

**MLOps ki 3 core problems solve karta hai:**
1. **Reproducibility** — same result milna chahiye har baar
2. **Scalability** — 10 users se 10M users tak
3. **Reliability** — model production mein consistent rehna chahiye

---

## PART 2: MLOps Real World Use Cases

### 2.1 Fraud Detection (Bank/Fintech)
```
Real-time transaction aai
        ↓
Feature extraction (amount, location, time, pattern)
        ↓
ML Model predict karo: Fraud? Not Fraud?
        ↓
< 100ms mein decision (UPI/card swipe ke time)
        ↓
Monitor: Kya model abhi bhi accurate hai?
        ↓
New fraud patterns aaye → Retrain karo
```
**MLOps role:** Model versioning, real-time serving, drift detection

---

### 2.2 Recommendation System (Netflix/Amazon)
```
User ne kuch dekha/kharida
        ↓
Feature store se user history lo
        ↓
Recommendation model run karo
        ↓
A/B test: Model A vs Model B — kaun better?
        ↓
Winner deploy karo, loser hatao
        ↓
User behavior se continuously retrain
```
**MLOps role:** A/B testing infrastructure, feature store, continuous training

---

### 2.3 Customer Support Chatbot (AI Agent)
```
User message aaya
        ↓
LLM Agent route karo (billing? technical? returns?)
        ↓
Tool calls: CRM lookup, Order DB query
        ↓
Response generate karo
        ↓
Log karo: latency, cost, user satisfaction
        ↓
Weekly: kahan fail ho raha hai? improve karo
```
**MLOps role:** LLM observability, cost tracking, prompt versioning

---

### 2.4 Healthcare — Medical Imaging
```
X-Ray image aai
        ↓
CNN Model: Tumor detect karo
        ↓
Confidence score: 87% probability
        ↓
Low confidence → Doctor ko flag karo
        ↓
Doctor feedback → Training data mein add
        ↓
Model quarterly retrain
```
**MLOps role:** Model cards, audit trails, retraining pipelines

---

## PART 3: MLOps Full Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MLOps LIFECYCLE                       │
│                                                         │
│  DATA          MODEL           DEPLOYMENT    MONITORING  │
│  ──────        ──────          ──────────    ─────────── │
│  Collect   →  Train       →   Package   →   Track       │
│  Validate      Evaluate        Serve         Alert       │
│  Version       Register        Scale         Retrain     │
│  Store         Version         A/B Test      Explain     │
└─────────────────────────────────────────────────────────┘
```

---

## PART 4: AI AGENT DEPLOYMENT — Step by Step

### Scenario: Tumhara Customer Support Agent Deploy Karna Hai

```
Agent kya karta hai:
- User ke questions answer karta hai
- Order status check karta hai (tool call)
- Refund process karta hai (tool call)
- Escalate karta hai humans ko (jab needed)
```

---

### Step 1: Agent Ko Containerize Karo (Docker)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```python
# requirements.txt
fastapi==0.111.0
langchain==0.2.0
anthropic==0.28.0
langfuse==2.0.0       # observability
redis==5.0.0          # caching
pydantic==2.0.0
```

```python
# main.py — Agent ka API
from fastapi import FastAPI
from langchain_anthropic import ChatAnthropic
from langfuse import Langfuse

app = FastAPI()
langfuse = Langfuse()  # observability

@app.post("/chat")
async def chat(message: str, session_id: str):
    # trace start karo
    trace = langfuse.trace(name="customer-support", session_id=session_id)
    
    response = await agent.run(message)
    
    # log karo
    trace.update(output=response, metadata={"tokens": response.usage})
    
    return {"response": response.content}
```

---

### Step 2: Environment Variables & Secrets

```bash
# .env (NEVER commit this)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
LANGFUSE_SECRET_KEY=sk-lf-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    langfuse_secret_key: str
    database_url: str
    redis_url: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

### Step 3: Cloud Pe Deploy Karo

#### Option A: AWS (Most Common Enterprise)
```
User Request
     ↓
API Gateway (rate limiting, auth)
     ↓
ECS Fargate (serverless containers)
  ├── Agent Container 1
  ├── Agent Container 2  (auto-scaled)
  └── Agent Container N
     ↓
ElastiCache Redis (conversation memory)
     ↓
RDS PostgreSQL (agent logs, user data)
```

**AWS Services breakdown:**
| Service | Purpose |
|---------|---------|
| ECS Fargate | Agent containers run karna |
| ECR | Docker images store karna |
| API Gateway | Traffic manage karna |
| ElastiCache | Redis — session memory |
| RDS | Database |
| Secrets Manager | API keys safely store |
| CloudWatch | Logs aur metrics |
| ALB | Load balancer |

---

#### Option B: Railway / Render (Startup/Small Project)
```bash
# railway.toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```
- **Railway:** Push karo, auto deploy — $20/month se start
- **Render:** Similar, free tier available
- **Fly.io:** Edge deployment, global

---

#### Option C: Kubernetes (Large Scale)
```yaml
# agent-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-support-agent
spec:
  replicas: 3                    # 3 instances
  selector:
    matchLabels:
      app: customer-support-agent
  template:
    spec:
      containers:
      - name: agent
        image: myregistry/agent:v1.2.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: anthropic-key
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-hpa
spec:
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70   # 70% CPU pe scale out
```

---

### Step 4: Agent Memory — Production Setup

```
Problem: User kal baat kiya tha, aaj bhi yaad rehna chahiye
```

```python
# memory_manager.py
import redis
import json
from datetime import timedelta

redis_client = redis.Redis.from_url(settings.redis_url)

def save_conversation(session_id: str, messages: list):
    key = f"chat:{session_id}"
    redis_client.setex(
        key,
        timedelta(days=7),        # 7 din baad expire
        json.dumps(messages)
    )

def get_conversation(session_id: str) -> list:
    key = f"chat:{session_id}"
    data = redis_client.get(key)
    return json.loads(data) if data else []

# Long-term memory — Vector DB mein
def save_long_term_memory(user_id: str, fact: str):
    embedding = embed(fact)
    vector_db.upsert(
        id=f"{user_id}_{hash(fact)}",
        vector=embedding,
        metadata={"user_id": user_id, "fact": fact}
    )
```

---

### Step 5: Rate Limiting — LLM Costs Control

```python
# rate_limiter.py
from redis import Redis
import time

redis_client = Redis.from_url(settings.redis_url)

def check_rate_limit(user_id: str) -> bool:
    key = f"rate:{user_id}:{int(time.time() // 60)}"  # per minute
    
    current = redis_client.incr(key)
    redis_client.expire(key, 60)
    
    if current > 20:  # 20 requests per minute limit
        raise RateLimitError("Too many requests")
    
    return True

# Token budget per user per day
def check_token_budget(user_id: str, tokens_used: int) -> bool:
    key = f"tokens:{user_id}:{date.today()}"
    total = redis_client.incrby(key, tokens_used)
    redis_client.expire(key, 86400)  # 24 hours
    
    if total > 100_000:  # 100K tokens/day limit
        raise BudgetExceededError("Daily token limit reached")
```

---

### Step 6: Observability — Kya Ho Raha Hai Agent Ke Saath?

```python
# observability.py — Langfuse integration
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context

langfuse = Langfuse(
    public_key=settings.langfuse_public_key,
    secret_key=settings.langfuse_secret_key,
)

@observe()  # automatically track karo
async def run_agent(user_message: str, session_id: str):
    langfuse_context.update_current_trace(
        session_id=session_id,
        tags=["customer-support", "production"]
    )
    
    # agent run
    response = await agent.ainvoke({"input": user_message})
    
    # custom score log karo
    langfuse_context.score_current_trace(
        name="response_quality",
        value=await evaluate_response(response)
    )
    
    return response
```

**Langfuse Dashboard mein dikhega:**
```
📊 Traces: 15,234 today
⏱️  Avg Latency: 2.3s
💰 Cost: $45.23 today
🎯 Success Rate: 94.2%
❌ Failed: 5.8% (escalated to human)

Top Failing Queries:
  1. "Mera refund kab aayega?" — 340 fails
  2. "Invoice chahiye" — 120 fails
```

---

### Step 7: Prompt Versioning — Agent Ka "Code"

```
Problem: Prompt change kiya, sab kuch worse ho gaya — kaunsa better tha?
```

```python
# prompt_manager.py — LangSmith ya Langfuse se
from langfuse import Langfuse

langfuse = Langfuse()

# Prompt register karo
langfuse.create_prompt(
    name="customer-support-system",
    prompt="""You are a helpful customer support agent for XYZ Store.
    
    Rules:
    - Always be polite
    - If order not found, ask for order ID
    - Refunds take 5-7 business days
    - Escalate to human if: legal issues, complaints > 3
    
    Today's date: {{date}}
    """,
    labels=["production"],  # version tag
)

# Use karo
def get_system_prompt():
    prompt = langfuse.get_prompt("customer-support-system", label="production")
    return prompt.compile(date=str(date.today()))
```

**Versioning:**
```
v1.0 → Baseline (accuracy: 72%)
v1.1 → Added refund rules (accuracy: 81%)
v1.2 → Better escalation logic (accuracy: 87%) ← current production
v1.3 → Testing (accuracy: ???) ← staging
```

---

### Step 8: A/B Testing — Kaun Sa Agent Better Hai?

```python
# ab_testing.py
import random

def get_agent_version(user_id: str) -> str:
    # Consistent assignment — same user same version mile
    user_hash = hash(user_id) % 100
    
    if user_hash < 80:
        return "agent_v1"    # 80% users
    else:
        return "agent_v2"    # 20% users (new version test)

@app.post("/chat")
async def chat(message: str, user_id: str):
    version = get_agent_version(user_id)
    
    if version == "agent_v1":
        response = await agent_v1.run(message)
    else:
        response = await agent_v2.run(message)
    
    # log version ke saath
    log_event(user_id, version, message, response)
    
    return response

# After 1 week — compare karo:
# Agent v1: CSAT 78%, Cost $0.02/query
# Agent v2: CSAT 84%, Cost $0.03/query
# Decision: v2 better hai, 80% → 100% rollout karo
```

---

### Step 9: CI/CD Pipeline — Auto Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy Agent

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Agent Tests
        run: |
          pip install -r requirements.txt
          pytest tests/test_agent.py -v
          
      - name: Run Eval Suite
        run: |
          python evals/run_evals.py    # 100 test cases check karo
          # Fail if accuracy < 85%

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Image
        run: docker build -t agent:${{ github.sha }} .
        
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
          docker push $ECR_URI/agent:${{ github.sha }}
          
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production \
            --service customer-support-agent \
            --force-new-deployment
```

---

### Step 10: Monitoring & Alerts — Production Mein Jaagna

```python
# monitoring.py
from dataclasses import dataclass
import asyncio

@dataclass
class AgentMetrics:
    latency_p50: float   # 50% requests is time pe complete
    latency_p99: float   # 99% requests is time pe complete
    error_rate: float    # % requests jo fail hue
    cost_per_query: float
    human_escalation_rate: float

# CloudWatch / Datadog mein push karo
async def push_metrics(metrics: AgentMetrics):
    cloudwatch.put_metric_data(
        Namespace="CustomerSupportAgent",
        MetricData=[
            {"MetricName": "P99Latency", "Value": metrics.latency_p99},
            {"MetricName": "ErrorRate", "Value": metrics.error_rate},
            {"MetricName": "CostPerQuery", "Value": metrics.cost_per_query},
        ]
    )

# Alert rules
"""
ALERT: Error rate > 5% → PagerDuty → Engineer ko jagao
ALERT: P99 latency > 10s → Investigate
ALERT: Daily cost > $500 → Pause + notify
ALERT: Escalation rate > 20% → Agent ki quality kharab ho rahi hai
"""
```

---

## PART 5: Agent Deployment Architectures

### 5.1 Simple Setup (Startup)
```
Internet → Railway/Render → FastAPI Agent → Anthropic API
                               ↓
                            Redis (memory)
                               ↓
                          PostgreSQL (logs)
```
**Cost:** ~$50-200/month | **Setup:** 1 day

---

### 5.2 Production Setup (Mid-size Company)
```
Internet
   ↓
CloudFlare (DDoS protection, WAF)
   ↓
AWS API Gateway (rate limiting, auth)
   ↓
Application Load Balancer
   ↓
ECS Fargate (2-10 containers, auto-scale)
   ├── Agent Service
   ├── Tool Service (order lookup, etc.)
   └── Memory Service
   ↓
ElastiCache Redis (hot memory)
   ↓
RDS PostgreSQL (cold storage)
   ↓
Langfuse / LangSmith (observability)
   ↓
CloudWatch (alerts)
```
**Cost:** ~$500-2000/month | **Setup:** 1-2 weeks

---

### 5.3 Enterprise Setup (Large Scale)
```
Multi-region deployment
   ↓
Global Load Balancer
   ↓
Kubernetes (EKS/GKE)
  ├── Agent pods (100+)
  ├── Tool microservices
  ├── Vector DB (Qdrant cluster)
  └── Cache cluster
   ↓
Data Lake (S3) — all conversations
   ↓
Weekly retraining pipeline
   ↓
Model Registry (MLflow)
   ↓
Full observability stack
```
**Cost:** $5000+/month | **Setup:** 1-3 months

---

## PART 6: Agent Testing — Deploy Se Pehle

### 6.1 Unit Tests
```python
# test_agent.py
def test_order_lookup_tool():
    result = order_lookup_tool("ORD-12345")
    assert result["status"] == "delivered"
    assert "tracking" in result

def test_agent_handles_unknown_query():
    response = agent.run("kya aap mujhe fly karna sikha sakte ho?")
    assert "scope" in response.lower() or "help" in response.lower()
    # Out of scope query ko politely decline kare
```

### 6.2 Evaluation Suite (Evals)
```python
# evals/test_cases.json
[
  {
    "input": "Mera order ORD-789 kahan hai?",
    "expected_tool": "order_lookup",
    "expected_contains": ["tracking", "status"]
  },
  {
    "input": "Main manager se baat karna chahta hun",
    "expected_action": "escalate_to_human",
    "should_not_contain": ["I cannot", "impossible"]
  },
  {
    "input": "Refund milega?",
    "expected_contains": ["5-7 business days", "policy"]
  }
]

# run_evals.py
async def run_evals():
    results = []
    for case in test_cases:
        response = await agent.run(case["input"])
        score = evaluate(response, case)
        results.append(score)
    
    accuracy = sum(results) / len(results)
    print(f"Accuracy: {accuracy:.1%}")
    
    if accuracy < 0.85:
        raise Exception("Accuracy below threshold! Don't deploy.")
```

### 6.3 Load Testing
```bash
# locust se load test karo
locust -f locustfile.py --users 100 --spawn-rate 10 --run-time 5m

# Dekhna hai:
# - 100 concurrent users handle ho rahe hain?
# - Latency acceptable hai?
# - Koi memory leak toh nahi?
```

---

## PART 7: Cost Optimization in Production

### 7.1 Semantic Caching
```python
# Same ya similar question pucha → cached answer do (LLM call skip)
from gptcache import cache

cache.init()  # Redis-backed semantic cache

@cache.cached()
async def get_answer(question: str) -> str:
    return await llm.ainvoke(question)

# "Order status kya hai?" → LLM call
# "Mera order kahan hai?" → Cache hit! (similar question)
# Cost: 60-70% reduction on repeated queries
```

### 7.2 Model Routing
```python
# Simple query → cheap model, Complex → expensive model
def route_query(message: str) -> str:
    if len(message) < 50 and is_simple_query(message):
        return "claude-haiku-4-5"      # $0.001/1K tokens
    elif needs_reasoning(message):
        return "claude-opus-4-7"       # $0.015/1K tokens
    else:
        return "claude-sonnet-4-6"     # $0.003/1K tokens

# Result: 40-50% cost savings
```

### 7.3 Prompt Caching
```python
# Anthropic prompt caching — system prompt cache ho jaata hai
response = anthropic.messages.create(
    model="claude-sonnet-4-6",
    system=[
        {
            "type": "text",
            "text": long_system_prompt,  # 2000 tokens
            "cache_control": {"type": "ephemeral"}  # CACHE THIS!
        }
    ],
    messages=[{"role": "user", "content": user_message}]
)
# First call: 2100 tokens charged
# Next calls: only 100 tokens charged (system prompt cached)
# Savings: 90%+ on system prompt tokens
```

---

## PART 8: Real World Agent MLOps — Checklist

```
PRE-DEPLOYMENT:
  ✅ Docker container banao
  ✅ Environment variables secure karo (no hardcoded keys)
  ✅ Unit tests pass ho rahe hain
  ✅ Eval suite: accuracy > threshold
  ✅ Load test done
  ✅ Prompt version registered

DEPLOYMENT:
  ✅ Staging mein deploy karo pehle
  ✅ Smoke tests run karo
  ✅ 5-10% traffic pe A/B test shuru karo
  ✅ Metrics dekhte raho (latency, errors)
  ✅ Full rollout karo slowly

POST-DEPLOYMENT:
  ✅ Observability dashboard setup
  ✅ Alerts configured (error rate, cost, latency)
  ✅ Weekly eval run schedule
  ✅ Cost report daily
  ✅ Failure cases collect karo → improve karo
```

---

## PART 9: Tools Summary — Apna Stack Choose Karo

### Small Project (Solo Developer)
```
Deploy:      Railway / Render
Memory:      Redis (Railway add-on)
DB:          PostgreSQL (Railway add-on)
Observability: Langfuse (free tier)
LLM:         Anthropic / OpenAI direct
Total Cost:  ~$50-100/month
```

### Startup (5-50 users)
```
Deploy:      AWS ECS Fargate
Memory:      ElastiCache Redis
DB:          RDS PostgreSQL
Observability: Langfuse Cloud / LangSmith
Caching:     GPTCache (semantic)
CI/CD:       GitHub Actions
Total Cost:  ~$200-500/month
```

### Enterprise (50+ devs, millions of users)
```
Deploy:      Kubernetes (EKS)
Memory:      Redis Cluster
DB:          Aurora PostgreSQL
Observability: Datadog + Langfuse
Experiment:  MLflow
Registry:    ECR
CI/CD:       GitHub Actions + ArgoCD
Gateway:     Kong / AWS API Gateway
Total Cost:  $2000+/month
```

---

## QUICK INTERVIEW ANSWERS

**Q: MLOps aur DevOps mein kya fark hai?**
A: DevOps mein sirf code deploy hota hai — deterministic hota hai. MLOps mein model + data + code — model ka behavior data ke saath change ho sakta hai. Isliye data versioning, model monitoring, aur retraining pipeline extra chahiye.

**Q: AI Agent ko production mein deploy karne ke liye kya chahiye?**
A: 5 cheezein: 1) Containerization (Docker) 2) Memory management (Redis) 3) Observability (Langfuse/LangSmith) 4) Rate limiting (cost control) 5) Eval suite (quality gate before deploy)

**Q: Model drift kaise handle karte hain?**
A: Monitor karo — agar accuracy drop ho ya input distribution change ho. Threshold set karo: below X% → alert → investigate → retrain if needed. Scheduled retraining bhi karo (weekly/monthly).

**Q: LLM production mein cost kaise control karein?**
A: Prompt caching (90% savings on system prompt), semantic caching (60-70% on repeated queries), model routing (cheap model for simple queries), rate limiting per user, daily budget alerts.
