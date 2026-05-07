# Day 4 — Design a Search System (Google / Twitter Search)

---

## 1. Requirements Clarify Karo (5 min)

### Functional Requirements:
```
1. Full-text search (documents, tweets, web pages)
2. Typeahead / Autocomplete (user type kare toh suggestions aayein)
3. Relevant results return karo (ranking)
4. Filters support karo (date, language, type)
5. Near real-time indexing (Twitter: tweet aaya → 5 sec mein searchable)
```

### Non-Functional Requirements:
```
High Availability:   99.99% uptime
Low Latency:         < 200ms search results
Scale:               1 billion documents indexed
                     10,000 search queries/sec
Freshness:           New content 5-10 sec mein searchable (Twitter)
                     Web crawl: days/weeks (Google)
```

---

## 2. Capacity Estimation (5 min)

```
Documents:          1 billion web pages / tweets
Avg document size:  10 KB
Raw storage:        1B × 10KB = 10 PB

Index size:         ~20% of raw (inverted index compressed)
                    = 2 PB

Search QPS:         10,000 queries/sec
Peak QPS:           30,000 queries/sec

Typeahead QPS:      50,000 req/sec
(har keystroke pe ek request)

Crawl rate (Google): 1 billion pages / 30 days
                   = ~400 pages/sec
```

---

## 3. High-Level Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              CLIENTS                     │
                    │   (Browser, Mobile App)                 │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │           API GATEWAY                    │
                    └──────┬───────────────────┬──────────────┘
                           │                   │
              ┌────────────▼──────┐   ┌────────▼────────────┐
              │   Search API      │   │  Typeahead API       │
              │   Service         │   │  Service             │
              └────────┬──────────┘   └────────┬────────────┘
                       │                       │
              ┌────────▼──────────┐   ┌────────▼────────────┐
              │  Elasticsearch    │   │   Trie / Redis       │
              │  (Search Index)   │   │   (Autocomplete)     │
              └───────────────────┘   └─────────────────────┘

                    INDEXING PIPELINE (Background)

    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Crawler │──▶│  Parser  │──▶│  Indexer │──▶│  Search  │
    │          │   │          │   │          │   │  Index   │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
         │
    ┌────▼─────┐
    │  URL     │
    │  Frontier│
    │  (Queue) │
    └──────────┘
```

---

## 4. Inverted Index — Core Concept

### Normal Index vs Inverted Index:
```
Normal Index (Forward Index):
  Document 1: "I love cats and dogs"
  Document 2: "Cats are great pets"
  Document 3: "Dogs are loyal animals"

  DocID → Words
  Doc1 → [I, love, cats, dogs]
  Doc2 → [cats, great, pets]
  Doc3 → [dogs, loyal, animals]

  Problem: "cats" dhundna hai → Sab documents scan karo → Slow!

Inverted Index:
  Word → [DocIDs]

  "cats"    → [Doc1, Doc2]
  "dogs"    → [Doc1, Doc3]
  "love"    → [Doc1]
  "great"   → [Doc2]
  "loyal"   → [Doc3]
  "animals" → [Doc3]

  Search "cats":
    Inverted index mein "cats" → [Doc1, Doc2]
    Directly Doc1, Doc2 return karo → Super fast!

With positions (for phrase search):
  "cats"  → [Doc1:(pos:3), Doc2:(pos:1)]
  "love"  → [Doc1:(pos:2)]

  Search "love cats":
    "love" positions + "cats" positions
    Doc1: love=pos2, cats=pos3 → consecutive → Match!
```

### Inverted Index with TF-IDF (Ranking):
```
TF  = Term Frequency  (word kitni baar document mein aaya)
IDF = Inverse Document Frequency (word kitne documents mein hai)

TF-IDF = TF × IDF

Example:
  "the" → bahut common word → Low IDF → Low score
  "elasticsearch" → rare word → High IDF → High score

  Document jo rare words match kare → Higher ranking
```

---

## 5. Crawling System

### Web Crawler Architecture:
```
Step 1: Seed URLs
  Starting URLs: [google.com, wikipedia.org, ...]
  URL Frontier (Queue) mein daalo

Step 2: Crawler Workers
  URL Frontier se URL uthao
  HTTP GET request karo
  HTML content download karo

Step 3: Parser
  HTML parse karo
  Text extract karo
  New links extract karo → URL Frontier mein daalo

Step 4: Duplicate Detection
  URL already crawled? → Skip karo
  Content duplicate? → Skip karo (SimHash use karo)

Step 5: Indexer
  Parsed content → Inverted Index mein add karo

Flow:
  URL Frontier → Crawler → Parser → Indexer → Search Index
                    ↑           │
                    └───────────┘
                    (New URLs discovered)
```

### URL Frontier (Priority Queue):
```
Sab URLs equal nahi hote:

Priority factors:
  - PageRank (important sites pehle crawl karo)
  - Freshness (news sites baar baar crawl karo)
  - Last crawl time (recently crawled → lower priority)

Implementation:
  High priority queue: News sites, popular domains
  Medium priority queue: Regular websites
  Low priority queue: Rarely updated sites

Politeness:
  Ek domain pe baar baar request mat karo
  robots.txt respect karo
  Rate limit: 1 request/second per domain
```

### Distributed Crawling:
```
1 crawler: 400 pages/sec → Too slow for web scale

Distributed crawlers:
  1000 crawler workers × 400 pages/sec = 400,000 pages/sec

URL assignment:
  URL hash % num_crawlers = crawler_id
  Same domain → Same crawler (politeness maintain)

Deduplication:
  Bloom Filter: URL already visited? (memory efficient)
  Redis SET: Exact dedup (more accurate)
```

---

## 6. Indexing Pipeline

```
Raw Document → Tokenizer → Normalizer → Indexer → Search Index

Step 1: Tokenizer
  Input:  "Hello World! How are you?"
  Output: ["Hello", "World", "How", "are", "you"]

Step 2: Normalizer
  Lowercase:    ["hello", "world", "how", "are", "you"]
  Stop words remove: ["hello", "world"]  (how, are, you = stop words)
  Stemming:     ["hello", "world"]
    (running → run, cats → cat, better → good)

Step 3: Inverted Index Update
  "hello" → [doc_id: 123, position: 1, tf: 1]
  "world" → [doc_id: 123, position: 2, tf: 1]

Step 4: Store
  Elasticsearch mein index update karo
```

### Near Real-time Indexing (Twitter):
```
Tweet aaya → Kafka → Indexer → Elasticsearch
                                    ↓
                              In-memory buffer
                                    ↓
                            Flush every 1 second
                                    ↓
                            Searchable in ~5 sec

Elasticsearch near real-time:
  Default refresh interval: 1 second
  New documents 1 second mein searchable ho jaate hain
```

---

## 7. Search Ranking

### Ranking Factors:
```
Google-style ranking:

1. Relevance Score (TF-IDF / BM25)
   - Query words document mein kitni baar hain?
   - Rare words match → Higher score

2. PageRank
   - Kitne important sites link karte hain is page ko?
   - Wikipedia → High PageRank
   - New unknown site → Low PageRank

3. Freshness
   - Recent content → Higher score (news queries)
   - "latest iphone" → Recent articles prefer karo

4. User Signals
   - Click-through rate (CTR): Zyada click → Higher rank
   - Dwell time: User page pe zyada ruka → Good signal
   - Bounce rate: Turant wapas aaya → Bad signal

5. Query-Document Match
   - Title mein keyword → High score
   - URL mein keyword → Medium score
   - Body mein keyword → Lower score

Twitter-style ranking:
   - Recency (recent tweets first)
   - Engagement (likes, retweets)
   - User you follow → Higher priority
   - Verified accounts → Slight boost
```

### BM25 — Modern Ranking Algorithm:
```
BM25 (Best Match 25) — Elasticsearch default

Better than TF-IDF because:
  - Document length normalize karta hai
  - Long document mein word zyada baar aana = unfair advantage
  - BM25 ye fix karta hai

Score formula (simplified):
  score = IDF × (TF × (k+1)) / (TF + k × (1 - b + b × dl/avgdl))

  k = 1.2 (term frequency saturation)
  b = 0.75 (length normalization)
  dl = document length
  avgdl = average document length
```

---

## 8. Typeahead / Autocomplete

### Trie Data Structure:
```
Trie = Tree where each node = one character

Insert: "cat", "car", "card", "care", "dog"

         root
        /    \
       c      d
       |      |
       a      o
      / \     |
     t   r    g*
     *  / \
       d   e
       *   *

* = word ends here

Search "ca":
  root → c → a → [t*, r → d*, r → e*]
  Suggestions: ["cat", "card", "care"]

Time complexity: O(prefix_length) → Very fast!
```

### Trie with Frequency:
```
Har node pe frequency store karo:

"cat"  → searched 1000 times
"car"  → searched 5000 times
"card" → searched 2000 times
"care" → searched 3000 times

Search "ca" → Top 3 by frequency:
  1. "car"  (5000)
  2. "care" (3000)
  3. "card" (2000)
  4. "cat"  (1000)

Return top 5 suggestions
```

### Typeahead System Design:
```
                    ┌─────────────────┐
User types "sea"    │   Typeahead     │
──────────────────▶ │   API Service   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Cache    │  ← "sea" → [search, season, seal]
                    │  (Trie results) │    Cache hit → instant return
                    └────────┬────────┘
                             │ Cache miss
                    ┌────────▼────────┐
                    │  Trie Service   │  ← In-memory Trie
                    │  (In-memory)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Trie Builder   │  ← Daily/hourly rebuild
                    │  (Batch job)    │    from search logs
                    └─────────────────┘

Trie update strategy:
  Option 1: Real-time update → Too slow (Trie lock karna padega)
  Option 2: Offline rebuild → Every hour new Trie build karo
            Search logs → Aggregate → New Trie → Swap

Data collection:
  User searches "iphone 15" → Log karo
  Aggregate: "iphone" → 1M searches/day
  Trie mein frequency update karo
```

### Typeahead at Scale:
```
Problem: Single Trie server → 50,000 req/sec → Overload

Solution: Shard by prefix

  Shard 1: a-f  → "apple", "facebook", "cat"
  Shard 2: g-m  → "google", "microsoft", "hello"
  Shard 3: n-s  → "netflix", "search", "python"
  Shard 4: t-z  → "twitter", "youtube", "zoom"

User types "go" → Shard 2 pe jaao → "google", "gmail", "go"

Each shard: In-memory Trie + Redis cache
```

---

## 9. Elasticsearch — Basics

### Kya Hai:
```
Elasticsearch = Distributed search engine
  - Apache Lucene pe based
  - JSON documents store karta hai
  - Full-text search, analytics
  - Horizontal scaling (shards)
  - Near real-time (1 sec refresh)

Terminology:
  Index     = Database (tweets_index, products_index)
  Document  = Row (ek tweet, ek product)
  Field     = Column (title, content, timestamp)
  Shard     = Index ka ek piece (distributed)
  Replica   = Shard ki copy (availability)
```

### Elasticsearch Architecture:
```
Cluster (3 nodes):

  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │   Node 1    │  │   Node 2    │  │   Node 3    │
  │  (Master)   │  │  (Data)     │  │  (Data)     │
  │             │  │             │  │             │
  │  Shard 0 P  │  │  Shard 1 P  │  │  Shard 2 P  │
  │  Shard 1 R  │  │  Shard 2 R  │  │  Shard 0 R  │
  └─────────────┘  └─────────────┘  └─────────────┘

P = Primary Shard
R = Replica Shard

Index: tweets_index
  3 primary shards (data distribute)
  1 replica per shard (availability)

Node 2 down:
  Shard 1 P gone → Shard 1 R (Node 1) → Primary ban jaata hai
  No data loss ✓
```

### Search Query Flow:
```
Search "elasticsearch tutorial"

Step 1: Query → Any node (Coordinating node)
Step 2: Coordinating node → Sab shards pe query bhejo
Step 3: Each shard → Local search → Top results return karo
Step 4: Coordinating node → Results merge karo → Re-rank
Step 5: Final top 10 results → Client ko return karo

Query example:
{
  "query": {
    "multi_match": {
      "query": "elasticsearch tutorial",
      "fields": ["title^3", "content", "tags^2"]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "timestamp": "desc" }
  ],
  "size": 10
}

title^3 = title field ka weight 3x (title match → higher score)
tags^2  = tags field ka weight 2x
```

---

## 10. Complete Search Flow

```
User searches "machine learning tutorial"

Step 1: Query Processing
  Input: "machine learning tutorial"
  Tokenize: ["machine", "learning", "tutorial"]
  Remove stop words: ["machine", "learning", "tutorial"]
  (no stop words here)

Step 2: Elasticsearch Query
  Search API → Elasticsearch cluster
  Query: match "machine learning tutorial"
  Fields: title (3x weight), content (1x), tags (2x)

Step 3: Shard Search
  Shard 0: Top 10 results
  Shard 1: Top 10 results
  Shard 2: Top 10 results

Step 4: Merge & Rank
  30 results → BM25 score se sort karo
  Re-rank with: freshness, CTR, PageRank
  Final top 10

Step 5: Return
  Results with: title, snippet, URL, timestamp
  Response time: < 100ms

Step 6: Log
  Search query log karo → Typeahead update ke liye
  Click log karo → Ranking improve ke liye
```

---

## 11. Interview Questions & Answers

### Q: "What is an inverted index?"
```
Inverted index ek data structure hai jo
word → [document IDs] mapping store karta hai.

Normal index: Document → Words (forward)
Inverted index: Word → Documents (inverted)

Search "cats":
  Inverted index mein "cats" → [Doc1, Doc2, Doc5]
  Directly in documents return karo → O(1) lookup

Without inverted index:
  Sab documents scan karo → O(n) → Billions of docs pe slow
```

### Q: "How does typeahead work at scale?"
```
Trie data structure use karo:
  - Prefix se suggestions dhundna O(prefix_length)
  - Frequency store karo → Popular suggestions pehle

Scale ke liye:
  - Prefix se shard karo (a-f, g-m, n-s, t-z)
  - Redis cache: Common prefixes cache karo
  - Offline rebuild: Har ghante search logs se Trie update karo
  - CDN: Typeahead responses cache karo (popular prefixes)
```

### Q: "How to handle near real-time indexing?"
```
Twitter use case:
  Tweet aaya → Kafka → Indexer → Elasticsearch
  
  Elasticsearch refresh interval: 1 second
  New tweet 1-2 seconds mein searchable

Tradeoff:
  Refresh interval kam karo → Faster indexing, more CPU
  Refresh interval badha do → Slower indexing, less CPU
  
  Twitter: 1 second (near real-time needed)
  Google: Minutes to hours (freshness less critical)
```

### Q: "How to rank search results?"
```
Multiple signals combine karo:

1. Text relevance: BM25 score (query-document match)
2. Authority: PageRank / follower count
3. Freshness: Recent content boost
4. Personalization: User history, location
5. User signals: CTR, dwell time (ML model)

Learning to Rank (LTR):
  ML model train karo on user click data
  Features: BM25 score, PageRank, freshness, CTR
  Output: Final ranking score
  
  This is what Google/Twitter actually does
```

### Q: "How to scale search to 1 billion documents?"
```
Elasticsearch horizontal scaling:
  1B documents → 10 shards × 100M docs each
  Each shard: Separate Lucene index
  
  Search: All 10 shards parallel mein search karo
  Merge: Results combine karo
  
  More shards → More parallelism → Faster search
  
  Hardware:
    Each node: 64GB RAM, SSD storage
    10 nodes × 10 shards = 100 shard capacity
    
  Caching:
    Popular queries Redis mein cache karo
    Cache hit rate 80%+ → DB load drastically kam
```

---

## 12. Quick Summary

```
Core components:
  Crawler        → Web pages / tweets collect karo
  Parser         → HTML → Clean text
  Indexer        → Inverted index build karo
  Elasticsearch  → Distributed search engine
  Trie           → Typeahead / autocomplete
  Redis          → Cache (typeahead results, search results)
  Kafka          → Real-time indexing pipeline

Key concepts:
  Inverted Index → Word to Document mapping (fast search)
  BM25           → Modern ranking algorithm
  TF-IDF         → Term frequency × Inverse doc frequency
  Trie           → Prefix tree for autocomplete
  Sharding       → Index distribute karo (scale)
  Replica        → Availability ke liye copy

Key decisions:
  Elasticsearch > MySQL (full-text search)
  Trie > SQL LIKE query (autocomplete speed)
  Kafka > Direct write (real-time indexing pipeline)
  BM25 > TF-IDF (better ranking)
  Offline Trie rebuild > Real-time update (consistency)
```

---

## 13. Practice Tasks (Aaj Karo)

### Task 1: Diagram Draw Karo
```
Blank paper pe draw karo:
  Crawler → Parser → Kafka → Indexer → Elasticsearch
  Search API → Elasticsearch → Results
  Typeahead API → Trie/Redis → Suggestions
```

### Task 2: Inverted Index Manually Banao
```
In 3 sentences ka inverted index banao:
  S1: "the quick brown fox"
  S2: "the fox jumped high"
  S3: "quick brown rabbit"

Expected:
  "the"   → [S1, S2]
  "quick" → [S1, S3]
  "fox"   → [S1, S2]
  "brown" → [S1, S3]
  ...
```

### Task 3: Mock Answer
```
45 min timer lagao:
"Design Google Search / Twitter Search"

Step 1 (5 min):  Requirements clarify karo
Step 2 (5 min):  Capacity estimate karo
Step 3 (10 min): High-level design (Crawler → Index → Search)
Step 4 (15 min): Deep dive (Inverted index, Ranking, Typeahead)
Step 5 (10 min): Edge cases discuss karo
```

### Task 4: Questions Prepare Karo
```
Ye questions ka answer ready karo:
1. What is an inverted index and how does it work?
2. How does typeahead work at 50,000 req/sec?
3. How to rank search results?
4. How to handle near real-time indexing?
5. How to scale to 1 billion documents?
```

---

Kal Day 5 mein YouTube / Video Streaming System design karenge.
