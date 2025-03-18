import { Routes } from 'discord-api-types/v10';
import { REST } from '@discordjs/rest';
import 'dotenv/config';
const { CLIENTID, DISCORD_TOKEN } = process.env;
import fs from 'node:fs';
import path from 'node:path';


import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(dirname(import.meta.url));


const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);



for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = import(filePath);
		const commandresult = command.then((result) => {
			if (result.default.data && result.default.execute) {

				return result.default.data

			} else {

				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);

				};
			});
		commands.push(await commandresult);
		};
};
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(CLIENTID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
