const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { AutoMessage, AutoDelete } = require('../../models/Auto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auto')
        .setDescription('Manage automatic for your server.')
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('message')
                .setDescription('Manage auto-messages.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add an auto-message.')
                .addChannelOption(option =>
    option
        .setName('channel')
        .setDescription('The channel to send the message.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
                .addStringOption(option =>
                    option
                        .setName('time')
                        .setDescription('Interval (e.g., 1s, 2m, 3h, 4d).')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('The content of the auto-message.')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('embed')
                        .setDescription('Send the message as an embed (default: false).')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove an auto-message.')
                .addIntegerOption(option =>
                    option
                        .setName('number')
                        .setDescription('The auto-message number to remove.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show all active auto-messages.')
        ))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('delete')
                .setDescription('Manage auto-delete.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Enable auto-delete for a channel')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('The channel to apply auto-delete')
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                                .setRequired(true))
                        .addStringOption(option =>
                            option
                                .setName('time')
                                .setDescription('The duration before messages are deleted (e.g., 1s, 1m, 1h, 1d)')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('List all channels with auto-delete')
                        .addStringOption(option =>
                            option
                                .setName('channel')
                                .setDescription('Filter a specific channel')
                                .setAutocomplete(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove auto-delete from a channel')
                        .addStringOption(option =>
                            option
                                .setName('channel')
                                .setDescription('Select a channel to remove')
                                .setAutocomplete(true)
                                .setRequired(true))))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
            .setDMPermission(false),
   
       async autocomplete(interaction) {
           const focusedValue = interaction.options.getFocused();
           const entries = await AutoDelete.find({ guildId: interaction.guild.id });
       
           const filtered = entries
               .map(entry => {
                   const channel = interaction.client.channels.cache.get(entry.channelId);
                   const channelName = channel ? channel.name : `Unknown Channel (${entry.channelId})`;
                   return {
                       name: `${channelName} | ${formatDuration(entry.duration)}`,
                       value: entry.channelId,
                   };
               })
               .filter(entry => entry.name.toLowerCase().includes(focusedValue.toLowerCase()));
       
           await interaction.respond(filtered.length ? filtered : [{ name: 'No results found', value: 'none' }]);
       },
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

      if (subcommandGroup === 'delete') {
        if (subcommand === 'set') {
            const channel = interaction.options.getChannel('channel');
            const time = interaction.options.getString('time');
            const duration = parseTimeToMs(time);

            if (!duration || duration > 14 * 24 * 60 * 60 * 1000) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Invalid Time')
    
                    .setDescription('Use formats like `1s`, `1m`, `1h`, or `1d`. Maximum is 14 days.');

                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            await AutoDelete.findOneAndUpdate(
                { guildId: interaction.guild.id, channelId: channel.id },
                { guildId: interaction.guild.id, channelId: channel.id, duration },
                { upsert: true }
            );

            const embed = new EmbedBuilder()
                .setColor(0x00ff10)
                .setTitle('Auto-Delete Enabled')
                .setDescription(`Auto-delete enabled for ${channel} with a duration of ${time}.`)
;

            interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'list') {
            const channelQuery = interaction.options.getString('channel');
            const filters = { guildId: interaction.guild.id };
            if (channelQuery) filters.channelId = channelQuery;

            const entries = await AutoDelete.find(filters);
            if (entries.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xffff00)
                    .setTitle('No Channels Found')
                    .setDescription('No channels with auto-delete enabled were found.');
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0x007bff)
                .setTitle('Auto-Delete Settings')
                .setDescription(
                    entries
                        .map(entry => `<#${entry.channelId}>: ${formatDuration(entry.duration)}`)
                        .join('\n')
                );
            interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'remove') {
            const channelId = interaction.options.getString('channel');
            const entry = await AutoDelete.findOneAndDelete({ guildId: interaction.guild.id, channelId });

            if (!entry) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Channel Not Found')
                    .setDescription('No auto-delete setting found for the selected channel.');

                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0x00ff10)
                .setTitle('Auto-Delete Removed')
                .setDescription(`Auto-delete has been removed for <#${channelId}>.`);

            interaction.editReply({ embeds: [embed], ephemeral: true });
        }  
    } 
      if (subcommandGroup === 'message') {
        if (subcommand === 'add') {
            const channel = interaction.options.getChannel('channel');
            const time = interaction.options.getString('time');
            const messageContent = interaction.options.getString('message');
            const isEmbed = interaction.options.getBoolean('embed') || false;

            const timeRegex = /^(\d+)(s|m|h|d)$/;
            const match = time.match(timeRegex);
            if (!match) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Invalid Time Format')
                    .setDescription('Use a valid time format, e.g., `1s`, `2m`, `3h`, `4d`.')
                    
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            const interval = parseInt(match[1], 10) * {
                s: 1000,
                m: 60000,
                h: 3600000,
                d: 86400000,
            }[match[2]];

            await AutoMessage.create({
                guildId: interaction.guild.id,
                channelId: channel.id,
                message: messageContent,
                interval,
                nextExecution: new Date(Date.now() + interval),
                isEmbed,
            });

            const embed = new EmbedBuilder()
                .setColor(0x00c8ff)
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle('Auto-Message Added')
                .setDescription(`A new auto-message has been set for ${channel} every ${time}.`)
                .addFields(
                    { name: 'Message Content', value: messageContent },
                    { name: 'Interval', value: time }
                )
                
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'remove') {
            const number = interaction.options.getInteger('number');
            const messages = await AutoMessage.find({ guildId: interaction.guild.id });

            if (number < 1 || number > messages.length) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('Invalid Number')
                    .setDescription('Please provide a valid auto-message number.')
                    
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            const messageToRemove = messages[number - 1];
            await AutoMessage.findByIdAndDelete(messageToRemove._id);

            const embed = new EmbedBuilder()
                .setColor(0x00c8ff)
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle('Auto-Message Removed')
                .setDescription(`Auto-message #${number} has been removed.`)
                
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'show') {
            const messages = await AutoMessage.find({ guildId: interaction.guild.id });

            if (messages.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setTitle('No Auto-Messages Found')
                    .setDescription('There are no active auto-messages on this server.')
                    
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            const description = messages
                .map((msg, index) => `**#${index + 1}**: <#${msg.channelId}> every ${msg.interval / 1000}s`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x00c8ff)
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle('Active Auto-Messages')
                .setDescription(description)
                
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      }
    },
};

function parseTimeToMs(time) {
    const match = time.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * units[unit];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (60 * 1000)) % 60;
    const hours = Math.floor(ms / (60 * 60 * 1000)) % 24;
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));

    return [
        days ? `${days}d` : '',
        hours ? `${hours}h` : '',
        minutes ? `${minutes}m` : '',
        seconds ? `${seconds}s` : '',
    ]
        .filter(Boolean)
        .join(' ');
}