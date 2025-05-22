const ranks = [
    {
        RankName: 'Owner',
        RankId: 0,
        Url: "https://cdn.discordapp.com/emojis/1295645534002085960.gif",
        Color: "#ffd365",
        Perms: ['MUTE_MEMBERS', 'DELETE_MESSAGES', 'BAN_MEMBERS', 'BAN_GUILDS', 'MANAGE_ROLES', 'MANAGE_ITEMS', 'OWNER'],
        Staff: true,
        Priority: 1
    },
    {
        RankName: 'Admin',
        RankId: 1,
        Url: "https://cdn.discordapp.com/emojis/1295656421450321940.png",
        Color: "#f04747",
        Perms: ['MUTE_MEMBERS', 'DELETE_MESSAGES', 'BAN_MEMBERS', 'BAN_GUILDS', 'MANAGE_ROLES', 'MANAGE_ITEMS'],
        Staff: true,
        Priority: 2
    },
    {
        RankName: 'Chat-Moderator',
        RankId: 2,
        Url: "https://cdn.discordapp.com/emojis/1295655853696876565.png",
        Color: "#f99352",
        Perms: ['MUTE_MEMBERS', 'DELETE_MESSAGES', 'BAN_MEMBERS'],
        Staff: true,
        Priority: 3
    },
    {
        RankName: 'Developer',
        RankId: 3,
        Url: "https://cdn.discordapp.com/emojis/1295649070387560448.png",
        Color: "#55ee83",
        Perms: ['MUTE_MEMBERS', 'DELETE_MESSAGES'],
        Staff: true,
        Priority: 4
    },
    {
        RankName: 'Chat-Helper',
        RankId: 4,
        Url: "https://cdn.discordapp.com/emojis/1295648180884607059.gif",
        Color: "#93a4e7",
        Perms: ['SERVER_INVITE'],
        Staff: false,
        Priority: 5
    },
    {
        RankName: 'Partner',
        RankId: 8,
        Url: "https://cdn.discordapp.com/emojis/1355474864051585052.png",
        Color: "#ff3aa4",
        Perms: ['SERVER_INVITE'],
        Staff: false,
        Priority: 8
    },
    {
        RankName: 'User',
        RankId: 5,
        Url: "https://cdn.discordapp.com/emojis/1312847541922173072.png",
        Color: "#1e2e33",
        Perms: [],
        Staff: false,
        Priority: 6
    },
    
    {
        RankName: 'Premium',
        RankId: 6,
        Url: "https://cdn.discordapp.com/emojis/1296440511707746304.gif",
        Color: "#ff3aa4",
        Perms: ['SERVER_INVITE'],
        Staff: false,
        Priority: 7
    },
]

module.exports = ranks;