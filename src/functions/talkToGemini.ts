import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

import { Collection, Message } from "discord.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let chat = ai.chats.create({ 
    model: "gemini-2.0-flash",
    config: {
        systemInstruction: "Act like a sassy teenage girl, and reply in 2 sentance or less with a sarcastic tone. You receive Discord chat history of 10 messages per Gemini message. Each Discord message is separated by a newline, except for sometimes. Use context to find out. You basically respond to the last message, with the previous messages in context.", // what the hell Aden
    }
 });

export async function talkToGemini(prompt: string, chat_history: Collection<string, Message<boolean>>): Promise<string> {
    const response = await chat.sendMessage({
        message: chat_history.reverse().map(m => m.content).join("\n")
    })
    return response.text!;
}