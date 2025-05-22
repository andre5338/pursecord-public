const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const afkModel = require('../../models/afkModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('utility')
    .setDescription('Manage Utility Commands')
    .addSubcommand(subcommand =>
        subcommand
        .setName('help')
        .setDescription('Get help with a specific command')
    )
    .addSubcommandGroup(group =>
      group
        .setName('afk')
        .setDescription('Manage your AFK status')
        .addSubcommand(subcommand =>
            subcommand
              .setName('set')
              .setDescription('Set your AFK status with an optional reason.')
              .addStringOption(option =>
                option
                  .setName('reason')
                  .setDescription('The reason for your AFK status.')
              )
          )
          .addSubcommand(subcommand =>
            subcommand
              .setName('remove')
              .setDescription('Remove your AFK status.')))
          .setDMPermission(false),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (interaction.options.getSubcommandGroup() === 'afk') {
      if (subcommand === 'set') {
            const existingAFK = await afkModel.findOne({ userId });
            if (existingAFK) {
              const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('AFK Status Already Set')
                .setDescription('You are already AFK. Remove your AFK status first before setting it again.');

              return interaction.reply({ embeds: [embed], ephemeral: true });
            }
      
            const reason = interaction.options.getString('reason') || 'No reason provided';
            await afkModel.create({ userId, reason, timestamp: new Date() });
            const embed = new EmbedBuilder()
              .setColor(0x00d5ff)
              .setTitle('AFK Status Set')
              .setDescription(`You are now AFK.\n**Reason:** ${reason}`);
            
              await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === 'remove') {
        const existingAFK = await afkModel.findOne({ userId });
        if (!existingAFK) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('No AFK Status Found')
            .setDescription('You are not currently AFK. Use `/afk set` to set your AFK status.')
    ;

          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
  
        let notificationText = '';
        if (existingAFK.notifications.length > 0) {
          notificationText = existingAFK.notifications
            .map(
              notification =>
                `You got pinged ${notification.count} time(s) by <@${notification.userId}>`
            )
            .join('\n');
        }
  
        const embed = new EmbedBuilder()
          .setColor(0x00ff10)
          .setTitle('AFK Status Removed')
          .setDescription('You are no longer AFK.')
          .addFields({
            name: 'Ping Notifications',
            value: notificationText || 'No notifications.',
          });
  
        await afkModel.findOneAndDelete({ userId });
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subcommand === 'help') {
            await interaction.deferReply();
    
            const embed = new EmbedBuilder()
                .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                .setTitle('Help Menu')
                .setDescription(`Hey, since there are many commands in the bot, we now have it via the select menu, feel free to give it a try :D`)
                .setColor(0x00c8ff)
                .setThumbnail(interaction.client.user.avatarURL())
                
    
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('Choose a Category')
                .addOptions([
                    {
                        label: 'Utility',
                        description: 'Show\'s you commands from Utility Category.',
                        value: 'utility_commands',
                    },
                    {
                        label: 'Moderation',
                        description: 'Show\'s you commands from Moderation Category.',
                        value: 'moderation_commands',
                    },
                    {
                        label: 'Fun',
                        description: 'Show\'s you commands from Fun Category.',
                        value: 'fun_commands',
                    },
                    {
                        label: 'Developer',
                        description: 'Show\'s you commands from Developer Category.',
                        value: 'developer_commands',
                    }
                ]);
    
            const row = new ActionRowBuilder().addComponents(selectMenu);
    
            await interaction.editReply({ embeds: [embed], components: [row] });
    
            const filter = (i) => i.customId === 'help_menu' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
    
            collector.on('collect', async (i) => {
                await i.deferUpdate();
            
                let categoryEmbed;
            
                if (i.values[0] === 'utility_commands') {
                    categoryEmbed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setTitle('Utility Commands')
                        .setDescription(`
                            **/utility help ⇢** Show the help menu.
                            **/utility afk set [Reason] ⇢** Set your AFK status.
                            **/utility afk remove ⇢** Remove your AFK status.`)
                        .setColor(0x00c8ff)
                        ;
                } else if (i.values[0] === 'moderation_commands') {
                    const moderationEmbed = new EmbedBuilder()
                        .setTitle('Moderation Commands')
                        .setDescription('Choose a subcategory for moderation:')
                        .setColor(0x00c8ff)
                        ;
            
                    const moderationMenu = new StringSelectMenuBuilder()
                        .setCustomId('moderation_menu')
                        .setPlaceholder('Choose a Subcategory')
                        .addOptions([
                            {
                                label: 'Basic Moderation',
                                description: 'Ban, Kick, Timeout, etc.',
                                value: 'basic_moderation',
                            },
                            {
                                label: 'Custom Commands',
                                description: 'Add, List, Remove custom commands.',
                                value: 'custom_commands',
                            },
                            {
                                label: 'Automatic Functions',
                                description: 'Manage automatics in the server.',
                                value: 'auto_messages',
                            }
                        ]);
            
                    const moderationRow = new ActionRowBuilder().addComponents(moderationMenu);
                    await i.editReply({ embeds: [moderationEmbed], components: [moderationRow] });
            
                    const subCollector = interaction.channel.createMessageComponentCollector({
                        filter: (sub) => sub.customId === 'moderation_menu' && sub.user.id === interaction.user.id,
                        time: 60000,
                    });
            
                    subCollector.on('collect', async (sub) => {
                        await sub.deferUpdate();
    
                        let moderationCategoryEmbed;
            
                        const helpMenu = new StringSelectMenuBuilder()
                        .setCustomId('help_menu')
                        .setPlaceholder('Choose a Category')
                        .addOptions([
                            {
                                label: 'Utility',
                                description: 'Show\'s you commands from Utility Category.',
                                value: 'utility_commands',
                            },
                            {
                                label: 'Moderation',
                                description: 'Show\'s you commands from Moderation Category.',
                                value: 'moderation_commands',
                            },
                            {
                                label: 'Fun',
                                description: 'Show\'s you commands from Fun Category.',
                                value: 'fun_commands',
                            },
                            {
                                label: 'Developer',
                                description: 'Show\'s you commands from Developer Category.',
                                value: 'developer_commands',
                            }
                        ]);
                        const helpMenuRow = new ActionRowBuilder().addComponents(helpMenu);
    
                        if (sub.values[0] === 'basic_moderation') {
                            moderationCategoryEmbed = new EmbedBuilder()
                                .setTitle('Basic Moderation Commands')
                                .setDescription(`
                                    **/moderation ban <User> [Reason] ⇢** Ban a User from the Server.
                                    **/moderation kick <User> [Reason] ⇢** Kick a User from the Server.
                                    **/moderation timeout <User> [Reason] ⇢** Timeout a User in the Server.
                                    **/moderation purge_user <User> <Amount> ⇢** Purge Messages from a User.
                                    **/moderation unban <User> ⇢** Unban a User from the Server.
                                    **/moderation untimout <User> ⇢** Untimeout a User in the Server.
                                    **/moderation clear <Amount> ⇢** Clear Messages in the Channel.
                                    **/moderation emoji copy <Emoji> ⇢** Copy an Emoji from another Server.(Currently Buggy)
                                    **/moderation emoji show <Emoji> ⇢** Show Information about an Emoji.`)
                                .setColor(0x00c8ff)
                        ;
                        } else if (sub.values[0] === 'custom_commands') {
                            moderationCategoryEmbed = new EmbedBuilder()
                                .setTitle('Custom Commands Management')
                                .setDescription(`
                                    **/custom-command add <Command> <Message> ⇢** Add a Custom-Command to the Server.
                                    **/custom-command list ⇢** Show all Custom-Commands in the Server.
                                    **/custom-command remove <Command> ⇢** Remove a Custom-Command from the Server.`)
                                .setColor(0x00c8ff)
                        ;
                        } else if (sub.values[0] === 'auto_messages') {
                            moderationCategoryEmbed = new EmbedBuilder()
                                .setTitle('Automatic Management')
                                .setDescription(`
                                    **/auto message add <Channel> <Message> <Time> ⇢** Add a Auto-Message to a Channel.
                                    **/auto message show ⇢** Show all Auto-Messages in the Server.
                                    **/auto message remove <Channel> <Message> ⇢** Remove a Auto-Message from a Channel.
                                    
                                    **/auto delete add <Channel> <Time> ⇢** Add a Auto-Delete to a Channel.
                                    **/auto delete show ⇢** Show all Auto-Deletes in the Server.
                                    **/auto delete remove <Channel> <Time> ⇢** Remove a Auto-Delete from a Channel.`)
                                .setColor(0x00c8ff)
                        ;
                        }
    
                        await sub.editReply({ embeds: [moderationCategoryEmbed], components: [moderationRow, helpMenuRow] });
                    });
            
                    subCollector.on('end', async () => {
                        await i.editReply({ components: [] });
                    });
                } else if (i.values[0] === 'fun_commands') {
                    categoryEmbed = new EmbedBuilder()
                        .setTitle('Fun Commands')
                        .setDescription('soon')
                        .setColor(0x00c8ff);
                } else if (i.values[0] === 'developer_commands') {
                    categoryEmbed = new EmbedBuilder()
                        .setTitle('Developer Commands')
                        .setDescription(`
                            **/eval <Code> ⇢** Execute a Code in the Bot.
                            **/reload <Command> ⇢** Reload a Command in the Bot.
                            **/gc-update <User> <Username> <IsStaff> <Banned> <Coins> <Rank> ⇢** Update a User in the Database.`)
                        .setColor(0x00c8ff);
                }
            
                if (i.values[0] !== 'moderation_commands') {
                    await i.editReply({ embeds: [categoryEmbed], components: [row] });
                }
            });
    }
  },
};