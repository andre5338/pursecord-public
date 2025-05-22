const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: false,

    async execute(client) {

        const totalGuilds = client.guilds.cache.size;
        
        console.log(`[Status] - ${client.user.username} is now Online!`);
        console.log(`[Stats] - Server: ${totalGuilds}`);

        setInterval(async () => {
            const updatedGuilds = client.guilds.cache.size;
            client.user.setActivity(`/utility help | ${updatedGuilds} Servers`, { type: ActivityType.Watching });
           // client.user.setActivity(`with floxy's dog`, { type: ActivityType.Playing });
        }, 5000);
    },
};