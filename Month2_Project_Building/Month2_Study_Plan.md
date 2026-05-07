# Month 2: Project Building — Complete Study Plan

---

## Overview

```
Week 5-6: Payment System (Stripe, Webhooks, Retry)
Week 7:   Background Jobs (BullMQ + Redis)
Week 8:   Docker + AWS Deployment
```

---

## Week 5–6: Payment System (Day 1–14)

### Week 5: Stripe Basics

#### Day 1 — Stripe Setup & Concepts
```
Topics:
  - Stripe kya hai, kaise kaam karta hai
  - Test mode vs Live mode
  - API keys (publishable + secret)
  - Stripe Dashboard tour
  - Core objects: Customer, PaymentIntent, Charge

Practice:
  - Stripe account banao (free)
  - Test API keys copy karo
  - npm install stripe
  - First API call: customer create karo
```

#### Day 2 — Payment Intents
```
Topics:
  - PaymentIntent flow (modern Stripe approach)
  - Create → Confirm → Succeed/Fail
  - Client secret kya hota hai
  - 3D Secure handling

Practice:
  - PaymentIntent create karo
  - Test card numbers use karo
  - Success + failure scenarios test karo
```

#### Day 3 — Stripe Checkout (Hosted)
```
Topics:
  - Stripe Checkout Session
  - Redirect-based payment flow
  - Success/cancel URLs
  - Line items, pricing

Practice:
  - Checkout session create karo
  - Browser mein redirect test karo
  - Test card se payment complete karo
```

#### Day 4 — Customers & Cards
```
Topics:
  - Customer object create/update
  - Payment methods attach karo
  - Saved cards (future payments)
  - Customer portal

Practice:
  - Customer banao
  - Card attach karo
  - Saved card se charge karo
```

#### Day 5 — Subscriptions
```
Topics:
  - Products aur Prices create karo
  - Subscription create karo
  - Billing cycles (monthly, yearly)
  - Trial periods
  - Cancel/pause subscription

Practice:
  - Product + Price create karo
  - Subscription start karo
  - Cancel karo
```

#### Day 6 — Refunds & Disputes
```
Topics:
  - Full aur partial refunds
  - Refund reasons
  - Dispute handling
  - Idempotency keys (duplicate prevention)

Practice:
  - Payment karo
  - Partial refund karo
  - Idempotency key test karo
```

#### Day 7 — Week 5 Revision
```
- Stripe flow diagram draw karo
- Quiz: PaymentIntent vs Charge
- Mini project: Simple checkout page
```

---

### Week 6: Webhooks & Production

#### Day 8 — Webhooks Introduction
```
Topics:
  - Webhook kya hota hai (push vs pull)
  - Stripe webhook events
  - Webhook endpoint setup
  - Event types: payment_intent.succeeded, etc.

Practice:
  - Express webhook endpoint banao
  - Stripe CLI install karo
  - Local webhook test karo
```

#### Day 9 — Webhook Signature Verification
```
Topics:
  - Webhook security (signature verify karo)
  - stripe.webhooks.constructEvent()
  - Raw body requirement
  - Replay attacks prevent karo

Practice:
  - Signature verification implement karo
  - Invalid signature test karo
  - Secure webhook endpoint
```

#### Day 10 — Webhook Event Handling
```
Topics:
  - Event handlers implement karo
  - Idempotent processing (duplicate events)
  - Database update on payment success
  - Email send on subscription events

Practice:
  - payment_intent.succeeded handler
  - customer.subscription.deleted handler
  - DB update implement karo
```

#### Day 11 — Retry Logic
```
Topics:
  - Payment failure reasons
  - Automatic retry strategies
  - Exponential backoff
  - Smart retry (card decline codes)
  - Dunning management

Practice:
  - Retry logic implement karo
  - Decline codes handle karo
  - Max retry limit set karo
```

#### Day 12 — Error Handling
```
Topics:
  - Stripe error types (card_error, api_error, etc.)
  - User-friendly error messages
  - Logging payment errors
  - Alerting on failures

Practice:
  - All error types handle karo
  - User messages map karo
  - Error logging implement karo
```

#### Day 13 — Complete Payment API
```
Topics:
  - Full payment flow API
  - POST /checkout → Create session
  - POST /webhook → Handle events
  - GET /subscription → Status check
  - POST /cancel → Cancel subscription

Practice:
  - Complete API banao
  - Postman se test karo
```

#### Day 14 — Week 6 Revision + Project
```
Project: E-commerce Payment System
  ✓ Product listing
  ✓ Stripe Checkout
  ✓ Webhook handling
  ✓ Subscription management
  ✓ Retry logic
```

---

## Week 7: Background Jobs (Day 15–21)

#### Day 15 — BullMQ Introduction
```
Topics:
  - Background jobs kya hain aur kyun zaroori hain
  - BullMQ kya hai (Redis-based queue)
  - Queue, Job, Worker concepts
  - Job lifecycle (waiting → active → completed/failed)

Practice:
  - npm install bullmq ioredis
  - First queue + worker banao
  - Simple job add karo
```

#### Day 16 — Job Types & Options
```
Topics:
  - Delayed jobs (schedule karo)
  - Repeatable jobs (cron)
  - Priority jobs
  - Job attempts + backoff
  - Job data + result

Practice:
  - Delayed job: 5 min baad execute
  - Cron job: Har minute
  - Priority queue test karo
```

#### Day 17 — Email Queue
```
Topics:
  - Email sending async karo
  - Nodemailer + BullMQ
  - Email templates
  - Retry on failure

Practice:
  - Email queue banao
  - Welcome email job
  - Failed email retry
```

#### Day 18 — Payment Retry Queue
```
Topics:
  - Failed payment retry queue
  - Exponential backoff
  - Max attempts
  - Dead letter queue (permanently failed)

Practice:
  - Payment retry queue implement karo
  - Stripe ke saath integrate karo
```

#### Day 19 — Job Monitoring
```
Topics:
  - Bull Board (UI dashboard)
  - Job status check karo
  - Failed jobs inspect karo
  - Queue metrics

Practice:
  - Bull Board setup karo
  - http://localhost:3000/admin/queues
```

#### Day 20 — Worker Scaling
```
Topics:
  - Multiple workers
  - Concurrency control
  - Rate limiting jobs
  - Graceful shutdown

Practice:
  - 3 workers same queue pe
  - Concurrency = 5 set karo
```

#### Day 21 — Week 7 Revision + Project
```
Project: Job Processing System
  ✓ Email queue
  ✓ Payment retry queue
  ✓ Scheduled reports
  ✓ Bull Board monitoring
```

---

## Week 8: Docker + AWS (Day 22–28)

#### Day 22 — Docker Basics
```
Topics:
  - Docker kya hai, containers vs VMs
  - Dockerfile write karna
  - Image build + run
  - Port mapping, volumes

Practice:
  - Node.js app Dockerize karo
  - docker build + docker run
```

#### Day 23 — Docker Compose
```
Topics:
  - Multi-container apps
  - docker-compose.yml
  - Services: app, redis, postgres
  - Networks, volumes

Practice:
  - App + Redis + DB compose karo
  - docker-compose up
```

#### Day 24 — AWS Basics
```
Topics:
  - AWS account setup (free tier)
  - EC2, S3, RDS, ECR overview
  - IAM users + roles
  - AWS CLI setup

Practice:
  - AWS account banao
  - IAM user create karo
  - AWS CLI configure karo
```

#### Day 25 — Deploy to EC2
```
Topics:
  - EC2 instance launch karo
  - SSH connect karo
  - Node.js + PM2 install karo
  - Nginx reverse proxy

Practice:
  - EC2 t2.micro launch karo
  - App deploy karo
  - Public URL pe access karo
```

#### Day 26 — ECR + ECS
```
Topics:
  - ECR (Elastic Container Registry)
  - Docker image push karo
  - ECS (Elastic Container Service)
  - Task definitions

Practice:
  - Docker image ECR pe push karo
  - ECS task run karo
```

#### Day 27 — Environment & Secrets
```
Topics:
  - Environment variables AWS mein
  - AWS Secrets Manager
  - Parameter Store
  - .env vs production secrets

Practice:
  - Secrets Manager mein API keys store karo
  - App mein use karo
```

#### Day 28 — Final Project + CI/CD
```
Project: Production-ready deployment
  ✓ Dockerized Node.js app
  ✓ AWS EC2 deploy
  ✓ Nginx + SSL
  ✓ GitHub Actions CI/CD
  ✓ Auto-deploy on push
```

---

## Prerequisites

```
Install karo:
  npm install stripe bullmq ioredis nodemailer
  npm install -g @bull-board/api

Accounts banao:
  Stripe: https://stripe.com (free test mode)
  AWS:    https://aws.amazon.com (free tier)

Tools:
  Docker Desktop: https://docker.com
  AWS CLI:        https://aws.amazon.com/cli
  Stripe CLI:     https://stripe.com/docs/stripe-cli
```

---

## Folder Structure

```
Month2_Project_Building/
├── Month2_Study_Plan.md          ← Ye file
├── Week5-6_Payment_System/
│   ├── payment-api/              ← Project code
│   └── Day1 to Day14 .md files
├── Week7_Background_Jobs/
│   ├── job-system/               ← Project code
│   └── Day15 to Day21 .md files
└── Week8_Docker_AWS/
    ├── deployment/               ← Docker + AWS files
    └── Day22 to Day28 .md files
```
