# Day 6 — Prompt Engineering Best Practices

Aaj production-level prompt likhna seekhenge.
Ye woh skills hain jo real projects mein kaam aati hain.

---

## 1. DO's — Kya Karna Chahiye

### DO 1: Specific aur Clear Instructions Do

```
Bad:   "Write code"
Good:  "Write a Node.js async function named 'fetchUser' that:
        - Takes userId (number) as parameter
        - Fetches from https://api.example.com/users/{id}
        - Returns user object {id, name, email}
        - Throws error if user not found (404)"

Bad:   "Fix my code"
Good:  "Fix this JavaScript function. It should filter even numbers
        from an array but currently returns an empty array.
        Keep the same function name and parameter."
```

### DO 2: Output Format Specify Karo

```
"Return your answer as JSON"
"Use markdown with headers and bullet points"
"Give code only, no explanation"
"Respond in exactly 3 bullet points"
"Format: Problem | Cause | Solution"

Example:
  Bad:  "Analyze this code"
  Good: "Analyze this code and return JSON:
         {
           'bugs': ['bug description'],
           'rating': 1-10,
           'summary': 'one line summary'
         }"
```

### DO 3: Role Assign Karo

```
"You are a senior React developer..."
"Act as a database architect..."
"You are a security expert specializing in Node.js..."
"Behave as a technical interviewer at Google..."

Role assign karne se:
  - Response quality improve hoti hai
  - Tone appropriate hoti hai
  - Domain-specific knowledge activate hoti hai
```

### DO 4: Examples Do (Few-shot)

```
"Convert to camelCase:
  user_name     → userName
  first_name    → firstName
  email_address → ?

Answer: emailAddress"

LLM pattern samajh jaata hai — consistent output milta hai.
```

### DO 5: Constraints Batao

```
Length:    "In under 100 words"
           "Maximum 3 bullet points"
           "One sentence only"

Language:  "Only use Python"
           "Use ES6+ JavaScript"
           "No external libraries"

Audience:  "Explain to a 10-year-old"
           "Assume senior developer audience"
           "No technical jargon"

Scope:     "Focus only on performance issues"
           "Ignore styling, only logic"
```

### DO 6: Step-by-step Sochne ke Liye Kaho

```
Magic phrases:
  "Think step by step"
  "Reason through this carefully"
  "Show your work"
  "Break this down"

Kab use karein:
  - Math problems
  - Complex debugging
  - Architecture decisions
  - Multi-step reasoning

Example:
  Bad:  "What's wrong with this algorithm?"
  Good: "Analyze this algorithm step by step:
         1. Trace through with input [3,1,4,1,5]
         2. Identify where it goes wrong
         3. Explain why
         4. Suggest fix"
```

---

## 2. DON'Ts — Kya Nahi Karna Chahiye

### DON'T 1: Vague Instructions Mat Do

```
Vague → LLM guess karta hai → Wrong output

✗ "Write something about databases"
✓ "Write a 150-word comparison of PostgreSQL vs MongoDB,
    focusing on when to use each. Include one use case each."

✗ "Make it better"
✓ "Improve error handling in this function.
    Add try/catch, validate inputs, return meaningful error messages."

✗ "Help me with my project"
✓ "I'm building a REST API with Node.js and Express.
    Help me design the folder structure for a medium-sized project
    with authentication, database, and multiple routes."
```

### DON'T 2: Multiple Unrelated Tasks Ek Prompt Mein Mat Daalo

```
✗ "Write a login function, explain JWT tokens, list 10 Node.js
    libraries, and tell me about microservices architecture"

✓ Alag alag prompts karo:
  Prompt 1: "Write a login function with JWT"
  Prompt 2: "Explain JWT tokens"
  Prompt 3: "List top 10 Node.js libraries for REST APIs"
  Prompt 4: "Explain microservices architecture"

Kyun?
  - LLM ek task pe focus karta hai better
  - Output quality improve hoti hai
  - Easier to iterate and refine
```

### DON'T 3: Assume Mat Karo LLM Context Jaanta Hai

```
✗ "Fix the bug I mentioned earlier"
   (LLM nahi jaanta kaunsa bug — history mein nahi tha)

✓ "Fix this bug in my Node.js code:
    The function 'calculateTotal' returns NaN when items array is empty.
    Here is the code: [paste code]"

✗ "Use the same approach as before"
✓ "Use async/await with try/catch (same as the previous function I showed)"

Always provide full context in each message.
```

### DON'T 4: Negative Instructions Avoid Karo

```
Negative instructions LLM ke liye confusing hote hain.
Positive instructions better kaam karte hain.

✗ "Don't use for loops"
✓ "Use array methods: map, filter, reduce instead of loops"

✗ "Don't make it too long"
✓ "Keep response under 100 words"

✗ "Don't use technical terms"
✓ "Use simple everyday language, no programming jargon"

✗ "Don't give wrong information"
✓ "If unsure, say 'I'm not certain' instead of guessing"
```

### DON'T 5: Sensitive Info Prompt Mein Mat Daalo

```
✗ "My API key is sk-abc123, help me debug this"
✓ "Help me debug this API call (API key removed from code)"

✗ "User password is 'mypass123', why isn't login working?"
✓ "Login function not working, here's the code with placeholder values"

OpenAI prompts potentially logged ho sakte hain.
Sensitive data hamesha remove karo.
```

---

## 3. Production Prompt Template

```
You are a [SPECIFIC ROLE with expertise].

Context:
[BACKGROUND — project type, tech stack, constraints, audience]

Task:
[EXACTLY what to do — clear, specific, actionable]

Requirements:
- [Requirement 1 — specific]
- [Requirement 2 — specific]
- [Requirement 3 — specific]

Constraints:
- [Length/format constraint]
- [Technical constraint]

Output Format:
[Exact format — JSON schema / markdown structure / plain text]

Example:
Input:  [concrete example input]
Output: [exact expected output]
```

---

## 4. Real Prompt Examples — Production Quality

### Example 1: JavaScript Code Reviewer

```
You are a senior JavaScript developer with expertise in Node.js and security.

Context:
I'm building a production REST API. Code quality and security are critical.

Task:
Review the provided JavaScript code and identify all issues.

Requirements:
- Find bugs (logic errors, edge cases, null handling)
- Find security vulnerabilities (injection, auth issues, data exposure)
- Find performance problems (unnecessary loops, memory leaks)
- Suggest ES6+ improvements

Constraints:
- Be specific — mention line numbers or variable names
- Prioritize: Security > Bugs > Performance > Style

Output Format:
Return ONLY this JSON, no extra text:
{
  "rating": <number 1-10>,
  "bugs": [
    {"issue": "<description>", "fix": "<code fix>"}
  ],
  "security": [
    {"issue": "<description>", "severity": "high|medium|low", "fix": "<fix>"}
  ],
  "performance": ["<suggestion>"],
  "summary": "<one line overall assessment>"
}

Example:
Input:
  function getUser(id) {
    return db.query("SELECT * FROM users WHERE id = " + id);
  }

Output:
{
  "rating": 2,
  "bugs": [],
  "security": [
    {
      "issue": "SQL injection via string concatenation",
      "severity": "high",
      "fix": "db.query('SELECT * FROM users WHERE id = ?', [id])"
    }
  ],
  "performance": ["Add index on users.id column"],
  "summary": "Critical SQL injection vulnerability must be fixed immediately"
}
```

### Example 2: API Documentation Generator

```
You are a technical writer specializing in REST API documentation.

Context:
I'm documenting a Node.js/Express REST API for other developers.
Documentation should follow OpenAPI/Swagger style.

Task:
Generate documentation for the provided API endpoint code.

Requirements:
- Extract: endpoint path, HTTP method, parameters, request body, responses
- Include example request and response
- Note any authentication requirements
- Mention error responses

Output Format:
Markdown with these sections:
## [METHOD] [PATH]
**Description:** ...
**Auth:** Required/Not Required
**Parameters:** table
**Request Body:** JSON example
**Response 200:** JSON example
**Error Responses:** table

Example:
Input:
  app.get('/users/:id', auth, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({error: 'Not found'});
    res.json(user);
  });

Output:
## GET /users/:id
**Description:** Fetch a single user by ID
**Auth:** Required (Bearer token)
**Parameters:**
| Name | Type   | Required | Description |
|------|--------|----------|-------------|
| id   | string | Yes      | User ID     |
**Response 200:** {"id": "123", "name": "John", "email": "..."}
**Error Responses:**
| Code | Description    |
|------|----------------|
| 401  | Unauthorized   |
| 404  | User not found |
```

### Example 3: Bug Explainer for Beginners

```
You are a patient programming teacher for beginners.

Context:
My student is learning JavaScript and gets confused by error messages.
They need simple, encouraging explanations.

Task:
Explain the provided JavaScript error and how to fix it.

Requirements:
- Explain what the error means in simple words (no jargon)
- Show exactly where the problem is
- Give the fixed code
- Explain WHY the fix works

Constraints:
- Under 150 words total
- Use simple analogies if helpful
- End with an encouraging note

Output Format:
WHAT HAPPENED: [simple explanation]
THE PROBLEM: [point to specific line/code]
THE FIX: [corrected code]
WHY IT WORKS: [simple explanation]
KEEP GOING: [one encouraging sentence]
```

---

## 5. Iterative Prompt Refinement

```
Good prompts rarely come in one shot.
Iterate karo:

Step 1: Basic prompt likhke test karo
Step 2: Output dekho — kya missing hai?
Step 3: Constraint ya example add karo
Step 4: Test again
Step 5: Repeat

Example iteration:

v1: "Review my code"
    → Too generic, no structure

v2: "Review my JavaScript code for bugs"
    → Better but no output format

v3: "Review my JavaScript code for bugs. Return JSON with bugs array."
    → Good but JSON structure unclear

v4: "Review my JavaScript code. Return JSON:
     {bugs: [{line, issue, fix}], rating: 1-10}"
    → Much better

v5: Add example input/output
    → Production ready
```

---

## 6. Prompt Testing Checklist

```
Before using a prompt in production, check:

□ Output format consistent hai? (10 baar run karo)
□ Edge cases handle hote hain? (empty input, null, long text)
□ Hallucination check kiya? (wrong info de raha hai?)
□ Token count reasonable hai? (system prompt too long?)
□ Temperature sahi set hai? (code=low, creative=high)
□ Few-shot examples accurate hain?
□ Negative instructions positive mein convert kiye?
□ Sensitive data remove kiya?
```

---

## 7. Common Prompt Mistakes aur Fixes

```
Mistake 1: Asking for opinion as fact
  ✗ "What is the best JavaScript framework?"
  ✓ "Compare React, Vue, Angular for a large enterprise app.
      List pros/cons of each. No opinion, just facts."

Mistake 2: Too many requirements
  ✗ "Write code that is fast, secure, readable, well-commented,
      uses design patterns, handles all errors, is testable,
      follows SOLID principles, and uses TypeScript"
  ✓ Focus on 2-3 most important requirements

Mistake 3: No example for complex output
  ✗ "Return structured data about the user"
  ✓ Always show exact JSON structure with example

Mistake 4: Forgetting to specify language
  ✗ "Write a function to sort an array"
  ✓ "Write a JavaScript function to sort an array of objects
      by the 'age' property in ascending order"

Mistake 5: Not testing with edge cases
  Always test with: empty input, null, very long input, special characters
```

---

## 8. Prompt Optimization for Cost

```javascript
// Token-efficient prompt writing

// BEFORE (verbose — 85 tokens):
const systemPrompt = `You are an extremely helpful, knowledgeable,
and friendly AI assistant who specializes in answering questions
about programming and software development. You always provide
clear, accurate, and detailed explanations with practical code
examples when appropriate and necessary.`;

// AFTER (concise — 28 tokens, same meaning):
const systemPrompt = `You are a programming expert.
Give clear, accurate answers with code examples when relevant.`;

// Savings: 57 tokens × 1000 calls/day = 57,000 tokens/day
// GPT-4o-mini: 57,000 × $0.15/1M = $0.0086/day = $0.26/month saved
```

---

## 9. Practice Tasks (Aaj Karo)

### Task 1: Production Prompt Banao
```
Ye prompt banao using the template:

Role: JavaScript code reviewer
Task: Review code aur bugs dhundho
Output: JSON format:
  {
    "bugs": [{"line": "", "issue": "", "fix": ""}],
    "suggestions": ["suggestion1"],
    "rating": 7
  }
Example bhi include karo.

Phir test karo is code pe:
  async function fetchData(url) {
    const res = fetch(url)
    const data = res.json()
    return data
  }
```

### Task 2: Bad Prompts Fix Karo
```
Ye prompts improve karo:

1. "Tell me about Node.js"
   → Your improved version: ?

2. "Don't write long code, don't use callbacks, don't forget errors"
   → Your improved version: ?

3. "Write a function"
   → Your improved version: ?

4. "Make my API better"
   → Your improved version: ?
```

### Task 3: Prompt Comparison
```
Same task, 2 different prompts:

Prompt A (bad):
  "Explain async await"

Prompt B (good — tumhara):
  [Write your own good version]

Run both on ChatGPT.
Compare: Which is more useful? Why?
```

### Task 4: Token Optimization
```
Ye system prompt optimize karo — 50% tokens mein same meaning:

Original:
"You are a very helpful and knowledgeable programming assistant
 who always tries to provide the most accurate, detailed, and
 useful information possible to help developers solve their
 coding problems and improve their programming skills."

Your optimized version: ?
```

---

## 10. Week 1 Preview — Kal Revision

```
Kal Day 7 — Week 1 ka poora revision aur quiz.

Topics covered this week:
  Day 1: AI kya hai, LLM kya hai, types
  Day 2: Tokens — cost, context window, speed
  Day 3: Prompts — types, structure, examples
  Day 4: Temperature, Top-P, max_tokens
  Day 5: System prompts, roles, conversation history
  Day 6: Best practices, templates, production prompts

Revision ke liye:
  - Har day ke key points ek baar padho
  - Quiz questions khud se answer karo
  - Ek complete prompt template khud se likhke test karo
```

---

Kal Day 7 — Week 1 Revision + Quiz.
Poore week ka summary aur self-assessment karenge.
