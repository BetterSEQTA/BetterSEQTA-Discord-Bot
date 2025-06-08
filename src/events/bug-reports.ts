import { AnyThreadChannel, Events } from "discord.js";

export default {
    name: Events.ThreadCreate,
    async execute(thread: AnyThreadChannel, newlyCreated: boolean) {
        console.log(thread, newlyCreated);
    }
}