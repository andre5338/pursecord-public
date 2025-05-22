const { EmbedBuilder, Events } = require('discord.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        const logChannelId = '1291414570287497307';
        const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

        const owner = await guild.fetchOwner().catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Joined a new server')
            .setColor(0x00ff00)
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Owner', value: owner ? `${owner.user.tag}` : 'Unknown', inline: true },
                { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }
            )
            .setThumbnail(guild.iconURL({ dynamic: true }));

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
