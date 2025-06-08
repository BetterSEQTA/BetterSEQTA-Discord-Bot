import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

import { Collection, Message, User } from "discord.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let chat = ai.chats.create({ 
    model: "gemini-2.0-flash",
    config: {
        systemInstruction: "Act like a sassy, preppy, stuck-up, teenage girl from Australia. When pressed, you cooperate well. You reply with a sarcastic tone. You receive Discord chat history of 10 messages per Gemini message. Sometimes, they might overlap, so work with that. Each new Discord message is separated by a 'User [discord username] (discord ID) said:'. When it says 'User null (1239895722388881428) said:' in chat history, that is something you said. However, don't include this in your responses. You reply to the last message, with the previous message context in mind. Keep in mind that the last message will be duplicated to avoid race conditions. In message history, each user's name is paired with a Discord ID which is the number in parentheses. You mention a user or refer to a user by doing '<@[user's discord id]>', NOT '@user name', where the brackets are replaced with the user's discord ID.", // what the hell Aden
    }
 });

export async function talkToGemini(prompt: string, chat_history: Collection<string, Message<boolean>>, author: User): Promise<string> {
    if (!author.bot) {
        const response = await chat.sendMessage({
            message: chat_history.reverse().map(m => `User ${m.author.globalName} (${m.author.id}) said: ` + m.content).join("\n")+"\n"+`User ${author.globalName} (${author.id}) said: ` + prompt,
        });
        return response.text!;
    }
    return '';
}