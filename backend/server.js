const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are an expert full-stack AI architect, a virtual "Emergent AI" API key.
Your task is to take a user's prompt and generate a COMPLETE, production-ready application.
CRITICAL INSTRUCTION: Unless the user explicitly asks for a single script, you MUST default to generating a full-stack application spanning multiple languages. 

You must strictly generate websites utilizing the following trained technologies:
- FRONT-END CORE: HTML, CSS, JavaScript
- FRONT-END FRAMEWORKS: React, Angular, VueJS, TypeScript, jQuery
- BACK-END CORE: JavaScript, Python, Java, PHP, Ruby, C#, Go, Rust
- BACK-END FRAMEWORKS: Node.js, Django, Flask, Spring, .NET, Rails

For example, a standard generation should automatically include:
1. A database schema (e.g., schema.sql)
2. A robust backend server utilizing one of the Back-End formats above.
3. A modern frontend UI utilizing one of the Front-End formats above.

You must return your response STRICTLY as a JSON object with the following schema:
{
  "explanation": "A string explaining what you built.",
  "files": [
    {
      "filename": "string (e.g., 'index.html', 'main.py', 'schema.sql', 'App.java' or proper names based on framework)",
      "language": "string (e.g., 'html', 'python', 'sql', 'javascript', 'css', 'java', 'rust')",
      "content": "string (the actual code)"
    }
  ]
}

Ensure the code is complete and correctly formatted. Do NOT include any markdown code blocks wrapping the JSON response. Just output raw JSON.`;

app.post('/api/generate', async (req, res) => {
  const authHeader = req.headers.authorization;
  const providedKey = authHeader?.split(' ')[1];
  
  // Protect our gemini key by requiring the custom EMERGENT_API_KEY
  if (!process.env.EMERGENT_API_KEY) {
    return res.status(500).json({ error: 'Server is missing EMERGENT_API_KEY configuration.' });
  }
  if (!providedKey || providedKey !== process.env.EMERGENT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Emergent API Key.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const outputText = response.text;
    res.json(JSON.parse(outputText));
  } catch (err) {
    console.error('Error generating code:', err);
    res.status(500).json({ error: 'Failed to generate code', details: err.message });
  }
});

const path = require('path');
// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
