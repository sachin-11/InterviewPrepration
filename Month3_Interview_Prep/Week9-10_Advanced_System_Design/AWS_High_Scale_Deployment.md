# AWS pe High-Scale Project Deploy Karna
### (Millions of Active Users ke liye)

---

## 1. Overview — Kya Banana Hai?

```
Goal: Ek production-ready system jo handle kare:
  - 10 million+ DAU (Daily Active Users)
  - 99.99% uptime
  - Auto-scale (traffic badhe toh server badhe, ghate toh ghate)
  - Zero downtime deployments
  - Global users ke liye fast response
  - Secure & cost-efficient
```

---

## 2. Complete AWS Architecture — High Level

```
                         INTERNET
                            │
                    ┌───────▼────────┐
                    │  Route 53      │  ← DNS + Health Check
                    │  (DNS)         │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  CloudFront    │  ← CDN (Static files cache)
                    │  (CDN)         │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  WAF           │  ← Web Application Firewall
                    │  (Security)    │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  ALB           │  ← Application Load Balancer
                    │  (Load Bal.)   │
                    └───────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
   │  ECS/EKS    │  │  ECS/EKS     │  │  ECS/EKS    │
   │  Container  │  │  Container   │  │  Container  │
   │  (AZ-1a)    │  │  (AZ-1b)     │  │  (AZ-1c)    │
   └──────┬──────┘  └───────┬──────┘  └──────┬──────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
   │  RDS Aurora │  │  ElastiCache │  │  SQS/SNS    │
   │  (Database) │  │  (Redis)     │  │  (Queue)    │
   └─────────────┘  └──────────────┘  └─────────────┘
          │
   ┌──────▼──────┐
   │     S3      │  ← Media, Static Files
   └─────────────┘
```

---

## 3. Har AWS Service — Kya Hai, Kyu Use Karo

---

### 3.1 Route 53 — DNS Service
```
Kya karta hai:
  - Domain name ko IP address mein convert karta hai
  - myapp.com → ALB ka IP

Kyu use karo:
  ✓ Health checks — agar ek region down ho toh traffic
    automatically dusre region pe bhejo (Failover routing)
  ✓ Latency-based routing — user ke paas wala region serve karo
  ✓ 100% SLA uptime guarantee AWS deta hai

Alternatives:
  GoDaddy DNS, Cloudflare DNS — but Route 53 AWS services
  ke saath best integrate hota hai
```

### 3.2 CloudFront — CDN (Content Delivery Network)
```
Kya karta hai:
  - Static files (images, CSS, JS, videos) ko
    user ke paas wale edge location pe cache karta hai
  - 400+ edge locations worldwide

Kyu use karo:
  ✓ India ka user → Mumbai edge se serve hoga (fast)
    US ka user → Virginia edge se serve hoga (fast)
    Without CDN: Sab requests origin server pe jaate → slow
  ✓ Origin server ka load 70-80% reduce ho jaata hai
  ✓ DDoS protection built-in
  ✓ HTTPS free mein milta hai (ACM certificate)

Example:
  Without CDN: User (Mumbai) → Server (US) = 200ms
  With CDN:    User (Mumbai) → Edge (Mumbai) = 10ms
```

### 3.3 WAF — Web Application Firewall
```
Kya karta hai:
  - Malicious requests block karta hai
  - SQL injection, XSS attacks rokta hai
  - Rate limiting (IP level pe)
  - Bot traffic filter karta hai

Kyu use karo:
  ✓ Production app mein security mandatory hai
  ✓ OWASP Top 10 attacks automatically block
  ✓ Custom rules bana sakte ho (e.g., India se hi allow karo)
  ✓ CloudFront ke saath integrate hota hai

Rules example:
  - Block: SQL injection patterns
  - Block: More than 1000 req/min from single IP
  - Allow: Only specific countries
  - Block: Known bad bots
```

### 3.4 ALB — Application Load Balancer
```
Kya karta hai:
  - Incoming traffic ko multiple servers pe distribute karta hai
  - Health check karta hai (unhealthy server pe traffic nahi bhejta)
  - Path-based routing (/api → backend, / → frontend)

Kyu use karo:
  ✓ ELB (Classic) se better — Layer 7 (HTTP) routing
  ✓ WebSocket support (chat apps ke liye)
  ✓ SSL termination — HTTPS yahan handle hota hai,
    backend HTTP use kar sakta hai
  ✓ Sticky sessions — same user same server pe jaata hai

Routing rules:
  /api/*     → Backend ECS service
  /ws/*      → WebSocket ECS service
  /*         → Frontend (S3 + CloudFront)
```

### 3.5 ECS (Elastic Container Service) — App Servers
```
Kya karta hai:
  - Docker containers run karta hai
  - Auto-scaling handle karta hai
  - Multiple Availability Zones mein deploy karta hai

Kyu use karo (vs raw EC2):
  ✓ EC2 pe manually Docker manage karna padta
  ✓ ECS automatically containers start/stop karta hai
  ✓ Rolling deployments — zero downtime
  ✓ CPU/Memory ke basis pe auto-scale

ECS vs EKS:
  ECS: AWS ka managed container service (simpler)
  EKS: Kubernetes on AWS (complex but more control)
  
  Recommendation:
    Small-Medium scale → ECS (easy)
    Large scale / Multi-cloud → EKS (Kubernetes)

Fargate (ECS ka mode):
  - Server manage nahi karna padta
  - AWS khud EC2 instances manage karta hai
  - Sirf container define karo, baaki AWS kare
  - Cost: Pay per container (not per server)

Auto Scaling config:
  Min tasks: 2 (always 2 containers running)
  Max tasks: 50 (max tak scale kar sakta hai)
  Scale up:  CPU > 70% → ek aur container add karo
  Scale down: CPU < 30% → container remove karo
```

### 3.6 RDS Aurora — Database
```
Kya karta hai:
  - Managed relational database (MySQL/PostgreSQL compatible)
  - Multi-AZ deployment (automatic failover)
  - Read replicas (read traffic distribute karo)

Kyu use karo (vs self-managed MySQL):
  ✓ Automatic backups (point-in-time recovery)
  ✓ Multi-AZ: Primary down → Standby automatically primary banta hai
    (30 seconds mein failover)
  ✓ Read replicas: Heavy read traffic → replicas pe bhejo
  ✓ Aurora: MySQL se 5x fast, PostgreSQL se 3x fast
  ✓ Serverless option: Traffic nahi hai toh pause ho jaata hai

Aurora Architecture:
  ┌─────────────┐     ┌─────────────┐
  │   Primary   │────▶│  Standby    │  (Multi-AZ)
  │   (Write)   │     │  (Failover) │
  └──────┬──────┘     └─────────────┘
         │
  ┌──────┴──────┐
  │             │
  ▼             ▼
Read         Read
Replica 1    Replica 2
(Read)       (Read)

Write → Primary only
Read  → Read Replicas (load distribute)
```

### 3.7 ElastiCache (Redis) — Cache Layer
```
Kya karta hai:
  - In-memory cache (database ke saamne)
  - Session storage
  - Rate limiting counters
  - Pub/Sub messaging

Kyu use karo:
  ✓ Database pe har request nahi jaata
  ✓ Redis: 100,000+ operations/sec (DB: 1,000-10,000)
  ✓ Session data store karo (user login state)
  ✓ Frequently accessed data cache karo

Cache strategy:
  Cache-aside (most common):
    1. Request aaya
    2. Redis mein check karo
    3. Cache hit → Redis se return karo (fast)
    4. Cache miss → DB se fetch karo → Redis mein store karo
    5. Next request → Redis se milega

  TTL (Time To Live):
    User profile: 1 hour TTL
    Product data: 30 min TTL
    Session: 24 hour TTL
```

### 3.8 S3 — Object Storage
```
Kya karta hai:
  - Files store karo (images, videos, documents)
  - Static website hosting
  - Backup storage
  - Log storage

Kyu use karo:
  ✓ 99.999999999% (11 nines) durability
  ✓ Unlimited storage
  ✓ Cheap ($0.023/GB/month)
  ✓ CloudFront ke saath CDN banao

Use cases:
  User uploads → S3 mein store karo
  Frontend build → S3 pe deploy karo
  DB backups → S3 mein store karo
  Application logs → S3 mein archive karo

S3 + CloudFront flow:
  User uploads image → S3
  User views image → CloudFront (cached at edge)
  → Fast delivery worldwide
```

### 3.9 SQS — Simple Queue Service
```
Kya karta hai:
  - Message queue (async processing)
  - Services ke beech decouple karo

Kyu use karo:
  ✓ Heavy tasks async karo (email send, image resize)
  ✓ Traffic spike absorb karo
  ✓ Service failure pe messages safe rahenge

Example flow:
  User registers
    → API: "Registration successful" (instant response)
    → SQS mein message: "Send welcome email to user@email.com"
    → Email Service: SQS se message uthao → Email bhejo
  
  User ne image upload ki
    → S3 mein store karo
    → SQS mein message: "Resize image xyz"
    → Image Processor: SQS se uthao → Resize karo → S3 mein save karo
```

### 3.10 SNS — Simple Notification Service
```
Kya karta hai:
  - Pub/Sub messaging
  - Push notifications (mobile)
  - Fan-out (ek message → multiple queues)

Kyu use karo:
  ✓ Ek event → Multiple services ko notify karo
  
Example:
  Order placed event → SNS topic
    → SQS queue 1 → Email service (confirmation email)
    → SQS queue 2 → Inventory service (stock update)
    → SQS queue 3 → Analytics service (track order)
```

### 3.11 CloudWatch — Monitoring & Alerts
```
Kya karta hai:
  - Metrics collect karo (CPU, memory, requests)
  - Logs store karo
  - Alerts set karo
  - Dashboards banao

Kyu use karo:
  ✓ Production mein kya ho raha hai — real-time visibility
  ✓ Alert: CPU > 80% → Email/Slack notification
  ✓ Auto Scaling trigger: CloudWatch metric → Scale up/down
  ✓ Application logs centralize karo

Key metrics monitor karo:
  - ECS: CPU utilization, Memory utilization, Task count
  - ALB: Request count, Error rate (5xx), Latency (p99)
  - RDS: CPU, Connections, Read/Write IOPS
  - ElastiCache: Cache hit rate, Memory usage
```

### 3.12 ECR — Elastic Container Registry
```
Kya karta hai:
  - Docker images store karo (private registry)
  - AWS ka DockerHub

Kyu use karo:
  ✓ ECS directly ECR se image pull karta hai (fast, secure)
  ✓ Image vulnerability scanning
  ✓ IAM se access control

Flow:
  Developer → docker build → docker push → ECR
  ECS deployment → ECR se image pull → Container start
```

### 3.13 VPC — Virtual Private Cloud
```
Kya karta hai:
  - AWS resources ke liye private network
  - Internet se isolate karo

Kyu use karo:
  ✓ Database internet pe directly accessible nahi hona chahiye
  ✓ Private subnet mein rakho (RDS, ElastiCache)
  ✓ Public subnet mein rakho (ALB, NAT Gateway)

VPC Structure:
  VPC (10.0.0.0/16)
  │
  ├── Public Subnet (10.0.1.0/24)  ← ALB, NAT Gateway
  │   AZ-1a
  │
  ├── Public Subnet (10.0.2.0/24)  ← ALB
  │   AZ-1b
  │
  ├── Private Subnet (10.0.3.0/24) ← ECS Containers
  │   AZ-1a
  │
  ├── Private Subnet (10.0.4.0/24) ← ECS Containers
  │   AZ-1b
  │
  ├── Private Subnet (10.0.5.0/24) ← RDS, ElastiCache
  │   AZ-1a
  │
  └── Private Subnet (10.0.6.0/24) ← RDS, ElastiCache
      AZ-1b

Internet → ALB (public) → ECS (private) → RDS (private)
RDS internet se directly accessible NAHI hai ✓
```

---

## 4. Complete Request Flow

```
User ne myapp.com/api/users request kiya

Step 1: DNS Resolution
  Browser → Route 53
  Route 53 → CloudFront ka IP return karo

Step 2: CDN Check
  Request → CloudFront
  Static file hai? → Cache se return karo (END)
  API request hai? → Origin (ALB) pe forward karo

Step 3: Security Check
  Request → WAF
  Malicious? → Block (403)
  Rate limit exceed? → Block (429)
  Clean? → ALB pe forward karo

Step 4: Load Balancing
  Request → ALB
  Path: /api/* → Backend ECS service
  Health check: Healthy containers mein se ek choose karo
  Round-robin → Container 2 pe bhejo

Step 5: Application Processing
  Request → ECS Container (Node.js/Java app)
  
  Cache check:
    Redis mein data hai? → Return karo (fast path)
    Redis mein nahi? → DB se fetch karo
  
  DB query:
    RDS Read Replica pe SELECT query
    Data → Redis mein cache karo (TTL: 1 hour)
    Response return karo

Step 6: Async Tasks (if any)
  Heavy task hai? → SQS mein message daalo
  Response turant return karo (don't wait)
  Background worker SQS se uthayega

Step 7: Response
  Container → ALB → CloudFront → User
  Total time: ~50-100ms
```

---

## 5. CI/CD Pipeline — Zero Downtime Deployment

```
Developer pushes code → GitHub

GitHub Actions / CodePipeline:

Step 1: Build
  - npm install / mvn build
  - Unit tests run karo
  - Docker image build karo

Step 2: Push
  - Docker image → ECR push karo
  - Tag: myapp:v1.2.3

Step 3: Deploy (Rolling Update)
  - ECS new task definition create karo (new image)
  - Rolling deployment start:
    
    Before: [Container v1] [Container v1] [Container v1]
    
    Step a: [Container v2] [Container v1] [Container v1]
            (v2 healthy check pass karo)
    
    Step b: [Container v2] [Container v2] [Container v1]
    
    Step c: [Container v2] [Container v2] [Container v2]
    
    Zero downtime! Users ko kuch pata nahi chala

Step 4: Verify
  - CloudWatch metrics check karo
  - Error rate spike? → Automatic rollback
  - All good? → Deployment complete
```

---

## 6. Auto Scaling — Traffic Spike Handle Karna

```
Normal traffic (daytime):
  ECS Tasks: 5 containers running
  RDS: 1 primary + 1 read replica
  ElastiCache: 2 nodes

Traffic spike (sale/event):
  
  CloudWatch detects: ALB requests/sec → 10x increase
                      ECS CPU → 80%
  
  Auto Scaling triggers:
    ECS: 5 → 20 containers (2 minutes mein)
    RDS: Read replica add karo (5 minutes)
  
  Traffic handled ✓

Traffic drops (night):
  CloudWatch detects: CPU → 10%
  
  Auto Scaling scales down:
    ECS: 20 → 5 containers (cost save)
    RDS: Extra replica remove karo

Cost optimization:
  Peak hours:  20 containers × $0.05/hr = $1/hr
  Off hours:   5 containers × $0.05/hr = $0.25/hr
  Savings: 75% cost reduction during low traffic
```

---

## 7. Multi-Region Setup (Global Users ke liye)

```
Single Region problem:
  Mumbai region down → Sab users affected

Multi-Region solution:

  ┌─────────────────────────────────────────┐
  │              Route 53                   │
  │         (Latency-based routing)         │
  └──────┬──────────────────────┬───────────┘
         │                      │
  ┌──────▼──────┐        ┌──────▼──────┐
  │  ap-south-1 │        │  us-east-1  │
  │  (Mumbai)   │        │  (Virginia) │
  │             │        │             │
  │  ALB        │        │  ALB        │
  │  ECS        │        │  ECS        │
  │  RDS        │        │  RDS        │
  └─────────────┘        └─────────────┘
         │                      │
         └──────────┬───────────┘
                    │
             ┌──────▼──────┐
             │  S3 Cross-  │
             │  Region     │
             │  Replication│
             └─────────────┘

India users → Mumbai region (low latency)
US users → Virginia region (low latency)
Mumbai down → Route 53 → Virginia pe failover
```

---

## 8. Security Best Practices

```
Network Security:
  ✓ VPC: Database private subnet mein (internet access nahi)
  ✓ Security Groups: Minimum required ports open karo
    ALB: 80, 443 only
    ECS: ALB se traffic only
    RDS: ECS se traffic only (port 5432/3306)
  ✓ WAF: SQL injection, XSS block karo
  ✓ Shield: DDoS protection

Data Security:
  ✓ RDS encryption at rest (AES-256)
  ✓ S3 encryption at rest
  ✓ HTTPS everywhere (ACM certificate free)
  ✓ Secrets Manager: DB passwords, API keys store karo
    (Code mein hardcode mat karo!)

Access Control:
  ✓ IAM roles: ECS containers ko minimum permissions
  ✓ No root account use karo
  ✓ MFA enable karo
  ✓ CloudTrail: Sab API calls log karo (audit trail)
```

---

## 9. Cost Estimation (10M DAU app)

```
Service          | Monthly Cost (approx)
─────────────────┼──────────────────────
ECS Fargate      | $500-800
RDS Aurora       | $300-500
ElastiCache      | $150-250
ALB              | $50-100
CloudFront       | $100-200
S3               | $50-100
Route 53         | $10-20
WAF              | $50-100
CloudWatch       | $50-100
Data Transfer    | $100-200
─────────────────┼──────────────────────
Total            | ~$1,500-2,500/month

Cost optimization tips:
  ✓ Reserved Instances: 1-3 year commit → 40-60% discount
  ✓ Spot Instances: Non-critical workloads → 70% discount
  ✓ S3 Intelligent Tiering: Old data → cheaper storage
  ✓ CloudFront: Origin requests reduce → RDS/ECS cost kam
```

---

## 10. Quick Reference — Service Selection Guide

```
Requirement                  → AWS Service
─────────────────────────────────────────────
DNS + Health check           → Route 53
CDN / Static files           → CloudFront
Security / DDoS              → WAF + Shield
Load balancing               → ALB
App containers               → ECS Fargate
Database (relational)        → RDS Aurora
Cache / Session              → ElastiCache (Redis)
File storage                 → S3
Async processing             → SQS
Event fan-out                → SNS
Container registry           → ECR
Monitoring / Alerts          → CloudWatch
Secrets management           → Secrets Manager
Private network              → VPC
CI/CD                        → CodePipeline / GitHub Actions
```

---

## 11. Interview Mein Kaise Explain Karo

```
"Hum AWS pe deploy karte hain with following setup:

Traffic flow:
  Route 53 (DNS) → CloudFront (CDN) → WAF (Security)
  → ALB (Load Balancer) → ECS Fargate (Containers)
  → RDS Aurora (DB) + ElastiCache (Cache)

High Availability:
  Multi-AZ deployment → ek AZ down → traffic dusre AZ pe
  RDS Multi-AZ → automatic failover in 30 seconds
  ECS min 2 tasks → ek crash → dusra serve karta hai

Scalability:
  ECS Auto Scaling → CPU > 70% → containers add karo
  RDS Read Replicas → read traffic distribute karo
  ElastiCache → DB pe load reduce karo

Zero Downtime:
  ECS Rolling deployment → ek ek container update hota hai
  Health checks → unhealthy container traffic nahi milta

Security:
  VPC private subnets → DB internet se accessible nahi
  WAF → attacks block karo
  Secrets Manager → passwords code mein nahi"
```

---

Ye architecture 10M+ DAU handle kar sakta hai with proper scaling.
