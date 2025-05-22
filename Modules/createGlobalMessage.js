const { EmbedBuilder } = require("discord.js");
const Ranks = require('../models/Global-Chat/Ranks');
const { default: axios } = require("axios");

async function createGlobalMessage(message, userData, image, sticker) {
    const ranks = (await Ranks.find({})).filter((rank) => userData.Ranks.includes(rank.RankName)).sort((a, b) => a.Priority - b.Priority);
    const premium = userData.Ranks.includes("Premium");
    const highestRank = ranks[0] ?? await Ranks.findOne({ RankName: "User" });
    const userClan = Array.isArray(userData.Clan) && userData.Clan.length > 0 ? userData.Clan[0] : null;
    let longestInvite;

    if (premium) {
        const invites = await message.guild.invites.fetch();
        longestInvite = invites.reduce((longest, invite) => {
            return (invite.maxAge > longest.maxAge) ? invite : longest;
        }, { maxAge: 0 });
        if (!longestInvite || longestInvite.maxAge === 0) {
            longestInvite = await message.guild.invites.create(message.channel.id, { maxAge: 0 });
        }
    }

    const embed = new EmbedBuilder()
        .setAuthor({ name: `${premium ? `Premium | ${highestRank.RankName}` : `${highestRank.RankName}`}`, iconURL: `${premium ? `https://cdn.discordapp.com/emojis/1361122113351848087
.gif` : `${highestRank.Url}`}` })
        .setTitle(`${message.author.displayName}${userClan ? ` [${userClan.Tag}]` : ``}`)
        .setURL(`https://discordapp.com/users/${message.author.id}`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setColor(premium ? "#ffb800" : highestRank.Color);

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = message.content.match(urlRegex);
    let cleanMessage = message.content.replace(urlRegex, '').trim();

    embed.addFields(
        {
            name: "<a:Messages:1361121591659860018> Message",
            value: `>>> ${cleanMessage || "No message content"}`
        }
    );

    if (message.reference && message.reference.messageId) {
        try {
            const reference = await message.fetchReference();
            if (!reference) return;
    
            const repliedToTitle = reference.embeds?.[0]?.title || "Unknown User";
            const repliedToContent = reference.embeds?.[0]?.fields?.find(f => f.name.includes("Message"))?.value.replace('>>> ', '') || "No message content";
    
            embed.addFields({
                name: `<:Reply:1361122796515889374> Reply to \`${repliedToTitle}\``,
                value: `>>> *${repliedToContent.trim().replace(/\*/g, "\\*")}*`
            });
    
        } catch {
            embed.addFields({
                name: `<:Reply:1361122796515889374> Reply`,
                value: `>>> *Message not available*`
            });
        }
    }    

    let importantLinks = `[<:Bot:1361122693914689680> **Invite Bot**](https://discordapp.com/oauth2/authorize?client_id=1356445923114487818) - [<:link:1359054050108112998> **Support**](https://discord.gg/nvz8SrnRbf)${premium ? ` - [<a:Premium:1361122113351848087> **Join Server**](${longestInvite.url})` : ``}`;

    if (links) {
        links.forEach(link => {
            importantLinks += ` [<:link:1359054050108112998> **View Link**](${link})`;
        });
    }

    embed.addFields(
        {
            name: "<:Links:1361124094275223643> Important Links",
            value: importantLinks
        }
    );

    const youtubeRegex = (/(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)([\w\-]+)/);
    const match = message.content.match(youtubeRegex);
    let thumbnailSet = false;

    if (match) {
        const videoId = match[5];
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'snippet',
                    id: videoId,
                    key: "AIzaSyDFEchd2xjDLQNz06QqdSMzd9pD9ZKUc3c",
                },
            });

            const video = response.data.items[0];
            if (video) {
                const title = video.snippet.title;
                const thumbnail = video.snippet.thumbnails.high.url;
                embed.setImage(thumbnail);
                embed.addFields(
                    {
                        name: "<:YouTube:1361123115589173268> I shared a YouTube video:",
                        value: `[**${title}**](https://www.youtube.com/watch?v=${videoId})`
                    }
                );
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
        }
    }

    const twitchRegex = (/(https?:\/\/)?(www\.)?(twitch\.tv\/)([\w\-]+)/);
    const twitchMatch = message.content.match(twitchRegex);

    if (twitchMatch) {
        const username = twitchMatch[4];

        try {
            const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: "xkqxgofku2ma8azmyewfkx3wnqw1fs",
                    client_secret: "s85hii0b6n7koi27sk1jxaufrsft4a",
                    grant_type: "client_credentials",
                },
            });

            const accessToken = tokenResponse.data.access_token;

            const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
                params: { login: username },
                headers: {
                    'Client-ID': "xkqxgofku2ma8azmyewfkx3wnqw1fs",
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            const user = userResponse.data.data[0];
            if (!user) {
                return;
            }

            const userId = user.id;

            const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams`, {
                params: { user_id: userId },
                headers: {
                    'Client-ID': "xkqxgofku2ma8azmyewfkx3wnqw1fs",
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            const streamData = streamResponse.data.data[0];
            const twitchUrl = `https://www.twitch.tv/${username}`;

            if (streamData) {
                const title = streamData.title;
                embed.setImage(streamData.thumbnail_url.replace("{width}", "1280").replace("{height}", "720"));
                embed.addFields(
                    {
                        name: "Join the live stream!",
                        value: `**[${title}](${twitchUrl})**`,
                    }
                );
            } else {
                const vodResponse = await axios.get(`https://api.twitch.tv/helix/videos`, {
                    params: { user_id: userId, type: "archive" },
                    headers: {
                        'Client-ID': "xkqxgofku2ma8azmyewfkx3wnqw1fs",
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                const vod = vodResponse.data.data[0];
                if (vod) {
                    const vodTitle = vod.title;
                    const vodUrl = vod.url;
                    embed.setImage(vod.thumbnail_url.replace('%{width}', '1280').replace('%{height}', '720'));

                    embed.addFields(
                        {
                            name: "Check out this VOD!",
                            value: `**[${vodTitle}](${vodUrl})**`,
                        }
                    );
                } else {
                    embed.addFields(
                        {
                            name: "Twitch Channel:",
                            value: `**[${username}](${twitchUrl})** has no VODs available.`,
                        }
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching Twitch details:', error.response?.data || error.message);
        }
    }

    const tenorRegex = /https?:\/\/(?:www\.)?tenor\.com\/view\/([^\s]+?)-gif-(\d+)/i;
    const tenorMatch = message.content.match(tenorRegex);
    
    if (tenorMatch && !thumbnailSet) {
        const tenorId = tenorMatch[2];
        
        try {
            const response = await axios.get(`https://g.tenor.com/v1/gifs`, {
                params: {
                    ids: tenorId,
                    key: "LIVDSRZULELA",
                    media_filter: "minimal"
                }
            });
    
            const gifData = response.data.results[0];
            if (gifData) {
                const gifUrl = gifData.media[0].gif.url;
                embed.setImage(gifUrl);
                embed.addFields({
                    name: "<:Image:1361123301686251770> I shared a GIF",
                    value: `${message.author.displayName} sent a GIF from Tenor:`
                });
                thumbnailSet = true;
            }
        } catch (error) {
            console.error('Error fetching Tenor GIF:', error);
            embed.addFields({
                name: "<:Image:1361123301686251770> I shared a GIF",
                value: `[View GIF](${tenorMatch[0]})`
            });
        }
    }

    if (!thumbnailSet && image) {
        embed.addFields(
            {
                name: "<:Image:1361123301686251770> I shared an image",
                value: `${message.author.displayName} sent an image:`,
            }
        );
        embed.setImage(`attachment://${image.name}`);
    }
    else if (!thumbnailSet && sticker) {
        embed.addFields(
            {
                name: "<:Image:1361123301686251770> I shared a sticker",
                value: `${message.author.displayName} sent a sticker:`,
            }
        );
        embed.setImage(`attachment://${sticker.name}`);
    }

    embed.setFooter({
        text: `${message.guild.name} | ${message.guild.memberCount} 👤`,
        iconURL: message.guild.iconURL({ dynamic: true }),
    });

    return embed;
}

module.exports = { createGlobalMessage };
