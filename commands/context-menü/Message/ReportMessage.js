const { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const GlobalMessage = require('../../../models/Global-Chat/GlobalMessage');

module.exports = {
    maintenance: false,
    data: new ContextMenuCommandBuilder()
        .setName('Report Global Message')
        .setDMPermission(false)
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        const message = await interaction.channel.messages.fetch(interaction.targetId);
        if (!message) {
            return interaction.reply({ content: 'Message not found.', ephemeral: true });
        }

        const globalMessage = await GlobalMessage.findOne({ 'messageIds.messageId': message.id });

        if (!globalMessage) {
            return interaction.reply({ content: 'Global message not found.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId(`reportGlobalMessageModal:${message.id}`)
            .setTitle('Message Report');
        const messageInput = new TextInputBuilder()
            .setCustomId('messageInput')
            .setLabel('Why do you want to report this message?')
            .setStyle(TextInputStyle.Paragraph)

        const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};