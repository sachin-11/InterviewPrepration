# AWS Deployment with Docker & Kubernetes - Complete Guide

## Introduction (Introduction)

Project ko scale karne ke liye AWS pe deploy karna hai, to iske liye Docker aur Kubernetes use karte hain. Ye complete flow samjhte hain step by step.

---

## Overview (Overview)

**Deployment Flow:**
```
Local Development → Docker Image → Push to Registry → Kubernetes Cluster → AWS Deployment → Auto Scaling
```

**Key Components:**
- **Docker**: Application ko containerize karne ke liye
- **Kubernetes**: Containers orchestrate karne ke liye
- **AWS**: Cloud platform for hosting
- **ECR**: Docker image registry
- **EKS**: Kubernetes service on AWS

---

## Prerequisites (Shuru karne se pehle)

### Required Tools
1. **AWS Account** (Free tier available)
2. **Docker** installed locally
3. **kubectl** - Kubernetes command line tool
4. **awscli** - AWS command line tool
5. **eksctl** - EKS cluster management tool

### Installation Commands
```bash
# Docker (Windows/Mac)
# Download from docker.com

# AWS CLI
pip install awscli

# kubectl
# Windows: chocolatey install kubernetes-cli
# Mac: brew install kubectl

# eksctl
# Windows: chocolatey install eksctl
# Mac: brew tap weaveworks/tap && brew install weaveworks/tap/eksctl
```

### AWS Configuration
```bash
# Configure AWS credentials
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

---

## Step 1: Docker Setup (Docker Setup)

### Dockerfile Create Karo
```dockerfile
# Dockerfile example for Python Flask app
FROM python:3.9-slim

WORKDIR /app

# Dependencies install karo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application copy karo
COPY . .

# Expose port
EXPOSE 5000

# Run command
CMD ["python", "app.py"]
```

### requirements.txt
```
flask==2.3.0
gunicorn==21.2.0
```

### Docker Build
```bash
# Docker image build karo
docker build -t my-app:latest .

# Local test karo
docker run -p 5000:5000 my-app:latest

# Image verify karo
docker images
```

### Docker Compose (Multiple Services)
```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

```bash
# Docker compose run karo
docker-compose up -d

# Stop karo
docker-compose down
```

---

## Step 2: AWS ECR Setup (Docker Registry)

### ECR Repository Create Karo
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Repository create karo
aws ecr create-repository \
    --repository-name my-app-repo \
    --region us-east-1

# Repository list check karo
aws ecr describe-repositories --region us-east-1
```

### Docker Image Push to ECR
```bash
# Tag the image for ECR
docker tag my-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest
```

### ECR URI Format
```
<account-id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:<tag>
```

---

## Step 3: Kubernetes Setup (Kubernetes Basics)

### Kubernetes Architecture
```
Master Node (Control Plane)
├── API Server
├── etcd (Key-value store)
├── Scheduler
└── Controller Manager

Worker Nodes
├── Kubelet
├── Kube-proxy
└── Container Runtime (Docker)
```

### Key Kubernetes Concepts

#### 1. Pod
- Smallest deployable unit
- One or more containers
- Shared storage/network
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
spec:
  containers:
  - name: my-app
    image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest
    ports:
    - containerPort: 5000
```

#### 2. Deployment
- Manages pod replicas
- Rolling updates
- Rollbacks
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest
        ports:
        - containerPort: 5000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### 3. Service
- Network exposure for pods
- Load balancing
- Service discovery
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

#### 4. ConfigMap
- Configuration data
- Environment variables
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
```

#### 5. Secret
- Sensitive data
- Passwords, API keys
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-app-secret
type: Opaque
data:
  password: cGFzc3dvcmQxMjM=  # base64 encoded
```

#### 6. Horizontal Pod Autoscaler (HPA)
- Automatic scaling
- Based on CPU/memory
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Step 4: AWS EKS Setup (Kubernetes on AWS)

### EKS Cluster Create Karo
```bash
# Cluster create karo using eksctl
eksctl create cluster \
    --name my-eks-cluster \
    --region us-east-1 \
    --nodes 2 \
    --node-type t3.medium \
    --nodes-min 2 \
    --nodes-max 4 \
    --managed

# Cluster status check karo
eksctl get cluster --name my-eks-cluster --region us-east-1

# kubectl configure karo
aws eks update-kubeconfig --name my-eks-cluster --region us-east-1

# Nodes check karo
kubectl get nodes
```

### EKS Cluster Configuration File
```yaml
# cluster.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-eks-cluster
  region: us-east-1
nodeGroups:
  - name: ng-1
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 2
    maxSize: 4
    volumeSize: 20
    ssh:
      allow: true
```

```bash
# Create cluster from config file
eksctl create cluster -f cluster.yaml
```

---

## Step 5: Deploy to Kubernetes (Application Deploy)

### Namespace Create Karo
```bash
# Namespace create karo
kubectl create namespace production

# Namespace use karo
kubectl config set-context --current --namespace=production
```

### Secret for ECR Access
```bash
# ECR login secret create karo
kubectl create secret docker-registry ecr-secret \
    --docker-server=<account-id>.dkr.ecr.us-east-1.amazonaws.com \
    --docker-username=AWS \
    --docker-password=$(aws ecr get-login-password --region us-east-1) \
    --namespace=production
```

### Complete Deployment File
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/my-app-repo:latest
        ports:
        - containerPort: 5000
        env:
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: my-app-config
              key: APP_ENV
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: ecr-secret
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
  namespace: production
spec:
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Apply Deployment
```bash
# Deployment apply karo
kubectl apply -f deployment.yaml

# Status check karo
kubectl get deployments -n production
kubectl get pods -n production
kubectl get services -n production

# Logs check karo
kubectl logs -f deployment/my-app-deployment -n production

# Pod describe karo (troubleshooting ke liye)
kubectl describe pod <pod-name> -n production
```

---

## Step 6: Ingress Setup (Traffic Management)

### AWS Load Balancer Controller Install
```bash
# IAM policy create karo
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam-policy.json

# IAM role create karo for service account
eksctl create iamserviceaccount \
    --cluster=my-eks-cluster \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --attach-policy-arn=arn:aws:iam::<account-id>:policy/AWSLoadBalancerControllerIAMPolicy \
    --approve \
    --override-existing-serviceaccounts

# Install controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=my-eks-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller
```

### Ingress Resource Create Karo
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 80
```

```bash
# Ingress apply karo
kubectl apply -f ingress.yaml

# Ingress check karo
kubectl get ingress -n production
```

---

## Step 7: Monitoring & Logging (Monitoring)

### CloudWatch Integration
```bash
# CloudWatch agent install karo
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-agent-k8s/main/deployment-manifests/cwagent-fluentd-daemonset.yaml
```

### Prometheus & Grafana Setup
```bash
# Helm repo add karo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Prometheus install karo
helm install prometheus prometheus-community/kube-prometheus-stack \
    -n monitoring \
    --create-namespace

# Grafana access karo
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

---

## Step 8: CI/CD Pipeline (Automated Deployment)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to EKS

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: my-app-repo
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --name my-eks-cluster --region us-east-1
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/my-app-deployment \
          my-app=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
          -n production
```

---

## Step 9: Scaling Strategies (Scaling)

### Vertical Scaling (Resource Limits)
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Horizontal Scaling (HPA)
```bash
# HPA create karo
kubectl autoscale deployment my-app-deployment \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n production

# HPA status check karo
kubectl get hpa -n production
```

### Cluster Autoscaler
```yaml
# In cluster.yaml add:
autoscalingGroups:
  - name: eks-ng-1-asg
    desiredSize: 2
    minSize: 2
    maxSize: 5
```

---

## Step 10: Cost Optimization (Cost Management)

### Cost Saving Tips
1. **Use Spot Instances** for non-critical workloads
2. **Auto-scaling** to scale down when not needed
3. **Right-sizing** instances based on actual usage
4. **Reserved Instances** for long-running workloads
5. **Monitor costs** using AWS Cost Explorer

### Spot Instance Configuration
```yaml
# In cluster.yaml
nodeGroups:
  - name: spot-ng
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 5
    spot: true
```

---

## Troubleshooting (Problem Solving)

### Common Issues

#### 1. Pod Not Starting
```bash
# Pod status check karo
kubectl get pods -n production

# Pod describe karo
kubectl describe pod <pod-name> -n production

# Logs check karo
kubectl logs <pod-name> -n production
```

#### 2. Image Pull Error
```bash
# Secret verify karo
kubectl get secret ecr-secret -n production -o yaml

# ECR login verify karo
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### 3. Service Not Accessible
```bash
# Service check karo
kubectl get svc -n production

# Endpoints check karo
kubectl get endpoints my-app-service -n production

# Port forward test karo
kubectl port-forward svc/my-app-service 8080:80 -n production
```

#### 4. HPA Not Working
```bash
# Metrics server install karo
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Metrics check karo
kubectl top nodes
kubectl top pods -n production
```

---

## Best Practices (Best Practices)

### Docker
- Use multi-stage builds for smaller images
- Don't run as root user
- Use .dockerignore to exclude unnecessary files
- Tag images properly (version, environment)
- Scan images for vulnerabilities

### Kubernetes
- Use resource limits and requests
- Implement liveness and readiness probes
- Use ConfigMaps and Secrets for configuration
- Implement proper RBAC
- Use namespaces for environment isolation

### AWS
- Use IAM roles instead of access keys
- Enable encryption at rest
- Use VPC for network isolation
- Implement proper security groups
- Enable CloudTrail for auditing

---

## Complete Deployment Script (One-Command Deploy)

```bash
#!/bin/bash
# complete-deploy.sh

set -e

# Variables
AWS_REGION="us-east-1"
CLUSTER_NAME="my-eks-cluster"
ECR_REPO="my-app-repo"
NAMESPACE="production"

echo "Step 1: Build Docker Image"
docker build -t $ECR_REPO:latest .

echo "Step 2: Login to ECR"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

echo "Step 3: Tag and Push Image"
docker tag $ECR_REPO:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

echo "Step 4: Update kubeconfig"
aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION

echo "Step 5: Create namespace if not exists"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "Step 6: Apply deployment"
kubectl apply -f deployment.yaml

echo "Step 7: Wait for deployment"
kubectl rollout status deployment/my-app-deployment -n $NAMESPACE

echo "Step 8: Get service URL"
kubectl get svc my-app-service -n $NAMESPACE

echo "Deployment Complete!"
```

```bash
# Run the script
chmod +x complete-deploy.sh
./complete-deploy.sh
```

---

## Summary (Summary)

**Complete Flow:**
1. **Local Development** → Code likho aur test karo
2. **Dockerize** → Dockerfile banao aur image build karo
3. **Push to ECR** → AWS ECR mein image push karo
4. **EKS Cluster** → Kubernetes cluster create karo
5. **Deploy** → Kubernetes deployment apply karo
6. **Expose** → Service aur Ingress se expose karo
7. **Scale** → HPA se auto-scale karo
8. **Monitor** → CloudWatch/Prometheus se monitor karo
9. **CI/CD** → Automated pipeline setup karo

**Key Commands:**
```bash
docker build -t app:latest .
docker push <ecr-uri>
kubectl apply -f deployment.yaml
kubectl get pods -n production
kubectl logs -f <pod-name>
kubectl scale deployment my-app-deployment --replicas=5 -n production
```

**Important Points:**
- Docker containers ko consistent environment deta hai
- Kubernetes containers ko orchestrate karta hai
- AWS EKS managed Kubernetes service hai
- Auto-scaling se cost optimize ho sakta hai
- Monitoring se issues pata chalte hain
- CI/CD se deployment automatic ho jata hai

---

## Interview Questions with Answers

### 1. Docker vs Virtual Machines difference?

**Virtual Machines (VMs):**
- Har VM apna complete OS (Operating System) chalata hai
- Heavy weight - GBs of memory aur disk space leta hai
- Hardware virtualization use karta hai (Hypervisor)
- Slow startup time (minutes)
- Less efficient resource utilization

**Docker Containers:**
- Host OS kernel share karte hain
- Lightweight - MBs of memory leta hai
- OS-level virtualization use karta hai
- Fast startup time (seconds)
- High resource efficiency

**Example:**
```
VM: Hardware → Hypervisor → Guest OS → App → Libraries
Docker: Hardware → Host OS → Docker Engine → App → Libraries
```

---

### 2. Kubernetes architecture explain karo?

**Control Plane (Master Node):**
- **API Server**: Kubernetes ki front-end, sab requests yahan aate hain
- **etcd**: Key-value store, cluster state store karta hai
- **Scheduler**: Pods ko nodes pe assign karta hai
- **Controller Manager**: Cluster state maintain karta hai (replication, node controller)
- **Cloud Controller Manager**: Cloud-specific integration

**Worker Nodes:**
- **Kubelet**: Master se instructions leta hai, containers manage karta hai
- **Kube-proxy**: Network rules maintain karta hai, service discovery
- **Container Runtime**: Docker/containerd jo containers run karta hai

**Flow:**
```
User → kubectl → API Server → Scheduler → Kubelet → Container Runtime → Pod
```

---

### 3. Pod vs Deployment difference?

**Pod:**
- Smallest deployable unit in Kubernetes
- Ek ya multiple containers contain karta hai
- Ephemeral - delete ho sakta hai, restart ho sakta hai
- Manual scaling - replicas manually manage karna padta hai
- No self-healing - agar pod fail ho jaye, manually recreate karna padta hai

**Deployment:**
- Higher-level abstraction
- Pods ka declarative management
- Automatic scaling - replicas automatically manage
- Self-healing - failed pods automatically recreate
- Rolling updates - zero-downtime deployments
- Rollback support - previous versions pe wapas ja sakte ho

**Example:**
```yaml
# Pod - single instance
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: my-app
    image: nginx

# Deployment - managed pods with replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: nginx
```

---

### 4. Service types in Kubernetes?

**1. ClusterIP (Default):**
- Service ko cluster ke andar expose karta hai
- External access nahi milta
- Internal communication ke liye

```yaml
spec:
  type: ClusterIP  # or omit (default)
```

**2. NodePort:**
- Har node pe specific port open karta hai
- External access milta hai via <NodeIP>:<NodePort>
- Port range: 30000-32767

```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30007
```

**3. LoadBalancer:**
- Cloud provider ka load balancer create karta hai
- External IP milta hai
- Production deployments ke liye

```yaml
spec:
  type: LoadBalancer
```

**4. ExternalName:**
- DNS name ko map karta hai
- Service ke liye alias provide karta hai

```yaml
spec:
  type: ExternalName
  externalName: example.com
```

**5. Headless Service (ClusterIP: None):**
- No cluster IP assigned
- Direct pod IPs return karta hai
- Stateful applications ke li ye

---

### 5. HPA kaise kaam karta hai?

**Horizontal Pod Autoscaler (HPA) Working:**

**Components:**
- **Metrics Server**: Resource usage collect karta hai (CPU, memory)
- **HPA Controller**: Metrics analyze karke scaling decisions leta hai
- **Deployment/ReplicaSet**: Scale in/out karta hai

**Process:**
1. Metrics Server se current CPU/memory usage read karta hai
2. Target utilization se compare karta hai (e.g., 70%)
3. Agar current > target, then scale up (replicas increase)
4. Agar current < target, then scale down (replicas decrease)
5. Min/Max replicas ke within rehta hai

**Example:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Scaling Behavior:**
- Scale up: Fast (within seconds)
- Scale down: Slow (stabilization window to prevent flapping)
- Custom metrics bhi use kar sakte ho (requests per second, custom metrics)

---

### 6. EKS vs self-managed Kubernetes?

**Amazon EKS (Elastic Kubernetes Service):**
- **Managed Service**: AWS control plane manage karta hai
- **Pros:**
  - No control plane management
  - Automatic updates and patches
  - High availability (multi-AZ)
  - AWS integration (IAM, VPC, CloudWatch)
  - Less operational overhead
- **Cons:**
  - Additional cost ($0.20/hour per cluster)
  - Less control over control plane
  - Vendor lock-in

**Self-Managed Kubernetes:**
- **DIY Setup**: Apne control plane manage karo
- **Pros:**
  - Full control over cluster
  - No additional managed service cost
  - Custom configurations possible
  - Can run anywhere (on-prem, other clouds)
- **Cons:**
  - High operational overhead
  - Manual updates and maintenance
  - Need expertise
  - High availability setup complex

**Use Cases:**
- **EKS**: Production, less ops team, AWS ecosystem
- **Self-managed**: Cost sensitive, full control needed, multi-cloud

---

### 7. Docker image optimization techniques?

**1. Multi-stage Builds:**
```dockerfile
# Build stage
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage (smaller)
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --production
CMD ["node", "dist/index.js"]
```

**2. Use Alpine Images:**
```dockerfile
# Instead of
FROM python:3.9

# Use
FROM python:3.9-alpine  # Much smaller
```

**3. .dockerignore File:**
```
node_modules
.git
.env
*.log
__pycache__
```

**4. Layer Caching:**
```dockerfile
# Order matters - put changes less frequently first
COPY requirements.txt .
RUN pip install -r requirements.txt  # This layer cached if requirements.txt unchanged
COPY . .
```

**5. Combine RUN Commands:**
```dockerfile
# Instead of multiple RUN
RUN apt-get update
RUN apt-get install -y python

# Combine
RUN apt-get update && apt-get install -y python && rm -rf /var/lib/apt/lists/*
```

**6. Minimize Image Size:**
- Remove unnecessary files
- Use .dockerignore
- Clean up package manager caches
- Use specific tags instead of latest

**7. Scan for Vulnerabilities:**
```bash
docker scan my-image:latest
```

---

### 8. Kubernetes networking model?

**Key Concepts:**

**1. Pod-to-Pod Communication:**
- Har pod apna unique IP address milta hai
- Direct communication without NAT
- Flat network model - sab pods ek network mein hain

**2. Service Networking:**
- **ClusterIP**: Virtual IP for service
- **kube-proxy**: Implements service IP
- **iptables/IPVS**: Traffic routing

**3. Network Policies:**
- Pod-to-pod traffic control
- Whitelist/blacklist rules
- Namespace isolation

**4. DNS:**
- CoreDNS provides cluster DNS
- Service discovery via DNS
- Format: `<service-name>.<namespace>.svc.cluster.local`

**5. Ingress:**
- External access management
- HTTP/HTTPS routing
- SSL termination

**Network Flow:**
```
External → LoadBalancer/Ingress → Service (ClusterIP) → Pod IP → Container
```

**CNI Plugins (Container Network Interface):**
- Calico
- Flannel
- Weave Net
- Cilium

**Example Network Policy:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
```

---

### 9. Rolling update kaise hota hai?

**Rolling Update Process:**

**1. Deployment Update:**
```bash
kubectl set image deployment/my-app my-app=new-image:v2
```

**2. Steps:**
1. New ReplicaSet create hota hai with new version
2. Old ReplicaSet se gradually pods shift hote hain
3. New pods start hote hain (readiness probe wait)
4. Old pods terminate hote hain (graceful shutdown)
5. Process repeat hota hai until sab pods updated

**3. Configuration:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Extra pods allowed during update
      maxUnavailable: 1   # Pods that can be unavailable
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:v1
```

**4. Rollback:**
```bash
# Undo last update
kubectl rollout undo deployment/my-app

# Rollback to specific revision
kubectl rollout undo deployment/my-app --to-revision=2

# Check rollout status
kubectl rollout status deployment/my-app

# View rollout history
kubectl rollout history deployment/my-app
```

**5. Benefits:**
- Zero downtime
- Gradual deployment
- Easy rollback
- Health checks ensure stability

---

### 10. ConfigMap vs Secret difference?

**ConfigMap:**
- **Purpose**: Non-sensitive configuration data
- **Storage**: Base64 encoded (but not encrypted)
- **Use Cases**: 
  - Environment variables
  - Command line arguments
  - Configuration files
  - Application settings
- **Example:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  database_url: "postgres://localhost:5432/mydb"
```

**Secret:**
- **Purpose**: Sensitive data (passwords, keys, tokens)
- **Storage**: Base64 encoded (can be encrypted at rest)
- **Use Cases**:
  - Database passwords
  - API keys
  - TLS certificates
  - OAuth tokens
- **Example:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  password: cGFzc3dvcmQxMjM=  # base64 encoded "password123"
  username: YWRtaW4=        # base64 encoded "admin"
```

**Key Differences:**
| Feature | ConfigMap | Secret |
|---------|-----------|--------|
| Data Type | Non-sensitive | Sensitive |
| Encoding | Base64 | Base64 (optional encryption) |
| Access Control | Less restrictive | More restrictive |
| Size Limit | 1MB | 1MB |
| Etcd Storage | Plain | Encrypted (if configured) |

**Usage in Pod:**
```yaml
spec:
  containers:
  - name: app
    envFrom:
    - configMapRef:
        name: app-config
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
```

---

### 11. AWS ECR benefits?

**Amazon Elastic Container Registry (ECR) Benefits:**

**1. Fully Managed:**
- No infrastructure management
- AWS handles scaling, patching, security
- High availability by default

**2. Security:**
- IAM-based access control
- Image scanning for vulnerabilities
- Encryption at rest and in transit
- Private registry by default

**3. Integration:**
- Seamless EKS integration
- ECS integration
- AWS IAM authentication
- CloudTrail logging

**4. Lifecycle Policies:**
- Automatic image cleanup
- Tag-based rules
- Size-based policies
- Cost optimization

**Example Lifecycle Policy:**
```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

**5. Performance:**
- Fast image pull/push
- Regional replication
- Cross-region replication
- CDN support

**6. Cost:**
- Pay for storage only
- No data transfer fees within same region
- Free tier: 500 MB/month storage

**7. Compliance:**
- PCI DSS compliant
- HIPAA eligible
- SOC certified

---

### 12. Kubernetes troubleshooting steps?

**Troubleshooting Methodology:**

**Step 1: Check Pod Status**
```bash
# Pod status check
kubectl get pods -n <namespace>

# Detailed pod info
kubectl describe pod <pod-name> -n <namespace>

# Pod logs
kubectl logs <pod-name> -n <namespace>

# Previous container logs (if crashed)
kubectl logs <pod-name> --previous -n <namespace>
```

**Step 2: Common Pod States**
- **Pending**: Scheduling issue, resource constraints
- **Running**: Normal state
- **Failed**: Container exited with error
- **CrashLoopBackOff**: Container repeatedly crashing
- **ImagePullBackOff**: Image pull failed
- **OOMKilled**: Out of memory

**Step 3: Check Events**
```bash
# Cluster events
kubectl get events --sort-by='.lastTimestamp'

# Namespace events
kubectl get events -n <namespace>
```

**Step 4: Check Resources**
```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n <namespace>

# Resource quotas
kubectl describe resourcequota -n <namespace>
```

**Step 5: Check Services**
```bash
# Service status
kubectl get svc -n <namespace>

# Service endpoints
kubectl get endpoints <service-name> -n <namespace>

# Service details
kubectl describe svc <service-name> -n <namespace>
```

**Step 6: Network Issues**
```bash
# DNS resolution
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- nslookup <service-name>

# Pod connectivity
kubectl exec -it <pod-name> -- curl <service-name>

# Network policies
kubectl get networkpolicies -n <namespace>
```

**Step 7: Common Issues & Solutions**

**ImagePullBackOff:**
```bash
# Check image name and tag
kubectl describe pod <pod-name>

# Check image pull secret
kubectl get secret ecr-secret -n <namespace>

# Re-create secret if needed
kubectl delete secret ecr-secret -n <namespace>
kubectl create secret docker-registry ecr-secret ...
```

**CrashLoopBackOff:**
```bash
# Check logs for error
kubectl logs <pod-name>

# Check resource limits
kubectl describe pod <pod-name> | grep -A 5 Limits

# Increase limits if needed
```

**Pending:**
```bash
# Check scheduler events
kubectl describe pod <pod-name>

# Check node resources
kubectl describe nodes

# Check taints/tolerations
kubectl describe nodes | grep -A 5 Taint
```

---

### 13. CI/CD pipeline benefits?

**CI (Continuous Integration) Benefits:**

**1. Early Bug Detection:**
- Code changes automatically tested
- Issues caught before merge
- Reduced debugging time

**2. Faster Development:**
- Automated builds and tests
- No manual intervention
- Quick feedback loop

**3. Code Quality:**
- Consistent testing
- Code reviews integrated
- Automated linting/formatting

**CD (Continuous Deployment) Benefits:**

**1. Faster Time to Market:**
- Automated deployments
- No manual release process
- Quick feature delivery

**2. Reduced Risk:**
- Small, frequent changes
- Easier rollbacks
- Less deployment stress

**3. Consistency:**
- Same process every time
- No human error
- Reproducible deployments

**Complete CI/CD Pipeline Benefits:**

**1. Efficiency:**
- Automates repetitive tasks
- Saves developer time
- Faster iteration cycles

**2. Reliability:**
- Consistent deployments
- Reduced human error
- Automated testing

**3. Visibility:**
- Build/deployment status visible
- Easy to track issues
- Better collaboration

**4. Scalability:**
- Handles multiple environments
- Supports microservices
- Easy to add new services

**Example Pipeline:**
```
Code Push → Build → Test → Security Scan → Docker Build → Push to ECR → Deploy to Dev → Integration Tests → Deploy to Staging → E2E Tests → Deploy to Production
```

---

### 14. Cost optimization strategies?

**AWS Cost Optimization Strategies:**

**1. Right-Sizing:**
- Monitor actual resource usage
- Choose appropriate instance types
- Avoid over-provisioning
```bash
# CloudWatch metrics se usage check karo
aws cloudwatch get-metric-statistics ...
```

**2. Auto-Scaling:**
- Scale based on demand
- Scale down during low traffic
- Use HPA in Kubernetes
```yaml
# HPA configuration
minReplicas: 2
maxReplicas: 10
targetCPUUtilizationPercentage: 70
```

**3. Spot Instances:**
- Up to 90% cost savings
- For fault-tolerant workloads
- Use in Kubernetes node groups
```yaml
# Spot instance configuration
spot: true
instanceTypes: ["t3.medium", "t3a.medium"]
```

**4. Reserved Instances:**
- For steady-state workloads
- 1-3 year commitments
- Up to 75% savings

**5. Lifecycle Policies:**
- Clean up old resources
- Remove unused ECR images
- Delete old snapshots
```json
{
  "rules": [{
    "rulePriority": 1,
    "selection": {
      "tagStatus": "untagged",
      "countType": "imageCountMoreThan",
      "countNumber": 5
    },
    "action": {"type": "expire"}
  }]
}
```

**6. Monitoring & Alerts:**
- Set up cost alerts
- Track spending by service
- Use AWS Cost Explorer
```bash
# Set up billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-spend-alert \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum
```

**7. Use Free Tier:**
- AWS free tier services
- 12 months free for many services
- Always free for some services

**8. Multi-Region Strategy:**
- Deploy in cheaper regions
- Consider data transfer costs
- Use CloudFront for CDN

**9. Container Optimization:**
- Smaller Docker images
- Fewer ECR storage costs
- Efficient resource usage

**10. Schedule Resources:**
- Stop non-production resources at night
- Use auto-start/stop for dev environments
- Lambda functions for scheduling

---

### 15. Security best practices?

**Docker Security Best Practices:**

**1. Use Official Images:**
```dockerfile
# Use official base images
FROM python:3.9-alpine
# Not: FROM random/python
```

**2. Minimal Base Images:**
```dockerfile
# Use alpine for smaller attack surface
FROM python:3.9-alpine
```

**3. Don't Run as Root:**
```dockerfile
# Create non-root user
RUN adduser -D myuser
USER myuser
```

**4. Scan Images:**
```bash
# Scan for vulnerabilities
docker scan my-image:latest

# Use Trivy for more scanning
trivy image my-image:latest
```

**5. Use .dockerignore:**
```
# Exclude sensitive files
.env
*.key
*.pem
secrets/
```

**6. Keep Images Updated:**
```dockerfile
# Use specific versions
FROM python:3.9.5-alpine
# Not: FROM python:latest
```

**Kubernetes Security Best Practices:**

**1. RBAC (Role-Based Access Control):**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

**2. Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**3. Pod Security Policies:**
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  runAsUser:
    rule: MustRunAsNonRoot
```

**4. Secrets Management:**
```yaml
# Use Secrets for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
data:
  api-key: <base64-encoded-key>
```

**5. Image Pull Secrets:**
```yaml
spec:
  imagePullSecrets:
  - name: ecr-secret
```

**6. Resource Limits:**
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**7. Use Service Accounts:**
```yaml
spec:
  serviceAccountName: my-service-account
```

**AWS Security Best Practices:**

**1. IAM Roles:**
- Use IAM roles, not access keys
- Least privilege principle
- Rotate credentials regularly

**2. VPC Isolation:**
- Use private subnets
- Security groups
- Network ACLs

**3. Encryption:**
- EBS encryption
- EKS secrets encryption
- S3 bucket encryption

**4. Enable CloudTrail:**
- Audit API calls
- Monitor suspicious activity
- Compliance requirements

**5. Security Groups:**
- Restrict inbound/outbound traffic
- Only necessary ports open
- Regular audits

**6. Use AWS Secrets Manager:**
- Store secrets securely
- Automatic rotation
- Encrypted storage

**7. Enable GuardDuty:**
- Threat detection
- Anomaly detection
- Automated responses

**General Security Practices:**

**1. Regular Updates:**
- Keep all software updated
- Security patches
- Dependency updates

**2. Monitoring & Logging:**
- CloudWatch logs
- Audit trails
- Security alerts

**3. Backup & Disaster Recovery:**
- Regular backups
- Tested restore procedures
- Multi-region redundancy

**4. Compliance:**
- GDPR, HIPAA, PCI DSS
- Regular security audits
- Penetration testing

---

## Enterprise-Level Deployment (Enterprise Deployment)

Enterprise-level deployment mein basic deployment se bahut zyada features aur complexity hoti hai. Ye comprehensive approach hai.

---

## 1. Multi-Environment Strategy

**Environment Hierarchy:**
```
Development → Testing → Staging → Production
```

**Development Environment:**
- Rapid iteration ke liye
- Minimal resources
- Auto-scaling disabled
- Debugging enabled
- Local or cloud-based

**Testing/QA Environment:**
- Integration tests
- Automated test suites
- Similar to production config
- Limited access

**Staging/Pre-Production:**
- Production replica
- Final testing
- Performance testing
- Security testing
- Blue-green deployment testing

**Production Environment:**
- High availability
- Auto-scaling enabled
- Strict security
- Monitoring & alerting
- Disaster recovery

**Environment Separation:**
```yaml
# Separate clusters per environment
dev-cluster:    2 nodes, t3.medium
test-cluster:   3 nodes, t3.medium
staging-cluster: 4 nodes, t3.large
prod-cluster:   6+ nodes, m5.large (multi-AZ)
```

---

## 2. High Availability Architecture

**Multi-AZ Deployment:**
```yaml
# EKS cluster across multiple availability zones
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: prod-cluster
  region: us-east-1
  availabilityZones:
  - us-east-1a
  - us-east-1b
  - us-east-1c
```

**Multi-Region Deployment:**
```
Primary Region: us-east-1 (Active)
Secondary Region: us-west-2 (Passive/Active)
```

**Database High Availability:**
- Multi-AZ RDS deployment
- Read replicas for read-heavy workloads
- Automated backups
- Point-in-time recovery
- Cross-region replication

**Load Balancing:**
- Application Load Balancer (ALB)
- Network Load Balancer (NLB)
- Global Accelerator for multi-region
- DNS-based load balancing (Route53)

---

## 3. GitOps Deployment Strategy

**GitOps Principles:**
1. **Declarative Configuration**: YAML files in Git
2. **Version Control**: Sab changes Git mein
3. **Automated Sync**: Git se cluster automatic sync
4. **Pull Requests**: Changes via PR only

**Tools:**
- **ArgoCD**: GitOps operator for Kubernetes
- **Flux**: Continuous delivery for Kubernetes
- **Terraform**: Infrastructure as code

**ArgoCD Setup:**
```yaml
# Application manifest
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/my-app.git
    targetRevision: main
    path: k8s/manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

**Benefits:**
- Version-controlled infrastructure
- Rollback easy
- Audit trail
- Collaboration
- Consistency across environments

---

## 4. Blue-Green Deployment

**Concept:**
- Two identical environments: Blue (current) and Green (new)
- Traffic switch between them
- Zero downtime deployment
- Instant rollback

**Implementation:**
```yaml
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-blue
spec:
  replicas: 4
  selector:
    matchLabels:
      app: my-app
      version: blue
  template:
    metadata:
      labels:
        app: my-app
        version: blue
    spec:
      containers:
      - name: my-app
        image: my-app:v1
---
# Green deployment (new)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-green
spec:
  replicas: 4
  selector:
    matchLabels:
      app: my-app
      version: green
  template:
    metadata:
      labels:
        app: my-app
        version: green
    spec:
      containers:
      - name: my-app
        image: my-app:v2
---
# Service pointing to blue
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
    version: blue  # Change to green to switch
  ports:
  - port: 80
    targetPort: 5000
```

**Traffic Switch:**
```bash
# Switch to green
kubectl patch service my-app-service -p '{"spec":{"selector":{"version":"green"}}}'

# Rollback to blue
kubectl patch service my-app-service -p '{"spec":{"selector":{"version":"blue"}}}'
```

---

## 5. Canary Deployment

**Concept:**
- Gradual traffic shift to new version
- Monitor metrics during rollout
- Automatic rollback if issues detected
- Risk mitigation

**Implementation with Istio/Service Mesh:**
```yaml
# VirtualService for canary
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
  - my-app
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: my-app
        subset: v2
  - route:
    - destination:
        host: my-app
        subset: v1
      weight: 90
    - destination:
        host: my-app
        subset: v2
      weight: 10  # 10% to new version
```

**Canary Tools:**
- **Flagger**: Progressive delivery for Kubernetes
- **Argo Rollouts**: Kubernetes deployment controller
- **Istio**: Service mesh with traffic management

**Flagger Configuration:**
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  service:
    port: 80
    targetPort: 5000
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
    - name: request-duration
      thresholdRange:
        max: 500
```

---

## 6. Feature Flags

**Purpose:**
- Features ko code deploy karke bhi control karo
- A/B testing
- Gradual feature rollout
- Emergency kill switch

**Implementation:**
```python
# Using feature flags
from launchdarkly import LDClient

ld_client = LDClient("sdk-key")

if ld_client.variation("new-feature", user_key, default=False):
    # New feature code
    return new_feature_logic()
else:
    # Old feature code
    return old_feature_logic()
```

**Feature Flag Services:**
- **LaunchDarkly**: Enterprise feature flag platform
- **Unleash**: Open-source feature flags
- **Split.io**: Feature experimentation platform
- **Firebase Remote Config**: Google's solution

**Best Practices:**
- Remove flags after feature is stable
- Document flags and their purpose
- Regular cleanup of old flags
- Test with flags enabled/disabled

---

## 7. Service Mesh (Istio/Linkerd)

**Why Service Mesh?**
- Service-to-service communication management
- Security (mTLS)
- Observability
- Traffic management
- Resilience (retries, circuit breakers)

**Istio Architecture:**
```
Control Plane:
- Istiod: Pilot, Citadel, Galley

Data Plane:
- Envoy proxies (sidecar containers)
```

**Istio Installation:**
```bash
# Install Istio
istioctl install --set profile=default

# Enable automatic sidecar injection
kubectl label namespace default istio-injection=enabled
```

**Traffic Management:**
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

**Security:**
```yaml
# Enable mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
```

---

## 8. Advanced Monitoring & Observability

**Monitoring Stack:**
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Loki**: Log aggregation
- **Tempo**: Distributed tracing
- **Jaeger**: Distributed tracing

**Enterprise Monitoring:**
```yaml
# Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: prometheus
spec:
  serviceMonitorSelectorNilUsesHelmValues: false
  serviceMonitors:
  - name: my-app
    selector:
      matchLabels:
        app: my-app
  resources:
    requests:
      memory: 400Mi
  retention: 30d
```

**Alerting:**
```yaml
# AlertManager configuration
groups:
- name: application
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
```

**SLA/SLO Monitoring:**
- **SLA (Service Level Agreement)**: Commitment to customers
- **SLO (Service Level Objective)**: Internal targets
- **SLI (Service Level Indicator)**: Metrics to measure SLO

**Example SLO:**
```yaml
slo:
  name: availability
  objective: 99.9%  # 99.9% uptime
  description: "API availability"
  sli:
    metric: http_requests_total
    success: status < 500
```

---

## 9. Security & Compliance

**Enterprise Security Measures:**

**1. IAM Governance:**
```yaml
# IAM roles for service accounts
apiVersion: iam.amazonaws.com/v1alpha2
kind: IAMRolePolicy
metadata:
  name: eks-iam-role
spec:
  policy:
    Version: "2012-10-17"
    Statement:
    - Effect: Allow
      Action:
      - s3:GetObject
      Resource: "arn:aws:s3:::my-bucket/*"
```

**2. Network Security:**
```yaml
# VPC configuration
- Private subnets for workloads
- Public subnets for load balancers only
- NAT gateways for outbound traffic
- VPC peering for inter-region communication
- Transit Gateway for multi-account
```

**3. Secrets Management:**
```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name prod/db/password \
  --secret-string "secure-password"

# Automatic rotation enabled
aws secretsmanager rotate-secret \
  --secret-id prod/db/password \
  --rotation-lambda-arn arn:aws:lambda:...
```

**4. Compliance Frameworks:**
- **SOC 2**: Security, availability, processing integrity
- **HIPAA**: Healthcare data protection
- **PCI DSS**: Payment card industry
- **GDPR**: European data protection
- **ISO 27001**: Information security

**5. Security Scanning:**
```bash
# Container scanning
trivy image my-app:latest

# Kubernetes security
kube-bench master
kube-hunter

# Infrastructure scanning
tfsec terraform/
```

---

## 10. Disaster Recovery (DR)

**DR Strategy:**
```
RPO (Recovery Point Objective): Maximum data loss tolerance
RTO (Recovery Time Objective): Maximum downtime tolerance
```

**Backup Strategy:**
```yaml
# Velero for Kubernetes backups
velero backup create my-backup \
  --include-namespaces production \
  --ttl 720h0m0s \
  --storage-location default

# Scheduled backups
velero schedule create daily-backup \
  --schedule "0 2 * * *" \
  --include-namespaces production
```

**Multi-Region DR:**
```
Primary Region (us-east-1):
- Active workload
- Real-time data replication
- Automated failover

Secondary Region (us-west-2):
- Hot standby
- Data replicated via cross-region replication
- Can take over in minutes
```

**Failover Process:**
```bash
# DNS failover with Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://failover.json
```

**DR Testing:**
- Monthly failover drills
- Documentation reviews
- Runbook updates
- Team training

---

## 11. Cost Management at Scale

**Enterprise Cost Optimization:**

Jab koi application deploy hota hai, cost management bahut important hai. Agar properly manage nahi kiya to bill bohot high ho sakta hai. Ye detailed guide hai cost save karne ke liye.

---

### Cost Management Fundamentals

**Kyun Cost Management Important Hai?**
- Cloud resources pay-as-you-go hote hain
- Unmonitored resources se unexpected bills aate hain
- Over-provisioning se waste hota hai
- Cost optimization se profit margin increase hota hai

**Cost Management Lifecycle:**
```
Planning → Deployment → Monitoring → Optimization → Continuous Improvement
```

---

### 1. Cost Allocation & Tagging Strategy

**Why Tagging Important?**
- Cost tracking by team/application
- Resource ownership identification
- Budget allocation
- Chargeback to departments

**Tagging Strategy:**
```yaml
# Mandatory tags for all resources
tags:
  # Environment identification
  Environment: production  # production, staging, development, testing
  
  # Team ownership
  Team: platform-team  # engineering, data-science, product
  
  # Application identification
  Application: user-service  # specific service name
  
  # Cost center for billing
  CostCenter: engineering-001
  
  # Project tracking
  Project: microservices-migration
  
  # Owner contact
  Owner: john.doe@company.com
  
  # Automation tag
  ManagedBy: terraform  # terraform, cloudformation, manual
  
  # Data classification
  DataClassification: sensitive  # public, internal, confidential, sensitive
```

**Tag Enforcement:**
```yaml
# AWS Config rule for mandatory tags
apiVersion: config.amazonaws.com/v1
kind: ConfigRule
metadata:
  name: required-tags
spec:
  source:
    owner: AWS
    sourceIdentifier: REQUIRED_TAGS
  inputParameters:
    tag1Key: Environment
    tag1Value: ^(production|staging|development)$
    tag2Key: Team
    tag2Value: .+
```

---

### 2. Budgets & Alerts Setup

**AWS Budgets Configuration:**
```json
{
  "BudgetName": "Production-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "10000",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "Tag": [
      {
        "Key": "Environment",
        "Values": ["production"]
      }
    ]
  },
  "NotificationWithSubscribers": [
    {
      "Notification": {
        "NotificationType": "ACTUAL_COST",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE_OF_BUDGET"
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "engineering@company.com"
        },
        {
          "SubscriptionType": "SNS",
          "Address": "arn:aws:sns:us-east-1:123456789012:cost-alerts"
        }
      ]
    }
  ]
}
```

**Budget Creation:**
```bash
# Create budget using AWS CLI
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://production-budget.json

# List budgets
aws budgets describe-budgets --account-id 123456789012

# Update budget
aws budgets update-budget \
  --account-id 123456789012 \
  --budget file://updated-budget.json
```

**Alert Levels:**
- **50%**: Informational - monitoring phase
- **75%**: Warning - investigate usage
- **90%**: Critical - immediate action required
- **100%**: Emergency - stop non-essential services

---

### 3. Right-Sizing Resources

**Identify Over-Provisioned Resources:**
```bash
# AWS Cost Explorer recommendations
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# AWS Compute Optimizer for EC2 recommendations
aws compute-optimizer get-recommendation-summaries \
  --account-ids 123456789012 \
  --service-code ec2
```

**Right-Sizing Strategy:**

**EC2 Instances:**
```bash
# Check current usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Average

# If CPU < 20% consistently, downsize
# If CPU > 80% consistently, upgrade
```

**Kubernetes Resource Limits:**
```yaml
# Before right-sizing (over-provisioned)
resources:
  requests:
    memory: "4Gi"
    cpu: "2000m"
  limits:
    memory: "8Gi"
    cpu: "4000m"

# After right-sizing (based on actual usage)
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

**Vertical Pod Autoscaler (VPA):**
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      minAllowed:
        cpu: "100m"
        memory: "100Mi"
      maxAllowed:
        cpu: "2"
        memory: "2Gi"
```

---

### 4. Auto-Scaling Implementation

**Kubernetes HPA for Cost Savings:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2        # Minimum running instances
  maxReplicas: 10       # Maximum scale
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale when CPU > 70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

**AWS Auto Scaling Groups:**
```bash
# Create auto scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name my-app-asg \
  --launch-template LaunchTemplateId=lt-1234567890abcdef0 \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3 \
  --vpc-zone-identifier subnet-12345,subnet-67890 \
  --target-group-arns arn:aws:elasticloadbalancing:...

# Scaling policy based on CPU
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-app-asg \
  --policy-name cpu-scale-out \
  --scaling-adjustment 1 \
  --adjustment-type ChangeInCapacity \
  --cooldown 300 \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold
```

**Scheduled Scaling (Time-based):**
```yaml
# Scale down during non-business hours
apiVersion: autoscaling/v2
kind: CronHorizontalPodAutoscaler
metadata:
  name: my-app-cron-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  jobs:
  - name: scale-down-night
    schedule: "0 18 * * 1-5"  # 6 PM weekdays
    targetSize: 2
  - name: scale-up-morning
    schedule: "0 8 * * 1-5"   # 8 AM weekdays
    targetSize: 5
  - name: scale-down-weekend
    schedule: "0 18 * * 6,0"  # 6 PM weekends
    targetSize: 1
```

---

### 5. Spot Instances & Savings Plans

**Spot Instances for Cost Savings:**
```yaml
# EKS node group with spot instances
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: prod-cluster
  region: us-east-1
managedNodeGroups:
  - name: spot-ng
    instanceType: mixed
    instanceTypes:
    - t3.medium
    - t3a.medium
    - t3.large
    spot: true
    desiredCapacity: 4
    minSize: 2
    maxSize: 8
    volumeSize: 20
    labels:
      node-type: spot
    taints:
    - key: spot
      value: "true"
      effect: NoSchedule
```

**Spot Instance Best Practices:**
- Use for fault-tolerant workloads
- Multiple instance types for better availability
- Handle spot interruptions gracefully
- Mix spot and on-demand instances
- Use spot for batch jobs, CI/CD, background processing

**Spot Interruption Handling:**
```yaml
# DaemonSet to handle spot termination
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: spot-termination-handler
spec:
  selector:
    matchLabels:
      app: spot-handler
  template:
    metadata:
      labels:
        app: spot-handler
    spec:
      tolerations:
      - key: spot
        operator: Exists
        effect: NoSchedule
      containers:
      - name: handler
        image: kevinmichaels/spot-termination-handler
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
```

**Savings Plans:**
```bash
# Compute Savings Plans (most flexible)
aws savings-plans create-savings-plan \
  --savings-plan-offering-id <offering-id> \
  --commitment "100.00" \
  --upfront-payment "0.00" \
  --purchase-time 2024-01-01T00:00:00Z

# EC2 Instance Savings Plans (for EC2 only)
aws ec2-purchase-scheduled-instances \
  --purchase-request file://savings-plan.json
```

**Savings Plan Strategy:**
- **Compute Savings Plans**: Flexible across EC2, Fargate, Lambda
- **EC2 Instance Savings Plans**: Up to 72% savings, EC2 only
- **1-year term**: 43% savings, partial upfront
- **3-year term**: 66% savings, all/no upfront
- Analyze 90-day usage before purchasing

---

### 6. Resource Cleanup & Lifecycle Management

**Automatic Resource Cleanup:**
```yaml
# Lifecycle policy for ECR images
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 production images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["prod"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Delete untagged images older than 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushedAt",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

**EBS Snapshot Cleanup:**
```bash
# Delete old snapshots
aws ec2 describe-snapshots \
  --owner-ids 123456789012 \
  --query 'Snapshots[?StartTime<=`2024-01-01`].SnapshotId' \
  --output text | xargs -I {} aws ec2 delete-snapshot --snapshot-id {}

# Automated cleanup script
#!/bin/bash
# Keep only last 7 days snapshots
aws ec2 describe-snapshots \
  --owner-ids 123456789012 \
  --filters Name=tag:Environment,Values=production \
  --query 'Snapshots[?StartTime<=`'$(date -d '-7 days' +%Y-%m-%d)'`].SnapshotId' \
  --output text | xargs -I {} aws ec2 delete-snapshot --snapshot-id {}
```

**S3 Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "Prefix": "logs/",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      },
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    },
    {
      "ID": "TransitionToGlacier",
      "Status": "Enabled",
      "Prefix": "backups/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 180,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ]
    }
  ]
}
```

---

### 7. Database Cost Optimization

**RDS Cost Optimization:**
```bash
# Enable Multi-AZ only for production
aws rds modify-db-instance \
  --db-instance-identifier my-db \
  --multi-az \
  --apply-immediately

# Use read replicas for read-heavy workloads
aws rds create-db-instance-read-replica \
  --db-instance-identifier my-db-replica \
  --source-db-instance-identifier my-db

# Instance class optimization
aws rds modify-db-instance \
  --db-instance-identifier my-db \
  --db-instance-class db.t3.medium \
  --apply-immediately
```

**Database Cost Saving Tips:**
- **Right-sizing**: Monitor CPU, memory, IOPS usage
- **Reserved Instances**: For steady production workloads
- **Read Replicas**: Offload read traffic
- **Multi-AZ**: Only for production, not dev/staging
- **Backup retention**: Optimize retention period
- **Storage auto-scaling**: Enable with limits
- **Serverless**: Aurora Serverless for intermittent workloads

**Aurora Serverless:**
```yaml
# Aurora Serverless for cost savings
resource "aws_rds_cluster" "aurora_serverless" {
  cluster_identifier = "aurora-serverless-cluster"
  engine = "aurora-mysql"
  engine_mode = "provisioned"
  database_name = "mydb"
  
  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 4
  }
  
  # Auto-pause after inactivity
  enable_http_endpoint = true
}
```

---

### 8. Container & Image Optimization

**Docker Image Size Reduction:**
```dockerfile
# Before: Large image (1.2GB)
FROM python:3.9
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]

# After: Optimized image (150MB)
FROM python:3.9-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.9-alpine
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app/requirements.txt /app/
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

**ECR Storage Cost Savings:**
```bash
# Lifecycle policy to reduce storage
aws ecr put-lifecycle-policy \
  --repository-name my-repo \
  --lifecycle-policy-text file://lifecycle-policy.json

# Scan and remove vulnerable images
aws ecr describe-images \
  --repository-name my-repo \
  --query 'sort_by(imageDetails,& imagePushedAt)' \
  --output table
```

---

### 9. Network Cost Optimization

**VPC & Network Cost Savings:**
```yaml
# Use private subnets for workloads
# Use NAT Gateway instead of NAT instance (cost-effective for high traffic)
# Use VPC endpoints for S3, DynamoDB (no data transfer charges)

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3" {
  vpc_id = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = [aws_route_table.private.id]
}
```

**Data Transfer Optimization:**
- Use CloudFront CDN for static assets
- Enable compression
- Minimize cross-region data transfer
- Use VPC peering instead of VPN
- Optimize image sizes
- Use caching aggressively

---

### 10. Monitoring & Anomaly Detection

**AWS Cost Anomaly Detection:**
```bash
# Enable cost anomaly detection
aws ce enable-anomaly-subscription \
  --subscription-name production-cost-monitor \
  --monitor-arn arn:aws:ce::123456789012:anomalymonitor/monitor-id \
  --subscription file://subscription.json

# Subscription configuration
{
  "Frequency": "DAILY",
  "Subscribers": [
    {
      "Address": "engineering@company.com",
      "Type": "EMAIL"
    },
    {
      "Address": "arn:aws:sns:us-east-1:123456789012:cost-alerts",
      "Type": "SNS"
    }
  ]
}
```

**Custom Cost Metrics:**
```python
# CloudWatch custom metric for cost tracking
import boto3

cloudwatch = boto3.client('cloudwatch')

def put_cost_metric(service, cost):
    cloudwatch.put_metric_data(
        Namespace='AWS/Cost',
        MetricData=[{
            'MetricName': f'{service}_Cost',
            'Value': cost,
            'Unit': 'Count',
            'Timestamp': datetime.now(),
            'Dimensions': [
                {
                    'Name': 'Service',
                    'Value': service
                }
            ]
        }]
    )
```

---

### 11. FinOps Framework Implementation

**FinOps Lifecycle:**
```
1. Inform: Visibility into cloud costs
2. Optimize: Reduce waste and improve efficiency
3. Operate: Business alignment and governance
```

**FinOps Best Practices:**

**1. Daily Cost Monitoring:**
```bash
# Daily cost report script
#!/bin/bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -d 'yesterday' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost,UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output table
```

**2. Weekly Cost Reviews:**
- Review top 5 cost drivers
- Identify anomalies
- Check for orphaned resources
- Review reserved instance utilization
- Plan for upcoming changes

**3. Monthly Cost Analysis:**
- Compare with budget
- Analyze trends
- Identify optimization opportunities
- Update forecasts
- Report to stakeholders

**4. Quarterly Strategy:**
- Review savings plans
- Evaluate architecture changes
- Assess new cost-saving opportunities
- Update tagging strategy
- Train teams on cost awareness

---

### 12. Cost Optimization Checklist

**Immediate Actions (Do Now):**
- [ ] Enable AWS Cost Anomaly Detection
- [ ] Set up budget alerts (80%, 90%, 100%)
- [ ] Implement mandatory tagging policy
- [ ] Enable CloudWatch billing alarms
- [ ] Review and delete unused resources
- [ ] Set up ECR lifecycle policies
- [ ] Enable S3 lifecycle policies
- [ ] Configure auto-scaling for all services

**Short-term (Within 1 Month):**
- [ ] Right-size over-provisioned resources
- [ ] Implement spot instances where appropriate
- [ ] Purchase savings plans for steady workloads
- [ ] Optimize database configurations
- [ ] Reduce Docker image sizes
- [ ] Implement scheduled scaling
- [ ] Set up VPC endpoints
- [ ] Enable CloudFront for static assets

**Long-term (Within 3 Months):**
- [ ] Implement FinOps framework
- [ ] Automate cost optimization
- [ ] Train teams on cost awareness
- [ ] Implement chargeback/showback
- [ ] Optimize architecture for cost
- [ ] Multi-region cost strategy
- [ ] Implement serverless where appropriate
- [ ] Regular cost audits

---

### 13. Cost Optimization Tools

**AWS Native Tools:**
- **Cost Explorer**: Detailed cost analysis
- **AWS Budgets**: Budget tracking and alerts
- **Compute Optimizer**: Resource recommendations
- **Cost Anomaly Detection**: Unusual spending detection
- **Trusted Advisor**: Best practice recommendations

**Third-Party Tools:**
- **CloudHealth**: Multi-cloud cost management
- **Apptio**: IT financial management
- **Cloudability**: Cloud cost optimization
- **Spot.io**: Automated cloud optimization
- **ParkMyCloud**: Automated resource scheduling

**Open Source Tools:**
- **Infracost**: Cost estimation for Terraform
- **Kube-Cost**: Kubernetes cost monitoring
- **Cloud Custodian**: Resource policy enforcement

---

### 14. Real-World Cost Saving Examples

**Example 1: Development Environment Optimization**
```
Before: 24/7 running dev cluster (10 nodes, t3.large)
Cost: $720/month

After: Scheduled scaling (8 AM - 8 PM weekdays, 2 nodes)
Cost: $180/month
Savings: $540/month (75% reduction)
```

**Example 2: Database Optimization**
```
Before: Over-provisioned RDS (db.r5.2xlarge, Multi-AZ)
Cost: $1,200/month

After: Right-sized (db.t3.medium, Single AZ dev)
Cost: $150/month
Savings: $1,050/month (87.5% reduction)
```

**Example 3: Spot Instance Usage**
```
Before: All on-demand instances for batch processing
Cost: $500/month

After: 80% spot instances for batch jobs
Cost: $100/month
Savings: $400/month (80% reduction)
```

**Example 4: Reserved Instances**
```
Before: All on-demand for production web servers
Cost: $1,000/month

After: 3-year compute savings plan
Cost: $340/month
Savings: $660/month (66% reduction)
```

---

### 5. FinOps Practices
- Regular cost reviews
- Right-sizing initiatives
- Resource cleanup
- Architecture optimization

---

## Real-World AWS Deployment Scenarios (User Expansion)

Ye section mein real-world scenarios hai jo dikhta hai ki kaise application deploy hota hai jab users expand hote hain - startup se lekar enterprise tak.

---

## Stage 1: Startup Phase (0 - 10,000 Users)

**Business Context:**
- New application launch
- Limited budget
- Small team (2-5 developers)
- Focus on speed to market
- MVP (Minimum Viable Product)

**Architecture:**
```
[Users] → CloudFront → ALB → EC2 (Single Instance) → RDS (Single AZ)
                      ↓
                  S3 (Static Assets)
```

**AWS Services:**
- **EC2**: t3.medium (1 instance)
- **RDS**: db.t3.micro (Single AZ)
- **S3**: For static assets
- **CloudFront**: CDN for static content
- **Route 53**: DNS management
- **IAM**: Basic access control

**Infrastructure as Code:**
```yaml
# Terraform configuration
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  key_name      = "production-key"
  
  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}

resource "aws_db_instance" "database" {
  allocated_storage    = 20
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  db_name              = "myapp"
  username             = "admin"
  password             = var.db_password
  skip_final_snapshot  = true
  
  multi_az             = false
  publicly_accessible  = false
}
```

**Deployment Strategy:**
- Manual deployment via SSH
- Git pull on server
- Restart application
- No CI/CD pipeline
- Blue-green deployment not needed

**Cost Estimate:**
- EC2: $30/month
- RDS: $15/month
- S3: $5/month
- CloudFront: $10/month
- Route 53: $1/month
- **Total: ~$61/month**

**Monitoring:**
- CloudWatch basic metrics
- Email alerts for CPU > 80%
- Manual log checking via SSH

**Team Structure:**
- 1 Full-stack developer
- 1 Part-time DevOps (optional)

**Scaling Strategy:**
- Manual scaling
- Upgrade instance type when needed
- No auto-scaling

**Limitations:**
- Single point of failure
- No high availability
- Manual scaling only
- Limited monitoring

**When to Move to Next Stage:**
- Regular downtime incidents
- Performance degradation during peak hours
- Team size growing beyond capacity
- Customer complaints about reliability

---

## Stage 2: Growth Phase (10,000 - 100,000 Users)

**Business Context:**
- Product-market fit achieved
- Growing user base
- Funding secured
- Team expanding (5-15 developers)
- Focus on reliability and scalability

**Architecture:**
```
[Users] → CloudFront → ALB → Auto Scaling Group (2-4 instances) → RDS (Multi-AZ)
                      ↓                      ↓
                  S3 (Assets)           ElastiCache (Redis)
```

**AWS Services:**
- **EC2**: t3.large (Auto Scaling Group, 2-4 instances)
- **RDS**: db.t3.medium (Multi-AZ)
- **ElastiCache**: cache.t3.medium (Redis)
- **S3**: For static assets and backups
- **CloudFront**: CDN with WAF
- **Route 53**: DNS with health checks
- **CloudWatch**: Enhanced monitoring
- **AWS Backup**: Automated backups
- **WAF**: Web Application Firewall

**Infrastructure as Code:**
```yaml
# Terraform with modules
module "web_server" {
  source = "./modules/web-server"
  
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.large"
  min_size      = 2
  max_size      = 4
  desired_capacity = 2
}

module "database" {
  source = "./modules/database"
  
  allocated_storage    = 50
  instance_class       = "db.t3.medium"
  multi_az             = true
  backup_retention     = 7
}

module "redis" {
  source = "./modules/redis"
  
  node_type         = "cache.t3.medium"
  num_cache_nodes   = 1
  automatic_failover = true
}
```

**Deployment Strategy:**
- GitHub Actions CI/CD pipeline
- Docker containerization
- Blue-green deployment
- Rolling updates
- Automated testing

**CI/CD Pipeline:**
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: docker build -t myapp:${{ github.sha }} .
    - name: Push to ECR
      run: |
        aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
        docker push $ECR_URI/myapp:${{ github.sha }}
    - name: Deploy to EC2
      run: |
        aws autoscaling update-auto-scaling-group \
          --auto-scaling-group-name myapp-asg \
          --launch-template LaunchTemplateId=$LT_ID,Version=$LatestVersion
```

**Cost Estimate:**
- EC2 (2-4 instances): $120-240/month
- RDS (Multi-AZ): $80/month
- ElastiCache: $40/month
- S3: $15/month
- CloudFront: $30/month
- WAF: $20/month
- **Total: ~$305-425/month**

**Monitoring:**
- CloudWatch dashboards
- Custom metrics
- Alarm notifications (SNS)
- Log aggregation (CloudWatch Logs)
- Performance monitoring (X-Ray)

**Team Structure:**
- 3 Backend developers
- 2 Frontend developers
- 1 DevOps engineer
- 1 QA engineer

**Scaling Strategy:**
- Auto Scaling Group based on CPU
- Scale out: 2 → 4 instances
- Scale in: 4 → 2 instances
- Database read replicas if needed

**High Availability:**
- Multi-AZ deployment
- Auto Scaling Group
- RDS Multi-AZ
- ElastiCache automatic failover

**When to Move to Next Stage:**
- Frequent scaling events
- Database becoming bottleneck
- Need for microservices architecture
- Team size > 15
- Performance issues during peak traffic

---

## Stage 3: Scale Phase (100,000 - 1,000,000 Users)

**Business Context:**
- Established product
- Rapid growth
- Series B/C funding
- Team (15-50 developers)
- Focus on performance and cost optimization
- Multiple product lines

**Architecture:**
```
[Users] → CloudFront → WAF → ALB → API Gateway → ECS/Fargate → RDS (Multi-AZ + Read Replicas)
                      ↓              ↓                      ↓
                  S3 (Assets)   Lambda (Serverless)   ElastiCache (Cluster)
                                      ↓
                                  SQS/SNS (Async)
```

**AWS Services:**
- **ECS/Fargate**: Container orchestration
- **EKS**: Kubernetes cluster (optional)
- **API Gateway**: API management
- **Lambda**: Serverless functions
- **RDS**: db.r5.large (Multi-AZ + 2 read replicas)
- **ElastiCache**: cache.r5.large (Redis Cluster)
- **S3**: Multi-region replication
- **CloudFront**: Global CDN with custom SSL
- **Route 53**: Latency-based routing
- **SQS/SNS**: Message queues
- **CloudWatch**: Advanced monitoring
- **X-Ray**: Distributed tracing
- **WAF**: Advanced security rules
- **Shield**: DDoS protection

**Infrastructure as Code:**
```yaml
# Terraform with multi-environment support
module "ecs_cluster" {
  source = "./modules/ecs-cluster"
  
  cluster_name = "production"
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 1
        base   = 1
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = 4
        base   = 0
      }
    }
  }
}

module "api_gateway" {
  source = "./modules/api-gateway"
  
  api_name           = "production-api"
  stage_name         = "v1"
  throttling_burst_limit = 2000
  throttling_rate_limit   = 10000
}

module "rds_cluster" {
  source = "./modules/rds-cluster"
  
  engine               = "aurora-mysql"
  engine_version       = "5.7.mysql_aurora.2.11.2"
  instance_class       = "db.r5.large"
  allocated_storage    = 100
  database_name        = "myapp"
  
  reader_count         = 2
  backup_retention     = 30
  deletion_protection  = true
}
```

**Deployment Strategy:**
- GitOps with ArgoCD
- Canary deployments
- Feature flags (LaunchDarkly)
- Automated rollback
- Service mesh (Istio)
- Blue-green for major releases

**GitOps Configuration:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: production-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/infrastructure
    targetRevision: main
    path: k8s/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

**Cost Estimate:**
- ECS/Fargate: $400-800/month
- RDS Cluster: $600/month
- Read Replicas: $400/month
- ElastiCache Cluster: $300/month
- API Gateway: $100-200/month
- Lambda: $50-150/month
- S3: $50/month
- CloudFront: $100/month
- WAF + Shield: $100/month
- **Total: ~$2,100-2,700/month**

**Monitoring:**
- Prometheus + Grafana
- CloudWatch Synthetics
- Distributed tracing (X-Ray/Jaeger)
- Real user monitoring (RUM)
- Log aggregation (ELK Stack)
- APM (Datadog/New Relic)

**Team Structure:**
- 10 Backend developers
- 8 Frontend developers
- 5 DevOps engineers
- 3 SRE engineers
- 4 QA engineers
- 2 Security engineers
- 1 Data engineer

**Scaling Strategy:**
- Auto-scaling (Fargate + Spot)
- Database read replicas
- Caching layers (Redis)
- CDN for static content
- Queue-based processing (SQS)
- Horizontal pod autoscaler

**High Availability:**
- Multi-region deployment
- Cross-region replication
- Disaster recovery plan
- Automated failover
- 99.9% SLA target

**Security:**
- VPC with private subnets
- Security groups
- IAM roles
- Secrets Manager
- Certificate Manager
- WAF + Shield
- Regular security audits

**When to Move to Next Stage:**
- Need for global presence
- Regulatory requirements (GDPR, HIPAA)
- Multi-region latency issues
- Team size > 50
- Cost optimization critical

---

## Stage 4: Enterprise Phase (1,000,000+ Users)

**Business Context:**
- Market leader
- Global presence
- Public company or late-stage startup
- Team (50-500+ developers)
- Focus on compliance, security, cost optimization
- Multiple business units

**Architecture:**
```
[Global Users] → CloudFront (Edge Locations) → WAF + Shield → Global Accelerator → Regional ALB
                                                                              ↓
[US-East] → EKS Cluster → Service Mesh (Istio) → Microservices → Aurora Global Database
                  ↓                              ↓
              Lambda Functions              ElastiCache Global
                  ↓                              ↓
              SQS/SNS/Kinesis                S3 Multi-Region

[EU-West] → EKS Cluster → Service Mesh → Microservices → Aurora Read Replica
[AP-South] → EKS Cluster → Service Mesh → Microservices → Aurora Read Replica
```

**AWS Services:**
- **EKS**: Multiple clusters per region
- **Aurora Global Database**: Multi-region database
- **Global Accelerator**: Global traffic routing
- **CloudFront**: Global edge network
- **WAF + Shield**: Advanced DDoS protection
- **Transit Gateway**: Multi-account networking
- **Organizations**: Multi-account management
- **Control Tower**: Governance
- **Service Catalog**: Infrastructure catalog
- **Secrets Manager**: Enterprise secrets
- **KMS**: Customer-managed keys
- **Macie**: Data classification
- **GuardDuty**: Threat detection
- **Config**: Compliance monitoring
- **CloudTrail**: Audit logging
- **S3**: Multi-region with intelligent tiering
- **DynamoDB Global Tables**: NoSQL global database
- **Kinesis**: Real-time data streaming
- **MSK**: Managed Kafka
- **Step Functions**: Workflow orchestration

**Infrastructure as Code:**
```yaml
# Multi-account, multi-region setup
module "aws_organization" {
  source = "./modules/organization"
  
  accounts = {
    production = {
      email = "prod@company.com"
      name  = "Production"
    }
    staging = {
      email = "staging@company.com"
      name  = "Staging"
    }
    dev = {
      email = "dev@company.com"
      name  = "Development"
    }
    security = {
      email = "security@company.com"
      name  = "Security"
    }
  }
}

module "eks_cluster" {
  source = "./modules/eks-cluster"
  
  for_each = {
    us-east-1  = { region = "us-east-1",  nodes = 10 }
    eu-west-1  = { region = "eu-west-1",  nodes = 6 }
    ap-south-1  = { region = "ap-south-1",  nodes = 4 }
  }
  
  cluster_name    = "${each.value.region}-production"
  region          = each.value.region
  node_count      = each.value.nodes
  instance_types  = ["m5.large", "m5.xlarge"]
  
  enable_irsa     = true
  enable_ssm      = true
}

module "aurora_global" {
  source = "./modules/aurora-global"
  
  primary_region = "us-east-1"
  secondary_regions = ["eu-west-1", "ap-south-1"]
  
  engine               = "aurora-mysql"
  engine_version       = "5.7.mysql_aurora.2.11.2"
  instance_class       = "db.r5.2xlarge"
  allocated_storage    = 500
  
  backup_retention     = 90
  deletion_protection  = true
}
```

**Deployment Strategy:**
- Multi-region GitOps
- Canary with automated rollback
- Feature flags at scale
- Chaos engineering
- Service mesh for traffic management
- Progressive delivery (Argo Rollouts)
- Automated compliance checks

**Multi-Region GitOps:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: global-applications
  namespace: argocd
spec:
  generators:
  - clusters:
      selector:
        matchLabels:
          environment: production
  template:
    metadata:
      name: '{{cluster.name}}-myapp'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/infrastructure
        targetRevision: main
        path: k8s/production
      destination:
        server: '{{server}}'
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

**Cost Estimate:**
- EKS Clusters (3 regions): $3,000-5,000/month
- Aurora Global Database: $2,500/month
- Read Replicas: $1,500/month
- ElastiCache Global: $800/month
- Global Accelerator: $500/month
- CloudFront: $500/month
- WAF + Shield: $300/month
- Lambda: $200-400/month
- Kinesis/MSK: $400/month
- S3 (Multi-region): $300/month
- Networking (Transit Gateway): $200/month
- **Total: ~$9,700-11,900/month**

**Monitoring:**
- Prometheus + Grafana (per region)
- CloudWatch Synthetics (global)
- Distributed tracing (Jaeger/Tempo)
- Real user monitoring (RUM)
- Log aggregation (ELK/Loki)
- APM (Datadog/New Relic)
- Business metrics (custom dashboards)
- SLO/SLA monitoring
- Error budget tracking

**Team Structure:**
- 50 Backend developers
- 40 Frontend developers
- 20 DevOps engineers
- 15 SRE engineers
- 10 QA engineers
- 8 Security engineers
- 5 Data engineers
- 5 Platform engineers
- 3 Compliance officers
- 2 FinOps specialists

**Scaling Strategy:**
- Auto-scaling across regions
- Database sharding
- Microservices with independent scaling
- Serverless for burst traffic
- Queue-based processing at scale
- Horizontal pod autoscaler
- Cluster autoscaler
- Predictive scaling

**High Availability:**
- Multi-region active-active
- Cross-region failover (RTO < 5 min)
- Disaster recovery (RPO < 1 min)
- Automated failover testing
- 99.99% SLA target
- Business continuity planning

**Security & Compliance:**
- Multi-account strategy
- VPC with private endpoints
- Zero-trust architecture
- IAM with SSO
- Secrets Manager with rotation
- KMS customer-managed keys
- Macie for data discovery
- GuardDuty for threat detection
- Security Hub for centralized security
- Compliance (SOC 2, HIPAA, GDPR, PCI DSS)
- Regular penetration testing
- Bug bounty program

**Governance:**
- AWS Control Tower
- AWS Organizations
- Service Catalog
- Config rules
- CloudTrail logging
- Tag policies
- Budget controls
- IAM Access Analyzer
- Trusted Advisor

**Cost Management:**
- FinOps framework
- Cost allocation by team
- Reserved instances and savings plans
- Spot instances for 60% of workloads
- Automated cost optimization
- Regular cost reviews
- Chargeback to business units
- Cost anomaly detection

**When to Consider Further Expansion:**
- Entering new markets
- Regulatory requirements in new regions
- Mergers and acquisitions
- Need for edge computing
- Specialized compliance requirements

---

## Migration Strategies Between Stages

### Stage 1 → Stage 2 Migration

**Preparation (2-4 weeks):**
1. Set up CI/CD pipeline
2. Containerize application
3. Create Terraform modules
4. Set up monitoring
5. Plan migration timeline

**Migration Steps (1-2 weeks):**
1. Create new infrastructure (ASG, Multi-AZ RDS)
2. Deploy new version alongside old
3. Switch DNS using Route53
4. Monitor for issues
5. Decommission old infrastructure

**Rollback Plan:**
- Switch DNS back to old infrastructure
- Keep old infrastructure running for 1 week

---

### Stage 2 → Stage 3 Migration

**Preparation (4-8 weeks):**
1. Evaluate container orchestration (ECS vs EKS)
2. Design microservices architecture
3. Set up service mesh
4. Implement feature flags
5. Train team on new tools

**Migration Steps (4-6 weeks):**
1. Migrate monolith to containers
2. Set up ECS/EKS cluster
3. Implement API Gateway
4. Gradual microservices extraction
5. Database read replicas
6. Monitor and optimize

**Rollback Plan:**
- Keep monolith running
- Gradual rollback if issues
- Feature flags to disable new services

---

### Stage 3 → Stage 4 Migration

**Preparation (8-12 weeks):**
1. Multi-region architecture design
2. Data residency compliance
3. Global database planning
4. Multi-account strategy
5. Team training and hiring

**Migration Steps (8-12 weeks):**
1. Set up AWS Organizations
2. Create regional EKS clusters
3. Migrate to Aurora Global Database
4. Implement global traffic routing
5. Set up multi-region CI/CD
6. Gradual traffic shift

**Rollback Plan:**
- Keep primary region active
- Gradual traffic rollback
- Database failback if needed

---

## Key Metrics to Track at Each Stage

### Stage 1 Metrics
- Active users
- Page load time
- Server uptime
- Error rate
- Cost per user

### Stage 2 Metrics
- Request latency (p50, p95, p99)
- Auto-scaling events
- Database query performance
- Cache hit ratio
- Deployment frequency

### Stage 3 Metrics
- Service-level objectives (SLOs)
- Error budget
- Request rate per service
- Database connection pool usage
- Container resource utilization
- Cost per transaction

### Stage 4 Metrics
- Regional latency
- Cross-region data transfer
- Global availability
- Compliance score
- Cost per business unit
- SLO/SLA compliance
- Security incidents
- Carbon footprint

---

## Common Pitfalls to Avoid

### Stage 1 Pitfalls
- **Over-engineering**: Don't use Kubernetes for simple apps
- **Ignoring security**: Even startups need basic security
- **No monitoring**: You can't improve what you don't measure
- **Manual processes**: Automate from day one

### Stage 2 Pitfalls
- **Premature microservices**: Monolith is fine at this scale
- **Ignoring cost**: Auto-scaling can increase bills
- **Poor database design**: Indexing and queries matter
- **No backup strategy**: Data loss is catastrophic

### Stage 3 Pitfalls
- **Microservices chaos**: Too many services = complexity
- **Inconsistent monitoring**: Each service needs observability
- **Ignoring team skills**: Kubernetes is complex
- **Poor service boundaries**: Coupling defeats the purpose

### Stage 4 Pitfalls
- **Multi-region complexity**: Start with one region
- **Compliance neglect**: Regulations are real
- **Cost explosion**: Enterprise scale = enterprise costs
- **Siloed teams**: Communication is critical

---

## 12. CI/CD at Enterprise Scale

**Enterprise CI/CD Pipeline:**
```
Code Push → Security Scan → Unit Tests → Build → Integration Tests → 
Security Scan → Container Scan → Push to Registry → Dev Deploy → 
Integration Tests → Staging Deploy → E2E Tests → Performance Tests → 
Security Audit → Approval → Production Deploy → Monitoring
```

**Pipeline Stages:**

**1. Security Stage:**
```yaml
# GitHub Actions security
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: my-app:latest
    format: 'sarif'
    output: 'trivy-results.sarif'
```

**2. Quality Gates:**
```yaml
# SonarQube integration
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**3. Approval Gates:**
```yaml
# Manual approval for production
environment:
  name: production
  url: https://prod.example.com
  # Requires approval
```

**4. Deployment Strategies:**
- Blue-green for major releases
- Canary for feature releases
- Rolling updates for patches

---

## 13. Configuration Management

**External Configuration:**
```yaml
# External ConfigMap from Git
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  annotations:
    config.k8s.io/owning-inventory: config-management
data:
  # Loaded from external source
  config.yaml: |
    database:
      host: ${DB_HOST}
      port: 5432
```

**Configuration Tools:**
- **External Secrets Operator**: Sync secrets from external systems
- **Kustomize**: Configuration customization
- **Helm**: Package management
- **Config Management Controller**: Git-based config sync

---

## 14. A/B Testing

**Implementation:**
```python
# A/B testing with feature flags
import hashlib

def get_variant(user_id):
    hash_value = hashlib.md5(user_id.encode()).hexdigest()
    return int(hash_value[:8], 16) % 100

if get_variant(user_id) < 50:
    # Variant A
    return variant_a_logic()
else:
    # Variant B
    return variant_b_logic()
```

**A/B Testing Tools:**
- **Optimizely**: Enterprise experimentation
- **VWO**: Visual website optimizer
- **Google Optimize**: Free A/B testing
- **Split.io**: Feature experimentation

---

## 15. Enterprise Deployment Checklist

**Pre-Deployment:**
- [ ] Security scanning completed
- [ ] All tests passed
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Backup verified
- [ ] DR plan tested
- [ ] Compliance verified

**During Deployment:**
- [ ] Blue-green deployment used
- [ ] Health checks passing
- [ ] Metrics within SLO
- [ ] No errors in logs
- [ ] Latency acceptable
- [ ] Security scanning passed

**Post-Deployment:**
- [ ] Monitoring verified
- [ ] Performance validated
- [ ] User feedback collected
- [ ] Documentation updated
- [ ] Team notified
- [ ] Post-mortem if issues

---

## 16. Enterprise Tools Summary

**Category | Tools**
---------|-------
**GitOps** | ArgoCD, Flux, Terraform
**Service Mesh** | Istio, Linkerd, Consul
**Monitoring** | Prometheus, Grafana, Datadog, New Relic
**Logging** | ELK Stack, Loki, Splunk
**Tracing** | Jaeger, Zipkin, Tempo
**Security** | Trivy, Aqua, Twistlock
**CI/CD** | Jenkins, GitLab CI, CircleCI, GitHub Actions
**Feature Flags** | LaunchDarkly, Unleash, Split.io
**A/B Testing** | Optimizely, VWO, Google Optimize
**Secrets** | AWS Secrets Manager, HashiCorp Vault
**Backup** | Velero, AWS Backup
**Cost Management** | AWS Cost Explorer, CloudHealth

---

## Resources

### Official Documentation
- Docker: https://docs.docker.com
- Kubernetes: https://kubernetes.io/docs
- AWS EKS: https://aws.amazon.com/eks
- AWS ECR: https://aws.amazon.com/ecr

### Learning Resources
- Kubernetes Documentation
- AWS Well-Architected Framework
- Docker Best Practices
- Kubernetes Patterns
