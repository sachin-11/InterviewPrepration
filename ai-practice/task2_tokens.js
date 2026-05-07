// Task 2: Token Usage — 3 different questions compare karo
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askAndShowCost(question) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: question }],
    max_tokens: 500
  });

  const usage = response.usage;

  console.log(`\nQuestion: "${question}"`);
  console.log(`Answer:   ${response.choices[0].message.content.slice(0, 80)}...`);
  console.log(`Tokens  → Input: ${usage.prompt_tokens} | Output: ${usage.completion_tokens} | Total: ${usage.total_tokens}`);
  console.log(`Cost    → FREE (Groq)`);
  console.log(`Finish  → ${response.choices[0].finish_reason}`);
  console.log("-".repeat(60));
}

console.log("=== Token Comparison: Short vs Medium vs Long ===\n");

await askAndShowCost("What is 2+2?");
await askAndShowCost("Explain recursion with an example");
await askAndShowCost("Write a complete REST API in Node.js");
