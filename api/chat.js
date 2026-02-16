export default async function handler(req, res) {
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
        if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

        const { message, history } = req.body;

        const messages = [
            { role: "system", content: "You are Aether, a helpful Physics AI Tutor. Keep answers precise. Use LaTeX for math." }
        ];

        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                const role = (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user';
                const content = msg.content || (msg.parts && msg.parts[0] ? msg.parts[0].text : "");
                if (content) messages.push({ role, content });
            });
        }

        messages.push({ role: "user", content: message });

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                // 🔥 চ্যাটের জন্য ফাস্ট মডেল
                model: "llama-3.1-8b-instant", 
                temperature: 0.7,
                max_tokens: 800
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const reply = data.choices?.[0]?.message?.content || "I am speechless!";
        return res.status(200).json({ reply: reply });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
