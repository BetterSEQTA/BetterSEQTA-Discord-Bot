import { client } from "../index.js";
import { EmbedBuilder } from "@discordjs/builders";

export async function pollChanges(message) {

    const channel = client.channels.cache.get('1104256006139150407');
	try {
        if (message.embeds[0].title.toLowerCase().includes('[betterseqta/betterseqta-themes]') && message.embeds[0].title.toLowerCase().includes('pull request')) {
            const index = message.embeds[0].title.toLowerCase().indexOf('user');
            const strOut = message.embeds[0].title.toLowerCase().substr(index);

            const username = strOut.substring(5);
            const guild = await client.guilds.fetch('1104025284979720212');
            
            const user = (await guild.members.fetch({ query: username, limit: 1 })).first(2)[0];

            const dmEmbed = new EmbedBuilder()
	            .setColor(message.embeds[0].color)
	            .setTitle(message.embeds[0].title)
                .setDescription('There has been an update on your pull request for the BetterSEQTA+ Theme Repository.')
                .setURL(message.embeds[0].url)
                .addFields(
                    { name: 'Description from GitHub', value: message.embeds[0].description || 'N/A' }
                )
                .setTimestamp()
                .setFooter({text: 'This is an automated message from the BetterSEQTA+ Discord Bot.'});
            user.send({ embeds: [dmEmbed] });
        }
	} catch (error) {
		console.error('Error trying to send a message: ', error);
	}
}