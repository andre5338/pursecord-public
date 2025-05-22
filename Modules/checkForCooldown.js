const { EmbedBuilder } = require("discord.js");
const Users = require('../models/Global-Chat/User.js');

async function checkCooldown(message) {
    const userId = message.author.id;
    const now = Date.now();
    const cooldownTime = 5000;

    const userData = await Users.findOne({ User: userId });
    if (userData && userData.IsStaff) return false;

    if (!message.client.cooldowns) {
        message.client.cooldowns = new Map();
    }

    if (message.client.cooldowns.has(userId)) {
        const lastMessageTime = message.client.cooldowns.get(userId);
        const timeLeft = cooldownTime - (now - lastMessageTime);

        if (timeLeft > 0) {
            let reply = await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1312847779936211006> You are currently under cooldown. You can chat again in <t:${Math.floor((now + timeLeft) / 1000)}:R>`)
                        .setColor('Red')
                ]
            });
            setTimeout(async () => {
                await message.delete().catch(() => { });
                await reply.delete().catch(() => { });
            }, 5000);
            return true;
        }
    }
    message.client.cooldowns.set(userId, now);
    return false;
}

module.exports = { checkCooldown };