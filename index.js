require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildWebhooks
    ]
});

client.commands = new Collection();
client.events = new Collection();
client.cooldowns = new Map();

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
    const commandPath = `./commands/${folder}`;
    const isContextMenu = folder.toLowerCase().includes('context-menü');

    if (isContextMenu) {
        const userCommands = fs.readdirSync(`${commandPath}/User`).filter(file => file.endsWith('.js'));
        const messageCommands = fs.readdirSync(`${commandPath}/Message`).filter(file => file.endsWith('.js'));

        for (const file of userCommands) {
            const command = require(`${commandPath}/User/${file}`);
            if (command.name && command.type === 2 && command.execute) {
                client.commands.set(command.name, command);
            }
        }

        for (const file of messageCommands) {
            const command = require(`${commandPath}/Message/${file}`);
            if (command.name && command.type === 3 && command.execute) {
                client.commands.set(command.name, command);
            }
        }
    } else {
        const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`${commandPath}/${file}`);
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

const eventFolders = fs.readdirSync('./events');

for (const folder of eventFolders) {
    const eventFiles = fs.readdirSync(`./events/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(`./events/${folder}/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        client.events.set(event.name, event);
    }
}

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4
})
    .then(() => console.log("[MongoDB] - Successfully connected"))
    .catch(err => console.error("[MongoDB] - Error:", err))
    .finally(() => {
        console.log("[MongoDB] - Connection attempt finished");
    });

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    const commands = [];

    for (const command of client.commands.values()) {
        if (command.data && typeof command.data.toJSON === 'function') {
            commands.push(command.data.toJSON());
        }
    }    

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    client.login(process.env.BOT_TOKEN);
})();