import { GuildMember, TextChannel } from 'discord.js';

export default {
  name: 'guildMemberRemove',
  once: false,
  async execute(member: GuildMember) {
    const channel = member.guild.channels.cache.get('1381114212847194164');
    if (channel?.isTextBased()) {
      (channel as TextChannel).send(`😢 <@${member.id}> left`);
    }
  },
};
