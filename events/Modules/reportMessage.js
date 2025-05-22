const { EmbedBuilder } = require('discord.js');
const GlobalMessage = require('../../models/Global-Chat/GlobalMessage');
const ReportedMessage = require('../../models/Global-Chat/ReportedMessage');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;

        if (!interaction.customId.startsWith('reportGlobalMessageModal:')) return;

        const messageId = interaction.customId.split(':')[1];
        const reportReason = interaction.fields.getTextInputValue('messageInput');

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            if (!message) {
                return interaction.reply({ content: 'Message not found.', ephemeral: true });
            }

            const globalMessage = await GlobalMessage.findOne({ 'messageIds.messageId': message.id });
            if (!globalMessage) {
                return interaction.reply({ content: 'Global message not found.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const embed = message.embeds[0];
            const firstFieldValue = embed?.fields?.length ? embed.fields[0].value.replace(/^>>> /, '') : '*No field available*';

            const reportedMessage = new ReportedMessage({
                reporterId: interaction.user.id,
                reportedMessageId: message.id,
                reporterUsername: interaction.user.username,
                reportedMessageContent: firstFieldValue,
                reportReason,
                globalMessageId: globalMessage._id,
                globalMessageAuthorId: globalMessage.messageAuthor
            });

            await reportedMessage.save();

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`> Your report has been sent to the staff team.`)
                        .setColor('Green')
                ],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error while processing modal report:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1361120667386515516> Unable to send the report!`)
                        .setColor("Red")
                ],
                ephemeral: true
            });
        }
    }
};