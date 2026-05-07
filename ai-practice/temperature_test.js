// Temperature Practical Test — Llama on Groq
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askWithTemp(prompt, temperature) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: 80
  });
  return response.choices[0].message.content;
}

// // =============================================
// // TEST 1: Creative prompt — temperature fark dikhega
// // =============================================
// console.log("=== TEST 1: Creative Prompt ===");
// console.log("Prompt: 'Write a one-line tagline for a coffee shop'\n");

// const temps = [0, 0.5, 1.0, 1.5];

// for (const t of temps) {
//   // Open-ended prompt — temperature fark zyada dikhega
//   const result = await askWithTemp(
//     "Write a completely unique, unexpected, creative one-line tagline for a coffee shop. Be surprising and original. Do NOT use common phrases.",
//     t
//   );
//   console.log(`Temp ${t}: ${result}`);
// }

// =============================================
// TEST 2: Factual prompt — temperature fark nahi dikhega
// =============================================
// console.log("\n=== TEST 2: Factual Prompt (temp should not matter) ===");
// console.log("Prompt: 'What is the capital of Japan?'\n");

// for (const t of [0, 0.5, 1.0, 1.5]) {
//   const result = await askWithTemp("What is the capital of Japan?", t);
//   console.log(`Temp ${t}: ${result.trim()}`);
// }

// =============================================
// TEST 3: Same prompt, temp 0 — 3 baar run karo (same result?)
// =============================================
// console.log("\n=== TEST 3: Temp 0 — 3 baar same prompt (deterministic?) ===");
// console.log("Prompt: 'Complete: The sky is'\n");

// for (let i = 1; i <= 3; i++) {
//   const result = await askWithTemp("Complete this sentence in 5 words: The sky is", 0);
//   console.log(`Run ${i}: ${result.trim()}`);
// }

// =============================================
// TEST 4: Same prompt, temp 1.5 — 3 baar run karo (different results?)
// =============================================
// console.log("\n=== TEST 4: Temp 1.5 — 3 baar same prompt (random?) ===");
// console.log("Prompt: 'Complete: The sky is'\n");

// for (let i = 1; i <= 3; i++) {
//   const result = await askWithTemp("Complete this sentence in 5 words: The sky is", 1.5);
//   console.log(`Run ${i}: ${result.trim()}`);
// }
