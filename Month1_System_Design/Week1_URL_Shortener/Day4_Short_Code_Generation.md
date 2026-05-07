# Day 4 — Core Algorithm: Short Code Generation

Aaj ka sabse important topic — short code kaise generate karte hain?
Ye URL shortener ka dil hai. Kai approaches hain, har ek ke pros/cons hain.

---

## 1. Problem Statement

```
Input:  "https://www.example.com/very/long/url"
Output: "abc123"  (6-7 character unique code)

Requirements:
  - Unique hona chahiye (duplicate nahi)
  - Short hona chahiye (6-7 chars)
  - Fast generate hona chahiye
  - Predictable nahi hona chahiye (security)
```

---

## 2. Approach 1: Hashing (MD5 / SHA256)

### Kya hota hai hashing?
Koi bhi input lo → fixed size output milta hai

```
MD5("https://example.com")   = "5ababd603b22780302dd8d83498...  (32 chars hex)
SHA256("https://example.com") = "b94d27b9934d3e08a52e52d7da7..." (64 chars hex)
```

### URL Shortener mein use:
```
1. Original URL ka MD5/SHA256 hash nikalo
2. Pehle 6-7 characters lo
3. Ye hi short code hai
```

Example:
```
URL   = "https://example.com/blog"
MD5   = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
Code  = "a1b2c3"  (first 6 chars)
```

### Problem: Hash Collision
```
URL1 = "https://example.com/page1"  → MD5 first 6 = "a1b2c3"
URL2 = "https://example.com/page2"  → MD5 first 6 = "a1b2c3"  ← SAME! Collision!
```

Do alag URLs ka same short code ban gaya — ye problem hai.

### Collision Handle Karna:
```
Option 1: Append +1 aur retry karo
  "a1b2c3" already exists → try "a1b2c4" → try "a1b2c5"...

Option 2: URL ke saath timestamp bhi hash karo
  MD5("https://example.com" + "1710234567") → different hash

Option 3: Bloom filter use karo (check karo pehle se exist karta hai ya nahi)
```

### Hashing ka Summary:
```
Pros:
  + Same URL → same short code (idempotent)
  + Simple implement karna

Cons:
  - Collision possible hai
  - Retry logic complex ho jaata hai
  - Distributed system mein aur mushkil
```

---

## 3. Approach 2: Base62 Encoding

### Base62 kya hota hai?

Normal numbers Base10 mein hote hain (0-9, 10 digits).
Base62 mein 62 characters use karte hain:

```
Characters: a b c d e f g h i j k l m n o p q r s t u v w x y z
            A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
            0 1 2 3 4 5 6 7 8 9

Total = 26 + 26 + 10 = 62 characters
```

### Kitne combinations possible hain?

```
6 characters → 62^6  = 56,800,235,584  ≈ 56 billion
7 characters → 62^7  = 3,521,614,606,208 ≈ 3.5 trillion
```

56 billion kaafi hai — humne Day 2 mein dekha tha sirf 18 billion records 5 saal mein.

### Base62 Encoding Kaise Kaam Karta Hai?

```
Number ko Base62 mein convert karo:

Number = 12345

Step 1: 12345 ÷ 62 = 199 remainder 7   → char[7]  = 'h'
Step 2: 199   ÷ 62 = 3   remainder 13  → char[13] = 'n'
Step 3: 3     ÷ 62 = 0   remainder 3   → char[3]  = 'd'

Result (reverse karo): "dnh"

char array:
index: 0  1  2  3  4  5  6  7  8  9  10 ...
char:  a  b  c  d  e  f  g  h  i  j  k  ...
```

---

## 4. Approach 3: Auto-Increment ID + Base62 (Best Approach)

### Idea:
```
1. DB mein har URL insert pe auto-increment ID milta hai (1, 2, 3, 4...)
2. Us ID ko Base62 mein encode karo
3. Woh encoded string = short code
```

### Example:
```
ID = 1        → Base62 = "a"
ID = 62       → Base62 = "ba"
ID = 12345    → Base62 = "dnh"
ID = 1000000  → Base62 = "4c92"
ID = 56800235584 → Base62 = "aaaaaa"  (6 chars tak pahunchne mein time lagega)
```

### Flow:
```
User POST /shorten karta hai
        ↓
DB mein URL insert karo
        ↓
Auto-increment ID milta hai (e.g., 100523)
        ↓
Base62 encode karo → "q8X"
        ↓
short_code = "q8X" DB mein update karo
        ↓
Return "https://short.ly/q8X"
```

### Pros/Cons:
```
Pros:
  + No collision (ID always unique hota hai)
  + Simple aur fast
  + Predictable length (ID badhne pe length badhti hai)

Cons:
  - Sequential IDs predictable hain (security concern)
    ID 100 ke baad 101 guess kar sakte hain
  - Single DB pe dependent (distributed problem)
```

---

## 5. Distributed Systems Problem

Agar multiple servers hain toh auto-increment ID problem create karta hai:

```
Server 1: ID = 1, 2, 3, 4...
Server 2: ID = 1, 2, 3, 4...   ← SAME IDs! Collision!
```

### Solutions:

#### Option A: Single DB for ID Generation
```
Ek central DB sirf IDs generate kare
Baaki sab servers us DB se ID lein

Problem: Single point of failure
         Agar ye DB down → poora system down
```

#### Option B: DB per Server with Range
```
Server 1: IDs 1       to 1,000,000
Server 2: IDs 1000001 to 2,000,000
Server 3: IDs 2000001 to 3,000,000

Problem: Ek server ka range khatam ho jaaye toh?
```

#### Option C: Snowflake ID (Twitter ka approach)
```
64-bit ID banao jisme:
  - 41 bits: Timestamp (milliseconds)
  - 10 bits: Machine/Server ID
  - 12 bits: Sequence number (same millisecond mein)

Result: Globally unique, time-sorted IDs
        Koi central coordination nahi chahiye
```

```
Snowflake ID structure:
[0][41-bit timestamp][10-bit machine id][12-bit sequence]
 ↑
 sign bit (always 0)
```

#### Option D: UUID
```
UUID = "550e8400-e29b-41d4-a716-446655440000"  (128-bit random)

Pros: Globally unique, no coordination needed
Cons: Too long for short code, not sequential
```

---

## 6. Base62 Code — Khud Implement Karo

### Python Implementation:

```python
BASE62_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

def encode(num):
    """Convert integer ID to Base62 short code"""
    if num == 0:
        return BASE62_CHARS[0]
    
    result = []
    while num > 0:
        remainder = num % 62
        result.append(BASE62_CHARS[remainder])
        num //= 62
    
    return ''.join(reversed(result))  # reverse karo


def decode(short_code):
    """Convert Base62 short code back to integer ID"""
    result = 0
    for char in short_code:
        result = result * 62 + BASE62_CHARS.index(char)
    return result


# Test karo
print(encode(1))        # "b"  (index 1)
print(encode(62))       # "ba"
print(encode(12345))    # "dnh"
print(decode("dnh"))    # 12345
print(encode(decode("abc123")))  # "abc123" (round trip)
```

### JavaScript Implementation:

```javascript
const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function encode(num) {
    if (num === 0) return BASE62_CHARS[0];
    
    let result = '';
    while (num > 0) {
        result = BASE62_CHARS[num % 62] + result;
        num = Math.floor(num / 62);
    }
    return result;
}

function decode(shortCode) {
    let result = 0;
    for (const char of shortCode) {
        result = result * 62 + BASE62_CHARS.indexOf(char);
    }
    return result;
}

// Test
console.log(encode(12345));       // "dnh"
console.log(decode("dnh"));       // 12345
```

---

## 7. Comparison Table — Sab Approaches

```
Approach              Collision?   Scalable?   Simple?   Secure?
────────────────────  ───────────  ──────────  ────────  ────────
MD5/SHA256 Hashing    Yes (rare)   Yes         Yes       Yes
Auto-ID + Base62      No           No (single) Yes       No (seq)
Snowflake + Base62    No           Yes         Medium    Yes
UUID                  No           Yes         Yes       Yes
```

### Interview mein kya bolna chahiye:
```
"I'll use auto-increment ID with Base62 encoding for simplicity.
 For distributed scaling, I'll use Snowflake IDs to avoid
 coordination overhead while maintaining uniqueness."
```

---

## 8. Practice Task (Aaj Karo)

1. Python ya JavaScript mein Base62 encode/decode khud likho (bina dekhke)
2. Ye manually calculate karo:
   - encode(100) = ?
   - encode(999) = ?
   - decode("bB") = ?
3. Socho: agar 2 users same URL submit karein simultaneously,
   kya collision ho sakta hai? Kaise handle karoge?

Answers:
```
encode(100):
  100 ÷ 62 = 1 remainder 38 → char[38] = 'M'
  1   ÷ 62 = 0 remainder 1  → char[1]  = 'b'
  Result = "bM"

encode(999):
  999 ÷ 62 = 16 remainder 7  → char[7]  = 'h'
  16  ÷ 62 = 0  remainder 16 → char[16] = 'q'
  Result = "qh"

decode("bB"):
  'b' = index 1
  'B' = index 27
  Result = 1 × 62 + 27 = 89
```

---

Kal Day 5 mein High-Level Architecture dekhenge —
Load Balancer, App Servers, Redis Cache, DB sab ko connect karenge.
