# Day 3 — Prompts: LLM se Baat Karna

---

## 1. Prompt Kya Hota Hai?

```
Prompt = Jo tum LLM ko input dete ho
         (instruction + context + examples)

Simple analogy:
  Junior developer ko kaam dene jaisa hai

  Bad manager:   "Write code"          → Developer confused
  Good manager:  "Write a Node.js function that validates email addresses.
                  Use regex. Return true/false. Handle null input."
                 → Developer exactly jaanta hai kya karna hai

Same cheez LLM ke saath hoti hai.
```

### Bad vs Good Prompt:
```
Bad:   "Write code"
Good:  "Write a Node.js function that takes an array of numbers
        and returns the sum. Include error handling for non-numeric values."

Bad:   "Explain AI"
Good:  "Explain what an LLM is to a 15-year-old student who knows
        basic programming but has never studied AI. Use a simple analogy."

Bad:   "Fix my code"
Good:  "Fix this JavaScript function. It should return the largest number
        in an array but currently returns undefined for empty arrays.
        Keep the same function signature."
```

---

## 2. Prompt ke 4 Parts

### Part 1: System Prompt — LLM ka Role
```
LLM ko batao wo kaun hai, kaise behave kare

Example 1 — Coding Assistant:
  "You are a senior Node.js developer with 10 years of experience.
   Always write clean, production-ready code with error handling.
   Use async/await. Add JSDoc comments."

Example 2 — Teacher:
  "You are a patient programming teacher for beginners.
   Use simple language. Avoid jargon.
   Always give real-life analogies before technical explanation."

Example 3 — Code Reviewer:
  "You are a strict code reviewer. Find bugs, security issues,
   and performance problems. Be direct and specific."
```

### Part 2: User Message — Actual Task
```
Kya karna hai clearly batao

Vague:   "Help me with arrays"
Clear:   "Write a function to remove duplicate values from an array
          in JavaScript. Show 3 different approaches."
```

### Part 3: Context — Background Info
```
LLM ko relevant background do

Without context:
  "Fix the bug"  ← Kaunsa bug? Kaunsa code?

With context:
  "I'm building a REST API in Node.js with Express.
   Users can upload files. The upload works but the file size
   validation is not working. Here is my code: [code]"
```

### Part 4: Examples — Pattern Dikhao
```
Jab output format specific chahiye toh examples do

"Convert these to JSON:
  Input:  'John, 25, Engineer'
  Output: {"name": "John", "age": 25, "role": "Engineer"}

  Now convert: 'Sarah, 30, Designer'"
```

---

## 3. Prompt Types — Detail

### Type 1: Zero-shot Prompting
```
Koi example nahi dete — seedha kaam bolte hain
LLM apni training se answer karta hai
```

```
Prompt:  "Translate 'Hello, how are you?' to French"
Output:  "Bonjour, comment allez-vous?"

Prompt:  "What is the time complexity of binary search?"
Output:  "O(log n)"

Prompt:  "Write a haiku about programming"
Output:  "Code flows like water
          Bugs hide in the shadows deep
          Debug brings the light"
```

Kab use karein:
```
✓ Simple, well-defined tasks
✓ LLM already jaanta ho (common knowledge)
✓ Format flexible ho
```

---

### Type 2: Few-shot Prompting
```
Kuch examples deke LLM ko pattern sikhate hain
LLM pattern follow karta hai
```

```
Prompt:
  "Classify the sentiment of these reviews:

   Review: 'This product is amazing!'
   Sentiment: Positive

   Review: 'Worst purchase ever, total waste of money'
   Sentiment: Negative

   Review: 'It works fine, nothing special'
   Sentiment: Neutral

   Review: 'Absolutely love it, exceeded my expectations!'
   Sentiment: ?"

Output: "Positive"
```

```javascript
// Code mein few-shot:
const prompt = `Convert natural language to SQL:

Question: "Show all users from Mumbai"
SQL: SELECT * FROM users WHERE city = 'Mumbai';

Question: "Count orders placed today"
SQL: SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE();

Question: "Find top 5 most expensive products"
SQL: ?`;

// Output: SELECT * FROM products ORDER BY price DESC LIMIT 5;
```

Kab use karein:
```
✓ Specific output format chahiye
✓ LLM ko pattern follow karna ho
✓ Domain-specific tasks (SQL, regex, etc.)
✓ Consistent style chahiye
```

---

### Type 3: Chain of Thought (CoT)
```
LLM ko step-by-step sochne ke liye force karo
Complex problems mein accuracy badh jaati hai
```

Without CoT:
```
Prompt:  "If a train travels 120km in 2 hours, then stops for 30 minutes,
          then travels 80km in 1 hour, what is the average speed?"
Output:  "66.7 km/h"  ← Often WRONG
```

With CoT:
```
Prompt:  "Solve step by step:
          If a train travels 120km in 2 hours, then stops for 30 minutes,
          then travels 80km in 1 hour, what is the average speed?
          Think through each step carefully."

Output:
  Step 1: Total distance = 120 + 80 = 200 km
  Step 2: Total time = 2 hours + 0.5 hours (stop) + 1 hour = 3.5 hours
  Step 3: Average speed = 200 / 3.5 = 57.14 km/h
  Answer: 57.14 km/h  ← CORRECT
```

Magic phrase: "Think step by step" — ye add karne se accuracy badh jaati hai

```javascript
// CoT for code debugging:
const prompt = `Debug this code step by step:

\`\`\`javascript
function factorial(n) {
  if (n = 0) return 1;
  return n * factorial(n - 1);
}
\`\`\`

Steps to follow:
1. Read the code carefully
2. Identify what it should do
3. Trace through with n=3
4. Find the bug
5. Explain the fix`;
```

---

### Type 4: Role Prompting
```
LLM ko ek specific persona assign karo
Behavior aur tone change ho jaata hai
```

```
Same question, different roles:

Role: "You are a 5-year-old explaining things"
Q: "What is recursion?"
A: "It's like when you look in a mirror and see another mirror
    behind you, and you see mirrors inside mirrors forever!"

Role: "You are a CS professor"
Q: "What is recursion?"
A: "Recursion is a programming technique where a function calls
    itself with a modified parameter until a base case is reached..."

Role: "You are a comedian"
Q: "What is recursion?"
A: "To understand recursion, you must first understand recursion.
    Ba dum tss! 🥁"
```

---

### Type 5: Instruction Following
```
Specific constraints aur format define karo
```

```
Prompt:
  "Explain bubble sort.
   Requirements:
   - Under 100 words
   - Include one code example in Python
   - End with time complexity
   - No jargon, beginner friendly"
```

---

## 4. Prompt Engineering Best Practices

### DO's ✓
```
1. Specific instructions do
   Bad:  "Write something about databases"
   Good: "Write a 200-word comparison of SQL vs NoSQL databases
          focusing on when to use each one"

2. Output format specify karo
   "Return your answer as JSON with keys: {answer, confidence, sources}"
   "Use bullet points"
   "Write in markdown with headers"

3. Role assign karo
   "You are an expert Python developer..."
   "Act as a technical interviewer..."

4. Constraints batao
   "In under 50 words"
   "Only use built-in JavaScript methods"
   "Explain without using technical terms"

5. Examples do (few-shot)
   Jab specific pattern chahiye

6. Step-by-step sochne ke liye kaho
   "Think step by step"
   "Reason through this carefully"
```

### DON'Ts ✗
```
1. Vague mat raho
   ✗ "Make it better"
   ✓ "Improve the error handling and add input validation"

2. Multiple unrelated tasks ek prompt mein mat daalo
   ✗ "Write a login function, explain JWT, and list 10 Node.js libraries"
   ✓ Alag alag prompts karo

3. Negative instructions avoid karo
   ✗ "Don't use for loops"
   ✓ "Use array methods like map, filter, reduce instead of for loops"

4. Assume mat karo LLM context jaanta hai
   ✗ "Fix the bug I mentioned earlier"
   ✓ "Fix this bug: [paste the code and describe the bug]"
```

---

## 5. Prompt Template (Production Use)

```
You are a [ROLE with specific expertise].

Context:
[BACKGROUND INFORMATION - project, tech stack, constraints]

Task:
[EXACTLY what to do]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Output Format:
[JSON / Markdown / Plain text / Code]

Example (optional):
Input:  [example input]
Output: [example output]
```

### Real Example — Code Review Bot:
```
You are a senior JavaScript developer and code reviewer.

Context:
I'm building a REST API with Node.js and Express.
We follow clean code principles and use async/await.

Task:
Review the following code and identify issues.

Requirements:
- Find bugs (logic errors, edge cases)
- Find security vulnerabilities
- Suggest performance improvements
- Rate code quality 1-10

Output Format:
Return JSON:
{
  "bugs": [{"line": "", "issue": "", "fix": ""}],
  "security": [{"issue": "", "severity": "high/medium/low"}],
  "performance": ["suggestion1"],
  "rating": 7,
  "summary": "Overall assessment"
}

Code to review:
[PASTE CODE HERE]
```

---

## 6. Prompt Comparison — Same Question, Different Prompts

### Question: "Explain sorting"

#### Prompt 1 (Zero-shot, vague):
```
Prompt: "Explain sorting"

Output: "Sorting is the process of arranging elements in a specific order,
         typically ascending or descending. Common sorting algorithms include
         bubble sort, merge sort, quick sort..."
         
Quality: Generic, no depth, no examples
```

#### Prompt 2 (Better, with context):
```
Prompt: "Explain sorting algorithms to a beginner programmer
         with a real-life example"

Output: "Imagine you have a deck of playing cards scattered on a table.
         Sorting means arranging them in order (Ace to King).
         
         Bubble Sort: Pick up two adjacent cards, swap if out of order.
         Repeat until all cards are sorted. Simple but slow.
         
         Quick Sort: Pick one card as 'pivot'. Put smaller cards on left,
         larger on right. Repeat for each group. Fast!"
         
Quality: Better, has analogy, more relatable
```

#### Prompt 3 (Best, with role + format + specifics):
```
Prompt: "You are a programming teacher for beginners.
         Explain bubble sort with:
         1. A real-life analogy
         2. Step-by-step explanation
         3. Python code example with comments
         4. Time complexity at the end
         Keep it under 200 words."

Output: "Imagine sorting books on a shelf by height.
         You compare two adjacent books, swap if needed, move right.
         Repeat until no swaps needed.
         
         Steps:
         1. Compare arr[0] and arr[1] → swap if arr[0] > arr[1]
         2. Move to arr[1] and arr[2] → repeat
         3. After one pass, largest is at end
         4. Repeat for remaining elements
         
         \`\`\`python
         def bubble_sort(arr):
             n = len(arr)
             for i in range(n):           # n passes
                 for j in range(n-i-1):   # compare adjacent
                     if arr[j] > arr[j+1]:
                         arr[j], arr[j+1] = arr[j+1], arr[j]  # swap
             return arr
         \`\`\`
         
         Time Complexity: O(n²) — slow for large arrays"
         
Quality: Excellent — structured, code included, analogy, complexity
```

---

## 7. System Prompt vs User Prompt

```
System Prompt:
  - Ek baar set hota hai
  - LLM ka overall behavior define karta hai
  - User nahi dekh sakta (hidden)
  - Poori conversation mein apply hota hai

User Prompt:
  - Har message mein aata hai
  - Specific task/question
  - User directly likhta hai

Example:
  System: "You are a helpful coding assistant. Always include error handling."
  User:   "Write a function to read a file"
  
  LLM automatically error handling include karega
  kyunki system prompt mein tha
```

```javascript
// API mein:
const messages = [
  {
    role: "system",
    content: "You are a Node.js expert. Always use async/await and include error handling."
  },
  {
    role: "user",
    content: "Write a function to fetch data from an API"
  }
];
```

---

## 8. Practice Tasks (Aaj Karo)

### Task 1: Prompt Comparison
```
ChatGPT ya Claude open karo.
Same question 3 baar poochho:

Round 1: "Explain sorting"
Round 2: "Explain sorting algorithms to a beginner with a real-life example"
Round 3: "You are a teacher. Explain bubble sort step by step
          with code example in Python. Under 150 words."

Note karo:
  - Kitna different hai response?
  - Kaunsa most useful laga?
  - Kaunsa prompt best result diya?
```

### Task 2: Prompt Improve Karo
```
Ye bad prompts improve karo:

1. "Help me with JavaScript"
   → Tumhara improved version: ?

2. "Write a database"
   → Tumhara improved version: ?

3. "My code is broken fix it"
   → Tumhara improved version: ?

Sample answers:
1. "Explain the difference between let, const, and var in JavaScript
    with code examples showing when to use each one"

2. "Write a MongoDB schema for a blog application with users, posts,
    and comments. Include timestamps and relationships."

3. "Fix this Node.js code that should read a JSON file and parse it,
    but throws 'SyntaxError: Unexpected token' error:
    [paste code here]"
```

### Task 3: Apna Prompt Template Banao
```
Ek system prompt likho for:
  "A JavaScript code reviewer that:
   - Finds bugs
   - Suggests ES6+ improvements
   - Rates code 1-10
   - Returns JSON output"

Phir isko test karo kisi code pe.
```

---

Kal Day 4 mein Temperature aur LLM parameters dekhenge —
Randomness, creativity, aur output control kaise karte hain.
