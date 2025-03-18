import { Events, Message } from "discord.js";
import { pollChanges } from "../functions/pollChanges.js";

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.webhookId) {
            pollChanges(message);
        }
    },
}