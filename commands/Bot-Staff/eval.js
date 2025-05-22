const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Execute JavaScript code')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The code to execute')
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

        const code = interaction.options.getString('code');

        try {
            let result = eval(code);

            if (result instanceof Promise) {
                result = await result;
            }

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Result')
                        .setDescription(`\`\`\`js\n${result}\n\`\`\``)
                ]
            });
        } catch (error) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`Error: \`\`\`js\n${error.message}\n\`\`\``)
                ]
            });
        }
    }
};