import { SlashCommandBuilder } from '@discordjs/builders';
import crypto from 'node:crypto';
import { octokit } from '../../functions/createOctokit.js';
export default {
    data: new SlashCommandBuilder()
        .setName('submit-theme')
        .setDescription('Submit a custom theme to GitHub.')
	.addAttachmentOption(option => option.setName('file').setDescription('The theme file to submit (in the BetterSEQTA+ exported format).').setRequired(true)),
    async execute(interaction) {
	    if (interaction.member.roles.cache.some(role => role.name === 'Theme Submitter') && interaction.channel.id === "1239895139959443486") {
	    	const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
	    	const attachment = interaction.options.getAttachment('file');
	    	if (attachment.name.split('.').pop() === 'json' || 'theme') {
				interaction.deferReply();
				const jsonFile = await fetch(attachment.url).then(response => response.json());
				const headName = `${interaction.user.id}-${crypto.randomBytes(10).toString('hex')}`;
				// Grab the branch reference of the main branch which we will use as the base for the new branch.
				const mainRef = await octokit.rest.git.getRef({
  					owner: 'BetterSEQTA',
  					repo: 'BetterSEQTA-Themes',
  					ref: 'heads/main',
				});
				// Make the new branch with the Discord ID of the submitting user combined with a random hex string of 10 bytes.
	    			await octokit.rest.git.createRef({
					owner: 'BetterSEQTA',
  					repo: 'BetterSEQTA-Themes',
  					ref: `refs/heads/${headName}`,
  					sha: mainRef.data.object.sha,
	    			});
				// Create a new tree with the new theme file.
				const newTree = await octokit.rest.git.createTree({
					owner: 'BetterSEQTA',
					repo: 'BetterSEQTA-Themes',
					base_tree: mainRef.data.object.sha,
					tree: [
						{
							path: `store/themes/${interaction.user.id}-${crypto.randomBytes(10).toString('hex')}/theme.json`,
							mode: '100644',
							type: 'blob',
							content: `${JSON.stringify(jsonFile, null, ' ')}`,
						},
					],
				});
				// Create a new commit with the new tree.
				const newCommit = await octokit.rest.git.createCommit({
					owner: 'BetterSEQTA',
					repo: 'BetterSEQTA-Themes',
					message: `Add new theme from user ${interactionUser.user.username}`,
					tree: newTree.data.sha,
					parents: [mainRef.data.object.sha],
					author: {
						name: `${interactionUser.user.username}`,
						email: 'See Discord Server',
						date: new Date().toISOString(),
					},
					committer: {
						name: 'BetterSEQTA+ Bot',
						email: 'See Discord Server',
						date: new Date().toISOString(),
					}

				});
				// Update the new branch with the new commit.
				await octokit.rest.git.updateRef({
					owner: 'BetterSEQTA',
					repo: 'BetterSEQTA-Themes',
					ref: `heads/${headName}`,
					sha: newCommit.data.sha,
				});
				// Create the pull request with the new branch into the main branch.
				const pullReq = await octokit.rest.pulls.create({
					owner: 'BetterSEQTA',
					repo: 'BetterSEQTA-Themes',
					title: `Add new theme from user ${interactionUser.user.username}`,
					head: headName,
					base: 'main',
					body: `This pull request was automatically created by the BetterSEQTA+ Bot on behalf of ${interactionUser.user.username}, who has the User ID of ${interaction.user.id} on ${new Date().toISOString()}.`,
				});
				interaction.editReply(`Submitted theme as pull request. See it here: ${pullReq.data.html_url}`);
	    	}
	    	else {
	    		interaction.reply('Please provide a valid JSON file.');
	    	}
		}
		else {
			interaction.reply('You do not have permission to use this command.');
		}
    },
}
