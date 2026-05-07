// Task 3: System Prompt — Same question, 3 different personas
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askWithSystem(question, systemPrompt, label) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: question }
    ],
    max_tokens: 200,
    temperature: 0.7
  });

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Persona: ${label}`);
  console.log(`${"=".repeat(50)}`);
  console.log(response.choices[0].message.content);
}

const question = "Node.js";

await askWithSystem(
  `Ask top 5 advanced interview questions on ${question} for a developer with 10+ years of experience. Also provide detailed, production-level answers.`,
  "You are a senior backend architect. Focus on real-world scenarios, scalability, performance, and deep technical concepts. Keep answers concise but impactful.",
  "Expert Interviewer"
);

// await askWithSystem(
//   question,
//   "You are a teacher for beginners. Use simple words, real-life analogies. Be friendly.",
//   "Friendly Teacher"
// );

// await askWithSystem(
//   question,
//   "You are a strict technical interviewer at Google. Ask a follow-up question after answering.",
//   "Google Interviewer"
// );
