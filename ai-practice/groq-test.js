import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function main() {
  console.log("Calling Groq API (FREE)...\n");

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",  // GPT-4 level, completely free
    messages: [
      { role: "user", content: "Say hello in 3 languages" }
    ],
    max_tokens: 100
  });

  console.log("Response:", response.choices[0].message.content);

  console.log("\nToken Usage:");
  console.log("  Input tokens: ", response.usage.prompt_tokens);
  console.log("  Output tokens:", response.usage.completion_tokens);
  console.log("  Total tokens: ", response.usage.total_tokens);
  console.log("\nCost: $0.00 (FREE!)");
}

main().catch(console.error);
