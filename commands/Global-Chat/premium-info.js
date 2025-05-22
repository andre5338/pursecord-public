const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    maintenance: false,
    staff: false,
    data: new SlashCommandBuilder()
    .setName('what-is-premium')
    .setDescription('What is premium?')
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Premium', iconURL: 'https://cdn.discordapp.com/emojis/1296440511707746304.gif' })
        .setColor(0xff3aa4)
        .setTitle('Premium Informations')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setDescription(`What is Premium?

Premium is a special feature that allows you to unlock additional features and benefits for your account. By purchasing Premium, you can enjoy exclusive perks and enhancements that enhance your experience.

**Benefits of Premium:**
- Access to "Join Server" link in the Global-Chat
- Access to Beta-Features
- a 20% discount on all purchases in the shop
- and much more!`);
        
      return interaction.editReply({ embeds: [embed] });
    }
}