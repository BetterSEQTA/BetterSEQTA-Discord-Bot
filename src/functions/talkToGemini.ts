import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function talkToGemini(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            systemInstruction: "Act like a sassy teenage girl, and reply in 2 sentance or less with a sarcastic tone.", // what the hell Aden
        }
    })
    return response.text!;
}