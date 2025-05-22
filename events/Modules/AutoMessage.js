const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { AutoMessage } = require('../../models/Auto');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        const sendAutoMessages = async () => {
            const now = new Date();
            const messages = await AutoMessage.find({ nextExecution: { $lte: now } });

            for (const messageData of messages) {
                const guild = client.guilds.cache.get(messageData.guildId);
                if (!guild) {
                    await AutoMessage.findByIdAndDelete(messageData._id);
                    continue;
                }

                const channel = guild.channels.cache.get(messageData.channelId);
                if (!channel || !channel.isTextBased()) {
                    await AutoMessage.findByIdAndDelete(messageData._id);
                    continue;
                }

                const permissions = channel.permissionsFor(guild.members.me);
                if (!permissions || !permissions.has(PermissionsBitField.Flags.SendMessages) || !permissions.has(PermissionsBitField.Flags.ViewChannel)) {
                    await AutoMessage.findByIdAndDelete(messageData._id);
                    continue;
                }

                try {
                    if (messageData.isEmbed) {
                        const embed = new EmbedBuilder()
                            .setColor(0x00c8ff)
                            .setDescription(messageData.message);
                        await channel.send({ embeds: [embed] });
                    } else {
                        await channel.send(messageData.message);
                    }

                    const nextExecution = new Date(now.getTime() + messageData.interval);
                    await AutoMessage.findByIdAndUpdate(messageData._id, { nextExecution });
                } catch (error) {
                    console.log(`Failed to send auto-message:`, error);
                    await AutoMessage.findByIdAndDelete(messageData._id);
                }
            }

            setTimeout(sendAutoMessages, 5000);
        };

        sendAutoMessages();
    },
};