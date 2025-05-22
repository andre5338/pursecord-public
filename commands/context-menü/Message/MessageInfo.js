const { EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const GlobalMessage = require('../../../models/Global-Chat/GlobalMessage');
const Ranks = require('../../../models/Global-Chat/Ranks');
const User = require('../../../models/Global-Chat/User');

module.exports = {
    maintenance: false,
    data: new ContextMenuCommandBuilder()
        .setName('View Global Message Info')
        .setDMPermission(false)
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userDocument = await User.findOne({ User: interaction.user.id }) ?? await User.create({ User: interaction.user.id });

        const ranks = (await Ranks.find({}))
            .filter((rank) => userDocument.Ranks.includes(rank.RankName))
            .sort((a, b) => a.Priority - b.Priority);
        const highestRank = ranks[0] ?? await Ranks.findOne({ RankName: "User" });

        const message = await interaction.channel.messages.fetch(interaction.targetId);
        if (!message) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> Message not found`)
                        .setColor('Red')
                ],
                ephemeral: true
            });
        }

        const globalMessage = await GlobalMessage.findOne({ 'messageIds.messageId': message.id });
        if (!globalMessage) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> Global message not found.`)
                        .setColor('Red')
                ],
                ephemeral: true
            });
        }

        if ((globalMessage.messageAuthor !== interaction.user.id) && !highestRank.Perms.includes("DELETE_MESSAGES")) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> You are not the author of this message.`)
                        .setColor('Red')
                ],
                ephemeral: true
            });
        }

        const author = await interaction.client.users.fetch(globalMessage.messageAuthor);
        const authorName = author ? `${author.username} (${author.id})` : "Unknown Author";

       
        const embed = new EmbedBuilder()
            .setTitle("Global Message Info")
            .setColor("Blue")
            .addFields(
                { name: "Message Author", value: authorName }
            );

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
};