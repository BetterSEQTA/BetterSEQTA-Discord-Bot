import { Events, Message, OmitPartialGroupDMChannel } from "discord.js";
import { pollChanges } from "../functions/pollChanges.js";
import { talkToGemini } from "../functions/talkToGemini.js";

export default {
    name: Events.MessageCreate,
    async execute(message: OmitPartialGroupDMChannel<Message>) {
        if (message.webhookId) {
            pollChanges(message);
        } else if (message.mentions.has(message.client.user!)) {
            const response = await talkToGemini(message.content);
            if (response) {
                await message.reply(response);
            } else {
                await message.reply("I don't know how to respond to that.");
            }
        }
    },
}