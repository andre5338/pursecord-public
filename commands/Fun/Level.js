const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const LevelUser = require('../../models/Level.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Manage level settings')
        .addSubcommandGroup(group =>
            group
                .setName('channel')
                .setDescription('Manage level-up message channels')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set the channel for level-up messages')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('The channel to send level-up messages to')
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove the custom channel for level-up messages')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rank')
                .setDescription('View your or another user’s rank')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to view the rank for')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add levels to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add levels to')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The amount of levels to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove levels from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove levels from')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The amount of levels to remove')
                        .setRequired(true)))
        .addSubcommandGroup(group =>
            group
                .setName('xp')
                .setDescription('Manage user XP')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add XP to a user')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to add XP to')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription('The amount of XP to add')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove XP from a user')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to remove XP from')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription('The amount of XP to remove')
                                .setRequired(true))))
                    .addSubcommand(subcommand =>
                            subcommand
                                .setName('leaderboard')
                                .setDescription('Show the Top 10.'))
        .setDMPermission(false),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const guildId = interaction.guild.id;
        const user = interaction.options.getUser('user') || interaction.user;

        if ((subcommand !== 'rank' && subcommand !== 'leaderboard') && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle('Insufficient Permissions')
                .setDescription('You don\'t have the `Manage Messages` permissions.')
                .setColor(0x00c8ff)

            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        if (user.bot) {
            return interaction.reply({ content: "Bots can't be assigned levels or ranks.", ephemeral: true });
        }

        const calculateLevel = (xp) => Math.floor(xp / 100);
        
      if (subcommand === 'leaderboard') {
        const guild = interaction.guild;
        try {
            const members = await guild.members.fetch();
            const memberIds = members.map(member => member.id);
    
            const topUsers = await LevelUser.find({ userId: { $in: memberIds } })
              .sort({ level: -1, xp: -1 });
    
            const uniqueUsers = [];
            const seenUserIds = new Set();
    
            topUsers.forEach(user => {
              if (!seenUserIds.has(user.userId)) {
                seenUserIds.add(user.userId);
                uniqueUsers.push(user);
              }
            });
    
            const embed = new EmbedBuilder()
              .setTitle('Top 10 Leaderboard')
              .setColor('#00FF00')
              .setDescription('The top 10 users based on level and XP');
    
            if (uniqueUsers.length === 0) {
              return interaction.reply('There are no users in the leaderboard on this server.');
            }
    
            uniqueUsers.slice(0, 10).forEach((user, index) => {
              embed.addFields(
                { name: `#${index + 1}. ${user.username}`, value: `Level: ${user.level} | XP: ${user.xp}` }
              );
            });
    
            return interaction.reply({ embeds: [embed], ephemeral: true });
          } catch (error) {
            console.error(error);
            return interaction.reply('There was an issue retrieving the leaderboard.');
          }    
    } else if (subcommand === 'rank') {
            const userDoc = await LevelUser.findOne({ userId: user.id, guildId });

            if (!userDoc) {
                const noRankEmbed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Rank Not Found')
                    .setDescription(`${user.username} has no rank or XP data yet.`)
                    .setColor(0x00c8ff)

                return interaction.reply({ embeds: [noRankEmbed], ephemeral: true });
            }

            const rankEmbed = new EmbedBuilder()
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle('User Rank')
                .setDescription(`Rank details for ${user}.`)

                .addFields(
                    { name: 'Level', value: `${userDoc.level}`, inline: true },
                    { name: 'XP', value: `${userDoc.xp}`, inline: true }
                )
                .setColor(0x00c8ff)

            return interaction.reply({ embeds: [rankEmbed], ephemeral: true });
        } else if (subcommandGroup === 'channel') {
            if (subcommand === 'set') {
                const channel = interaction.options.getChannel('channel');
                let userDoc = await LevelUser.findOne({ userId: interaction.user.id, guildId });
                if (!userDoc) {
                    userDoc = new LevelUser({ userId: interaction.user.id, guildId, levelChannelId: channel.id });
                } else {
                    userDoc.levelChannelId = channel.id;
                }
                await userDoc.save();

                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Channel Set')
                    .setDescription(`Level-up messages will now be sent to ${channel}.`)
                    .setColor(0x00c8ff)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (subcommand === 'remove') {
                let userDoc = await LevelUser.findOne({ userId: interaction.user.id, guildId });
                if (userDoc) {
                    userDoc.levelChannelId = null;
                    await userDoc.save();
                }
                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Channel Removed')
    
                    .setDescription('Level-up messages will be sent to the current channel.')
                    .setColor(0x00c8ff)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (subcommand === 'add' || subcommand === 'remove') {
            const amount = interaction.options.getInteger('amount');
            if (amount < 1) {
                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Invalid Amount')
                    .setDescription('You cannot add or remove a negative amount or zero.')
                    .setColor(0x00c8ff)
                    

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            let userDoc = await LevelUser.findOne({ userId: targetUser.id, guildId });

            if (!userDoc) {
                userDoc = new LevelUser({ userId: targetUser.id, guildId, xp: 0, level: 0 });
            }

            const action = subcommand === 'add' ? 'added to' : 'removed from';

            if (subcommand === 'add') {
                userDoc.level += amount;
            } else if (subcommand === 'remove') {
                userDoc.level = Math.max(0, userDoc.level - amount);
            }

            userDoc.xp = calculateLevel(userDoc.level) * 100;
            await userDoc.save();

            const embed = new EmbedBuilder()
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle(`Level ${subcommand === 'add' ? 'Added' : 'Removed'}`)
                .setDescription(`${amount} level(s) ${action} ${targetUser}.`)
                .addFields(
                    { name: 'New Level', value: `${userDoc.level.toString()}`, inline: true },
                    { name: 'Current XP', value: `${userDoc.xp.toString()}`, inline: true }
                )
                .setColor(0x00c8ff)
                

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommandGroup === 'xp') {
            const amount = interaction.options.getInteger('amount');
            if (amount < 1) {
                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Invalid Amount')
                    .setDescription('You cannot add or remove a negative amount or zero.')
                    .setColor(0x00c8ff)
                    
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            let userDoc = await LevelUser.findOne({ userId: targetUser.id, guildId });

            if (!userDoc) {
                userDoc = new LevelUser({ userId: targetUser.id, guildId, xp: 0, level: 0 });
            }

            if (subcommand === 'add') {
                userDoc.xp += amount;
            } else if (subcommand === 'remove') {
                userDoc.xp = Math.max(0, userDoc.xp - amount);
            }

            userDoc.level = calculateLevel(userDoc.xp);
            await userDoc.save();

            const embed = new EmbedBuilder()
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle(`XP ${subcommand === 'add' ? 'Added' : 'Removed'}`)
                .setDescription(`${amount} XP ${subcommand === 'add' ? 'added to' : 'removed from'} ${targetUser}.`)
                .addFields(
                    { name: 'New XP', value: `${userDoc.xp.toString()}`, inline: true },
                    { name: 'New Level', value: `${userDoc.level.toString()}`, inline: true }
                )

                .setColor(0x00c8ff)
                

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};