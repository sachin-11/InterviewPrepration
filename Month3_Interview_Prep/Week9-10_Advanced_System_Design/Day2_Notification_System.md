# Day 2 — Design a Notification System

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. Push notifications (mobile — iOS, Android)
2. Email notifications
3. SMS notifications
4. In-app notifications (bell icon)
5. User preferences (kaunsi notification chahiye, kaunsi nahi)
6. Notification templates (dynamic content)
7. Scheduled notifications (future time pe bhejo)
```

### Non-Functional Requirements:
```
High Availability:   99.99% uptime (notification miss nahi honi chahiye)
Scale:               10 million notifications/day
Latency:             Soft real-time (few seconds acceptable)
Reliability:         At-least-once delivery (duplicate better than miss)
Durability:          Failed notifications retry honi chahiye
```

---

## 2. Capacity Estimation (5 min)

```
DAU:                    10 million users
Notifications/user/day: 10 (average)
Total/day:              100 million notifications

Breakdown:
  Push (mobile):  70M/day  → ~810/sec
  Email:          20M/day  → ~230/sec
  SMS:            10M/day  → ~115/sec

Storage (notification log):
  1 notification = ~1 KB
  100M × 1KB = 100 GB/day
  Retain 30 days = 3 TB

Peak QPS:
  Normal: ~1,200 notifications/sec
  Peak:   ~5,000 notifications/sec (flash sale, breaking news)
```

---

## 3. High-Level Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           NOTIFICATION SOURCES           │
                    │  (Backend Services, Cron Jobs, Events)  │
                    └──────────────┬──────────────────────────┘
                                   │ REST API
                    ┌──────────────▼──────────────────────────┐
                    │         NOTIFICATION SERVICE             │
                    │   (Validate, Enrich, Route)             │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │           MESSAGE QUEUE (Kafka)          │
                    │  Topics: push, email, sms, in-app       │
                    └──────┬───────────┬──────────┬───────────┘
                           │           │          │
              ┌────────────▼─┐  ┌──────▼───┐  ┌──▼──────────┐
              │  Push Worker  │  │  Email   │  │  SMS Worker  │
              │               │  │  Worker  │  │              │
              └───────┬───────┘  └────┬─────┘  └──────┬───────┘
                      │               │               │
              ┌───────▼──┐    ┌───────▼──┐    ┌───────▼──┐
              │ FCM/APNs  │    │ SendGrid │    │  Twilio  │
              │ (Mobile)  │    │ (Email)  │    │  (SMS)   │
              └──────────┘    └──────────┘    └──────────┘
```

---

## 4. Notification Types — Deep Dive

### Push Notifications (Mobile):
```
Android → FCM (Firebase Cloud Messaging) — Google
iOS     → APNs (Apple Push Notification service) — Apple

Flow:
  1. App install hone pe → Device token generate hota hai
  2. Token → Hamare server pe save karo
  3. Notification bhejni hai → FCM/APNs ko token + payload bhejo
  4. FCM/APNs → Device pe deliver karo

Device Token:
  Unique identifier for each app installation
  Changes when: App reinstall, OS update, user logs out
  
  user_devices table:
    user_id, device_token, platform (ios/android/web), last_active
```

### Email Notifications:
```
Third-party providers:
  SendGrid, AWS SES, Mailgun

Why third-party?
  ✓ Deliverability (spam filters handle karte hain)
  ✓ Bounce handling
  ✓ Analytics (open rate, click rate)
  ✓ Scalable infrastructure

Flow:
  Notification Service → SendGrid API → User ka inbox
```

### SMS Notifications:
```
Third-party providers:
  Twilio, AWS SNS, Vonage

Use cases:
  OTP, critical alerts, order updates

Cost: Expensive (~$0.01/SMS) → Sparingly use karo
```

### In-App Notifications:
```
Bell icon pe click karo → Notifications list dikhti hai

Storage: DB mein store karo (read/unread status)
Real-time: WebSocket ya Server-Sent Events (SSE)

in_app_notifications table:
  id, user_id, title, body, type, is_read, created_at
```

---

## 5. Notification Service — Core Logic

```
Notification Service kya karta hai:

1. VALIDATE
   - Required fields check karo (user_id, type, content)
   - User exist karta hai?
   - Rate limit check (spam nahi hona chahiye)

2. FETCH USER PREFERENCES
   - User ne push off kiya hai? → Skip
   - User ne email off kiya hai? → Skip
   - Do Not Disturb hours? → Schedule for later

3. ENRICH
   - Template fill karo (dynamic variables)
   - User ka device token fetch karo
   - User ka email fetch karo

4. ROUTE
   - Push → Kafka topic: "push-notifications"
   - Email → Kafka topic: "email-notifications"
   - SMS → Kafka topic: "sms-notifications"
   - In-app → Kafka topic: "inapp-notifications"

5. LOG
   - Notification DB mein save karo (for retry + analytics)
```

---

## 6. Message Queue — Kafka

### Why Kafka?
```
Without Queue (Direct call):
  Notification Service → FCM directly call karo
  Problem:
    FCM down hai → Notification lost
    Traffic spike → Service overwhelm
    Retry logic complex

With Kafka:
  ✓ Buffer: Traffic spike absorb karo
  ✓ Durability: Message disk pe store hota hai
  ✓ Retry: Consumer fail kare toh re-process
  ✓ Decoupling: Service independent hain
  ✓ Multiple consumers: Push + Email + SMS parallel
```

### Kafka Topics:
```
Topic: push-notifications
  Partition by: user_id (same user ke messages order mein)
  Consumers: Push Worker instances

Topic: email-notifications
  Partition by: user_id
  Consumers: Email Worker instances

Topic: sms-notifications
  Partition by: user_id
  Consumers: SMS Worker instances

Topic: inapp-notifications
  Partition by: user_id
  Consumers: In-App Worker instances
```

---

## 7. Workers — Delivery Layer

### Push Worker:
```javascript
// Kafka se message consume karo
consumer.on('message', async (msg) => {
  const { userId, title, body, data } = msg;
  
  // User ke saare devices fetch karo
  const devices = await db.getUserDevices(userId);
  
  for (const device of devices) {
    if (device.platform === 'android') {
      await fcm.send({
        token: device.token,
        notification: { title, body },
        data
      });
    } else if (device.platform === 'ios') {
      await apns.send({
        deviceToken: device.token,
        alert: { title, body },
        payload: data
      });
    }
  }
  
  // Status update karo
  await db.updateNotificationStatus(msg.id, 'delivered');
});
```

### Retry Logic:
```
Delivery fail hone pe:
  Attempt 1: Immediately
  Attempt 2: 1 minute baad
  Attempt 3: 5 minutes baad
  Attempt 4: 30 minutes baad
  Attempt 5: 2 hours baad
  
  5 attempts ke baad → Dead Letter Queue (DLQ)
  DLQ → Alert engineering team

Exponential backoff:
  wait = base_delay × 2^attempt
  Jitter add karo (thundering herd problem avoid)
```

---

## 8. User Preferences

### Preference Table:
```sql
CREATE TABLE user_notification_preferences (
  user_id       BIGINT,
  channel       VARCHAR(20),   -- push, email, sms, in_app
  type          VARCHAR(50),   -- marketing, order_update, security
  enabled       BOOLEAN DEFAULT true,
  quiet_start   TIME,          -- DND start (e.g., 22:00)
  quiet_end     TIME,          -- DND end (e.g., 08:00)
  timezone      VARCHAR(50),
  PRIMARY KEY (user_id, channel, type)
);
```

### Preference Check Flow:
```
Notification aaya: user_id=123, channel=push, type=marketing

Check:
  1. user 123 ka push enabled hai? → No → Skip
  2. user 123 ka marketing push enabled hai? → No → Skip
  3. Current time DND hours mein hai? → Yes → Schedule for later
  4. Sab OK → Deliver karo
```

---

## 9. Notification Templates

### Why Templates?
```
Without templates:
  Every service apna message banata hai → Inconsistent
  
With templates:
  Central template store → Consistent branding
  Dynamic variables → Personalized messages
```

### Template Example:
```
Template ID: order_shipped
Subject:     "Your order #{{order_id}} has been shipped!"
Body:        "Hi {{user_name}}, your order of {{item_name}} 
              is on its way. Expected delivery: {{delivery_date}}"

Usage:
  {
    "template_id": "order_shipped",
    "user_id": 123,
    "variables": {
      "order_id": "ORD-456",
      "user_name": "Rahul",
      "item_name": "iPhone 15",
      "delivery_date": "Dec 25"
    }
  }
```

---

## 10. Scheduled Notifications

### Use Cases:
```
- "Flash sale starts in 1 hour" → Schedule 1 hour before
- Daily digest email → Every morning 9 AM
- Reminder: "You have items in cart" → 24 hours baad
```

### Implementation:
```
Option 1: Cron Job
  DB mein scheduled_at store karo
  Cron every minute run karo → Due notifications fetch karo → Send karo
  Problem: Scale nahi karta (millions of scheduled notifications)

Option 2: Delay Queue (Better)
  Kafka: Message ko future timestamp ke saath publish karo
  Worker: scheduled_at time aane pe process karo
  
  Tools: 
    - Redis Sorted Set (score = scheduled_at timestamp)
    - Kafka with delay
    - AWS SQS delay queues (max 15 min)
    - Dedicated scheduler: Quartz, Temporal

Redis Sorted Set approach:
  ZADD scheduled_notifications <timestamp> <notification_json>
  
  Scheduler (every second):
    ZRANGEBYSCORE scheduled_notifications 0 <now>
    → Due notifications fetch karo → Kafka mein push karo
```

---

## 11. Analytics & Monitoring

### Track Karo:
```
notification_logs table:
  id, user_id, channel, type, status, 
  sent_at, delivered_at, opened_at, 
  error_message, attempt_count

Status flow:
  pending → sent → delivered → opened
                ↘ failed → retrying → failed_permanent
```

### Key Metrics:
```
Delivery Rate:    Sent / Total attempted
Open Rate:        Opened / Delivered
Failure Rate:     Failed / Total
Latency:          Time from trigger to delivery
Queue Depth:      Kafka lag (backlog kitna hai)
```

---

## 12. Complete Architecture Diagram

```
  Services / Events
  (Order, Payment, etc.)
         │
         │ POST /notify
         ▼
┌─────────────────────┐     ┌──────────────────┐
│  Notification API   │────▶│  User Preferences │
│  (Validate, Route)  │     │  DB               │
└────────┬────────────┘     └──────────────────┘
         │
         │ Publish
         ▼
┌─────────────────────────────────────────────────┐
│                    KAFKA                         │
│  push-topic  │  email-topic  │  sms-topic       │
│  inapp-topic │  scheduled-topic                 │
└──────┬────────────┬──────────────┬──────────────┘
       │            │              │
┌──────▼──┐  ┌──────▼──┐  ┌───────▼──┐
│  Push   │  │  Email  │  │   SMS    │
│ Worker  │  │ Worker  │  │  Worker  │
└──────┬──┘  └──────┬──┘  └───────┬──┘
       │            │              │
┌──────▼──┐  ┌──────▼──┐  ┌───────▼──┐
│FCM/APNs │  │SendGrid │  │  Twilio  │
└─────────┘  └─────────┘  └──────────┘
       │            │              │
       └────────────┴──────────────┘
                    │
         ┌──────────▼──────────┐
         │   Notification Log  │
         │   (MySQL/Postgres)  │
         └─────────────────────┘
```

---

## 13. Interview Questions & Answers

### Q: "How do you handle notification failures?"
```
3-layer approach:

Layer 1: Retry with exponential backoff
  Attempt 1 → fail → wait 1min → Attempt 2 → fail → wait 5min...

Layer 2: Dead Letter Queue (DLQ)
  5 attempts ke baad → DLQ mein move karo
  Engineering team alert karo

Layer 3: Idempotency
  Same notification dobara deliver nahi honi chahiye
  notification_id unique rakho → Duplicate check karo
```

### Q: "How to handle 10x traffic spike (flash sale)?"
```
Kafka buffer karta hai:
  Spike aaya → Kafka mein messages pile up
  Workers apni speed se process karte hain
  No data loss, just slight delay

Auto-scaling:
  Workers horizontal scale karo (Kubernetes HPA)
  Queue depth monitor karo → Workers badhao

Rate limiting:
  Per-user: Max 10 notifications/hour
  Per-service: Max 1000 req/sec
```

### Q: "How to avoid sending duplicate notifications?"
```
Idempotency key:
  Har notification ka unique ID hota hai
  
  Before sending:
    Redis SET notification:abc123 "sent" NX EX 86400
    NX = only set if not exists
    
  Agar already set hai → Skip (duplicate)
  Agar set nahi tha → Send karo

Database level:
  notification_logs mein unique constraint on notification_id
```

### Q: "How to handle user timezone for scheduled notifications?"
```
User ka timezone store karo (preferences table mein)

Scheduled notification:
  "Send at 9 AM" → User ka timezone consider karo
  
  UTC mein store karo:
    user timezone = "Asia/Kolkata" (IST = UTC+5:30)
    9 AM IST = 3:30 AM UTC
    scheduled_at = 3:30 AM UTC store karo

Scheduler:
  UTC time se compare karo → Deliver karo
```

### Q: "What if FCM/APNs is down?"
```
Circuit Breaker pattern:
  FCM fail rate > 50% → Circuit open karo
  New requests → Immediately fail (don't wait)
  30 seconds baad → Half-open (test karo)
  Success → Circuit close karo

Fallback:
  Push fail → SMS bhejo (critical notifications ke liye)
  Push fail → In-app notification store karo
  User next time app open kare → Notification dikhao
```

---

## 14. Quick Summary

```
Core components:
  Notification API    → Validate, enrich, route
  Kafka               → Buffer, decouple, durability
  Workers             → Channel-specific delivery
  FCM/APNs/SendGrid   → Third-party providers
  Notification Log    → Retry, analytics, audit

Key decisions:
  Kafka > Direct call     (reliability, buffering)
  Third-party providers   (deliverability, scale)
  Exponential backoff     (retry without overwhelming)
  Idempotency keys        (no duplicate delivery)
  User preferences        (respect user choices)

Delivery channels:
  Push   → FCM (Android) / APNs (iOS)
  Email  → SendGrid / AWS SES
  SMS    → Twilio (expensive, use sparingly)
  In-app → DB store + WebSocket/SSE
```

---

## 15. Practice Tasks (Aaj Karo)

### Task 1: Diagram Draw Karo
```
Blank paper pe draw karo:
  Trigger → Notification API → Kafka → Workers → Providers
  User Preferences → Notification API
  Notification Log → Workers
```

### Task 2: Mock Answer
```
45 min timer lagao:
"Design a notification system for an e-commerce app"

Step 1 (5 min):  Requirements clarify karo
Step 2 (5 min):  Capacity estimate karo
Step 3 (10 min): High-level design draw karo
Step 4 (15 min): Deep dive (Kafka, retry, preferences)
Step 5 (10 min): Edge cases discuss karo
```

### Task 3: Questions Prepare Karo
```
Ye questions ka answer ready karo:
1. Why Kafka instead of direct API calls?
2. How to handle FCM/APNs downtime?
3. How to prevent duplicate notifications?
4. How to handle 10x traffic spike?
5. How to respect user's Do Not Disturb hours?
```

---

Kal Day 3 mein Rate Limiter design karenge.
