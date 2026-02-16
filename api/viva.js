export default async function handler(req, res) {
    // ১. পারমিশন (CORS) - যাতে আপনার ওয়েবসাইট থেকে রিকোয়েস্ট আসে
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const apiKey = process.env.GROQ_API_KEY; // Vercel থেকে কি (Key) নেবে
        if (!apiKey) return res.status(500).json({ error: 'Professor Brain Missing (API Key)' });

        const { message, history } = req.body;

        // ২. প্রফেসরের ক্যারেক্টার (খুবই গুরুত্বপূর্ণ)
        const systemPrompt = `
        You are Professor Aether, a strict external examiner conducting a Physics Viva Voce.
        
        PROTOCOL:
        1.  **Tone:** Formal, strict, but fair. Like a university professor.
        2.  **Action:** Ask ONE conceptual question at a time.
        3.  **Evaluation:** - If the student answers correctly: Say "Correct." and immediately ask a harder follow-up question.
            - If vague: Say "Be precise." and ask to clarify.
            - If wrong: Correct them in one sentence and move to a new topic.
        4.  **Brevity:** Keep responses SHORT. Do not lecture. This is an oral exam.
        5.  **Termination:** If the student says "End Viva", give a score out of 10 and a final remark.
        
        START: ask the student for their name and preferred topic.
        `;

        // ৩. মেমোরি সাজানো
        const messages = [{ role: "system", content: systemPrompt }];
        
        if (history) {
            history.forEach(msg => {
                messages.push({ 
                    role: msg.role === 'professor' ? 'assistant' : 'user', 
                    content: msg.content 
                });
            });
        }
        
        messages.push({ role: "user", content: message });

        // ৪. Groq (Llama 3) কল করা
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: "llama3-70b-8192", // 70B মডেল ভাইভার জন্য সেরা
                temperature: 0.6,
                max_tokens: 250
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "Professor is silent...";

        return res.status(200).json({ reply: reply });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
