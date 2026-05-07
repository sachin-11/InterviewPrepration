import Groq from 'groq-sdk';

let groqClient;

export function getGroq(config) {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
  }
  return groqClient;
}

export async function generateEmailBody(prompt, config) {
  const groq = getGroq(config);
  const messages = [
    {
      role: 'system',
      content:
        "You are an email content generator. Create professional email body text based on the user's request. Output only the email body, no subject line unless asked."
    },
    { role: 'user', content: prompt }
  ];

  const response = await groq.chat.completions.create({
    model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 700
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) {
    throw new Error('Empty model response');
  }
  return content.trim();
}
