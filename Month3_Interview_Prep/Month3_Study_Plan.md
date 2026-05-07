# Month 3: Interview Prep — Complete Study Plan

---

## Overview

```
Week 9-10: Advanced System Design (Day 1–14)
Week 11:   DSA Medium Level (Day 15–21)
Week 12:   Mock Interviews + Apply (Day 22–28)
```

---

## Week 9–10: Advanced System Design (Day 1–14)

### Week 9: Core Systems

#### Day 1 — Design a Chat System (WhatsApp)
```
Topics:
  - 1-1 messaging vs group messaging
  - WebSockets for real-time
  - Message delivery status (sent/delivered/read)
  - Online/offline presence
  - Message storage (Cassandra)
  - Push notifications

Key components:
  Client → WebSocket Server → Message Queue → DB
  Presence Service → Redis
  Notification Service → FCM/APNs
```

#### Day 2 — Design a Notification System
```
Topics:
  - Push, Email, SMS notifications
  - Template management
  - User preferences (opt-in/out)
  - Rate limiting per user
  - Delivery tracking
  - Retry on failure

Components:
  API → Kafka → Notification Workers → FCM/Twilio/SES
```

#### Day 3 — Design a Search System (Google/Twitter)
```
Topics:
  - Inverted index kya hota hai
  - Crawling, indexing, ranking
  - Typeahead/autocomplete
  - Search ranking factors
  - Elasticsearch basics

Key concepts:
  Crawler → Parser → Indexer → Search API
  Trie for autocomplete
```

#### Day 4 — Design a Video Streaming (YouTube/Netflix)
```
Topics:
  - Video upload pipeline
  - Transcoding (multiple resolutions)
  - CDN for video delivery
  - Adaptive bitrate streaming (HLS/DASH)
  - Recommendation system basics

Components:
  Upload → Transcoding Queue → Storage (S3) → CDN → Client
```

#### Day 5 — Design a Ride-Sharing (Uber/Ola)
```
Topics:
  - Location tracking (GPS updates)
  - Driver matching algorithm
  - Surge pricing
  - Real-time map updates
  - Trip management

Key: Geospatial indexing (QuadTree, S2)
     WebSockets for location updates
```

#### Day 6 — Design a News Feed (Facebook/Twitter)
```
Topics:
  - Fan-out on write vs fan-out on read
  - Feed ranking algorithm
  - Pagination (cursor-based)
  - Celebrity problem (high follower count)
  - Cache strategy for feeds

Fan-out on write: Pre-compute feeds
Fan-out on read:  Compute on request
Hybrid: Regular users = write, celebrities = read
```

#### Day 7 — Week 9 Revision
```
- 6 systems ka diagram draw karo
- Common patterns identify karo
- Mock: "Design WhatsApp" 45 min
```

---

### Week 10: Advanced Topics

#### Day 8 — Design a Distributed Cache (Redis)
```
Topics:
  - Cache eviction policies (LRU, LFU, TTL)
  - Cache invalidation strategies
  - Cache stampede problem
  - Consistent hashing
  - Redis Cluster

Patterns:
  Cache-aside, Write-through, Write-behind
```

#### Day 9 — Design a Distributed Message Queue (Kafka)
```
Topics:
  - Producer, Consumer, Topic, Partition
  - Consumer groups
  - Message ordering guarantees
  - At-least-once vs exactly-once delivery
  - Retention policy
  - Kafka vs RabbitMQ
```

#### Day 10 — Design a Distributed Lock
```
Topics:
  - Why distributed locks needed
  - Redis SETNX approach
  - Redlock algorithm
  - Deadlock prevention
  - Lock timeout + renewal

Use cases: Payment processing, inventory update
```

#### Day 11 — Design a Metrics/Monitoring System
```
Topics:
  - Time series data
  - Metrics collection (Prometheus)
  - Visualization (Grafana)
  - Alerting rules
  - Log aggregation (ELK stack)

Components:
  App → Metrics Agent → Time Series DB → Dashboard
```

#### Day 12 — Consistency & Availability
```
Topics:
  - CAP theorem (Consistency, Availability, Partition tolerance)
  - ACID vs BASE
  - Strong vs Eventual consistency
  - Read/Write quorum
  - Vector clocks

Real examples:
  Banking → Strong consistency (ACID)
  Social media → Eventual consistency (BASE)
```

#### Day 13 — Microservices Patterns
```
Topics:
  - Service discovery
  - API Gateway pattern
  - Circuit breaker
  - Saga pattern (distributed transactions)
  - CQRS (Command Query Responsibility Segregation)
  - Event sourcing
```

#### Day 14 — Week 10 Revision + Mock
```
- All 12 systems quick recap
- Mock interview: "Design YouTube" 45 min
- Common interview questions list
- Weak areas identify karo
```

---

## Week 11: DSA Medium Level (Day 15–21)

### Focus: Most common interview patterns

#### Day 15 — Arrays & Two Pointers
```
Problems:
  - Two Sum (Easy → Medium variants)
  - 3Sum
  - Container With Most Water
  - Trapping Rain Water
  - Sliding Window Maximum

Pattern: Two pointers, sliding window
Time: O(n) solutions
```

#### Day 16 — Strings & Hashing
```
Problems:
  - Longest Substring Without Repeating Characters
  - Group Anagrams
  - Valid Parentheses
  - Minimum Window Substring
  - Encode/Decode Strings

Pattern: HashMap, sliding window
```

#### Day 17 — Linked Lists
```
Problems:
  - Reverse Linked List
  - Detect Cycle (Floyd's algorithm)
  - Merge Two Sorted Lists
  - LRU Cache (LinkedList + HashMap)
  - Find Middle of Linked List

Pattern: Fast/slow pointers, dummy node
```

#### Day 18 — Trees & BFS/DFS
```
Problems:
  - Binary Tree Level Order Traversal
  - Maximum Depth of Binary Tree
  - Validate BST
  - Lowest Common Ancestor
  - Serialize/Deserialize Binary Tree

Pattern: BFS (queue), DFS (recursion/stack)
```

#### Day 19 — Dynamic Programming (Basic)
```
Problems:
  - Climbing Stairs
  - House Robber
  - Coin Change
  - Longest Common Subsequence
  - 0/1 Knapsack

Pattern: Memoization, tabulation
```

#### Day 20 — Graphs
```
Problems:
  - Number of Islands
  - Clone Graph
  - Course Schedule (Topological sort)
  - Shortest Path (Dijkstra)
  - Word Ladder

Pattern: BFS/DFS, Union-Find
```

#### Day 21 — Week 11 Revision
```
- 30 problems ka quick review
- Time complexity table banao
- Weak topics identify karo
- 5 problems timed practice (30 min each)
```

---

## Week 12: Mock Interviews + Apply (Day 22–28)

#### Day 22 — Resume + LinkedIn
```
Tasks:
  - Resume update karo (projects add karo)
  - LinkedIn profile optimize karo
  - GitHub profile clean karo
  - Portfolio projects README update karo

Resume tips:
  - Quantify achievements (50% faster, 10k users)
  - Tech stack clearly mention karo
  - Projects: Problem → Solution → Impact
```

#### Day 23 — Behavioral Questions
```
STAR method: Situation, Task, Action, Result

Common questions:
  - "Tell me about yourself"
  - "Biggest challenge you faced"
  - "Conflict with teammate"
  - "Why do you want to leave current job?"
  - "Where do you see yourself in 5 years?"

Prepare 5-7 stories using STAR
```

#### Day 24 — Mock Interview 1 (System Design)
```
45 min timer lagao:
  "Design a URL Shortener" (already done!)
  
  Evaluate yourself:
  □ Requirements clarified?
  □ Capacity estimated?
  □ High-level design drawn?
  □ Deep dive done?
  □ Edge cases covered?
```

#### Day 25 — Mock Interview 2 (Coding)
```
2 problems, 45 min each:
  Problem 1: Medium array/string
  Problem 2: Medium tree/graph

Evaluate:
  □ Brute force first?
  □ Optimized solution?
  □ Edge cases handled?
  □ Code clean?
  □ Time/space complexity stated?
```

#### Day 26 — Mock Interview 3 (Full Round)
```
Simulate complete interview:
  - 5 min: Introduction
  - 15 min: Behavioral
  - 45 min: Coding (2 problems)
  - 30 min: System design
  - 5 min: Questions for interviewer

Record yourself (optional) → Review
```

#### Day 27 — Job Applications
```
Target companies:
  Tier 1: Google, Microsoft, Amazon, Flipkart
  Tier 2: Swiggy, Zomato, Razorpay, CRED
  Tier 3: Startups, product companies

Apply strategy:
  - LinkedIn Easy Apply
  - Company career pages
  - Referrals (most effective!)
  - AngelList for startups

Daily: Apply to 5-10 companies
```

#### Day 28 — Final Preparation
```
Last day checklist:
  □ All Month 1-3 topics reviewed?
  □ 50+ DSA problems solved?
  □ 10+ system designs practiced?
  □ Resume ready?
  □ 3 mock interviews done?
  □ 20+ companies applied?

Interview day tips:
  - Think out loud
  - Clarify before coding
  - Start with brute force
  - Test with examples
  - Ask good questions at end
```

---

## Resources

```
System Design:
  Book: "System Design Interview" by Alex Xu (Vol 1 + 2)
  YouTube: ByteByteGo, Gaurav Sen, Exponent
  Website: systemdesign.one, hellointerview.com

DSA:
  LeetCode: https://leetcode.com
  NeetCode: https://neetcode.io (best roadmap)
  YouTube: NeetCode, Abdul Bari

Mock Interviews:
  Pramp: https://pramp.com (free peer mock)
  Interviewing.io: https://interviewing.io
  LeetCode Mock: https://leetcode.com/interview

Job Boards:
  LinkedIn Jobs
  Naukri.com
  AngelList (startups)
  Instahyre
  Cutshort
```

---

## Folder Structure

```
Month3_Interview_Prep/
├── Month3_Study_Plan.md              ← Ye file
├── Week9-10_Advanced_System_Design/
│   ├── Day1_Chat_System.md
│   ├── Day2_Notification_System.md
│   └── ... Day3 to Day14
├── Week11_DSA/
│   ├── Day15_Arrays_Two_Pointers.md
│   └── ... Day16 to Day21
└── Week12_Mock_Interviews/
    ├── Day22_Resume_LinkedIn.md
    └── ... Day23 to Day28
```
