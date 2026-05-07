# Week 3: Advanced Prompting & Function Calling

---

## Day 1 — Advanced Prompt Techniques

### 1. Role Prompting (Persona):
```javascript
const systemPrompt = `You are a senior software architect with 15 years of experience.
You specialize in distributed systems and microservices.
When reviewing code or designs, you:
- Point out scalability issues first
- Suggest industry best practices
- Give concrete examples from real systems (Netflix, Uber, etc.)
- Rate solutions on a scale of 1-10`;
```

### 2. Chain of Thought (CoT):
```javascript
const prompt = `Solve this problem step by step:

A URL shortener gets 10 million new URLs per day.
Each URL record is 500 bytes.
How much storage is needed for 1 year?

Think through this carefully:
1. Calculate daily storage
2. Calculate yearly storage
3. Add 20% buffer for indexes and metadata
4. Convert to appropriate unit (GB/TB)`;
```

### 3. Self-Consistency:
```javascript
// Same question multiple times poochho, majority answer lo
async function selfConsistency(question, runs = 3) {
  const answers = [];

  for (let i = 0; i < runs; i++) {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
      temperature: 0.8  // Varied responses ke liye
    });
    answers.push(res.choices[0].message.content);
  }

  // Sab answers return karo — manually ya LLM se best choose karo
  return answers;
}
```

### 4. ReAct Pattern (Reason + Act):
```
Prompt: "You have access to a calculator and web search.
         To answer, think step by step:
         Thought: what do I need to do?
         Action: [calculator/search] with [input]
         Observation: result
         ... repeat ...
         Final Answer: ..."
```

---

## Day 2 — Structured Output (JSON Mode)

### JSON Mode:
```javascript
// LLM ko force karo JSON return karne ke liye
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "You are a data extractor. Always respond with valid JSON only."
    },
    {
      role: "user",
      content: `Extract information from this text and return JSON:
                "John is a 28-year-old software engineer from Mumbai 
                 who loves JavaScript and has 5 years of experience."`
    }
  ],
  response_format: { type: "json_object" }  // JSON mode
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data);
// {
//   "name": "John",
//   "age": 28,
//   "profession": "software engineer",
//   "city": "Mumbai",
//   "skills": ["JavaScript"],
//   "experience_years": 5
// }
```

### Structured Output with Schema:
```javascript
// Exact schema define karo
const systemPrompt = `Extract job posting details and return ONLY this JSON structure:
{
  "title": "job title",
  "company": "company name",
  "location": "city, country",
  "salary": { "min": number, "max": number, "currency": "USD" },
  "skills": ["skill1", "skill2"],
  "experience_years": number,
  "remote": true/false
}
If any field is not found, use null.`;
```

### Practice Task:
- Ek "Resume Parser" banao
- Input: Resume text
- Output: JSON with {name, email, skills[], experience[], education[]}

---

## Day 3 — Function Calling (Tool Use)

### Function Calling kya hota hai?
```
Normal LLM: Sirf text generate karta hai
Function Calling: LLM decide karta hai kaunsa function call karna hai

Example:
  User: "What's the weather in Mumbai?"
  LLM: "I need to call get_weather('Mumbai')"
  Your code: get_weather('Mumbai') call karo
  Result: "32°C, Sunny"
  LLM: "The weather in Mumbai is 32°C and sunny"
```

### Basic Function Calling:
```javascript
// Step 1: Functions define karo
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name, e.g. Mumbai, Delhi"
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit"
          }
        },
        required: ["city"]
      }
    }
  }
];

// Step 2: LLM ko tools ke saath call karo
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "What's the weather in Mumbai?" }],
  tools: tools,
  tool_choice: "auto"  // LLM decide kare kab function call karna hai
});

// Step 3: LLM ne function call kiya ya nahi check karo
const message = response.choices[0].message;

if (message.tool_calls) {
  const toolCall = message.tool_calls[0];
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  console.log(`LLM wants to call: ${functionName}`);
  console.log(`With args:`, args);
  // Output: LLM wants to call: get_weather
  //         With args: { city: 'Mumbai', unit: 'celsius' }
}
```

### Complete Function Calling Flow:
```javascript
// Actual functions
const functions = {
  get_weather: async ({ city, unit = 'celsius' }) => {
    // Real mein weather API call karo
    // Abhi mock data return karte hain
    return { city, temperature: 32, unit, condition: "Sunny" };
  },

  search_database: async ({ query, limit = 5 }) => {
    // DB search karo
    return { results: [`Result for: ${query}`], count: 1 };
  }
};

async function chatWithTools(userMessage) {
  const messages = [{ role: "user", content: userMessage }];

  // First call — LLM decide kare function chahiye ya nahi
  let response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools,
    tool_choice: "auto"
  });

  let assistantMessage = response.choices[0].message;
  messages.push(assistantMessage);

  // Function calls hain toh execute karo
  while (assistantMessage.tool_calls) {
    for (const toolCall of assistantMessage.tool_calls) {
      const funcName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      // Actual function execute karo
      const result = await functions[funcName](args);

      // Result messages mein add karo
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    // LLM ko result ke saath dobara call karo
    response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto"
    });

    assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);
  }

  return assistantMessage.content;
}

// Test
const answer = await chatWithTools("What's the weather in Mumbai and Delhi?");
console.log(answer);
```

---

## Day 4 — Multiple Tools & Complex Workflows

### Multiple Functions Define Karo:
```javascript
const tools = [
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description: "Get current stock price for a company",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Stock symbol e.g. AAPL, GOOGL" }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Perform mathematical calculations",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Math expression e.g. '100 * 1.05'" }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email to a user",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" }
        },
        required: ["to", "subject", "body"]
      }
    }
  }
];
```

### Parallel Function Calls:
```javascript
// GPT-4 ek saath multiple functions call kar sakta hai
// "What's the price of AAPL and GOOGL?"
// LLM dono ke liye simultaneously tool_calls return karega

if (message.tool_calls && message.tool_calls.length > 1) {
  // Parallel execute karo
  const results = await Promise.all(
    message.tool_calls.map(async (toolCall) => {
      const result = await functions[toolCall.function.name](
        JSON.parse(toolCall.function.arguments)
      );
      return {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      };
    })
  );
  messages.push(...results);
}
```

### Practice Task:
- Ek "Personal Finance Assistant" banao with tools:
  - `get_balance(account)` → mock balance return karo
  - `transfer_money(from, to, amount)` → mock transfer
  - `get_transactions(account, days)` → mock transactions
- User se baat karo: "Show my balance and last 5 transactions"

---

## Day 5 — Embeddings & Semantic Search

### Embedding kya hota hai?
```
Text → Numbers (vector) mein convert karna

"Hello"     → [0.23, -0.45, 0.12, ...]  (1536 numbers)
"Hi there"  → [0.21, -0.43, 0.14, ...]  (similar numbers!)
"Pizza"     → [0.89, 0.12, -0.67, ...]  (very different)

Similar meaning = similar numbers = close in vector space
```

### Embeddings API:
```javascript
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding; // Array of 1536 numbers
}

// Cosine similarity — do vectors kitne similar hain
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));
  return dotProduct / (mag1 * mag2);
}

// Semantic search
async function semanticSearch(query, documents) {
  const queryEmbedding = await getEmbedding(query);

  const results = await Promise.all(
    documents.map(async (doc) => {
      const docEmbedding = await getEmbedding(doc);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      return { doc, similarity };
    })
  );

  return results.sort((a, b) => b.similarity - a.similarity);
}

// Test
const docs = [
  "Node.js is a JavaScript runtime",
  "Python is great for data science",
  "Express.js is a web framework for Node",
  "React is a frontend library"
];

const results = await semanticSearch("backend JavaScript framework", docs);
console.log(results[0]); // Most relevant result
```

---

## Day 6 — Prompt Chaining

### Kya hota hai?
```
Complex task ko multiple smaller prompts mein todna
Output of one prompt → Input of next prompt
```

### Example: Blog Post Generator
```javascript
async function generateBlogPost(topic) {
  // Step 1: Outline generate karo
  const outlineRes = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Create a detailed outline for a blog post about: ${topic}
                Return as JSON: { "title": "", "sections": ["section1", ...] }`
    }],
    response_format: { type: "json_object" }
  });

  const outline = JSON.parse(outlineRes.choices[0].message.content);
  console.log("Outline:", outline);

  // Step 2: Har section ke liye content generate karo
  const sections = await Promise.all(
    outline.sections.map(async (section) => {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Write a paragraph for this blog section: "${section}"
                    Blog topic: ${topic}
                    Keep it under 150 words.`
        }]
      });
      return { heading: section, content: res.choices[0].message.content };
    })
  );

  // Step 3: Final blog assemble karo
  const fullBlog = `# ${outline.title}\n\n` +
    sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');

  return fullBlog;
}

const blog = await generateBlogPost("Why Node.js is great for APIs");
console.log(blog);
```

---

## Day 7 — Week 3 Revision + Project

### Mini Project: Smart Code Reviewer
```javascript
// code-reviewer.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function reviewCode(code, language = 'javascript') {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert ${language} code reviewer.
                  Analyze code for: bugs, security issues, performance, best practices.`
      },
      {
        role: "user",
        content: `Review this code:\n\`\`\`${language}\n${code}\n\`\`\``
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  });

  return JSON.parse(response.choices[0].message.content);
}

// Test
const code = `
function getUser(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  return db.execute(query);
}`;

const review = await reviewCode(code);
console.log(JSON.stringify(review, null, 2));
```

### Week 3 Key Concepts:
```
CoT Prompting    → Step-by-step reasoning
JSON Mode        → Structured output guarantee
Function Calling → LLM + real-world actions
Embeddings       → Text → vectors, semantic search
Prompt Chaining  → Complex tasks mein todna
```

---

Week 4 mein poora AI Chat Backend banayenge with Express.js.
