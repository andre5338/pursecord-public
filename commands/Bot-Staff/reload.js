const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload a specific file by its full path')
        .addStringOption(option =>
            option.setName('file')
                .setDescription('The full path of the file to reload')
                .setRequired(true)
        )
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id !== '1180501233669242920') {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('You do not have permission to use this command!')
                ]
            });
        }

        const filePath = interaction.options.getString('file');
        const absolutePath = path.resolve(__dirname, `../../${filePath}`);

        if (!fs.existsSync(absolutePath)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`File \`${filePath}\` not found.`)
                ]
            });
        }

        try {
            delete require.cache[require.resolve(absolutePath)];
            const reloadedModule = require(absolutePath);

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00FF00')
                        .setDescription(`File \`${filePath}\` has been reloaded successfully.`)
                ]
            });
        } catch (error) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`Error reloading \`${filePath}\`: \`\`\`js\n${error.message}\n\`\`\``)
                ]
            });
        }
    }
};