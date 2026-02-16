export default async function handler(req, res) {
    // ১. পারমিশন (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'System Error: API Key Missing in Vercel.' });

        const { message, history } = req.body;

        // ২. প্রফেসরের ক্যারেক্টার
        const systemPrompt = `
        You are Professor Aether, a strict Physics Examiner.
        Rules:
        1. Ask one conceptual physics question.
        2. Keep it short.
        3. If answer is wrong, correct it.
        4. If correct, ask next question.
        `;

        const messages = [{ role: "system", content: systemPrompt }];
        
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                const role = (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user';
                const content = msg.content || (msg.parts && msg.parts[0] ? msg.parts[0].text : "");
                if (content) messages.push({ role, content });
            });
        }
        
        messages.push({ role: "user", content: message });

        // ৩. Groq API (Updated Model)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: "llama3-8b-8192", // 🔥 FIX: ছোট এবং ফাস্ট মডেল ব্যবহার করা হলো
                temperature: 0.6,
                max_tokens: 250
            })
        });

        const data = await response.json();

        // 🔥 FIX: আসল এরর চেক করা
        if (data.error) {
            return res.status(500).json({ error: `Groq Error: ${data.error.message}` });
        }

        const reply = data.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ error: "AI gave empty response." });
        }

        return res.status(200).json({ reply: reply });

    } catch (error) {
        console.error("Viva Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
