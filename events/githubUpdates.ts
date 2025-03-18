import { Events } from "discord.js";
import { pollChanges } from "../functions/pollChanges.js";

export default {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.webhookId) {
            pollChanges(message);
        }
    },
}