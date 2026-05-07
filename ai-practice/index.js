import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  console.log("Calling OpenAI API...\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: "Say hello in 3 languages" }
    ],
    max_tokens: 100
  });

  // AI ka response
  console.log("Response:", response.choices[0].message.content);

  // Token usage
  console.log("\nToken Usage:");
  console.log("  Input tokens: ", response.usage.prompt_tokens);
  console.log("  Output tokens:", response.usage.completion_tokens);
  console.log("  Total tokens: ", response.usage.total_tokens);

  // Cost
  const cost = (
    (response.usage.prompt_tokens     / 1_000_000 * 0.15) +
    (response.usage.completion_tokens / 1_000_000 * 0.60)
  );
  console.log(`\nCost: $${cost.toFixed(6)}`);
}

main().catch(console.error);
