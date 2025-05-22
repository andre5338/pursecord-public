const { Events, EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const Channel = require('../../models/Global-Chat/Channel');
const User = require('../../models/Global-Chat/User');
const { createGlobalMessage } = require('../../Modules/createGlobalMessage');
const GlobalMessage = require('../../models/Global-Chat/GlobalMessage');
const MessageQueue = require('../../Modules/MessageQueue');
const downloadImage = require('../../Modules/downloadImage');
const { checkCooldown } = require('../../Modules/checkForCooldown');
const validationCheck = require('../../Modules/validationCheck');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        try {
            if (message.author.bot) return;
            if (!message.guild) return;

            const channelEntry = await Channel.findOne({ Guild: message.guild.id, Channel: message.channel.id });
            if (!channelEntry) return;

            const permissions = message.guild.members.me.permissions;
            const channelPermissions = message.guild.members.me.permissionsIn(message.channel);

            const requiredPermissions = [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.CreateInstantInvite,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.ReadMessageHistory
            ];

            const lacksPermissions = requiredPermissions.some(perm =>
                !permissions.has(perm) || !channelPermissions.has(perm)
            );

            if (lacksPermissions) {
                const owner = await message.guild.fetchOwner();
                const missingPerms = requiredPermissions.filter(perm =>
                    !permissions.has(perm) || !channelPermissions.has(perm)
                );
                const missingPermsString = missingPerms.map(perm => perm.toString()).join(', ');

                const embedPerms = new EmbedBuilder()
                    .setTitle('⚠️ Permission Warning')
                    .setDescription(`The bot lacks required permissions to function correctly in this server.
                        
    **Missing Permissions:**
    ${missingPermsString}

    Look [here](https://discordapi.com/permissions.html#${missingPermsString}) for more Informations`);

                if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
                    return await owner.send({ embeds: [embedPerms] }).catch(() => { });
                }
                await message.channel.send({ embeds: [embedPerms] });
                return;
            }

            if (await checkCooldown(message)) return;
            if (await validationCheck(message)) return;

            const attachments = message.attachments;
            const stickers = message.stickers;
            let attachmentImage;
            let attachmentSticker;

            if (attachments.size) {
                const firstAttachment = attachments.first();
                if (firstAttachment.contentType?.startsWith('image/')) {
                    const uniqueName = `${Date.now()}-${firstAttachment.name}`;
                    const fileName = `Downloads/${uniqueName}`;
                    try {
                        if (!fs.existsSync('Downloads')) fs.mkdirSync('Downloads');
                        await downloadImage(firstAttachment.url, fileName);
                        attachmentImage = new AttachmentBuilder(fileName, { name: firstAttachment.name });
                    } catch (err) {
                        console.error(`Error downloading image: ${err.message}`);
                    }
                }
            }

            if (stickers.size) {
                const firstSticker = stickers.first();
                if (firstSticker.format === 3) {
                    const reply = await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription('<:Arrow:1361120667386515516> This sticker is a Lottie animation (.json file)')
                                .setColor('Red')
                        ]
                    });
                    setTimeout(async () => {
                        await message.delete().catch(() => {});
                        await reply.delete().catch(() => {});
                    }, 5000);
                    return;
                }
                const uniqueName = `${Date.now()}-sticker.png`;
                const fileName = `Downloads/${uniqueName}`;
                try {
                    if (!fs.existsSync('Downloads')) fs.mkdirSync('Downloads');
                    await downloadImage(firstSticker.url, fileName);
                    attachmentSticker = new AttachmentBuilder(fileName, { name: 'sticker.png' });
                } catch (err) {
                    console.error(`Error downloading sticker: ${err.message}`);
                }
            }

            const reply = await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("<a:Loading:1361123029110755549> Processing your message...")
                        .setColor("Blue")
                ]
            }).catch(() => {});

            await message.delete().catch(() => {});

            const user = await User.findOne({ User: message.author.id }) ?? await User.create({ User: message.author.id });

            if (user.Banned) {
                await reply.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<a:Loading:1361123029110755549> You are banned from the globalchat.")
                            .setColor("Red")
                    ]
                });
                setTimeout(() => reply.delete().catch(() => {}), 7000);
                return;
            }

            const embed = await createGlobalMessage(message, user, attachmentImage, attachmentSticker);
            const channels = await Channel.find();

            const messageData = {
                embeds: [embed],
                files: [attachmentImage, attachmentSticker].filter(Boolean)
            };

            const queue = new MessageQueue(message.client);
            channels.forEach(channel => {
                queue.add({
                    channelID: channel.Channel,
                    content: messageData
                });
            });

            const messageIds = channels.map(channel => ({
                serverId: channel.Guild,
                channelId: channel.Channel
            }));

            await GlobalMessage.create({
                messageAuthor: message.author.id,
                messageIds: messageIds
            });

            const coinMultiplier = user.Ranks.includes("Premium") ? 1.5 : 1;
            await User.updateOne(
                { User: user.User }, 
                { $inc: { "Stats.Messages": 1, "Stats.Coins": coinMultiplier } }
            );

            setTimeout(() => reply.delete().catch(() => {}), 3000);

        } catch (error) {
            console.error('Error in messageCreate:', error);
        }
    }
};