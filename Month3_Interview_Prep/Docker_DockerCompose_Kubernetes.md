# Docker, Docker Compose & Kubernetes — Complete Guide
> "Ek baar likhो, kahin bhi chalao" — aur scale bhi karo

---

## Part 1: DOCKER — Samajhte Hain Pehle

### Docker Kya Hai? (Simple Analogy)

```
Bina Docker:
  "Mere machine pe toh kaam karta tha!"
  Dev machine:   Python 3.9, Library v1.2
  Prod server:   Python 3.7, Library v2.0
  → App crash 😭

Docker ke saath:
  Sab kuch ek box (container) mein band karo
  → Har jagah same environment → same result ✅
```

**Container = App + uske saare dependencies ek saath pack**

---

### VM vs Container — Farq Kya Hai?

```
Virtual Machine (VM):            Container:
┌─────────────────────┐          ┌─────────────────────┐
│   Your App          │          │   Your App          │
│   Libraries         │          │   Libraries         │
│   OS (Ubuntu 20GB)  │          │   (No separate OS!) │
│   Hypervisor        │          │   Docker Engine     │
│   Host OS           │          │   Host OS           │
└─────────────────────┘          └─────────────────────┘

VM:        Heavy (GBs), slow start (minutes)
Container: Light (MBs), fast start (seconds)
```

---

### Docker Ki Core Concepts

```
IMAGE = Blueprint (recipe)
  - Read-only template
  - Base OS + dependencies + your code
  - DockerHub pe stored
  - Example: ubuntu:20.04, python:3.11, nginx:latest

CONTAINER = Running Instance (dish jo recipe se bani)
  - Image ka running copy
  - Isolated process
  - Apna filesystem, network, process space
  - Ek image se 100 containers bana sakte ho

DOCKERFILE = Instructions (recipe likhne ka tarika)
  - Step by step instructions image banane ke liye

REGISTRY = Store (image ka godown)
  - DockerHub: public registry
  - ECR (AWS), GCR (Google): private registry
```

---

### Dockerfile — Kaise Likhte Hain

```dockerfile
# Base image choose karo
FROM python:3.11-slim

# Working directory set karo container ke andar
WORKDIR /app

# Dependencies pehle copy karo (caching ke liye)
COPY requirements.txt .

# Dependencies install karo
RUN pip install --no-cache-dir -r requirements.txt

# Apna code copy karo
COPY . .

# Port expose karo
EXPOSE 8000

# App start karne ka command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Important Instructions:**

```dockerfile
FROM        → Base image
WORKDIR     → Container ke andar directory
COPY        → Files copy karo host se container mein
RUN         → Build time pe command chalao (image banate waqt)
CMD         → Container start hone pe run hoga (default command)
ENTRYPOINT  → CMD se zyada strict, override nahi hota easily
EXPOSE      → Document karo ki kaunsa port use hoga
ENV         → Environment variables set karo
ARG         → Build-time variables
```

---

### Docker Commands — Daily Use

```bash
# IMAGE COMMANDS
docker build -t myapp:v1 .          # Image banao current directory se
docker images                        # Saari images dekho
docker pull nginx:latest             # DockerHub se image download karo
docker push myapp:v1                 # Registry pe push karo
docker rmi myapp:v1                  # Image delete karo

# CONTAINER COMMANDS
docker run myapp:v1                  # Container start karo
docker run -d myapp:v1               # Background mein start (-d = detached)
docker run -p 8080:8000 myapp:v1     # Port map karo (host:container)
docker run -e DB_URL=postgres myapp  # Env variable pass karo
docker run -v /data:/app/data myapp  # Volume mount karo

docker ps                            # Running containers dekho
docker ps -a                         # Saare containers (stopped bhi)
docker stop <container_id>           # Container stop karo
docker rm <container_id>             # Container delete karo
docker logs <container_id>           # Logs dekho
docker exec -it <id> bash            # Container ke andar jaao

# USEFUL
docker system prune                  # Sab cleanup karo
docker stats                         # CPU/Memory usage live dekho
```

---

### Port Mapping Samjho

```
docker run -p 8080:8000 myapp

Host Machine          Container
Port 8080      →      Port 8000
(bahar se)            (andar)

Browser: localhost:8080 → Container ka port 8000
```

---

### Volumes — Data Persist Karna

```
Container delete karo → Data gaya 😱
Volume use karo → Data bana rahe ✅

Types:

1. Bind Mount — Host folder ko container se connect karo
   docker run -v /home/sachin/data:/app/data myapp
   (dev mein useful — code change → container mein reflect)

2. Named Volume — Docker manage karta hai
   docker run -v mydata:/app/data myapp
   (production mein better)
```

---

### Multi-Stage Build — Image Size Chhota Karo

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production (sirf compiled files)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Result: 1.2GB → 25MB image ✅
```

---

## Part 2: DOCKER COMPOSE — Multiple Containers Ek Saath

### Problem Compose Solve Karta Hai

```
Real app mein:
  - FastAPI app
  - PostgreSQL database
  - Redis cache
  - Nginx reverse proxy

Bina Compose:
  docker run -d postgres...          (yaad rakho flags)
  docker run -d redis...             (network manually banao)
  docker run -d --link postgres app  (complicated!)
  docker run -d nginx...

Compose ke saath:
  docker compose up    ← ek command, sab start 🎉
```

---

### docker-compose.yml — Basic Structure

```yaml
version: '3.8'

services:            # Saare containers yahan define karo

  # Service 1: FastAPI App
  app:
    build: .                    # Current directory ka Dockerfile use karo
    ports:
      - "8000:8000"             # host:container
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db                      # db start hone ke baad start ho
      - redis
    volumes:
      - .:/app                  # Live code reload dev mein

  # Service 2: PostgreSQL
  db:
    image: postgres:15          # DockerHub se direct
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Data persist karo
    ports:
      - "5432:5432"

  # Service 3: Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Service 4: Nginx
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:                        # Named volumes declare karo
  postgres_data:
```

---

### Docker Compose Commands

```bash
docker compose up              # Sab start karo (foreground)
docker compose up -d           # Background mein start karo
docker compose up --build      # Pehle image rebuild karo
docker compose down            # Sab stop aur remove karo
docker compose down -v         # Volumes bhi delete karo

docker compose ps              # Status dekho
docker compose logs            # Saari services ke logs
docker compose logs app        # Sirf app ke logs
docker compose logs -f app     # Live logs (follow mode)

docker compose exec app bash   # Kisi service ke andar jaao
docker compose restart app     # Ek service restart karo

docker compose scale app=3     # 3 instances chalao app ke
```

---

### Networking in Compose

```
Compose automatically ek network banata hai:
Sab services ek-doosre se SERVICE NAME se baat kar sakti hain

app container se:
  db se connect: postgresql://db:5432/...   ← 'db' service name hai
  redis se:      redis://redis:6379         ← 'redis' service name hai
  NOT localhost! Service name use karo.
```

---

### Dev vs Prod Compose Files

```bash
# Development
docker-compose.yml          # Base config
docker-compose.dev.yml      # Dev-specific overrides (volumes, debug)

# Production
docker-compose.prod.yml     # Prod-specific (no bind mounts, replicas)

# Use kaise karo:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## Part 3: KUBERNETES (K8s) — Scale Karo Production Mein

### Kubernetes Kya Hai?

```
Docker Compose:  Ek machine pe multiple containers manage karo
Kubernetes:      Hazaaron machines pe lakho containers manage karo

Kubernetes = Container Orchestration Platform

Solve karta hai:
  ✅ Auto-scaling (traffic badha → containers badho)
  ✅ Self-healing (container crash → auto restart)
  ✅ Load balancing (traffic equally distribute)
  ✅ Rolling updates (zero downtime deploy)
  ✅ Service discovery
  ✅ Secret/config management
```

---

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────┐
│                  K8s CLUSTER                    │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │           CONTROL PLANE (Master)         │  │
│  │                                          │  │
│  │  API Server  ← sab yahan se baat karte   │  │
│  │  Scheduler   ← decide karta hai kaun     │  │
│  │               sa pod kaun se node pe     │  │
│  │  etcd        ← cluster ka database       │  │
│  │  Controller  ← desired state maintain    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  NODE 1  │  │  NODE 2  │  │  NODE 3  │      │
│  │ (Worker) │  │ (Worker) │  │ (Worker) │      │
│  │          │  │          │  │          │      │
│  │ kubelet  │  │ kubelet  │  │ kubelet  │      │
│  │ [Pod]    │  │ [Pod]    │  │ [Pod]    │      │
│  │ [Pod]    │  │ [Pod]    │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

---

### Core Kubernetes Objects

#### 1. POD — Sabse Chhoti Unit

```
Pod = Ek ya zyada containers ka group jo saath chalte hain
    = Same network, same storage share karte hain

99% cases mein: 1 Pod = 1 Container

Pod directly use mat karo — Deployment use karo
(Pod crash hua toh koi restart nahi karega)
```

#### 2. DEPLOYMENT — Pods Ko Manage Karo

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 3              # 3 pods chalao
  selector:
    matchLabels:
      app: myapp
  template:                # Pod ka template
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:v1
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

**Deployment kya karta hai:**
```
replicas: 3 → 3 pods chalao
Pod crash hua → auto restart ✅
Image update karo → rolling update (zero downtime) ✅
Scale karo: kubectl scale deployment myapp --replicas=10 ✅
```

#### 3. SERVICE — Pods Ko Expose Karo

```
Problem: Pod ka IP change hota rehta hai (restart pe)
Solution: Service → stable IP + DNS name

Types:

ClusterIP (default):
  Sirf cluster ke andar accessible
  Other pods is se baat kar sakte hain

NodePort:
  Node ke port se bahar expose karo
  http://<node-ip>:30080

LoadBalancer:
  Cloud provider ka LB use karo (AWS ELB, GCP LB)
  Production mein yahi use karo
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp           # In pods ko target karo
  ports:
  - port: 80             # Service ka port
    targetPort: 8000     # Pod ka port
  type: LoadBalancer     # Type
```

#### 4. CONFIGMAP & SECRET

```yaml
# ConfigMap — non-sensitive config
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"

---
# Secret — sensitive data (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGIvbXlkYg==  # base64
```

#### 5. INGRESS — HTTP Routing

```yaml
# Ek IP se multiple services pe route karo
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

#### 6. HORIZONTAL POD AUTOSCALER (HPA)

```yaml
# Traffic badhe → pods automatic badho
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-deployment
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # CPU 70% → scale up
```

---

### kubectl — Main Commands

```bash
# CLUSTER INFO
kubectl cluster-info
kubectl get nodes

# PODS
kubectl get pods                          # Saare pods dekho
kubectl get pods -o wide                  # Node info bhi dekho
kubectl describe pod <pod-name>           # Detail info
kubectl logs <pod-name>                   # Logs
kubectl logs -f <pod-name>               # Live logs
kubectl exec -it <pod-name> -- bash       # Pod ke andar jaao
kubectl delete pod <pod-name>            # Pod delete (deployment restart karega)

# DEPLOYMENTS
kubectl get deployments
kubectl apply -f deployment.yaml          # Create/Update
kubectl delete -f deployment.yaml         # Delete
kubectl rollout status deployment/myapp   # Rollout status
kubectl rollout undo deployment/myapp     # Previous version pe jaao
kubectl scale deployment myapp --replicas=5

# SERVICES
kubectl get services
kubectl get svc

# ALL RESOURCES
kubectl get all                           # Sab kuch dekho
kubectl get all -n production            # Specific namespace

# NAMESPACES (environment isolation)
kubectl get namespaces
kubectl create namespace staging
kubectl apply -f app.yaml -n staging      # Staging mein deploy
```

---

### Namespace — Environment Isolation

```
Ek cluster mein multiple environments:

default       → dev/testing
staging       → staging
production    → production

Benefits:
  - Resource isolation
  - Access control
  - Resource quotas per team
```

---

## Comparison: Kab Kya Use Karo?

```
┌─────────────────┬──────────────────┬─────────────────────┐
│                 │ Docker Compose   │ Kubernetes          │
├─────────────────┼──────────────────┼─────────────────────┤
│ Use case        │ Local dev,       │ Production,         │
│                 │ small projects   │ large scale         │
├─────────────────┼──────────────────┼─────────────────────┤
│ Machines        │ 1 machine        │ 100s of machines    │
├─────────────────┼──────────────────┼─────────────────────┤
│ Auto-scaling    │ Manual only      │ Automatic (HPA)     │
├─────────────────┼──────────────────┼─────────────────────┤
│ Self-healing    │ Basic restart    │ Full auto-recovery  │
├─────────────────┼──────────────────┼─────────────────────┤
│ Complexity      │ Simple           │ Complex             │
├─────────────────┼──────────────────┼─────────────────────┤
│ Setup time      │ Minutes          │ Hours/Days          │
├─────────────────┼──────────────────┼─────────────────────┤
│ Cost            │ Low              │ Higher              │
└─────────────────┴──────────────────┴─────────────────────┘
```

---

## Real World Flow — Dev se Production

```
Step 1: Locally develop karo
  → Docker container mein run karo

Step 2: Docker Compose se test karo
  → Saari services ek saath run karo

Step 3: Image build karo aur push karo
  docker build -t myapp:v1.2 .
  docker push registry/myapp:v1.2

Step 4: Kubernetes mein deploy karo
  kubectl apply -f k8s/deployment.yaml
  kubectl apply -f k8s/service.yaml

Step 5: Monitor karo
  kubectl get pods
  kubectl logs -f deployment/myapp
```

---

## Interview Ke Liye Key Points

```
Docker:
  ✅ Container vs VM farq
  ✅ Image vs Container farq
  ✅ Dockerfile layers aur caching
  ✅ Multi-stage builds
  ✅ Volume types

Docker Compose:
  ✅ depends_on — startup order
  ✅ Service names as hostnames
  ✅ Named volumes for persistence

Kubernetes:
  ✅ Pod vs Deployment vs Service
  ✅ ClusterIP vs NodePort vs LoadBalancer
  ✅ HPA — auto scaling
  ✅ Rolling update — zero downtime
  ✅ ConfigMap vs Secret
  ✅ Namespace — environment isolation
  ✅ Liveness vs Readiness probe
```

---

## Liveness vs Readiness Probe (Bonus)

```yaml
containers:
- name: myapp
  image: myapp:v1
  livenessProbe:          # App alive hai? Nahi toh restart karo
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 30
    periodSeconds: 10

  readinessProbe:         # App ready hai traffic lene ke liye?
    httpGet:
      path: /ready
      port: 8000
    initialDelaySeconds: 5
    periodSeconds: 5

# Readiness fail → Service traffic nahi bhejti (but restart nahi)
# Liveness fail  → Pod restart hota hai
```
