const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const GlobalMessage = require('../../../models/Global-Chat/GlobalMessage');
const Ranks = require('../../../models/Global-Chat/Ranks');
const User = require('../../../models/Global-Chat/User');

module.exports = {
    maintenance: false,
    data: new ContextMenuCommandBuilder()
        .setName('Delete Global Message')
        .setDMPermission(false)
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const userDocument = await User.findOne({ User: interaction.user.id }) ?? await User.create({ User: interaction.user.id });

        const ranks = (await Ranks.find({})).filter((rank) => userDocument.Ranks.includes(rank.RankName)).sort((a, b) => a.Priority - b.Priority)
        const highestRank = ranks[0] ?? await Ranks.findOne({ RankName: "User" })

        const message = await interaction.channel.messages.fetch(interaction.targetId);
        if (!message) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> Message not found`)
                        .setColor('Red')
                ], ephemeral: true
            });
        }

        const globalMessage = await GlobalMessage.findOne({ 'messageIds.messageId': message.id });

        if (!globalMessage) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> Global message not found.`)
                        .setColor('Red')
                ], ephemeral: true
            });
        }

        if ((globalMessage.messageAuthor !== interaction.user.id) && !highestRank.Perms.includes("DELETE_MESSAGES")) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> You are not the author of this global message.`)
                        .setColor('Red')
                ], ephemeral: true
            });
        }

        try {
            let deletedCount = 0
            for (const msg of globalMessage.messageIds) {
                const guild = interaction.client.guilds.cache.get(msg.serverId);
                if (guild) {
                    const channel = guild.channels.cache.get(msg.channelId);
                    if (channel) {
                        try {
                            const msgToDelete = await channel.messages.fetch(msg.messageId);
                            if (msgToDelete) {
                                await msgToDelete.delete();
                                deletedCount++;
                            }
                        } catch (error) {
                            console.error(`Fehler beim Löschen der Nachricht ${msg.messageId} im Kanal ${msg.channelId} auf Server ${msg.serverId}:`, error);
                        }
                    }
                }
            }

            await GlobalMessage.findByIdAndDelete({ _id: globalMessage._id });
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> The message has been deleted in \`${deletedCount}\` servers.`)
                        .setColor('Green')
                ], ephemeral: true
            });
        } catch (error) {
            console.error('Error deleting global message:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> There was an error deleting the message.`)
                        .setColor('Red')
                ], ephemeral: true
            });
        }

        const author = await interaction.client.users.fetch(globalMessage.messageAuthor).catch(() => { })

        await author.send({content: `**Your message has been deleted by \`${interaction.user.tag}\`**`, embeds: message.embeds}).catch(()=>{})
    }
};