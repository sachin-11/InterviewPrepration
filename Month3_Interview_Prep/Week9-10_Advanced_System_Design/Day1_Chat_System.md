# Day 1 — Design a Chat System (WhatsApp)

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. 1-1 messaging (two users ke beech)
2. Group messaging (max 500 members)
3. Message delivery status (sent ✓, delivered ✓✓, read ✓✓ blue)
4. Online/offline presence
5. Push notifications (app background mein ho)
6. Media sharing (images, videos) — optional
7. Message history (last 30 days)
```

### Non-Functional Requirements:
```
High Availability:   99.99% uptime
Low Latency:         < 100ms message delivery
Scale:               500 million DAU
Storage:             60 billion messages/day
Consistency:         Message order preserve karo
```

---

## 2. Capacity Estimation (5 min)

```
DAU:                500 million
Messages/user/day:  40
Total messages/day: 500M × 40 = 20 billion

Message size:       ~100 bytes (text)
Storage/day:        20B × 100 = 2 TB/day
Storage/year:       2TB × 365 = ~730 TB

QPS (send):         20B / 86400 = ~230,000 msg/sec
Peak QPS:           ~500,000 msg/sec

WebSocket connections: 500M concurrent (peak)
```

---

## 3. High-Level Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              CLIENTS                     │
                    │   (iOS, Android, Web)                   │
                    └──────────────┬──────────────────────────┘
                                   │ WebSocket / HTTP
                    ┌──────────────▼──────────────────────────┐
                    │           LOAD BALANCER                  │
                    └──────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼──────┐  ┌──────────▼──────┐  ┌─────────▼──────┐
    │  Chat Server 1  │  │  Chat Server 2  │  │  Chat Server 3  │
    │  (WebSocket)    │  │  (WebSocket)    │  │  (WebSocket)    │
    └─────────┬───────┘  └──────────┬──────┘  └─────────┬───────┘
              │                     │                    │
              └─────────────────────┼────────────────────┘
                                    │
              ┌─────────────────────┼────────────────────┐
              │                     │                    │
    ┌─────────▼──────┐  ┌──────────▼──────┐  ┌─────────▼──────┐
    │  Message Queue  │  │  Presence       │  │  Notification   │
    │  (Kafka)        │  │  Service        │  │  Service        │
    └─────────┬───────┘  │  (Redis)        │  │  (FCM/APNs)     │
              │           └─────────────────┘  └────────────────┘
    ┌─────────▼──────┐
    │  Message Store  │
    │  (Cassandra)    │
    └────────────────┘
```

---

## 4. WebSockets — Real-time Communication

### HTTP vs WebSocket:
```
HTTP (Polling):
  Client: "Koi message hai?" → Server: "Nahi"
  Client: "Koi message hai?" → Server: "Nahi"
  Client: "Koi message hai?" → Server: "Haan! Ye lo"
  Problem: Wasteful, high latency

WebSocket:
  Client ←→ Server: Persistent bidirectional connection
  Server: "Message aaya! Ye lo" (push, no polling)
  Benefit: Real-time, low latency, efficient
```

### WebSocket Flow:
```
1. Client → HTTP Upgrade request → Server
2. Server → 101 Switching Protocols
3. Persistent TCP connection established
4. Both sides can send messages anytime

Connection per user:
  User A connects → Chat Server 1 pe WebSocket
  User B connects → Chat Server 2 pe WebSocket
  
  A → B message:
  A → Server 1 → Kafka → Server 2 → B
```

### Why Multiple Chat Servers?
```
500M concurrent WebSocket connections
1 server: ~50,000 connections max
Servers needed: 500M / 50K = 10,000 servers

Problem: A is on Server 1, B is on Server 2
Solution: Message Queue (Kafka) connects servers
```

---

## 5. Message Flow — 1-1 Messaging

```
Step 1: User A sends message to User B
        A → WebSocket → Chat Server 1

Step 2: Chat Server 1:
        a. Message DB mein save karo (Cassandra)
        b. Message ID generate karo (Snowflake)
        c. Kafka mein publish karo

Step 3: Kafka → Chat Server 2 (B ka server)

Step 4: Chat Server 2:
        B online hai? → WebSocket se deliver karo
        B offline hai? → Notification Service ko bhejo

Step 5: Delivery status update:
        B receives → "delivered" status A ko bhejo
        B reads    → "read" status A ko bhejo
```

### Message Status:
```
✓   = Sent (server ne receive kiya)
✓✓  = Delivered (recipient ke device pe pahuncha)
✓✓🔵 = Read (recipient ne dekha)

Implementation:
  sent:      Message DB mein save hone pe
  delivered: Recipient ka device online aaya, message mila
  read:      Recipient ne chat open kiya
```

---

## 6. Group Messaging

```
Group mein 500 members hain
A sends message to group

Approach 1: Fan-out on write
  A → Server → 499 members ko individually deliver karo
  Problem: 499 writes per message → Slow for large groups

Approach 2: Fan-out on read
  A → Server → Group message store karo
  Members read karte waqt fetch karo
  Problem: Read pe slow

WhatsApp approach:
  Small groups (< 100): Fan-out on write
  Large groups (> 100): Fan-out on read + cache

Group message storage:
  group_messages table:
    group_id, message_id, sender_id, content, timestamp
  
  member_last_read table:
    group_id, user_id, last_read_message_id
```

---

## 7. Presence Service

### Online/Offline Status:
```
User online hone pe:
  WebSocket connect → Presence Service → Redis SET user:123:online = 1 EX 30

User offline hone pe:
  WebSocket disconnect → Redis DELETE user:123:online

Heartbeat (every 5 seconds):
  Client → Server: "I'm alive"
  Server → Redis: EXPIRE user:123:online 30 (reset TTL)

Check if user online:
  Redis GET user:123:online
  → "1" = online
  → nil = offline (TTL expired)
```

### Last Seen:
```
User offline hone pe:
  Redis SET user:123:last_seen = timestamp

Display:
  "Online" / "Last seen today at 3:45 PM"
```

---

## 8. Message Storage — Cassandra

### Why Cassandra?
```
SQL (MySQL):
  ✗ Billions of messages → Slow queries
  ✗ Horizontal scaling mushkil
  ✗ Single point of failure

Cassandra:
  ✓ Distributed, horizontally scalable
  ✓ High write throughput (billions/day)
  ✓ Time-series data ke liye optimized
  ✓ No single point of failure
  ✓ WhatsApp, Discord use karte hain
```

### Schema:
```sql
-- 1-1 Messages
CREATE TABLE messages (
  conversation_id  UUID,
  message_id       BIGINT,    -- Snowflake ID (time-sorted)
  sender_id        BIGINT,
  content          TEXT,
  message_type     TEXT,      -- text, image, video
  status           TEXT,      -- sent, delivered, read
  created_at       TIMESTAMP,
  PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- conversation_id = hash(min(user1, user2), max(user1, user2))
-- Ensures same conversation_id for both users

-- Group Messages
CREATE TABLE group_messages (
  group_id    UUID,
  message_id  BIGINT,
  sender_id   BIGINT,
  content     TEXT,
  created_at  TIMESTAMP,
  PRIMARY KEY (group_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```

### Query Pattern:
```
Load last 20 messages:
  SELECT * FROM messages
  WHERE conversation_id = ?
  ORDER BY message_id DESC
  LIMIT 20;

Load older messages (pagination):
  SELECT * FROM messages
  WHERE conversation_id = ?
  AND message_id < last_seen_message_id
  LIMIT 20;
```

---

## 9. Push Notifications

### When to Send:
```
User B offline hai → Message aaya → Push notification bhejo

Flow:
  Chat Server → Notification Service → FCM (Android) / APNs (iOS)
  → Device pe notification
```

### Notification Service:
```
Notification Service:
  1. User ka device token fetch karo (DB se)
  2. FCM/APNs API call karo
  3. Notification deliver karo

Device token store:
  user_devices table:
    user_id, device_token, platform (ios/android), last_active
```

### Important: Push Notification Reliable Kaise Banaye?
```
Problem:
  FCM/APNs 100% guaranteed delivery nahi dete.
  Kabhi network issue, OS battery optimization, invalid token,
  notification permission off, ya app killed hone ki wajah se
  notification miss ho sakti hai.

Rule:
  Push notification ko "source of truth" mat banao.
  Source of truth = Cassandra message store + delivery/read ACK.
```

### Reliable Notification Flow:
```
1. Message receive:
   Chat Server message ko Cassandra mein store karega.
   Status = sent

2. Recipient online hai:
   WebSocket se message deliver karo.
   Client ACK bheje: message_received(message_id)
   Server status = delivered

3. Recipient offline/background mein hai:
   Notification Service FCM/APNs push bhejega.
   Saath mein message_id / conversation_id payload mein bhejega.

4. App open / foreground / reconnect:
   Client last_received_message_id server ko bhejega.
   Server Cassandra se missing messages fetch karke sync karega.

5. Agar push miss ho gayi:
   Koi data loss nahi hoga, kyunki message DB mein stored hai.
   Next app open, reconnect, ya periodic background sync par
   missing messages automatically aa jayenge.
```

### Retry + Ack Mechanism:
```
Notification Service:
  1. FCM/APNs send karo
  2. Response check karo:
     - success      → notification_sent mark karo
     - invalid token → token delete/update karo
     - retryable error → exponential backoff retry
  3. Notification events Kafka/DLQ mein store karo

Client ACKs:
  delivered_ack:
    Device ne message receive kar liya

  read_ack:
    User ne chat open karke message dekh liya

Server:
  ACK nahi aaya to message "undelivered" rahega.
  User reconnect kare to undelivered messages dobara sync honge.
```

### Android + iOS Best Practices:
```
Android:
  - FCM high priority sirf real user messages ke liye use karo
  - Notification permission check karo
  - Doze mode ke liye data sync reconnect pe zaroor karo
  - Token refresh handle karo

iOS:
  - APNs token refresh handle karo
  - Background push limited hoti hai, us par guarantee mat rakho
  - App foreground mein ho to local/in-app notification dikhao
  - App open hote hi server sync mandatory rakho

Common:
  - Multiple devices per user support karo
  - Har device ka separate device_token store karo
  - Per-device delivery ACK track karo
  - Push collapse key carefully use karo, warna old notifications replace ho sakti hain
```

### Interview Answer:
```
"FCM/APNs best-effort systems hain, isliye main push notification ko
message delivery guarantee nahi maanta. Main pehle message durable store
mein save karta hoon, phir WebSocket ya push se notify karta hoon.
Client har message ka delivered/read ACK bhejta hai. Agar push miss ho jaye,
client reconnect/app open par last_received_message_id bhejta hai aur server
Cassandra se missing messages sync kar deta hai. Isse Android/iOS dono mein
notification miss hone par bhi message loss nahi hota."
```

---

## 10. Complete Architecture Diagram

```
User A (Mobile)                    User B (Mobile)
      │                                   │
      │ WebSocket                         │ WebSocket
      ▼                                   ▼
┌─────────────┐                   ┌─────────────┐
│ Chat Server │                   │ Chat Server │
│     1       │                   │     2       │
└──────┬──────┘                   └──────┬──────┘
       │                                 │
       │ Publish                         │ Subscribe
       ▼                                 ▼
┌─────────────────────────────────────────────────┐
│                   KAFKA                          │
│  Topic: messages                                 │
│  Partition by: conversation_id                   │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼──┐   ┌─────▼──┐  ┌─────▼──────────┐
    │Cassandra│   │ Redis  │  │  Notification  │
    │(Messages│   │(Presence│  │  Service       │
    │ Store)  │   │ Cache) │  │  (FCM/APNs)    │
    └─────────┘   └────────┘  └────────────────┘
```

---

## 11. Interview Questions & Answers

### Q: "How do you handle message ordering?"
```
Snowflake ID use karo:
  - Timestamp-based (time-sorted)
  - Same millisecond mein bhi unique
  - Cassandra mein message_id se sort karo
  
  Client-side: Optimistic UI (message turant dikhao)
  Server-side: Snowflake ID se final order
```

### Q: "What if Chat Server crashes?"
```
1. Load Balancer health check detect karega
2. Client WebSocket disconnect hoga
3. Client reconnect karega (exponential backoff)
4. New server pe connect hoga
5. Missed messages Cassandra se fetch honge
6. Kafka messages durable hain (replay possible)
```

### Q: "How to scale to 500M users?"
```
Chat Servers: Horizontal scaling (10,000+ servers)
Kafka:        Partitioned by conversation_id
Cassandra:    Distributed, auto-sharding
Redis:        Redis Cluster for presence
CDN:          Media files ke liye
```

### Q: "How to handle offline messages?"
```
User offline hai:
  1. Message Cassandra mein store karo
  2. Push notification bhejo (FCM/APNs)
  
User online aaya:
  1. WebSocket connect
  2. Last seen message_id se newer messages fetch karo
  3. Deliver karo
  4. "Delivered" status update karo
```

---

## 12. Quick Summary

```
Core components:
  WebSocket Servers  → Real-time bidirectional communication
  Kafka              → Message routing between servers
  Cassandra          → Message storage (scalable, time-series)
  Redis              → Presence service (online/offline)
  FCM/APNs           → Push notifications

Key decisions:
  WebSocket > HTTP polling (real-time)
  Cassandra > MySQL (scale, write throughput)
  Kafka > Direct delivery (decoupling, reliability)
  Snowflake ID > UUID (time-sorted, unique)

Message status:
  sent → delivered → read
  Tracked via acknowledgments
```

---

## 13. Practice Tasks (Aaj Karo)

### Task 1: Diagram Draw Karo
```
Blank paper pe draw karo:
  Client → Load Balancer → Chat Servers → Kafka → Cassandra
  Presence Service → Redis
  Notification Service → FCM
```

### Task 2: Mock Answer
```
45 min timer lagao:
"Design a chat system like WhatsApp"

Step 1 (5 min):  Requirements clarify karo
Step 2 (5 min):  Capacity estimate karo
Step 3 (10 min): High-level design draw karo
Step 4 (15 min): Deep dive (WebSocket, Cassandra, Presence)
Step 5 (10 min): Edge cases discuss karo
```

### Task 3: Questions Prepare Karo
```
Ye questions ka answer ready karo:
1. Why WebSocket over HTTP?
2. Why Cassandra over MySQL?
3. How to handle message ordering?
4. What happens when server crashes?
5. How to scale to 1 billion users?
```

---

Kal Day 2 mein Notification System design karenge.
