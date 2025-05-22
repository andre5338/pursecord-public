const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../config.js')
module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const botMention = `<@${client.user.id}>`;
        if (message.content === botMention) {

            const funFacts = [
                'PurseCord was the 20th bot from my developers?',
                'The first alpha version of PurseCord only took ~13 Minutes?'
            ];

            const randomFunFact = funFacts[Math.floor(Math.random() * funFacts.length)];

            const embed = new EmbedBuilder()
                .setAuthor({ name: message.client.user.username, iconURL: message.client.user.avatarURL() })
                .setTitle('Ping?')
                .setDescription(`Oh hey **${message.author.username}**!\nDid you know: ${randomFunFact}`)
                .setColor(0x00c8ff)
                .addFields(
                    { name: 'Help:', value: 'To get started, use **/utility help** to see a list of commands!' },
                    { name: 'Custom-Commands:', value: 'Each of my custom commands starts with the command **p!**' }
                );

            const linkButton1 = new ButtonBuilder()
                .setLabel('Invite Me')
                .setStyle(ButtonStyle.Link)
                .setURL(config.main.bot_invite)
                .setEmoji(config.main.link);

            const linkButton2 = new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL(config.main.support_server)
                .setEmoji(config.main.link);

            const row = new ActionRowBuilder().addComponents(linkButton1, linkButton2);

            const replyMessage = await message.reply({ embeds: [embed], components: [row] });

            setTimeout(() => {
                replyMessage.delete().catch(() => {});
            }, 120000);
        }
    }
};