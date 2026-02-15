import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS সেটআপ (আপনার ফ্রন্টএন্ড থেকে রিকোয়েস্ট এক্সেপ্ট করার জন্য)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://aether-backend-nnav.vercel.app'); // প্রোডাকশনে '*' এর বদলে আপনার ডোমেইন দিন
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key missing' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        // Aether-এর নতুন ব্যক্তিত্ব এখানে সেট করা হলো
        systemInstruction: `
        You are Aether, the AI Physics Guide for PrepxaEdge.
        Your tone is calm, precise, and encouraging.
        Your goal is to conduct a Physics Viva.
        
        Rules:
        1. Ask one question at a time.
        2. Use LaTeX for math equations (enclosed in $ for inline, $$ for block).
        3. Do NOT use \\text{} command in LaTeX.
        4. If the answer is wrong, explain the concept simply before moving on.
        5. Start by welcoming the student and asking for their preferred topic.
        `
    });

    const chat = model.startChat({
        history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS সেটআপ (আপনার ফ্রন্টএন্ড থেকে রিকোয়েস্ট এক্সেপ্ট করার জন্য)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://aether-backend-nnav.vercel.app'); // প্রোডাকশনে '*' এর বদলে আপনার ডোমেইন দিন
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key missing' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        // Aether-এর নতুন ব্যক্তিত্ব এখানে সেট করা হলো
        systemInstruction: `
        You are Aether, the AI Physics Guide for PrepxaEdge.
        Your tone is calm, precise, and encouraging.
        Your goal is to conduct a Physics Viva.
        
        Rules:
        1. Ask one question at a time.
        2. Use LaTeX for math equations (enclosed in $ for inline, $$ for block).
        3. Do NOT use \\text{} command in LaTeX.
        4. If the answer is wrong, explain the concept simply before moving on.
        5. Start by welcoming the student and asking for their preferred topic.
        `
    });

    const chat = model.startChat({
        history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
