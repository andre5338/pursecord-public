const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    staff: false,
    maintenance: false,
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription(`Show's you the Shop`)
        .setDMPermission(false),
    async execute(interaction, userData) {
        const { client, user } = interaction;

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: "Globby Shop", iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(`Select one of the options below to display the corresponding items.`)
                        .setColor("#c7ebff")
                        .setFooter({ text: `Current Balance: ${userData?.Stats?.Coins || 0} Coins`, iconURL: user.displayAvatarURL({ dynamic: true }) })                    
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('shopSelectType')
                                .setPlaceholder('Select one of the options...')
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Premium Items')
                                        .setValue('premium'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Power-Ups')
                                        .setValue('powerUps')
                                )
                        )
                ],
                ephemeral: true
            });
    }
};