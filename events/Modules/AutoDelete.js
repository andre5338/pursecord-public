const { PermissionsBitField } = require('discord.js');
const { AutoDelete } = require('../../models/Auto');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const autoDeleteConfig = await AutoDelete.findOne({ guildId: message.guild.id, channelId: message.channel.id });
    if (!autoDeleteConfig || !autoDeleteConfig.duration) return;

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    const duration = autoDeleteConfig.duration;

    setTimeout(() => {
      message.delete().catch(() => {
        console.log(`Failed to delete message in ${message.guild.id}`);
      });
    }, duration);
  },
};