# Day 5 — System Prompts & Roles

Aaj samjhenge ki LLM ke saath conversation kaise structure hoti hai
aur system prompts se behavior kaise control karte hain.

---

## 1. Message Roles — 3 Types

```
OpenAI API mein har message ka ek "role" hota hai.
Role batata hai — ye message kisne bheja?

3 roles:
  system    → Developer ka instruction (LLM ka behavior define karo)
  user      → Human/user ka message
  assistant → LLM ka response (history ke liye)
```

### Visual Flow:
```
Developer sets:
┌─────────────────────────────────────────────────┐
│ role: "system"                                  │
│ content: "You are a helpful coding assistant"   │
└─────────────────────────────────────────────────┘
                      ↓
User types:
┌─────────────────────────────────────────────────┐
│ role: "user"                                    │
│ content: "What is a closure in JavaScript?"     │
└─────────────────────────────────────────────────┘
                      ↓
LLM responds:
┌─────────────────────────────────────────────────┐
│ role: "assistant"                               │
│ content: "A closure is a function that..."      │
└─────────────────────────────────────────────────┘
                      ↓
User types again:
┌─────────────────────────────────────────────────┐
│ role: "user"                                    │
│ content: "Give me a code example"               │
└─────────────────────────────────────────────────┘
```

---

## 2. System Role — LLM ka Behavior Define Karo

### System Prompt kya karta hai?
```
System prompt = LLM ko instructions deta hai ki:
  - Wo kaun hai (persona)
  - Kaise baat kare (tone)
  - Kya kare / kya na kare (rules)
  - Output format kya ho

Ye poori conversation mein apply hota hai.
User isko nahi dekh sakta (hidden from end user).
```

### Without System Prompt:
```
User:  "Review my code"
LLM:   "Sure! Your code looks good overall. Here are some suggestions..."
       (Generic, no specific style)
```

### With System Prompt:
```json
{
  "role": "system",
  "content": "You are a strict senior code reviewer at a top tech company.
              Be direct and critical. Point out every issue.
              Rate code 1-10. Never sugarcoat problems."
}
```
```
User:  "Review my code"
LLM:   "Rating: 4/10. Critical issues found:
        1. No error handling — this will crash in production
        2. SQL injection vulnerability on line 5
        3. O(n²) complexity — unacceptable for large datasets
        Fix these before this goes anywhere near production."
```

---

## 3. System Prompt Examples — Different Personas

### Persona 1: Strict Code Reviewer
```
You are a strict senior software engineer and code reviewer.
Your job is to find problems, not praise.

Rules:
- Always find at least 3 issues
- Rate code quality 1-10 (be harsh)
- Point out security vulnerabilities first
- Mention performance issues
- Suggest specific fixes with code

Format your response as:
RATING: X/10
CRITICAL ISSUES: (security, crashes)
MAJOR ISSUES: (logic, performance)
MINOR ISSUES: (style, naming)
FIXES: (code examples)
```

### Persona 2: Friendly Mentor
```
You are a friendly and encouraging programming mentor.
Your student is a beginner who gets discouraged easily.

Rules:
- Always start with something positive
- Explain issues gently, never harshly
- Use simple language, no jargon
- Give encouragement after criticism
- Celebrate small wins

Tone: Warm, supportive, patient
```

### Persona 3: Node.js Expert
```
You are a senior Node.js developer with 10 years of experience.
You specialize in building scalable REST APIs and microservices.

Always:
- Write production-ready code
- Use async/await (never callbacks)
- Include proper error handling with try/catch
- Add JSDoc comments
- Follow Node.js best practices

Never:
- Use var (use const/let)
- Write synchronous file operations
- Ignore error handling
```

### Persona 4: Concise Assistant
```
You are a concise technical assistant.
Rules:
- Maximum 3 sentences per answer
- No filler words ("certainly", "of course", "great question")
- Code examples only when explicitly asked
- Direct answers only
```

### Persona 5: Socratic Teacher
```
You are a Socratic programming teacher.
Instead of giving direct answers, guide students to find answers themselves.
Ask leading questions. Never give the solution directly.
Help them think, not just copy.
```

---

## 4. User Role — Human ka Message

```
User role = Jo end user type karta hai

Simple:
  {"role": "user", "content": "What is Node.js?"}

With context:
  {"role": "user", "content": "I'm building a REST API. What is Node.js?"}

With code:
  {"role": "user", "content": "Review this code:\n```js\nconst x = 1\n```"}

With instructions:
  {"role": "user", "content": "Explain in 2 sentences only: What is async/await?"}
```

---

## 5. Assistant Role — Conversation History

### LLM ki Memory Nahi Hoti:
```
IMPORTANT CONCEPT:
  LLM stateless hai — har API call independent hai
  LLM ko pata nahi kya hua pehle
  
  Solution: Poori conversation history har call mein bhejo
```

### Conversation History Kaise Kaam Karta Hai:
```javascript
// First message
const messages = [
  { role: "system", content: "You are a helpful assistant" },
  { role: "user",   content: "My name is Rahul" }
];

// LLM response aaya
const response1 = "Nice to meet you, Rahul!";

// History mein add karo
messages.push({ role: "assistant", content: response1 });

// Second message
messages.push({ role: "user", content: "What is my name?" });

// Ab poori history bhejo
// LLM dekh sakta hai: user ne naam bataya tha → "Rahul"
const response2 = await client.chat.completions.create({ messages });
// Output: "Your name is Rahul"
```

### Without History (Wrong):
```javascript
// Har baar fresh messages — LLM bhool jaata hai
const msg1 = [
  { role: "system", content: "You are helpful" },
  { role: "user",   content: "My name is Rahul" }
];
await client.chat.completions.create({ messages: msg1 });

const msg2 = [
  { role: "system", content: "You are helpful" },
  { role: "user",   content: "What is my name?" }  // History nahi!
];
await client.chat.completions.create({ messages: msg2 });
// Output: "I don't know your name" ← WRONG
```

---

## 6. Complete Conversation Example — Code

```javascript
// conversation.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Conversation history — yahan sab messages store honge
const messages = [
  {
    role: "system",
    content: `You are a senior Node.js developer and mentor.
              You help developers write better code.
              Be concise but thorough.
              Always include code examples when explaining concepts.`
  }
];

async function chat(userInput) {
  // User message add karo history mein
  messages.push({
    role: "user",
    content: userInput
  });

  // Poori history ke saath API call karo
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,       // Poori history
    temperature: 0.7,
    max_tokens: 600
  });

  const assistantReply = response.choices[0].message.content;

  // Assistant response bhi history mein add karo
  messages.push({
    role: "assistant",
    content: assistantReply
  });

  // Token usage print karo
  console.log(`[Tokens used: ${response.usage.total_tokens}]`);

  return assistantReply;
}

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Node.js Mentor Chat — type 'exit' to quit\n");

const ask = () => {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log(`\nTotal messages in history: ${messages.length}`);
      rl.close();
      return;
    }

    if (!input.trim()) { ask(); return; }

    const reply = await chat(input);
    console.log(`\nMentor: ${reply}\n`);
    ask();
  });
};

ask();
```

---

## 7. System Prompt vs User Prompt — Key Differences

```
Feature              System Prompt          User Prompt
───────────────────  ─────────────────────  ──────────────────────
Who writes it?       Developer              End user
Visible to user?     No (hidden)            Yes
When applied?        Entire conversation    Single message
Purpose              Behavior/persona       Specific task/question
Changes per message? No (set once)          Yes (every message)
Token cost?          Yes (every call)       Yes (every call)
```

### System Prompt Token Cost:
```
IMPORTANT: System prompt har API call mein count hota hai!

System prompt: 200 tokens
1000 calls/day → 200,000 extra tokens/day

Cost (GPT-4o-mini):
  200,000 × $0.15/1M = $0.03/day = $0.90/month

Isliye system prompt concise rakho!
```

---

## 8. Advanced: Dynamic System Prompts

```javascript
// User ke role ke hisaab se system prompt change karo
function getSystemPrompt(userRole) {
  const prompts = {
    beginner: `You are a patient teacher for programming beginners.
               Use simple language. Avoid jargon.
               Always give real-life analogies.`,

    intermediate: `You are a helpful coding assistant.
                   Assume basic programming knowledge.
                   Focus on best practices and patterns.`,

    expert: `You are a peer senior developer.
             Skip basics. Focus on architecture, performance, trade-offs.
             Be technical and concise.`
  };

  return prompts[userRole] || prompts.intermediate;
}

// Usage
const userRole = 'beginner'; // DB se fetch karo
const messages = [
  { role: "system", content: getSystemPrompt(userRole) },
  { role: "user",   content: userMessage }
];
```

---

## 9. Same Code — Different System Prompts

### Code to Review:
```javascript
function getUser(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  return db.execute(query);
}
```

### With Strict Reviewer System Prompt:
```
RATING: 2/10

CRITICAL ISSUES:
1. SQL INJECTION VULNERABILITY — Line 1
   "WHERE id = " + id allows malicious input
   Attacker can pass: id = "1 OR 1=1" → returns ALL users

2. No error handling — db.execute can throw, nothing catches it

3. No input validation — id could be null, undefined, or string

FIXES:
  // Use parameterized queries
  function getUser(id) {
    if (!id || isNaN(id)) throw new Error('Invalid user ID');
    const query = "SELECT * FROM users WHERE id = ?";
    return db.execute(query, [id]);
  }

This code should NOT go to production.
```

### With Friendly Mentor System Prompt:
```
Great start! You're on the right track with the basic structure.
I can see you're trying to fetch a user by ID — that's exactly right!

One thing we should improve together is how we build the query.
Right now we're directly adding the id into the query string, which
can cause a security issue called "SQL injection". Don't worry,
it's a very common mistake and easy to fix!

Here's a safer way:
  function getUser(id) {
    // Using ? placeholder keeps us safe
    const query = "SELECT * FROM users WHERE id = ?";
    return db.execute(query, [id]);
  }

You're doing great — security awareness is a sign of a growing developer!
```

Same code, same issue — completely different tone and approach.

---

## 10. Context Window aur History Management

```javascript
// History bahut badi ho jaaye toh trim karo
function manageHistory(messages, maxMessages = 20) {
  const systemPrompt = messages[0]; // System prompt hamesha rakho

  if (messages.length <= maxMessages + 1) {
    return messages; // Trim ki zaroorat nahi
  }

  // Last maxMessages messages rakho
  const recentMessages = messages.slice(-(maxMessages));

  console.log(`History trimmed: kept last ${maxMessages} messages`);
  return [systemPrompt, ...recentMessages];
}

// Usage in chat function:
async function chat(userInput) {
  messages.push({ role: "user", content: userInput });

  // Trim karo agar bahut bada ho gaya
  const trimmedMessages = manageHistory(messages);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: trimmedMessages
  });

  messages.push({
    role: "assistant",
    content: response.choices[0].message.content
  });

  return response.choices[0].message.content;
}
```

---

## 11. Quick Summary

```
role: system    → LLM ka behavior, persona, rules define karo
role: user      → Human ka message
role: assistant → LLM ka previous response (history ke liye)

Key points:
  ✓ LLM ki khud koi memory nahi — history manually bhejo
  ✓ System prompt poori conversation mein apply hota hai
  ✓ Same code + different system prompt = completely different response
  ✓ System prompt concise rakho (har call mein tokens count hote hain)
  ✓ History trim karo context window overflow se bachne ke liye
```

---

## 12. Practice Tasks (Aaj Karo)

### Task 1: Strict vs Friendly Reviewer
```
ChatGPT ya Claude open karo.

System Prompt 1 (Strict):
  "You are a strict code reviewer. Be harsh and direct.
   Find every issue. Rate 1-10. No sugarcoating."

System Prompt 2 (Friendly):
  "You are a friendly mentor for beginners.
   Be encouraging. Explain issues gently. Always end positively."

Same code dono ko do:
  function add(a, b) {
    return a + b
  }

Compare karo — tone, content, helpfulness.
```

### Task 2: Conversation History Test
```javascript
// Ye script run karo:

const messages = [
  { role: "system", content: "You are a helpful assistant" }
];

// Turn 1
messages.push({ role: "user", content: "My favorite language is Python" });
// API call karo, response add karo

// Turn 2
messages.push({ role: "user", content: "What is my favorite language?" });
// API call karo — LLM ko yaad hona chahiye

// Turn 3 — History remove karke test karo
const freshMessages = [
  { role: "system", content: "You are a helpful assistant" },
  { role: "user",   content: "What is my favorite language?" }
];
// API call karo — LLM nahi jaanta ab
```

### Task 3: Apna System Prompt Banao
```
Ek system prompt banao for:
  "An AI assistant that helps with JavaScript interview preparation.
   - Asks one question at a time
   - Gives hints if stuck (not full answer)
   - Rates answer 1-10
   - Explains correct answer after attempt"

Test karo: "Start my JavaScript interview"
```

---

Kal Day 6 mein Prompt Engineering Best Practices dekhenge —
Production mein kaise prompts likhte hain, common mistakes, optimization.
