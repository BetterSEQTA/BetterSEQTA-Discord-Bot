import { Events, Message, OmitPartialGroupDMChannel } from "discord.js";
import { pollChanges } from "../functions/pollChanges.js";
import { talkToGemini } from "../functions/talkToGemini.js";

export default {
    name: Events.MessageCreate,
    async execute(message: OmitPartialGroupDMChannel<Message>) {
        if (message.webhookId) {
            pollChanges(message);
        } else if (message.mentions.has(message.client.user!) && !message.author.bot && message.channelId == "1381245393245044847") {
            const tenmessages = await message.channel.messages.fetch({ limit: 10})
            const response = await talkToGemini(message.content, tenmessages, message.author!);
            if (response !== '') {
                await message.reply(response);
            } else {
                await message.reply("I don't know how to respond to that.");
            }
        }
    },
}