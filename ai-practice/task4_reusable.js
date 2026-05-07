// Task 4: Reusable ask() function
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function ask(question, options = {}) {
  const {
    temperature = 0.7,
    maxTokens   = 300,
    system      = 'You are a helpful assistant.'
  } = options;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: question }
    ]
  });

  return {
    answer: response.choices[0].message.content,
    tokens: response.usage.total_tokens
  };
}

// // Test 1: Default
// console.log("=== Test 1: Default ===");
// const r1 = await ask("What is Node.js?");
// console.log(r1.answer);
// console.log(`Tokens: ${r1.tokens}\n`);

// Test 2: Python expert, low temperature
// console.log("=== Test 2: Python Expert ===");
// const r2 = await ask("Write hello world in Python", {
//   system:      "You are a Python expert. Give code only, no explanation.",
//   temperature: 0.2,
//   maxTokens:   80
// });
// console.log(r2.answer);
// console.log(`Tokens: ${r2.tokens}\n`);

// Test 3: Creative — high temperature
// console.log("=== Test 3: Creative (high temp) ===");
// const r3 = await ask("Give me a unique startup idea", {
//   system:      "You are a creative entrepreneur. Give wild, unique ideas.",
//   temperature: 1.3,
//   maxTokens:   150
// });
// console.log(r3.answer);
// console.log(`Tokens: ${r3.tokens}`);
