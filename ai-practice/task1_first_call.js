// Task 1: First API Call + Full Response Explore
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Say hello in 3 languages" }],
  max_tokens: 100
});

// AI ka response
console.log("=== AI Response ===");
console.log(response.choices[0].message.content);

// Full response structure
console.log("\n=== Full Response Structure ===");
console.log(JSON.stringify(response, null, 2));
