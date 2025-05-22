const { ChannelType } = require("discord.js");
const Guild = require('../models/Global-Chat/Channel');
const fs = require('fs');

async function sendMessageToAllChannels(client, globalMessage, reply, image, sticker) {
    const sentMessages = [];
    const guilds = await Guild.find({});
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const guild of guilds) {
        try {
            const channel = await client.channels.fetch(guild.Channel).catch(() => null);
            if (!channel || channel.type !== ChannelType.GuildText || !channel.permissionsFor(client.user).has('SendMessages')) continue;

            const sendOptions = {
                content: globalMessage.content || undefined,
                embeds: globalMessage.embeds || [],
                files: []
            };

            if (image && fs.existsSync(image.attachment)) {
                sendOptions.files.push({ attachment: image.attachment, name: image.name });
            }

            if (sticker && fs.existsSync(sticker.attachment)) {
                sendOptions.files.push({ attachment: sticker.attachment, name: sticker.name });
            }

            const sent = await channel.send(sendOptions);
            sentMessages.push({
                serverId: guild.Guild,
                channelId: guild.Channel,
                messageId: sent.id
            });

            await delay(1000); 

        } catch (err) {
            console.error(`Fehler beim Senden an ${guild.Channel}:`, err);
        }
    }

    if (reply) {
        await reply.delete().catch(() => { });
    }

    if (image && fs.existsSync(image.attachment)) {
        fs.unlink(image.attachment, () => { });
    }

    return sentMessages;
}

module.exports = { sendMessageToAllChannels };