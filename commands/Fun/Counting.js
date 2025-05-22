const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { Counting } = require('../../models/Counting');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting')
        .setDescription('Manage the counting system.')
        .addSubcommandGroup(group =>
            group.setName('channel')
                .setDescription('Manage the counting channel.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set the channel for the counting system.')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('The channel to set for counting. Leave empty to use the current channel.')
                                .addChannelTypes(ChannelType.GuildText)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove the counting system.')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('math')
                .setDescription('Toggle math support for counting.')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable math support.')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setDMPermission(false),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup();
        const client = interaction.client;
        const serverIcon = interaction.guild.iconURL({ dynamic: true });
        const guildId = interaction.guild.id;
        const botIcon = client.user.avatarURL();
        const botName = client.user.username;
        

        const permissions = interaction.channel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setTitle('Insufficient Permissions')
                .setDescription('I\'m missing `Manage Messages` permissions on this server! Please fix this before using this command!')
                .setColor(0xff0000)
                .setThumbnail(serverIcon)
                .setAuthor({ name: botName, iconURL: botIcon });

            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        if (subcommand !== 'rank' && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setTitle('Insufficient Permissions')
                .setDescription('You do not have the `Manage Messages` permission in this channel.')
                .setColor(0xff0000)
                .setThumbnail(serverIcon)
                .setAuthor({ name: client.user.username, iconURL: botIcon });

            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        if (group === 'channel') {
            if (subcommand === 'set') {
                const channel = interaction.options.getChannel('channel') || interaction.channel;
                const existingChannel = await Counting.findOne({ guildId }).catch(err => {
                    console.error('Database error:', err);
                    return null;
                });

                if (existingChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('**Counting Channel Already Set**')
                        .setDescription(`The counting channel is already set to <#${existingChannel.channelId}>. Use \`\/counting channel remove\`\ to change it.`)
                        .setColor(0xff0000)
                        
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await Counting.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { channelId: channel.id },
                    { upsert: true }
                ).catch(err => {
                    console.error('Database error:', err);
                });

                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('🚀 **Counting Game Help**')
                    .setDescription('Welcome to the counting game! Start counting by typing the next number in this channel. The count resets if someone makes a mistake. You can also type `/counting leaderboard` to see the top players.')
                    .setColor(0x00c8ff)
                        
                    

                try {
                    const helpMessage = await channel.send({ embeds: [embed], ephemeral: true });
                    await helpMessage.pin();
                    const successEmbed = new EmbedBuilder()
                        .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() })  
                        .setDescription(`The channel <#${channel.id}> has been successfully set as the counting channel, and the help message has been pinned!`)
                        .setColor(0x00c8ff)
                                
                        

                    return interaction.reply({ embeds: [successEmbed], ephemeral: true });
                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setDescription('Failed to send or pin the help message to the specified channel.')
                        .setColor(0x00c8ff)
                                
                        
                        
                    
                    return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
                }

            } else if (subcommand === 'remove') {
                const result = await Counting.findOneAndDelete({ guildId }).catch(err => {
                    console.error('Database error:', err);
                    return null;
                });

                    const embed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setDescription(result ? '✅ The counting channel has been removed.' : '❌ No counting channel was set.')
                        .setColor(result ? 0x00c8ff : 0xff0000)
                                
                        


                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (subcommand === 'math') {
            const mathEnabled = interaction.options.getBoolean('enabled');
            await Counting.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { allowMath: mathEnabled },
                { upsert: true }
            ).catch(err => {
                console.error('Database error:', err);
            });

            const status = mathEnabled ? 'enabled' : 'disabled';
            const mathEmbed = new EmbedBuilder()
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle("Math")
                .setDescription(`🔢 Math support has been ${status} for the counting game.`)
                .setColor(0x00c8ff)
                
                
                
            return interaction.reply({ embeds: [mathEmbed], ephemeral: true });
        }
    },
};