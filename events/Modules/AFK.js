const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const afkModel = require('../../models/afkModel');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.GuildNews) return;
    const userId = message.author.id;
    const afkEntry = await afkModel.findOne({ userId });

    if (afkEntry) {
      await afkModel.findOneAndDelete({ userId });

      let notificationText = '';
      if (afkEntry.notifications.length > 0) {
        notificationText = afkEntry.notifications
          .map(
            notification =>
              `You got pinged ${notification.count} time(s) by <@${notification.userId}>`
          )
          .join('\n');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff10)
        .setTitle('Welcome Back!')
        .setDescription('Your AFK status has been removed.')
        .addFields({
          name: 'Ping Notifications',
          value: notificationText || 'No notifications.',
        });

      try {
        if (
          message.channel.type === ChannelType.GuildText &&
          message.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages)
        ) {
          const replyMessage = await message.reply({ embeds: [embed] });
          setTimeout(() => {
            replyMessage.delete().catch(() => {});
          }, 10000);
        } else {
          await message.author.send({ embeds: [embed] });
        }
      } catch {}
    }

    const mentionedUsers = message.mentions.users;
    if (mentionedUsers.size > 0) {
      for (const [id] of mentionedUsers) {
        const afkUser = await afkModel.findOne({ userId: id });
        if (afkUser) {
          const reason = afkUser.reason || 'No reason provided.';
          const existingNotification = afkUser.notifications.find(
            notification => notification.userId === message.author.id
          );

          if (existingNotification) {
            existingNotification.count++;
          } else {
            afkUser.notifications.push({ userId: message.author.id, count: 1 });
          }

          await afkUser.save();

          const embed = new EmbedBuilder()
            .setColor(0x00d5ff)
            .setTitle('User is AFK')
                .setDescription(
              `**${message.guild.members.cache.get(id).user.tag}** is currently AFK.\n**Reason:** ${reason}`
            )
            .addFields({ name: 'AFK since:', value: afkUser.timestamp.toLocaleString() });

          try {
            if (
              message.channel.type === ChannelType.GuildText &&
              message.channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages)
            ) {
              const afkMessage = await message.channel.send({ embeds: [embed] });
              setTimeout(() => afkMessage.delete().catch(() => {}), 30000);
            } else {
              await message.author.send({ embeds: [embed] });
            }
          } catch {}
        }
      }
    }
  },
};