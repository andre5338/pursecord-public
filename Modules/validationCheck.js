const { EmbedBuilder } = require("discord.js");
const User = require('../models/Global-Chat/User');

module.exports = async function checkValidation(message) {
    const userData = await User.findOne({ User: message.author.id }) ?? await User.create({ User: message.author.id });
    const premium = userData.Ranks.includes("VIP");

    const inviteRegex = /(?:discord\.gg|discordapp\.com\/invite|discord\.com\/invite|\.gg)\/\w+/;

    if (!premium && inviteRegex.test(message.content)) {
        await message.delete();
        await message.author.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription('<:Arrow:1361120667386515516> Invite links are not allowed in the Globalchat!')
                    .setColor('Red')
            ]
        }).catch(() => {});
        return true;
    }

    if (message?.content?.length > 500) {
        let reply = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription('<:Arrow:1361120667386515516> Your message is too long! Maximum length is 500 Characters.')
                    .setColor('Red')
            ]
        });
        setTimeout(async () => {
            await message.delete().catch(() => {});
            await reply.delete().catch(() => {});
        }, 5000);
        return true;
    }

    if (message?.content?.length < 2 && message.attachments.size == 0 && message.stickers.size == 0) {
        let reply = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription('<:Arrow:1361120667386515516> Your message is too short! Minimum length is 2 Characters.')
                    .setColor('Red')
            ]
        });
        setTimeout(async () => {
            await message.delete().catch(() => {});
            await reply.delete().catch(() => {});
        }, 5000);
        return true;
    }

    return false;
};