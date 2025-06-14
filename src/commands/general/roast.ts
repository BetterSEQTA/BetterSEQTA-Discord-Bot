import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, TextChannel, Collection, Message, User } from 'discord.js';
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Store the last roast time for each channel
const lastRoastTime = new Map<string, number>();
const ROAST_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

// Function to split message into chunks that fit Discord's 2000 character limit
function splitMessage(message: string): string[] {
    const chunks: string[] = [];
    const maxLength = 1900; // Leave some buffer for safety

    while (message.length > 0) {
        if (message.length <= maxLength) {
            chunks.push(message);
            break;
        }

        // Find the last newline within the maxLength
        let splitIndex = message.lastIndexOf('\n', maxLength);
        if (splitIndex === -1) {
            // If no newline found, split at maxLength
            splitIndex = maxLength;
        }

        chunks.push(message.substring(0, splitIndex));
        message = message.substring(splitIndex + 1);
    }

    return chunks;
}

export default {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Start randomly roasting channel members every 2 minutes or roast a specific user')
        .addBooleanOption(option =>
            option.setName('start')
                .setDescription('Start or stop the random roasting')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Specific user to roast')
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        const channel = interaction.channel as TextChannel;
        const targetUser = interaction.options.getUser('user');
        const shouldStart = interaction.options.getBoolean('start');

        // If a specific user is provided, roast them immediately
        if (targetUser) {
            await interaction.deferReply();
            try {
                const roast = await generateRoast(channel, targetUser);
                const messageChunks = splitMessage(`🔥 **Targeted Roast!** 🔥\n\nHey <@${targetUser.id}>, ${roast}`);
                
                // Send the first chunk as the initial reply
                await interaction.editReply(messageChunks[0]);

                // Send remaining chunks as follow-up messages
                for (let i = 1; i < messageChunks.length; i++) {
                    await interaction.followUp(messageChunks[i]);
                }
            } catch (error) {
                console.error('Error generating targeted roast:', error);
                await interaction.editReply('Failed to generate roast. Maybe they\'re too perfect to roast? 😉');
            }
            return;
        }

        // Handle random roasting mode
        if (shouldStart === null) {
            await interaction.reply('Please specify either a user to roast or set start to true/false for random roasting mode!');
            return;
        }

        if (shouldStart) {
            // Check if roasting is already active in this channel
            if (lastRoastTime.has(channel.id)) {
                await interaction.reply('Roasting is already active in this channel! 🔥');
                return;
            }

            // Start the roasting cycle
            lastRoastTime.set(channel.id, Date.now());
            await interaction.reply('🔥 Roasting mode activated! Random members will be roasted every 2 minutes!');

            // Start the roasting loop
            startRoastingLoop(channel);
        } else {
            // Stop the roasting
            if (lastRoastTime.has(channel.id)) {
                lastRoastTime.delete(channel.id);
                await interaction.reply('Roasting mode deactivated! 🔥');
            } else {
                await interaction.reply('Roasting wasn\'t active in this channel!');
            }
        }
    }
};

async function generateRoast(channel: TextChannel, user: User): Promise<string> {
    // Get their recent messages (last 50 messages)
    const messages = await channel.messages.fetch({ limit: 50 });
    const memberMessages = messages.filter(msg => msg.author.id === user.id)
        .map(msg => msg.content)
        .filter(content => content.length > 0)
        .slice(0, 5); // Get up to 5 recent messages

    // Get member info if available
    const member = channel.members.get(user.id);
    const roles = member ? member.roles.cache.map(role => role.name).join(', ') : 'No roles found';

    // Create a new chat with Gemini
    const chat = ai.chats.create({
        model: "gemini-2.5-flash-preview-05-20",
        config: {
            systemInstruction: "You are a savage AI that roasts Discord users with no mercy. Use their message history and roles as ammunition for brutal, but still family-friendly roasts. Don't hold back, but keep it clever and witty rather than just mean. Avoid coding/developer themes unless their messages specifically mention them. Make it personal based on their messages and roles. The goal is to make people laugh at how savage the roast is."
        }
    });

    // Prepare the context for the roast
    const context = {
        username: user.username,
        recentMessages: memberMessages,
        isBot: user.bot,
        roles: roles,
        joinDate: member ? member.joinedAt : null,
        status: member ? member.presence?.status : 'offline'
    };

    // Generate the roast
    const prompt = `Roast this Discord user with absolutely no mercy. Here's their info to use as ammunition:
Username: ${context.username}
Is Bot: ${context.isBot}
Roles: ${context.roles}
Status: ${context.status}
Join Date: ${context.joinDate ? context.joinDate.toLocaleDateString() : 'Unknown'}
Recent Messages: ${context.recentMessages.length > 0 ? context.recentMessages.join('\n') : 'No recent messages found'}

Make the roast absolutely savage and personal. Use their messages, roles, and any other info to make it hit hard. Keep it family-friendly but don't hold back on the savagery. The goal is to make people laugh at how brutal the roast is. If they're a bot, make fun of that. If they have funny roles, use those. If their messages are cringy, use that. If they're offline, make fun of their social life. If they're new, make fun of that. If they're old, make fun of that. Just be creative and savage!`;

    const response = await chat.sendMessage({ message: prompt });
    return response.text || 'Failed to generate roast';
}

async function startRoastingLoop(channel: TextChannel) {
    const roastInterval = setInterval(async () => {
        // Check if roasting is still active
        if (!lastRoastTime.has(channel.id)) {
            clearInterval(roastInterval);
            return;
        }

        try {
            // Get all members in the channel
            const members = channel.members;
            if (members.size === 0) {
                return;
            }

            // Pick a random member
            const randomMember = members.random()!;
            const roast = await generateRoast(channel, randomMember.user);
            
            // Split the roast into chunks if needed
            const messageChunks = splitMessage(`🔥 **Random Roast Time!** 🔥\n\nHey <@${randomMember.id}>, ${roast}`);

            // Send the first chunk
            await channel.send(messageChunks[0]);

            // Send remaining chunks as follow-up messages
            for (let i = 1; i < messageChunks.length; i++) {
                await channel.send(messageChunks[i]);
            }

        } catch (error) {
            console.error('Error in roast loop:', error);
        }
    }, ROAST_INTERVAL);
} 