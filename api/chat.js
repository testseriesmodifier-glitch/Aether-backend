import { GoogleGenerativeAI } from "@google/generative-ai";
import pdf from 'pdf-parse';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
    api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message, history, file } = req.body;
        let pdfText = "";

        // ১. PDF থেকে টেক্সট এক্সট্রাক্ট
        if (file && file.type === 'application/pdf') {
            try {
                const base64Data = file.data.split(',')[1];
                const dataBuffer = Buffer.from(base64Data, 'base64');
                const data = await pdf(dataBuffer);
                pdfText = `\n[Attached PDF Content]: ${data.text.substring(0, 7000)}`;
            } catch (err) { console.error("PDF Error:", err); }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // ২. অ্যাডভান্সড সিস্টেম প্রম্পট (ইমেজ জেনারেশন ইনস্ট্রাকশন সহ)
        const isViva = history && JSON.stringify(history).includes("Professor");
        const systemPrompt = isViva 
            ? "You are Prof. Aether, a strict physics examiner."
            : `You are Aether, a helpful physics assistant. 
               If the user asks to see or visualize something (e.g., 'show me a black hole' or 'diagram of an atom'), 
               include an image in your response using this markdown format: 
               ![Image](https://image.pollinations.ai/prompt/{description}?width=800&height=600&nologo=true)
               Replace {description} with a detailed English prompt for the image.`;

        // ৩. মেসেজ এবং ফাইল প্রিপারেশন
        let promptParts = [`${systemPrompt} ${pdfText} \n\nUser: ${message}`];
        if (file && file.type.startsWith('image/')) {
            promptParts.push({ inlineData: { data: file.data.split(',')[1], mimeType: file.type } });
        }

        // ৪. চ্যাট জেনারেশন
        const chat = model.startChat({
            history: (history || []).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
            })),
        });

        const result = await chat.sendMessage(promptParts);
        const response = await result.response;
        let replyText = response.text();

        // ৫. সাজেশন চিপস যোগ করা
        if (!isViva) {
            replyText += "\n\n[SUGGESTIONS]: Explain with more details, Show a diagram, Simplify this";
        }

        res.status(200).json({ reply: replyText });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
