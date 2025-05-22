const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Users = require('../../models/Global-Chat/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gc-update')
        .setDescription('Update a user entry in the database')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user ID to update')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Set a new username'))
        .addBooleanOption(option =>
            option.setName('isstaff')
                .setDescription('Set staff status'))
        .addBooleanOption(option =>
            option.setName('banned')
                .setDescription('Set banned status'))
        .addIntegerOption(option =>
            option.setName('coins')
                .setDescription('Set new coin amount'))
        .addStringOption(option =>
            option.setName('rank')
                .setDescription('Set a new single rank (replaces all ranks)'))
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.user.id !== '1180501233669242920') {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getString('user');
        const username = interaction.options.getString('username');
        const isStaff = interaction.options.getBoolean('isstaff');
        const banned = interaction.options.getBoolean('banned');
        const coins = interaction.options.getInteger('coins');
        const rank = interaction.options.getString('rank');

        const update = {};
        const changes = [];

        if (username !== null) {
            update.Username = username;
            changes.push(`**Username** ➜ \`${username}\``);
        }
        if (isStaff !== null) {
            update.IsStaff = isStaff;
            changes.push(`**IsStaff** ➜ \`${isStaff}\``);
        }
        if (banned !== null) {
            update.Banned = banned;
            changes.push(`**Banned** ➜ \`${banned}\``);
        }
        if (coins !== null) {
            update['Stats.Coins'] = coins;
            changes.push(`**Coins** ➜ \`${coins}\``);
        }
        if (rank !== null) {
            update.Ranks = [rank];
            changes.push(`**Rank** ➜ \`${rank}\``);
        }

        try {
            const result = await Users.findOneAndUpdate(
                { User: userId },
                { $set: update },
                { new: true }
            );

            if (!result) {
                return interaction.reply({ content: '⚠️ User not found in the database.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('User Update Successful!')
                .setDescription(`The following changes have been made to the user **${userId}**:`)
                .addFields(
                    { name: 'Changes:', value: changes.join('\n') }
                );

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ An error occurred while updating the user.', ephemeral: true });
        }
    },
};