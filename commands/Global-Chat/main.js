const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Channel = require('../../models/Global-Chat/Channel');
const { payUser } = require('../extra/pay.js');
const MessageQueue = require('../../Modules/MessageQueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global-chat')
        .setDescription('Global chat commands')
        .addSubcommandGroup(group =>
            group
                .setName('setup')
                .setDescription('Configure global chat system')
                .addSubcommand(sub =>
                    sub
                        .setName('add')
                        .setDescription('Enable global chat in this server'))
                .addSubcommand(sub =>
                    sub
                        .setName('remove')
                        .setDescription('Disable global chat in this server')))
            .addSubcommand(sub =>
                    sub
                        .setName('pay')
                        .setDescription('Send coins to users')
                        .addStringOption(opt =>
                            opt.setName('recipient')
                                .setDescription('User ID or "ALL"')
                                .setRequired(true))
                        .addStringOption(opt =>
                            opt.setName('amount')
                                .setDescription('Amount or "ALL"')
                                .setRequired(true)))
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'setup') {
            const serverId = interaction.guild.id;
            const channelId = interaction.channel.id;
            const channel = interaction.channel;
        
            // Neue Berechtigungsprüfung
            const requiredPermissions = [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.EmbedLinks
            ];
        
            if (!interaction.guild.members.me.permissions.has(requiredPermissions)) {
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`<:Arrow:1361120667386515516> I need following permissions: ${requiredPermissions.map(p => `\`${p}\``).join(', ')}`)], 
                    ephemeral: true
                });
            }
        
            if (interaction.options.getSubcommand() === 'add') {
                try {
                    const existingChannel = await Channel.findOne({ Guild: serverId, Channel: channelId });
                    
                    if (existingChannel) {
                        return await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`<:Arrow:1361120667386515516> This channel is already registered as global chat`)
                                    .setColor("Red")
                            ], 
                            ephemeral: true
                        });
                    }
        
                    await Channel.create({
                        Guild: serverId,
                        Channel: channelId,
                        LastMessage: Date.now()
                    });
        
                    await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('Green')
                            .setDescription(`<:Arrow:1361120667386515516> Global chat successfully registered in ${channel}`)], 
                        ephemeral: true
                    });
        
                    const owner = await interaction.guild.fetchOwner();
                    const welcomeEmbed = new EmbedBuilder()
                        .setAuthor({
                            name: "Welcome to the Global Chat!",
                            iconURL: interaction.guild.iconURL({ dynamic: true, size: 1024 })
                        })
                        .setDescription(`<:Arrow:1361120667386515516> **${interaction.guild.name}** has joined our chat!
        ┏\`📚\` › **Server-Name:** \`${interaction.guild.name}\`
        ┃\`👑\` › **Server Owner:** \`${owner.user.username}\`
        ┗\`👥\` › **Member:** \`${interaction.guild.memberCount} 👤 members on the server!\``)
                        .setColor("#00ff00");
        
                    const queue = new MessageQueue(interaction.client);
                    const channels = await Channel.find({ Channel: { $ne: channelId } });
                    
                    channels.forEach(ch => {
                        queue.add({
                            channelID: ch.Channel,
                            content: { embeds: [welcomeEmbed] }
                        });
                    });
        
                } catch (error) {
                    console.error('Error creating channel entry:', error);
                    await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#ff0000')
                            .setDescription('There was an error setting up global chat')], 
                        ephemeral: true
                    });
                }
            } else if (interaction.options.getSubcommand() === 'remove') {
                try {
                    const deleted = await Channel.deleteOne({ 
                        Guild: serverId, 
                        Channel: channelId 
                    });
        
                    if (deleted.deletedCount === 0) {
                        return await interaction.editReply({
                            embeds: [new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(`<:Arrow:1361120667386515516> No global chat found in this channel`)], 
                            ephemeral: true
                        });
                    }
        
                    await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('Green')
                            .setDescription(`<:Arrow:1361120667386515516> Global chat successfully removed from ${channel}`)], 
                        ephemeral: true
                    });
        
                } catch (error) {
                    console.error('Error removing channel:', error);
                    await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('<:Arrow:1361120667386515516> Error removing global chat')], 
                        ephemeral: true
                    });
                }
            }
        }

        if (subcommand === 'pay') {
            await payUser(
                interaction,
                interaction.options.getString('recipient'),
                interaction.options.getString('amount')
            );
        }
    }
};