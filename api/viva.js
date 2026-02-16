export default async function handler(req, res) {
    // ১. ব্রাউজার পারমিশন (CORS)
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

        // 🔥 প্রফেসর ইথারের ব্যক্তিত্ব (System Prompt)
        const systemPrompt = `
        You are Professor Aether, a strict but fair Physics Professor taking a Viva exam.
        Rules:
        1. Start by asking a conceptual physics question (e.g., regarding Quantum Mechanics, Thermodynamics, or Classical Mechanics).
        2. Wait for the student's answer.
        3. If the answer is vague, grill them with a follow-up question.
        4. If the answer is wrong, correct them sternly but briefly, then ask another question.
        5. Keep your responses short (conversational), like a real oral exam.
        6. Do NOT write long paragraphs. Speak like a human professor.
        7. If the student says "End Viva", give them a score out of 10 and a brutal feedback.
        `;

        // হিস্ট্রি সাজানো
        const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message }
        ];

        // Groq API (Llama 3 - Super Fast)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: "llama3-8b-8192",
                temperature: 0.7,
                max_tokens: 200
            })
        });

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || "Professor is silent...";

        return res.status(200).json({ reply: reply });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
