# Enterprise System Design — 10M Users
> Monolithic se Microservices tak — Complete Architecture Guide

---

## Pehle Samjho: 10M Users Ka Scale Kya Hota Hai?

```
10M registered users ka matlab:
  Peak concurrent users:    ~100,000 (1% rule)
  Requests per second:      ~50,000 RPS
  Data per day:             ~10TB

  Database rows:            Billions
  Uptime requirement:       99.99% = sirf 52 min/year downtime

Ye sab ek simple server pe nahi ho sakta:
  Single server handle kar sakta hai: ~1,000 RPS
  10M users ke liye chahiye: 50x zyada capacity
```

---

## PART 1: MONOLITHIC ARCHITECTURE

### Monolith Kya Hai?

```
Poora application ek single unit mein:
  ek codebase → ek deployment → ek database

┌─────────────────────────────────────────┐
│           MONOLITHIC APP                │
│                                         │
│   User Module  │  Order Module          │
│   ─────────────────────────             │
│   Payment Module │ Notification         │
│   ─────────────────────────             │
│   Product Module │ Auth Module          │
│                                         │
│   ─────────────────────────────         │
│         Single Database                 │
└─────────────────────────────────────────┘
         ↓ ek server pe deploy
```

---

### Monolith Ka System Design (2-Layer)

```
                     INTERNET
                        │
                   [CDN / WAF]
                        │
                 [Load Balancer]
                  /      |      \
           [App1]    [App2]    [App3]   ← 3 instances (horizontal scale)
                  \      |      /
               [Shared PostgreSQL]
                  Primary ─── Replica
                        │
                   [Redis Cache]
```

**Code Structure:**
```
myapp/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── orders/
│   ├── payments/
│   └── notifications/
├── shared/
│   ├── database.py
│   ├── cache.py
│   └── utils.py
├── main.py
└── Dockerfile
```

---

### Monolith: Pros & Cons

```
PROS:
  ✅ Simple develop karna — sab ek jagah
  ✅ Easy debug — ek hi process trace karo
  ✅ Simple deploy — ek Docker image
  ✅ Fast internal calls — no network latency
  ✅ ACID transactions easy — ek database
  ✅ Small team ke liye perfect (< 10 devs)
  ✅ Early stage startup ke liye ideal

CONS:
  ❌ Scale karna mushkil — poora app scale karna padta hai
     (sirf payment heavy hai, but poora scale karo)
  ❌ Ek bug → poori app down
  ❌ Technology lock-in — sab ek language
  ❌ Large team mein code conflicts
  ❌ Deploy karo toh poori app redeploy
  ❌ Fault isolation nahi — ek module crash = sab crash
```

---

### Monolith Deployment — Docker + Kubernetes

```yaml
# docker-compose.yml (development)
version: '3.8'
services:
  app:
    build: .
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on: [db, redis]
    deploy:
      replicas: 3              # 3 copies chalao

  db:
    image: postgres:15
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx.conf:/etc/nginx/nginx.conf]
```

```yaml
# k8s/deployment.yaml (production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: monolith-app
spec:
  replicas: 10                   # 10 instances
  selector:
    matchLabels:
      app: monolith
  template:
    spec:
      containers:
      - name: app
        image: myapp:v1.2
        resources:
          requests: {cpu: "500m", memory: "512Mi"}
          limits:   {cpu: "2000m", memory: "2Gi"}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 5
  maxReplicas: 50                # Traffic spike pe 50 tak scale
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70
```

---

### Monolith Se 10M Users Kaise Handle Karo?

```
Strategy: Scale Out (horizontal scaling)

Tier 1 — Load Balancer:
  AWS ALB ya Nginx → traffic distribute karo 10 instances mein

Tier 2 — App Layer:
  10-50 identical app instances
  Stateless rakho — session Redis mein store karo

Tier 3 — Database Layer:
  Primary (writes) + 3 Read Replicas (reads)
  Connection pooling: PgBouncer
  Sharding: user_id % 4 → 4 database shards

Tier 4 — Cache Layer:
  Redis Cluster — 80% requests cache se serve karo
  CDN — static assets cache karo globally

Result: Monolith bhi handle kar sakta hai 10M users
        BUT — sirf ek type ka application agar equally scale karna ho
```

---

## PART 2: MICROSERVICES ARCHITECTURE

### Microservices Kya Hai?

```
Application ko chhote independent services mein tod do:
  Har service:
    → Apna codebase
    → Apna database
    → Apna deployment
    → Apni team

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  User    │  │  Order   │  │ Payment  │  │  Notify  │
│ Service  │  │ Service  │  │ Service  │  │ Service  │
│          │  │          │  │          │  │          │
│ Users DB │  │ Orders DB│  │  Pay DB  │  │  Queue   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
     ↑              ↑              ↑              ↑
  Port 8001      Port 8002      Port 8003      Port 8004

Sab ek dusre se API ya Message Queue se baat karte hain
```

---

### 10M Users App Ka Full Microservices Design

```
                         INTERNET
                            │
                    ┌───────────────┐
                    │  CDN (CloudFront)│  ← Static files, images
                    └───────┬───────┘
                            │
                    ┌───────────────┐
                    │  WAF + DDoS   │  ← Security layer
                    └───────┬───────┘
                            │
                    ┌───────────────┐
                    │ Load Balancer │  ← AWS ALB / GCP LB
                    │  (Layer 7)    │
                    └───────┬───────┘
                            │
                    ┌───────────────┐
                    │  API Gateway  │  ← Auth, Rate limit,
                    │               │    Routing, SSL termination
                    └───┬───┬───┬───┘
              ┌─────────┘   │   └──────────┐
              │             │              │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │User Service │ │Order Service│ │Search Service│
    │  (Node.js)  │ │  (Python)   │ │(Elasticsearch│
    │  MySQL      │ │  Postgres   │  └─────────────┘
    └─────────────┘ └──────┬──────┘
                           │ (event)
              ┌────────────┴──────────────┐
              │     Message Queue         │
              │  (Kafka / RabbitMQ)       │
              └────────┬──────────────────┘
              ┌────────┴────────┐
    ┌─────────────┐    ┌─────────────┐
    │  Payment    │    │Notification │
    │  Service    │    │  Service    │
    │ (Java)      │    │  (Go)       │
    │  Stripe DB  │    │  Redis      │
    └─────────────┘    └─────────────┘
```

---

### Service Breakdown — Kaun Kya Karta Hai

```
1. API GATEWAY
   - Single entry point
   - JWT token verify karo
   - Rate limiting (100 req/min per user)
   - Request routing
   - SSL termination
   - Request/Response logging
   Tools: Kong, AWS API Gateway, Nginx

2. USER SERVICE
   - Register, Login, Profile
   - JWT token generate karo
   - Database: PostgreSQL (user data)
   - Cache: Redis (sessions, user cache)
   Scale: 5-10 pods

3. ORDER SERVICE
   - Order create/read/update
   - Order status tracking
   - Database: PostgreSQL
   - Events publish karo Kafka pe
   Scale: 10-20 pods

4. PAYMENT SERVICE
   - Payment processing (Stripe/Razorpay)
   - Transaction records
   - Database: PostgreSQL (ACID important)
   - Extra security, compliance
   Scale: 5 pods (kritical, slow scale)

5. NOTIFICATION SERVICE
   - Email, SMS, Push notifications
   - Async — queue se kaam karo
   - Database: MongoDB (flexible schema)
   - Queue: Kafka consumer
   Scale: 3-5 pods

6. SEARCH SERVICE
   - Full text search
   - Filters, facets
   - Database: Elasticsearch
   Scale: 3 pods (ES handles internally)

7. MEDIA SERVICE
   - Image/Video upload
   - Resize, compress
   - Storage: S3 / GCS
   Scale: 2-3 pods

8. ANALYTICS SERVICE
   - User behavior tracking
   - Reports, dashboards
   - Database: ClickHouse / BigQuery
   Scale: 2 pods (background jobs)
```

---

### Inter-Service Communication — Kaise Baat Karte Hain?

```
2 Patterns:

1. SYNCHRONOUS (Request-Response) — REST / gRPC
   ─────────────────────────────────────────────
   Order Service → User Service
   "Is user ka address do"
   → User Service turant jawab deta hai

   Use karo jab: Turant response chahiye
   Problem: Agar User Service down hai → Order Service bhi fail

   gRPC use karo internal mein (2x faster than REST):
   Order Service ──gRPC──→ User Service ──gRPC──→ Payment Service


2. ASYNCHRONOUS (Event-Driven) — Kafka / RabbitMQ
   ─────────────────────────────────────────────────
   Order Service → Kafka topic "order.created" publish karo
   → Notification Service consume karega (apne time pe)
   → Analytics Service consume karega
   → Payment Service consume karega

   Use karo jab: Turant response zaroori nahi
   Benefit: Services loosely coupled — ek down bhi hai toh kaam chalta
```

```python
# Event publishing (Order Service)
async def create_order(order_data):
    order = await db.create(order_data)

    # Synchronous: payment confirm karo
    payment = await payment_service.charge(order.id)

    # Asynchronous: notifications, analytics ko batao
    await kafka.publish("order.created", {
        "order_id": order.id,
        "user_id": order.user_id,
        "amount": order.total
    })
    return order

# Event consuming (Notification Service)
@kafka.consumer("order.created")
async def send_confirmation(event):
    user = await user_service.get(event["user_id"])
    await email.send(user.email, "Order confirmed!")
```

---

### Service Mesh — Service Communication Manage Karo

```
Problem as scale badhta hai:
  100 microservices → kaise track karo kaun kisse baat kar raha hai?
  Retry logic, timeouts, circuit breaker — har service mein likhna padega?

Solution: Service Mesh (Istio / Linkerd)
  Har pod ke saath ek sidecar proxy lagao (Envoy)
  Ye sab automatically handle karta hai:

  ✅ mTLS — service-to-service encryption
  ✅ Load balancing
  ✅ Circuit breaking
  ✅ Retries with backoff
  ✅ Distributed tracing
  ✅ Traffic splitting (canary deployments)

Bina code change ke ye sab milta hai!
```

---

### Circuit Breaker Pattern

```
Problem: Payment Service slow ho gaya
         Order Service wait karta raha → 1000 requests queue mein
         Orders Service bhi slow → User Service bhi slow
         → Cascading failure → Poora system down!

Solution: Circuit Breaker

States:
  CLOSED (normal):    Requests jaate hain
  OPEN (failed):      Requests rok do, error return karo fast
  HALF-OPEN (testing): Thoda traffic jaane do, check karo

┌──────────┐   5 failures    ┌──────────┐
│  CLOSED  │ ─────────────→  │   OPEN   │
│ (normal) │                 │  (fail)  │
└──────────┘                 └──────────┘
      ↑                           │ 30 seconds
      │ success               ┌───┴──────┐
      └─────────────────────  │HALF-OPEN │
                              └──────────┘

```python
# Circuit breaker implementation
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=30):
        self.failures = 0
        self.threshold = failure_threshold
        self.state = "CLOSED"

    async def call(self, service_fn):
        if self.state == "OPEN":
            raise Exception("Circuit open — service unavailable")

        try:
            result = await service_fn()
            self.failures = 0
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.state = "OPEN"
            raise
```

---

### Database Strategy — Microservices Mein

```
Rule: Har service ka APNA database
      Doosri service directly DB access nahi kar sakti

POLYGLOT PERSISTENCE — Har service ke liye best database:

User Service     → PostgreSQL    (relational, ACID)
Order Service    → PostgreSQL    (transactions important)
Product Service  → MongoDB       (flexible schema, catalog)
Search Service   → Elasticsearch (full-text search)
Session Store    → Redis         (fast key-value)
Analytics        → ClickHouse    (columnar, fast reads)
Media Metadata   → DynamoDB      (high-scale NoSQL)
Chat/Real-time   → Cassandra     (write-heavy, distributed)
```

---

### Caching Strategy — 3 Layers

```
Layer 1: CDN Cache (Global)
  Static files, images, public API responses
  Hit rate: ~60% requests yahan rokein
  Tools: CloudFront, Cloudflare

Layer 2: API Gateway Cache
  Frequently accessed, non-personalized data
  Example: Product listings, categories
  TTL: 5-15 minutes

Layer 3: Application Cache (Redis)
  User sessions, computed results, DB query cache
  Example: User profile, order history
  TTL: 1-60 minutes based on data freshness needs

Cache-Aside Pattern:
  1. Check Redis
  2. Miss? → DB se lo → Redis mein store karo
  3. Hit? → Redis se do

Write-Through:
  Write to DB aur Redis dono simultaneously
  (consistency important ho toh)

Cache Invalidation:
  TTL-based: Simple, eventual consistency ok
  Event-based: Order update → cache invalidate immediately
```

---

## PART 3: DEPLOYMENT STRATEGIES

### Complete CI/CD Pipeline

```
Developer pushes code
        │
        ▼
┌─────────────────┐
│   Git Push      │  → GitHub / GitLab
│   (feature branch)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CI Pipeline   │  GitHub Actions / Jenkins
│                 │
│ 1. Run Tests    │  → Unit, Integration, E2E
│ 2. Code Lint    │  → flake8, eslint
│ 3. Security     │  → Snyk, SAST scan
│ 4. Build Image  │  → docker build
│ 5. Push to ECR  │  → myapp:sha-abc123
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CD Pipeline   │
│                 │
│  Staging deploy │  → Auto deploy to staging
│  Smoke tests    │  → Basic health checks
│  Manual approve │  → Team lead approves
│  Prod deploy    │  → Kubernetes rolling update
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Monitor       │  → Datadog / Grafana
│   Alert         │  → PagerDuty on errors
└─────────────────┘
```

---

### Deployment Strategies — Zero Downtime

#### 1. Rolling Update (Default in K8s)

```
Before:  [v1] [v1] [v1] [v1] [v1]

Step 1:  [v2] [v1] [v1] [v1] [v1]
Step 2:  [v2] [v2] [v1] [v1] [v1]
Step 3:  [v2] [v2] [v2] [v1] [v1]
Step 4:  [v2] [v2] [v2] [v2] [v1]
After:   [v2] [v2] [v2] [v2] [v2]

✅ Zero downtime
✅ Simple
❌ Rollback slow (reverse rolling)
❌ Do versions run karte hain simultaneously
```

#### 2. Blue-Green Deployment

```
Blue (LIVE):   [v1] [v1] [v1]  ← 100% traffic
Green (NEW):   [v2] [v2] [v2]  ← 0% traffic (warm up)

Test green environment → sab theek? → Switch!

After switch:
Blue (OLD):    [v1] [v1] [v1]  ← 0% (standby)
Green (LIVE):  [v2] [v2] [v2]  ← 100% traffic

Problem? → Ek click se blue pe wapas jaao (instant rollback!)

✅ Instant rollback
✅ Full testing before switch
❌ Double infrastructure cost
❌ Database migration tricky
```

#### 3. Canary Deployment (Best for 10M Users)

```
Step 1:  v1 = 100%, v2 = 0%
Step 2:  v1 = 95%,  v2 = 5%   ← 5% users pe test karo
         Monitor: errors badhey? → Rollback
         Normal? → Aage badho
Step 3:  v1 = 50%,  v2 = 50%
Step 4:  v1 = 0%,   v2 = 100% ← Fully promoted

✅ Real user traffic pe test
✅ Gradual risk exposure
✅ Easy rollback
✅ A/B testing bhi kar sakte ho
❌ Complex to manage without service mesh
```

```yaml
# Kubernetes Canary with Istio
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  http:
  - route:
    - destination:
        host: myapp-v1
      weight: 95        # 95% traffic v1 pe
    - destination:
        host: myapp-v2
      weight: 5         # 5% traffic v2 pe (canary)
```

---

### Complete Kubernetes Production Setup

```
Cluster Structure:
┌─────────────────────────────────────────────────┐
│                  EKS CLUSTER                    │
│                                                 │
│  Namespace: production                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ user   │ │ order  │ │payment │ │notify  │  │
│  │service │ │service │ │service │ │service │  │
│  │3 pods  │ │5 pods  │ │3 pods  │ │2 pods  │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
│                                                 │
│  Namespace: infrastructure                      │
│  ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ Kafka  │ │ Redis  │ │ Istio  │              │
│  │Cluster │ │Cluster │ │  Mesh  │              │
│  └────────┘ └────────┘ └────────┘              │
│                                                 │
│  Namespace: monitoring                          │
│  ┌────────┐ ┌────────┐ ┌────────┐              │
│  │Grafana │ │Prometheus│ │Jaeger │              │
│  └────────┘ └────────┘ └────────┘              │
└─────────────────────────────────────────────────┘
```

```yaml
# Production Deployment — Full Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2           # Ek waqt 2 extra pods allowed
      maxUnavailable: 0     # Zero downtime maintain karo
  template:
    spec:
      containers:
      - name: order-service
        image: myregistry/order-service:v1.5.2
        resources:
          requests: {cpu: "250m", memory: "256Mi"}
          limits:   {cpu: "1000m", memory: "1Gi"}
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: order-db-secret
              key: url
        livenessProbe:
          httpGet: {path: /health, port: 8000}
          initialDelaySeconds: 30
        readinessProbe:
          httpGet: {path: /ready, port: 8000}
          initialDelaySeconds: 5
      affinity:
        podAntiAffinity:      # Different nodes pe spread karo
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: order-service
            topologyKey: kubernetes.io/hostname
```

---

### Infrastructure as Code — Terraform

```hcl
# AWS EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "production-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      min_size     = 3
      max_size     = 20
      desired_size = 5
      instance_types = ["m5.xlarge"]
    }
    compute_heavy = {
      min_size     = 0
      max_size     = 10
      desired_size = 2
      instance_types = ["c5.2xlarge"]
    }
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.r6g.xlarge"
  allocated_storage    = 100
  storage_type         = "gp3"
  multi_az             = true          # High availability
  deletion_protection  = true
  backup_retention_period = 7          # 7 din ka backup
}
```

---

## PART 4: OBSERVABILITY — Monitoring Stack

```
3 Pillars of Observability:

1. METRICS (Numbers)
   Tool: Prometheus + Grafana
   Track: RPS, latency, error rate, CPU, memory
   Alert: Error rate > 1% → PagerDuty

2. LOGS (Events)
   Tool: ELK Stack (Elasticsearch + Logstash + Kibana)
         ya Loki + Grafana
   Log: Every request, error, business event
   Format: Structured JSON logs

3. TRACES (Journey)
   Tool: Jaeger / Zipkin / Datadog APM
   Track: Ek request ka poora journey across services
   Debug: Kahan slow hai, kahan fail ho raha hai
```

```python
# Structured logging example
import structlog
logger = structlog.get_logger()

async def create_order(user_id, items):
    log = logger.bind(
        user_id=user_id,
        trace_id=get_trace_id(),    # Distributed trace connect karo
        service="order-service"
    )
    log.info("order.create.started", item_count=len(items))

    try:
        order = await db.create_order(user_id, items)
        log.info("order.create.success",
                 order_id=order.id,
                 duration_ms=elapsed())
        return order
    except Exception as e:
        log.error("order.create.failed", error=str(e))
        raise
```

---

## PART 5: SECURITY LAYERS

```
Layer 1: Network
  - VPC with private subnets (DB bahar se accessible nahi)
  - Security Groups (sirf zaruri ports open)
  - WAF (SQL injection, XSS block)
  - DDoS protection (AWS Shield)

Layer 2: API Gateway
  - JWT validation
  - Rate limiting (100 req/min per IP)
  - API key management
  - Request size limits

Layer 3: Service-to-Service
  - mTLS (mutual TLS via Istio)
  - Service accounts, not shared credentials
  - Zero-trust networking

Layer 4: Data
  - Encryption at rest (AES-256)
  - Encryption in transit (TLS 1.3)
  - Secrets in AWS Secrets Manager (not env vars)
  - PII data masking in logs

Layer 5: Container
  - Non-root user in containers
  - Read-only filesystem
  - No privileged containers
  - Image scanning (Snyk, Trivy)
```

---

## PART 6: COST OPTIMIZATION AT SCALE

```
Compute:
  ✅ Spot Instances for non-critical workloads (70% cheaper)
  ✅ Reserved Instances for baseline (30% cheaper)
  ✅ Right-size pods (CPU/memory waste mat karo)
  ✅ KEDA — event-driven autoscaling (scale to zero idle services)

Database:
  ✅ Read replicas se reads serve karo (primary pe load kam)
  ✅ Connection pooling (PgBouncer) — DB connections expensive
  ✅ Cold data → cheaper storage (S3 Glacier)
  ✅ Cache aggressively — DB call = most expensive operation

Network:
  ✅ CDN pe static assets (S3 direct nahi)
  ✅ Same region mein services rakho (cross-region data transfer costly)
  ✅ Compress API responses (gzip)

Monitoring:
  ✅ Log sampling at high volume (har request mat log karo)
  ✅ Metrics retention policy (1 year raw data mat rakho)
```

---

## MONOLITH vs MICROSERVICES — Kab Kya Choose Karo?

```
┌──────────────────────┬──────────────────┬─────────────────────┐
│ Criteria             │ Monolith         │ Microservices       │
├──────────────────────┼──────────────────┼─────────────────────┤
│ Team size            │ < 15 devs        │ > 15 devs           │
│ Product maturity     │ Early/MVP stage  │ Established product │
│ Scale requirement    │ < 1M users       │ > 1M users          │
│ Dev speed            │ Fast initially   │ Slow initially      │
│ Operational overhead │ Low              │ High                │
│ Technology choice    │ One stack        │ Best tool per job   │
│ Fault isolation      │ Poor             │ Excellent           │
│ Data consistency     │ Easy (1 DB)      │ Complex (saga)      │
│ Deployment           │ Simple           │ Complex             │
│ Debugging            │ Easy             │ Distributed tracing │
└──────────────────────┴──────────────────┴─────────────────────┘

REAL WORLD ADVICE:
  1. Pehle monolith banao (speed matters early)
  2. Bottleneck identify karo real data se
  3. Sirf woh service nikalo jo scale issue create kar rahi ho
  4. "Modular Monolith" → phir Microservices

Amazon, Netflix, Uber — sab ne monolith se start kiya
```

---

## EVOLUTION PATH — 10M Users Ke Liye

```
Phase 1 (0 → 10K users): Simple Monolith
  - Ek server + ek DB
  - Focus on product, not infrastructure
  - Cost: ~$100/month

Phase 2 (10K → 100K): Scaled Monolith
  - Load balancer + 3 app servers
  - DB read replicas
  - Redis cache add karo
  - CDN for static assets
  - Cost: ~$500/month

Phase 3 (100K → 1M): Modular Monolith → Partial Microservices
  - High-load services nikalo (payment, search, notifications)
  - Baaki monolith rehne do
  - Kubernetes pe deploy
  - Cost: ~$3,000/month

Phase 4 (1M → 10M): Full Microservices
  - Har domain ek service
  - Kafka for events
  - Service mesh (Istio)
  - Multi-region deployment
  - Cost: ~$15,000/month

Rule: Premature microservices = biggest engineering mistake
```

---

## Interview Ke Liye Key Questions & Answers

```
Q: Monolith vs Microservices kab choose karo?
A: Start with monolith, evolve to microservices
   when team > 15 people OR scaling problems arise.

Q: Microservices mein distributed transactions kaise handle karo?
A: SAGA pattern — ya compensating transactions
   Order → Payment fail → Order cancel event publish karo

Q: Service discovery kaise karta hai?
A: Kubernetes DNS — har service ek DNS name milta hai
   order-service.production.svc.cluster.local

Q: Database per service — join kaise karo?
A: API composition — application layer mein join karo
   Ya denormalize karo — har service mein zaroori data rakh lo

Q: 10M users ke liye bottleneck kahan hoga?
A: Database (99% cases) — Cache use karo, read replicas,
   connection pooling, query optimization pehle karo

Q: Zero downtime deploy kaise?
A: Rolling update ya Blue-Green deployment with
   database backward compatibility maintain karo
```
