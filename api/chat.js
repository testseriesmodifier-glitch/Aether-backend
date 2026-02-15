import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // --- 1. CORS HEADERS (FINAL FIX) ---
  // '*' মানে সবাই এক্সেস পাবে। Credentials বাদ দেওয়া হয়েছে যাতে কনফ্লিক্ট না হয়।
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // --- 2. PREFLIGHT REQUEST (OPTIONS) ---
  // ব্রাউজার যখন চেক করে, তখন তাকে 200 OK পাঠানো হচ্ছে
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- 3. METHOD CHECK ---
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
        systemInstruction: `
        You are Aether, the AI Physics Guide for PrepxaEdge.
        Your tone is calm, precise, and encouraging.
        Your goal is to conduct a Physics Viva.
        
        Rules:
        1. Keep answers concise (max 2-3 sentences unless asked for detail).
        2. Ask one follow-up question at a time.
        3. Use LaTeX for math equations (enclosed in $ for inline, $$ for block).
        4. If the answer is wrong, explain simply and ask to try again.
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
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
