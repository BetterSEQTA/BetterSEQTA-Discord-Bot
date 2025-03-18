import { Client, GatewayIntentBits, Events } from 'discord.js';
import { Collection } from '@discordjs/collection';
import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config';
const token = process.env.DISCORD_TOKEN

const isWin = process.platform === "win32";

import * as url from 'url';


const __dirname = (url.fileURLToPath(new URL('.', import.meta.url)));

export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages] });

client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		let command = ''
		if (isWin === true) {
			command = import('file:///' + filePath);
		} else {
			command = import(filePath);
		}
		const commandresult = command.then((result) => {
			if (result.default.data && result.default.execute) {

				return result.default.data.name

			} else {

				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);

			};
		});
		client.commands.set(await commandresult, await command);
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	let event = '';
	if (isWin === true) {
		event = import('file:///' + filePath);
	} else {
		event = import(filePath);
	}
	event.then((result) => {

		if (result.default.once) {
			client.once(result.default.name, (...args) => result.default.execute(...args));
		} else {
			client.on(result.default.name, (...args) => result.default.execute(...args));
		}

	})
}

client.login(token);