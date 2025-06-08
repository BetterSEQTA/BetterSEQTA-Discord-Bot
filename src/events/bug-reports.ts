import { AnyThreadChannel, Events } from "discord.js";

export default {
    name: Events.ThreadUpdate,
    async execute(oldThread: AnyThreadChannel, newThread: AnyThreadChannel) {
        console.log(oldThread, newThread)
    }
}