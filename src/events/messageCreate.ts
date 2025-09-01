// events/messageCreate.js
import { Events } from 'discord.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (!message.guild || message.author.bot) return;

      const OFFENDER_ID = '993781395761676298';
      const PROTECTED_ROLE_ID = '1104251374348279922';

      if (message.author.id !== OFFENDER_ID) return;

      const pingedProtectedMember = message.mentions.members?.some(member =>
        member.roles.cache.has(PROTECTED_ROLE_ID)
      );

      if (pingedProtectedMember) {
        if (message.deletable) await message.delete().catch(() => {});
        if (message.member?.moderatable) {
          await message.member.timeout(10_000, 'Pinged protected-role members').catch(() => {});
        }
      }
    } catch (err) {
      console.error('messageCreate moderation error:', err);
    }
  },
};
