import { SlashCommandBuilder } from '@discordjs/builders';
import { octokit } from '../../functions/createOctokit.js';
import { ChatInputCommandInteraction } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('get-theme-pulls')
		.setDescription('Get all theme pull requests you have created'),
	async execute(interaction: ChatInputCommandInteraction) {
		interaction.deferReply();
		if (interaction.member.roles.cache.some(role => role.name === 'Theme Submitter') && interaction.channel.id === "1239895139959443486") {
			const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
			const pulls = await octokit.rest.search.issuesAndPullRequests({
				q: `is:pr ${interactionUser.user.username} in:title repo:BetterSEQTA/BetterSEQTA-Themes`
			})
			interaction.editReply(`You have created the theme pull requests:\n${pulls.data.items.map(pull => `[${pull.number}](<${pull.html_url}>) - ${pull.title}`).join('\n')}`);
		} else {
			interaction.editReply('You do not have permission to use this command, or you are in the wrong channel.');
		}

	}
}
