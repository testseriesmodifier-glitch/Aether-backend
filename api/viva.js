export default async function handler(req, res) {
    // ১. ব্রাউজার পারমিশন (CORS) - যাতে আপনার সাইট থেকে রিকোয়েস্ট আসে
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // প্রি-ফ্লাইট রিকোয়েস্ট হ্যান্ডেল করা
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'System Error: API Key Missing in Vercel.' });

        const { message, history } = req.body;

        // ২. প্রফেসরের ক্যারেক্টার (System Prompt)
        const systemPrompt = `
        You are Professor Aether, a strict Physics Examiner conducting a Viva Voce.
        
        INSTRUCTIONS:
        1. Ask ONE conceptual physics question at a time.
        2. Keep it short and direct.
        3. Evaluate the student's answer strictly.
        4. If wrong, correct them briefly.
        5. If correct, ask a harder follow-up.
        `;

        const messages = [{ role: "system", content: systemPrompt }];
        
        // হিস্ট্রি যোগ করা
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                const role = (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user';
                const content = msg.content || (msg.parts && msg.parts[0] ? msg.parts[0].text : "");
                if (content) messages.push({ role, content });
            });
        }
        
        messages.push({ role: "user", content: message });

        // ৩. Groq API (🔥 NEW STABLE MODEL)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                // 🔥 আগের মডেলটি বন্ধ হয়ে গেছে, তাই এটি ব্যবহার করছি
                model: "llama-3.3-70b-versatile", 
                temperature: 0.6,
                max_tokens: 300
            })
        });

        const data = await response.json();

        // ৪. এরর চেকিং (যাতে সার্ভার ক্র্যাশ না করে)
        if (data.error) {
            console.error("Groq API Error:", data.error);
            return res.status(500).json({ error: `AI Model Error: ${data.error.message}` });
        }

        const reply = data.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ error: "AI gave empty response." });
        }

        return res.status(200).json({ reply: reply });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
