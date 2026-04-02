import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1,
            }
        });

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Carefully find the date of birth on this ID card. The current year is 2026. Is this person 18 years old or older?
If they are 18 or older, return EXACTLY: {"isOver18": true}
If they are under 18, or if you cannot find a date of birth at all, return EXACTLY: {"isOver18": false}`;

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
        
        let isOver18 = false;
        if (text.toLowerCase().includes('true')) {
            isOver18 = true;
        }

        return NextResponse.json({ isOver18 });

    } catch (error: any) {
        console.error('Error verifying ID with Gemini:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
