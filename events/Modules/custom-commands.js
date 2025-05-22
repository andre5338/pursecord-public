const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const CustomCommand = require('../../models/CustomCommand');
const prefix = 'p!';
const cooldowns = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!message.guild || message.author.bot || (!message.content.startsWith(prefix) && !message.content.startsWith(prefix.toUpperCase()))) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const guildId = message.guild.id;
        const now = Date.now();
        const cooldownAmount = 5000;

        const cooldownKey = `${guildId}-${commandName}`;
        if (cooldowns.has(cooldownKey)) {
            const expirationTime = cooldowns.get(cooldownKey) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`).then(async (msg) => {
                    setTimeout(async () => {
                        try {
                            if (msg.deletable) await msg.delete();
                        } catch (err) {}
                    }, 5000);
                });
            }
        }

        const customCommand = await CustomCommand.findOne({ guildId, commandName });
        if (customCommand) {
            const member = await message.guild.members.fetch(customCommand.createdBy);
            const embed = new EmbedBuilder()
                .setDescription(customCommand.response)
                .setColor(0x00ff10)
                .setFooter({ text: `Created by ${member.user.username} | Used by ${message.author.username}` });

            await message.channel.send({ embeds: [embed] });

            if (message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                try {
                    if (message.deletable) await message.delete();
                } catch (err) {}
            }
        }

        cooldowns.set(cooldownKey, now);
        setTimeout(() => cooldowns.delete(cooldownKey), cooldownAmount);
    }
};