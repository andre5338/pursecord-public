const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const User = require("../../models/Global-Chat/User");
const Shop = require("../../models/Global-Chat/Shop");
const Gift = require("../../models/Global-Chat/Gift");

module.exports = {
    maintenance: false,
    data: new SlashCommandBuilder()
        .setName("item")
        .setDMPermission(false)
        .setDescription("Use several item actions.")
        .addSubcommand(subcommand =>
            subcommand.setName("gift")
                .setDescription("Gift an item to another user.")
                .addStringOption(option => option.setName("userid").setDescription("The user you wanna gift this item.").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("item").setDescription("The item you want to gift.").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName("view-gifts")
                .setDescription("Lets see if someone gifted any items to you.")
        )
        .addSubcommand(subcommand =>
            subcommand.setName("inventory")
                .setDescription("Shows a list of your current inventory.")
        ),
    async autocomplete(interaction) {
        const sub = interaction.options.getSubcommand()
        const focusedValue = interaction.options.getFocused(true);
        let choices = [];
        if (sub == "gift") {
            if (focusedValue.name === 'userid') {
                const searchInput = focusedValue.value;
                const filter = searchInput ? { 'User': { $regex: searchInput, $options: 'i' } } : {};
                const users = await User.find(filter).limit(25);
                choices = users.map(user => {
                    const dcUser = interaction.client.users.cache.get(user.User);
                    return dcUser ? { name: `${dcUser.tag} - ${user.User}`, value: user.User } : null;
                }).filter(choice => choice);
            }                    
            if (focusedValue.name === 'item') {
                const userDoc = await User.findOne({ User: interaction.user.id }) ?? await User.create({ User: interaction.user.id })
                const userItems = userDoc.Inventory.map((item) => item.Item)
                const shopItems = (await Shop.find()).filter((item) => userItems.includes(item.Id));
                choices = shopItems.map((item) => { return { name: `${item.Name} - ${item.Id}`, value: item.Id } })
            }
        }
        const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.value.toLowerCase()));
        const result = filtered.map(choice => ({ name: choice.name, value: `${choice.value}` })).sort((a, b) => a.value - b.value)
        await interaction.respond(result);
    },
    async execute(interaction, userData) {
        const { options, guild, user } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === 'gift') {
            let userId = options.getString("userid");
            let item = options.getString("item");
            let itemId = item.includes(" - ") ? item.split(" - ")[1] : item;
        
            const itemData = await Shop.findOne({ Id: itemId });
            const recipientUser = await interaction.client.users.fetch(userId).catch(() => null);
        
            if (interaction.user.id == userId) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`<:Arrow:1312847779936211006> You cannot gift this to yourself!`)
                            .setColor("Yellow")
                    ], ephemeral: true
                })
            }
        
            if (!itemData) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`<:Arrow:1312847779936211006> This item could not be found!`)
                            .setColor("Yellow")
                    ], ephemeral: true
                });
            }
        
            if (!recipientUser) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`<:Arrow:1312847779936211006> Could not find the recipient user!`)
                            .setColor("Yellow")
                    ], ephemeral: true
                });
            }
        
            await Gift.create({ User: userId, Item: itemId, GiftetBy: interaction.user.tag });
            userData.Inventory = userData.Inventory.map((invItem) => {
                if (invItem.Item === itemId) {
                    invItem.Amount -= 1;
                }
                return invItem;
            }).filter((invItem) => invItem.Amount > 0);
            await userData.save();
        
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1312847779936211006> Successfully gifted \`${itemData.Name}\` to \`${recipientUser.username}\`!`)
                        .setColor("Yellow")
                ], ephemeral: true
            });
        }

        if (subcommand === 'view-gifts') {
            const shopItems = await Shop.find();
            const giftsInInventory = (await Gift.find({ User: interaction.user.id })).filter((item) => (shopItems.map((item) => item.Id)).includes(item.Item));

            const itemsPerPage = 5;
            const totalPages = giftsInInventory.length > 0 ? Math.ceil(giftsInInventory.length / itemsPerPage) : 0;

            let currentPage = 0;

            async function generateEmbed(page) {
                if (giftsInInventory.length === 0) {
                    return new EmbedBuilder()
                        .setAuthor({ name: `Your inbox is empty!`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                        .setColor("#c7ebff")
                        .setDescription("You currently have no gifts in your inbox.");
                }
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `You have ${giftsInInventory.length} gift${giftsInInventory.length > 0 ? "s" : ""} in your inbox!`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setColor("#c7ebff");

                giftsInInventory.slice(start, end).forEach(gift => {
                    const it = shopItems.find((item) => item.Id == gift.Item);
                    if (gift) {
                        embed.addFields({ name: `${it.Name}`, value: `<:Corner:1312847742703501332> Gifted by: \`${gift.GiftetBy}\`` });
                    }
                });

                return embed;
            };

            const embedMessage = await interaction.reply({
                embeds: [await generateEmbed(currentPage)],
                components: getRow(currentPage, totalPages),
                fetchReply: true,
                ephemeral: true
            });

            const collector = embedMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000,
                filter: i => i.customId != "claimGifts"
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'The buttons are disabled for you.', ephemeral: true });
                }

                if (i.customId === 'previous') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                }

                await i.update({ embeds: [await generateEmbed(currentPage)], components: getRow(currentPage, totalPages) });
            });

            collector.on('end', collected => {
                embedMessage.edit({ components: [] }).catch((err) => { });
            });

            function getRow(page, total) {
                if (total === 0) {
                    return [new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("claimGifts")
                                .setLabel("Claim all")
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true)
                        )];
                }

                return [new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('pageCount')
                            .setLabel(`Page ${page + 1} / ${total}`)
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === total - 1)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("claimGifts")
                            .setLabel("Claim all")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(giftsInInventory.length > 0 ? false : true)
                    )];
            }
        }

        if (subcommand === 'inventory') {
            const inventory_userDocument = await User.findOne({ User: interaction.user.id }) ?? await User.create({ User: interaction.user.id })


                const invItems = await Promise.all(
                    inventory_userDocument.Inventory.map(async (invItem) => {
                        const invShopItem = await Shop.findOne({ Id: invItem.Item });
                        if (invShopItem) {
                            return { Item: invShopItem, AmountInInv: invItem.Amount };
                        }
                        return null;
                    })
                );

                const validInvItems = invItems.filter(item => item !== null);

                const invEmbed = new EmbedBuilder()
                    .setAuthor({ name: `You have ${validInvItems.length} item${validInvItems.length > 0 ? "s" : ""} in your inventory!`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setColor("#c7ebff")

                if (validInvItems.length == 0) {
                    invEmbed.setDescription("You currently have no items in your inventory.")
                }

                validInvItems.forEach((item, index) => {
                    invEmbed.addFields({
                        name: `${item.Item.Icon} ${item.Item.Name}`,
                        value: `<:Corner:1361121182417686659> **Items remaining:** \`${item.AmountInInv}\``,
                        inline: true,
                    });

                    if (index % 2 === 0 || index == 0) {
                        invEmbed.addFields({ name: " ", value: " ", inline: true });
                    }
                });

                await interaction.reply({
                    embeds: [invEmbed], components: [await getItemList()], ephemeral: true
                })

                async function getItemList() {
                    const uniqueItems = new Set();
                    const options = validInvItems.map(option => {
                        if (uniqueItems.has(option.Item.Id)) {
                            return null;
                        }
                        uniqueItems.add(option.Item.Id);
                        return new StringSelectMenuOptionBuilder()
                            .setValue(option.Item.Id)
                            .setLabel(option.Item.Name);
                    }).filter(option => option !== null);
                
                    return new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("showItemMenu")
                                .setPlaceholder("Select an item to view details...")
                                .addOptions(options.length > 0 ? options : [
                                    new StringSelectMenuOptionBuilder()
                                        .setValue("none")
                                        .setLabel("None")
                                ])
                                .setDisabled(options.length === 0)
                        );
                }
                
        }
    },
};