const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Users = require('../../models/Global-Chat/User');
const ranks = require('../../Modules/ranks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Show profile of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to show profile for')
                .setRequired(false)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;

        if (!target?.id) return interaction.reply({ content: 'User not found.', ephemeral: true });

        let userData = await Users.findOne({ User: target.id });
        if (!userData) {
            userData = await Users.create({ User: target.id });
        }

        const userRanksSorted = userData.Ranks
            .map(rankName => ranks.find(r => r.RankName === rankName))
            .filter(Boolean)
            .sort((a, b) => a.Priority - b.Priority)
            .map(r => `[${r.RankName}](https://dev-botlist.com)`)

        const embed = new EmbedBuilder()
            .setTitle(`Profile from ${target.username}`)
            .setColor(0x00AE86)
            .addFields(
                { name: '<a:Coin:1361120904691716300> Coins', value: `${userData.Stats.Coins}`, inline: true },
                { name: '<a:Messages:1361121591659860018> Messages', value: `${userData.Stats.Messages}`, inline: true },
                { name: '<:Rank:1361119666260414555> Ranks', value: userRanksSorted.join('\n') || 'None', inline: false }
            )
            .setThumbnail(target.displayAvatarURL());

        await interaction.reply({ embeds: [embed] });
    }
};