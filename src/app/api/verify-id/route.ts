import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            return NextResponse.json({ error: 'AI Setup Incomplete' }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1,
            }
        });

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `You are a highly capable expert identity document parser. Your critical task is to meticulously examine this ID document and precisely extract the date of birth, even if the image is somewhat blurry, low quality, or poorly lit. 
Pay close attention to standard fields like "DOB", "Date of Birth", "Data Nasterii", "Născut", or purely numeric formats like DD.MM.YYYY, DD-MM-YYYY, or MM/DD/YYYY often located near the center or bottom of the ID.
Evaluate if the person is 21 years old or older. The current year is 2026.
Return ONLY a JSON object with two fields. Do NOT use markdown code blocks (\`\`\`json). Just the raw JSON string:
{
  "dateOfBirth": "YYYY-MM-DD",
  "isOver21": true/false
}
If you absolutely cannot discern a clear date of birth after close inspection, return:
{
  "error": "not_found"
}
ONLY return the JSON object, absolutely no other text.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType
                }
            }
        ]);

        const text = result.response.text();
        
        // Remove possible markdown fences if the model still returns them
        let jsonStr = text.trim();
        if (jsonStr.startsWith('\`\`\`json')) {
            jsonStr = jsonStr.substring(7);
        }
        if (jsonStr.startsWith('\`\`\`')) {
            jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith('\`\`\`')) {
            jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        
        jsonStr = jsonStr.trim();
        
        try {
            const parsed = JSON.parse(jsonStr);
            return NextResponse.json(parsed);
        } catch (parseError) {
             console.error("Failed to parse JSON out of text response. Text:", text);
             return NextResponse.json({ error: "not_found" }, { status: 200 });
        }

    } catch (error: any) {
        console.error('Error verifying ID with Gemini:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
