# Auto Email Generator

Automatically generate and send emails using AI.

## Features
- AI-powered email content generation
- Simple web interface
- Send emails directly

## Tech Stack
- Node.js + Express
- Nodemailer (email sending)
- Groq Llama (LLM for content generation)
- HTML/CSS/JavaScript frontend

## Setup
1. Install dependencies: `npm install`
2. Create a `.env` file with your email credentials and API keys:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   GROQ_API_KEY=your-groq-api-key
   ```
3. Run the server: `npm start`
4. Open http://localhost:3000 in your browser

## Usage
- Enter recipient email, subject, and a prompt for the email content
- Click "Generate and Send Email" to send