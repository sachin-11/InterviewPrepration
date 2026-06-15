# System Scaling: 1 User → 1 Million Users
## Monolith se Microservices tak — Complete Journey

---

## Overview: Scaling Stages

```
1 User → 1K → 10K → 100K → 500K → 1M+
   |        |      |        |        |
Monolith  Scale  Cache   Split    Full
Single   Vertically DB    Services Micro
Server             Layer          services
```

---

## PHASE 0: Day 1 — Single Server (1–100 Users)

### Architecture
```
User → Server (App + DB on same machine)
```

### Stack
- **1 VPS/EC2** (t2.micro): Node.js / Python / Java App
- **DB on same machine**: PostgreSQL / MySQL
- **No cache, no CDN, no load balancer**

### Code Example
```
/my-app
  /src
    app.js          ← Express/FastAPI app
    db.js           ← Direct DB connection
  package.json
```

### Database Config
```javascript
// Single DB connection — simple hai, chal raha hai
const db = new Pool({
  host: 'localhost',
  database: 'myapp',
  max: 10  // max 10 connections
});
```

### Cost: ~$5-10/month

### Warning Signs (Kab badalna hai)
- Response time > 500ms consistently
- CPU > 70% regularly
- DB connections exhausted
- App deploy karo toh site down

---

## PHASE 1: Vertical Scaling + Basic Separation (100–1K Users)

### What Changed
- App aur DB ko **alag machines** pe le jao
- Server size badao (vertical scaling)

### Architecture
```
Users → App Server (t3.medium)
              ↓
         DB Server (RDS t3.small)
```

### Changes
1. **DB ko alag server pe move karo** (RDS/managed DB)
2. **App server upgrade** karo (2 CPU → 4 CPU)
3. **Nginx** as reverse proxy add karo
4. **Basic monitoring** setup karo (CloudWatch/Datadog)

### Nginx Config
```nginx
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

### Database: Connection Pooling
```javascript
// PgBouncer ya built-in pooling
const pool = new Pool({
  host: process.env.DB_HOST,  // alag server
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Cost: ~$50-100/month

### Warning Signs
- Single server pe load badh raha hai
- Ek deploy = downtime
- DB aur App compete kar rahe hain resources ke liye

---

## PHASE 2: Caching + CDN (1K–10K Users)

### Core Problem
- Same data baar baar DB se fetch ho raha hai
- Static files server se serve ho rahe hain → slow

### Architecture
```
Users → CDN (CloudFront) → Static Assets (S3)
              ↓
         Load Balancer (ALB)
              ↓
         App Server × 2 (t3.medium)
              ↓
    Redis Cache ←→ PostgreSQL RDS
```

### Step 1: Add Redis Cache
```javascript
const redis = require('redis');
const client = redis.createClient({ host: 'redis-server' });

async function getUser(userId) {
  // Cache check pehle
  const cached = await client.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // DB se fetch
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  // Cache mein store karo (TTL: 1 hour)
  await client.setEx(`user:${userId}`, 3600, JSON.stringify(user.rows[0]));
  return user.rows[0];
}
```

### Cache Strategy
| Data Type | TTL | Strategy |
|-----------|-----|----------|
| User profile | 1 hour | Cache-aside |
| Product list | 5 min | Write-through |
| Session data | 24 hours | Cache-first |
| Real-time stock | No cache | Always DB |

### Step 2: CDN for Static Assets
```javascript
// S3 + CloudFront
// Images, JS, CSS → CDN se serve karo
// App server pe sirf API calls aayein

// Before: <img src="/images/logo.png">
// After:  <img src="https://cdn.myapp.com/images/logo.png">
```

### Step 3: Load Balancer (2 App Servers)
```
ALB → App-1 (health: OK)
    → App-2 (health: OK)

# Deploy strategy: Rolling deploy
# App-1 deploy → healthy? → App-2 deploy
# Zero downtime!
```

### Database: Read Replica Add Karo
```javascript
// Write → Primary DB
// Read  → Read Replica (SELECT queries)

const writeDB = new Pool({ host: process.env.PRIMARY_DB });
const readDB  = new Pool({ host: process.env.REPLICA_DB });

// User ne kuch likha → writeDB
await writeDB.query('INSERT INTO posts ...', [data]);

// User ne list dekhi → readDB
const posts = await readDB.query('SELECT * FROM posts LIMIT 20');
```

### Cost: ~$200-500/month

### Warning Signs
- 1 service fail → sab fail
- Different teams ek hi codebase pe kaam kar rahe hain → conflicts
- Deploy 30 min+ le raha hai
- DB specific tables pe overloaded hai

---

## PHASE 3: Horizontal Scaling + Queue System (10K–100K Users)

### Core Problem
- Traffic spikes handle nahi ho rahe
- Long-running tasks (email, image processing) app ko slow kar rahe hain
- DB single point of failure

### Architecture
```
Users
  ↓
CloudFront CDN
  ↓
ALB (Application Load Balancer)
  ↓          ↓          ↓
App-1      App-2      App-3     ← Auto Scaling Group
  ↓
Redis Cluster (3 nodes)
  ↓
Message Queue (SQS / RabbitMQ)
  ↓                    ↓
Worker-1            Worker-2    ← Background jobs
  ↓
PostgreSQL Primary + 2 Read Replicas
```

### Step 1: Auto Scaling
```yaml
# AWS Auto Scaling
AutoScalingGroup:
  MinSize: 2
  MaxSize: 10
  TargetCPUUtilization: 70%
  
# Jab CPU > 70% → nayi instance add karo
# Jab CPU < 30% → instance hatao
```

### Step 2: Message Queue (BIG CHANGE)
```javascript
// Before: Synchronous — user wait karta tha
async function registerUser(email) {
  await db.insert(email);
  await sendWelcomeEmail(email);  // 3 sec wait!
  return { success: true };
}

// After: Async with Queue — instant response
const sqs = new AWS.SQS();

async function registerUser(email) {
  await db.insert(email);
  
  // Queue mein daalo, worker handle karega
  await sqs.sendMessage({
    QueueUrl: process.env.EMAIL_QUEUE,
    MessageBody: JSON.stringify({ type: 'welcome_email', email })
  }).promise();
  
  return { success: true };  // Turant response!
}

// Worker (alag service)
async function processEmailQueue() {
  const messages = await sqs.receiveMessage({ QueueUrl: EMAIL_QUEUE });
  for (const msg of messages.Messages) {
    const { type, email } = JSON.parse(msg.Body);
    if (type === 'welcome_email') await sendWelcomeEmail(email);
    await sqs.deleteMessage({ ... });
  }
}
```

### Step 3: Database Sharding (agar zaroorat ho)
```
Shard by User ID:
  User ID 1-1M    → DB Shard 1
  User ID 1M-2M   → DB Shard 2
  User ID 2M+     → DB Shard 3

# Consistent Hashing use karo
function getShard(userId) {
  return userId % TOTAL_SHARDS;
}
```

### Step 4: Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per IP
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### Cost: ~$1,000-3,000/month

---

## PHASE 4: Monolith se Microservices (100K–500K Users)

### Kab Split Karna Hai? (The Decision)

```
Monolith raho agar:
✓ Team < 15 engineers
✓ Product still finding product-market fit
✓ Deployment complexity > benefits

Microservices jao agar:
✓ Different parts independently scale karne chahiye
✓ Teams alag alag deploy karna chahte hain
✓ Different services ko different tech chahiye
✓ Ek service ka failure baaki ko affect kar raha hai
```

### Strangler Fig Pattern — Gradual Migration

```
Step 1: Monolith ke saamne API Gateway lagao
Step 2: Ek service ko extract karo (User Service)
Step 3: Traffic route karo nayi service ki taraf
Step 4: Old code hatao
Step 5: Next service extract karo
... repeat
```

### Architecture After Split
```
                    API Gateway (Kong / AWS API GW)
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
  User Service    Product Service    Order Service
  (Node.js)       (Python/FastAPI)   (Java/Spring)
        ↓                ↓                ↓
   Users DB         Products DB       Orders DB
  (PostgreSQL)      (PostgreSQL)     (PostgreSQL)
        
        ↓ Events via Message Bus (Kafka)
  Notification Service    Analytics Service
```

### Service Communication
```javascript
// Synchronous: REST / gRPC (real-time response chahiye)
// User service → Product service (stock check)
const response = await axios.get(
  `http://product-service/api/products/${productId}/stock`
);

// Asynchronous: Events via Kafka (fire and forget)
// Order placed → multiple services ko notify karo
await kafka.produce('order.placed', {
  orderId: '123',
  userId: 'u456',
  productId: 'p789',
  amount: 1500
});

// Consumer: Notification Service
kafka.consume('order.placed', async (event) => {
  await sendOrderConfirmationEmail(event.userId);
});

// Consumer: Analytics Service  
kafka.consume('order.placed', async (event) => {
  await updateSalesMetrics(event);
});
```

### API Gateway Config
```yaml
routes:
  - path: /api/users/*
    service: user-service:3001
    
  - path: /api/products/*
    service: product-service:3002
    
  - path: /api/orders/*
    service: order-service:3003

middleware:
  - auth-check      # JWT verify karo
  - rate-limiting   # Per-user limits
  - logging         # All requests log karo
```

### Service Discovery
```yaml
# Docker Compose / Kubernetes
# Services apne aap ek doosre ko dhundh lete hain

# docker-compose.yml
services:
  user-service:
    image: myapp/user-service:v1.2
    environment:
      - DB_HOST=users-db
      - KAFKA_HOST=kafka:9092
      
  product-service:
    image: myapp/product-service:v2.1
    environment:
      - DB_HOST=products-db
```

### Cost: ~$3,000-8,000/month

---

## PHASE 5: Full Microservices at Scale (500K–1M+ Users)

### Architecture
```
Global Users
     ↓
Route 53 (DNS + GeoDNS)
     ↓
CloudFront (Global CDN)
     ↓
WAF (Web Application Firewall)
     ↓
API Gateway (Kong/AWS)
     ↓
Kubernetes Cluster (EKS)
  ├── User Service        (pods: 5-20, HPA)
  ├── Product Service     (pods: 3-15, HPA)
  ├── Order Service       (pods: 5-25, HPA)
  ├── Payment Service     (pods: 3-10, HPA)
  ├── Notification Svc    (pods: 2-8,  HPA)
  └── Search Service      (pods: 3-12, HPA)
     ↓
Kafka (Event Bus) — 3 brokers
     ↓
Databases:
  ├── Users DB       (RDS PostgreSQL Multi-AZ)
  ├── Products DB    (RDS PostgreSQL + ElastiCache)
  ├── Orders DB      (RDS PostgreSQL + Read Replicas)
  └── Search Index   (Elasticsearch)
     ↓
Observability:
  ├── Prometheus + Grafana (Metrics)
  ├── ELK Stack            (Logs)
  └── Jaeger               (Distributed Tracing)
```

### Kubernetes HPA (Auto Scaling)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    name: order-service
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        averageUtilization: 80
```

### Circuit Breaker (Failure Isolation)
```javascript
const CircuitBreaker = require('opossum');

// Agar payment service down hai, 
// toh order service crash nahi hogi
const paymentBreaker = new CircuitBreaker(callPaymentService, {
  timeout: 3000,          // 3 sec timeout
  errorThresholdPercentage: 50,  // 50% fail → circuit open
  resetTimeout: 30000     // 30 sec baad retry
});

paymentBreaker.fallback(() => ({ 
  status: 'queued',
  message: 'Payment will be processed shortly'
}));

async function placeOrder(orderData) {
  const payment = await paymentBreaker.fire(orderData.payment);
  // Circuit open hai toh fallback response milega
}
```

### Distributed Tracing
```javascript
// Har request ko unique trace ID do
// Taki 10 services mein bhi track kar sako

const { trace, context } = require('@opentelemetry/api');

app.post('/orders', async (req, res) => {
  const span = trace.getActiveSpan();
  span.setAttribute('user.id', req.user.id);
  span.setAttribute('order.amount', req.body.amount);
  
  // Ye trace ID automatically baaki services ko milega
  const order = await orderService.create(req.body);
  span.setAttribute('order.id', order.id);
  
  res.json(order);
});
```

### Cost: ~$8,000-25,000/month

---

## Quick Reference: Scaling Decision Tree

```
Current users kitne hain?

< 1K:
  → Single server, monolith, simple DB
  → Focus on product, not infra

1K – 10K:
  → App/DB alag servers
  → Redis cache add karo
  → CDN for static assets
  → Still monolith — theek hai!

10K – 100K:
  → Load balancer + 2-3 app servers
  → Auto scaling setup karo
  → Message queue (async tasks)
  → Read replicas add karo

100K – 500K:
  → Microservices migration start karo
  → API Gateway
  → Kafka/SQS for events
  → Kubernetes ya ECS
  → Per-service DB

500K – 1M+:
  → Full Kubernetes
  → Multi-region agar global hai
  → Circuit breakers
  → Distributed tracing
  → Dedicated SRE team
```

---

## Common Mistakes (Jo Galtiyan Log Karte Hain)

### 1. Premature Microservices
```
❌ Wrong: Day 1 pe hi microservices banana
✓ Right: Monolith se shuru karo, scale karo jab problem aaye

Amazon, Netflix — dono monolith se shuru hue the!
```

### 2. N+1 Query Problem
```javascript
// ❌ Wrong: Har user ke liye alag query
for (const user of users) {
  const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [user.id]);
  // 100 users = 101 queries!
}

// ✓ Right: Ek query mein sab
const orders = await db.query(
  'SELECT * FROM orders WHERE user_id = ANY($1)', 
  [users.map(u => u.id)]
);
```

### 3. No Cache Invalidation Strategy
```javascript
// ❌ Wrong: Cache karo but kabhi clear nahi karo
await redis.set('products', JSON.stringify(products));

// ✓ Right: Clear invalidation strategy
await redis.setEx('products', 300, JSON.stringify(products));  // 5 min TTL
// Ya manually: product update hone pe cache delete karo
await redis.del('products');
```

### 4. Synchronous Everything
```javascript
// ❌ Wrong: User ko wait karao
app.post('/register', async (req, res) => {
  await createUser(req.body);
  await sendEmail(req.body.email);   // 3 sec!
  await createAnalyticsProfile(...); // 2 sec!
  res.json({ success: true });       // User 5 sec wait kiya!
});

// ✓ Right: Async tasks queue mein daalo
app.post('/register', async (req, res) => {
  const user = await createUser(req.body);
  await queue.add('post-registration', { userId: user.id });
  res.json({ success: true });  // Instant!
});
```

---

## Database Scaling Cheat Sheet

| Stage | Solution |
|-------|----------|
| 1-10K users | Single DB |
| 10K-100K | + Read Replicas |
| 100K-500K | + Connection Pooling (PgBouncer) |
| 500K-1M | + Caching layer (Redis) |
| 1M+ | Sharding ya managed (PlanetScale/Neon) |

---

## Interview Mein Yeh Points Zaroor Bolna

1. **"Pehle bottleneck identify karo"** — blindly scale mat karo
2. **"Vertical scaling faster hai, horizontal scalable hai"**
3. **"Stateless apps easy to scale hoti hain"** — session Redis mein rakho
4. **"DB typically bottleneck hoti hai, app nahi"**
5. **"Cache invalidation > caching"** — stale data dangerous hai
6. **"Async > Sync"** — jahan possible ho queue use karo
7. **"Monitor karo"** — bina metrics ke andhera hai
8. **"Gradual migration"** — Strangler Fig pattern

---

*Last Updated: June 2026*
*Path: Month3_Interview_Prep/Scaling_1_to_1M_Users.md*
