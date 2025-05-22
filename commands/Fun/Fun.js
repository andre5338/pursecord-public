const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const Note = require('../../models/Note');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fun')
        .setDescription('Fun commands')
        .addSubcommandGroup(group =>
            group.setName('note')
                .setDescription('Manage your notes')
                .addSubcommand(subcommand =>
                    subcommand.setName('add')
                        .setDescription('Add a new note')
                        .addStringOption(option =>
                            option.setName('message')
                                .setDescription('The content of the note')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('edit')
                        .setDescription('Edit an existing note')
                        .addIntegerOption(option =>
                            option.setName('number')
                                .setDescription('The note number to edit')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('message')
                                .setDescription('The new content of the note')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('remove')
                        .setDescription('Remove a note')
                        .addIntegerOption(option =>
                            option.setName('number')
                                .setDescription('The note number to remove')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('list')
                        .setDescription('List all your notes'))
                .addSubcommand(subcommand =>
                    subcommand.setName('show')
                        .setDescription('Show a specific note')
                        .addIntegerOption(option =>
                            option.setName('number')
                                .setDescription('The note number to show')
                                .setRequired(true))))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mc-status')
                .setDescription('Shows the status of the Minecraft server.')
                .addStringOption(option =>
                    option.setName('ip')
                        .setDescription('The IP address of the Minecraft server.')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('dad-joke')
                .setDescription('Sends a random dad joke.'))
        .setDMPermission(false),

    async execute(interaction) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        let userNotes = await Note.findOne({ userId }) || new Note({ userId, notes: [] });
     
        await interaction.deferReply();

        if (subcommandGroup === 'note') {
            if (subcommand === 'add') {
                const message = interaction.options.getString('message');
                userNotes.notes.push({ message });
                await userNotes.save();

                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setColor(0x00c8ff)
                    .setTitle('Note Added')
                    .setDescription(`Note: "${message}" was successfully added!`)

                return interaction.editReply({ embeds: [embed], ephemeral: true });
            } else if (subcommand === 'edit') {
                const number = interaction.options.getInteger('number') - 1;
                const newMessage = interaction.options.getString('message');

                if (userNotes.notes.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setColor(0xff0000)
                        .setDescription('You have no notes to edit.')

                    return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
                }

                if (userNotes.notes[number]) {
                    userNotes.notes[number].message = newMessage;
                    await userNotes.save();

                    const embed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setColor(0x00c8ff)
                        .setTitle('Note Edited')
                        .setDescription(`Note #${number + 1} has been updated to: "${newMessage}"`)
                        

                    return interaction.editReply({ embeds: [embed], ephemeral: true });
                }

                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setColor(0xff0000)
                    .setDescription('Invalid note number.')
                    

                return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else if (subcommand === 'remove') {
                const number = interaction.options.getInteger('number') - 1;

                if (userNotes.notes.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setColor(0xff0000)
        
                        .setDescription('You have no notes to remove.')
                        

                    return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
                }

                if (userNotes.notes[number]) {
                    userNotes.notes.splice(number, 1);
                    await userNotes.save();

                    const embed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setColor(0x00c8ff)
                        .setTitle('Note Removed')
                        .setDescription(`Note #${number + 1} was removed.`)
                        

                    return interaction.editReply({ embeds: [embed], ephemeral: true });
                }

                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setColor(0xff0000)
                    .setDescription('Invalid note number.')
                    

                return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else if (subcommand === 'list') {
                if (userNotes.notes.length === 0) {
                    return interaction.editReply({ content: 'You have no notes.', ephemeral: true });
                }

                const notesList = userNotes.notes.map((note, index) => `#${index + 1}: ${note.message}`).join('\n');

                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setColor(0x00c8ff)
                    .setTitle('Your Notes')
                    .setDescription(notesList)

                return interaction.editReply({ embeds: [embed], ephemeral: true });
            } else if (subcommand === 'show') {
                const number = interaction.options.getInteger('number') - 1;

                if (userNotes.notes.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setColor(0xff0000)
                        .setDescription('You have no notes to show.')

                    return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
                }

                if (userNotes.notes[number]) {
                    const note = userNotes.notes[number];

                    const embed = new EmbedBuilder()
                        .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                        .setColor(0x00c8ff)
                        .setTitle(`Note #${number + 1}`)
                        .setDescription(note.message)
                        

                    return interaction.editReply({ embeds: [embed], ephemeral: true });
                }

                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setColor(0xff0000)
                    .setDescription('Invalid note number.')
                    

                return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            }
         } else if (subcommand === 'mc-status') {
            const serverIP = interaction.options.getString('ip');
        
            try {
                const response = await axios.get(`https://api.mcsrvstat.us/2/${serverIP}`);
                const serverData = response.data;
        
                if (!serverData || serverData.online === false || !serverData.ip) {
                    const notFoundEmbed = new EmbedBuilder()
                        .setAuthor({ 
                            name: interaction.client.user.username, 
                            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
                        })
                        .setColor(0xff0000)
                        .setTitle('Server Not Found')
                        .setDescription(`The Minecraft server \`${serverIP}\` could not be found or is currently offline.`);
        
                    return await interaction.editReply({ embeds: [notFoundEmbed], ephemeral: true });
                }
        
                const embed = new EmbedBuilder()
                    .setAuthor({ 
                        name: interaction.client.user.username, 
                        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setColor(0x00c8ff)
                    .setTitle('Minecraft Server Status')
                    .setDescription('The server is online!')
                    .addFields(
                        { name: 'Server IP', value: serverIP, inline: true },
                        { name: 'Version', value: serverData.version || 'Unknown', inline: true },
                        { name: 'Players', value: `${serverData.players.online}/${serverData.players.max}`, inline: true }
                    );
        
                await interaction.editReply({ embeds: [embed], ephemeral: true });
        
            } catch (error) {
                console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ 
                        name: interaction.client.user.username, 
                        iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setColor(0xff0000)
                    .setTitle('Error')
                    .setDescription('An error occurred while fetching the server status.');
        
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            }
        } else if (subcommand === 'dad-joke') {
                const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
                const jokeData = response.data;
                const joke = `${jokeData.setup} ${jokeData.punchline}`;

                const embed = new EmbedBuilder()
                    .setAuthor({ 
  name: interaction.client.user.username, 
  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) 
})                    .setColor(0x00c8ff)
                    .setTitle('Here\'s a random joke for you!')
                    .setDescription(joke)

                await interaction.editReply({ embeds: [embed], ephemeral: true });
              }
    }
};