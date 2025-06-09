import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default {
    data: new SlashCommandBuilder()
        .setName('motivate')
        .setDescription('Get a cringy motivational quote, story, or joke about our projects')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of cringe you want')
                .setRequired(true)
                .addChoices(
                    { name: 'Quote', value: 'quote' },
                    { name: 'Story', value: 'story' },
                    { name: 'Joke', value: 'joke' },
                    { name: 'Rap', value: 'rap' },
                    { name: 'Poem', value: 'poem' },
                    { name: 'Pickup Line', value: 'pickup' }
                ))
        .addStringOption(option =>
            option.setName('project')
                .setDescription('Which project to focus on')
                .setRequired(true)
                .addChoices(
                    { name: 'BetterSEQTA-Plus', value: 'bsplus' },
                    { name: 'DesQTA', value: 'desqta' },
                    { name: 'Minecraft Server', value: 'minecraft' }
                ))
        .addStringOption(option =>
            option.setName('mood')
                .setDescription('The mood of the cringe')
                .setRequired(false)
                .addChoices(
                    { name: 'Super Happy', value: 'happy' },
                    { name: 'Dramatically Sad', value: 'sad' },
                    { name: 'Overly Excited', value: 'excited' },
                    { name: 'Existential Crisis', value: 'existential' }
                ))
        .addBooleanOption(option =>
            option.setName('include_emojis')
                .setDescription('Add random emojis everywhere')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const type = interaction.options.getString('type')!;
        const project = interaction.options.getString('project')!;
        const mood = interaction.options.getString('mood') || 'excited';
        const includeEmojis = interaction.options.getBoolean('include_emojis') ?? true;
        
        try {
            // Create a new chat with Gemini
            const chat = ai.chats.create({
                model: "gemini-2.5-flash-preview-05-20",
                config: {
                    systemInstruction: "You are a cringy motivational assistant for developers. Generate extremely cheesy, over-the-top, and intentionally cringy content about BetterSEQTA-Plus, DesQTA, or a Minecraft server. Make it sound like it was written by an overly enthusiastic fan. Use lots of exclamation marks and dramatic language. Keep responses concise but make them as cringy as possible."
                }
            });

            // Generate appropriate prompt based on type and project
            let prompt = '';
            const projectName = project === 'bsplus' ? 'BetterSEQTA-Plus' : 
                              project === 'desqta' ? 'DesQTA' : 
                              'our Minecraft server';

            const moodPrompt = mood === 'happy' ? 'super happy and bubbly' :
                             mood === 'sad' ? 'dramatically sad and emotional' :
                             mood === 'excited' ? 'overly excited and enthusiastic' :
                             'having an existential crisis about';

            switch (type) {
                case 'quote':
                    prompt = `Generate a super cringy, overly dramatic quote about ${projectName}. Make it sound like it was written by someone who's way too ${moodPrompt} about the project. Use lots of exclamation marks and dramatic language. Keep it under 100 words.`;
                    break;
                case 'story':
                    prompt = `Write a ridiculously dramatic and cringy story about ${projectName}. Make it sound like an epic tale of coding heroism, with lots of dramatic moments and over-the-top ${moodPrompt} energy. Keep it under 150 words.`;
                    break;
                case 'joke':
                    prompt = `Tell a super cheesy and cringy joke about ${projectName}. Make it as over-the-top and intentionally bad as possible, like something a very ${moodPrompt} developer would tell. Keep it family-friendly and under 100 words.`;
                    break;
                case 'rap':
                    prompt = `Write a super cringy rap verse about ${projectName}. Make it sound like it was written by a developer who thinks they're a rapper. Include some coding terms and make it ${moodPrompt}. Keep it under 100 words.`;
                    break;
                case 'poem':
                    prompt = `Write a ridiculously dramatic poem about ${projectName}. Make it sound like it was written by a developer who's way too ${moodPrompt} about coding. Use lots of dramatic language and coding metaphors. Keep it under 100 words.`;
                    break;
                case 'pickup':
                    prompt = `Write a super cringy programming pickup line about ${projectName}. Make it sound like it was written by a developer who's way too ${moodPrompt} about their code. Keep it family-friendly and under 50 words.`;
                    break;
            }

            // Send the prompt to Gemini
            const response = await chat.sendMessage({ message: prompt });

            // Add random emojis if enabled
            let text = response.text || 'No response generated';
            if (includeEmojis) {
                const emojis = ['✨', '💻', '🚀', '🔥', '💯', '👨‍💻', '🎮', '⚡', '💪', '🎯', '🌟', '💫', '🎉', '🎊', '💖', '💕', '💓', '💗', '💘', '💝'];
                // Add 2-3 random emojis at random positions
                const numEmojis = Math.floor(Math.random() * 2) + 2;
                for (let i = 0; i < numEmojis; i++) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    const randomPosition = Math.floor(Math.random() * text.length);
                    text = text.slice(0, randomPosition) + randomEmoji + text.slice(randomPosition);
                }
            }

            // Format the response based on type
            let formattedResponse = '';
            switch (type) {
                case 'quote':
                    formattedResponse = `💭 **Cringy ${projectName} Quote**\n\n${text}`;
                    break;
                case 'story':
                    formattedResponse = `📖 **Epic ${projectName} Story**\n\n${text}`;
                    break;
                case 'joke':
                    formattedResponse = `😄 **Totally Not Cringy ${projectName} Joke**\n\n${text}`;
                    break;
                case 'rap':
                    formattedResponse = `🎤 **Fire ${projectName} Rap**\n\n${text}`;
                    break;
                case 'poem':
                    formattedResponse = `📝 **Beautiful ${projectName} Poem**\n\n${text}`;
                    break;
                case 'pickup':
                    formattedResponse = `💘 **Smooth ${projectName} Pickup Line**\n\n${text}`;
                    break;
            }

            await interaction.editReply(formattedResponse);

        } catch (error) {
            console.error('Error generating cringe:', error);
            await interaction.editReply({
                content: 'Oh no! My cringe generator broke! *dramatically faints* Please try again!'
            });
        }
    }
}; 