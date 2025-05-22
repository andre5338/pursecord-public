const { InteractionType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.type === InteractionType.ApplicationCommand) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Oh :/ You found an error, please report this to my Developers @ [Dev-Botlist](https://discord.gg/nvz8SrnRbf).',
                    ephemeral: true,
                });
            }
        } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.respond({
                    content: '❌ Oh :/ You found an error, please report this to my Developers @ [Dev-Botlist](https://discord.gg/nvz8SrnRbf).',
                    ephemeral: true,
                });
            }
        } else if (
            interaction.type === InteractionType.MessageContextMenu ||
            interaction.type === InteractionType.UserContextMenu
        ) {
            const contextMenu = client.contextMenus.get(interaction.commandName);
            if (!contextMenu) return;

            try {
                await contextMenu.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Oh :/ You found an error, please report this to my Developers @ [Dev-Botlist](https://discord.gg/nvz8SrnRbf).',
                    ephemeral: true,
                });
            }
        }
    },
};