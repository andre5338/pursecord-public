const { EmbedBuilder, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionType } = require('discord.js');
const User = require('../../models/Global-Chat/User');
const PremiumLog = require('../../models/Global-Chat/PremiumLog');
const Shop = require('../../models/Global-Chat/Shop');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.type !== InteractionType.MessageComponent) return;
        const userId = interaction.user.id;
        const user = await User.findOne({ User: userId }) ?? await User.create({ User: userId });

        if (interaction.isButton() && interaction.customId.startsWith('useItem:')) {
            const itemId = interaction.customId.split(':')[1];
            const inventoryItem = user.Inventory.find(item => item.Item === itemId);
            if (!inventoryItem || inventoryItem.Amount <= 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<:Arrow:1312847779936211006> You don't have this item in your inventory.")
                            .setColor("Red")
                    ],
                    ephemeral: true
                });
            }
            if (["1", "2", "3", "4", "6"].includes(itemId)) {
                let duration = 0;
                switch (itemId) {
                    case "1": duration = 1 * 24 * 60 * 60 * 1000; break;
                    case "2": duration = 7 * 24 * 60 * 60 * 1000; break;
                    case "3": duration = 30 * 24 * 60 * 60 * 1000; break;
                    case "4": duration = Infinity; break;
                    case "6": duration = 0; break;
                }
                const expiresAt = duration === Infinity ? null : new Date(Date.now() + duration);
                if (user.Ranks.includes('Premium')) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription("<:Arrow:1312847779936211006> You already have an active Premium status!")
                                .setColor("Yellow")
                        ],
                        ephemeral: true
                    });
                }
                user.Ranks.push('Premium');
                inventoryItem.Amount -= 1;
                if (inventoryItem.Amount === 0) {
                    user.Inventory = user.Inventory.filter(item => item.Item !== itemId);
                }
                await user.save();
                await PremiumLog.create({ User: userId, ExpiresAt: expiresAt });
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<:Arrow:1312847779936211006> Premium activated! Enjoy your benefits.")
                            .setColor("Green")
                    ],
                    ephemeral: true
                });
            } else {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<:Arrow:1312847779936211006> You can't use this right now!")
                            .setColor("Yellow")
                    ],
                    ephemeral: true
                });
            }
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'shopSelectType') {
            const premium = user.Ranks.includes("Premium");
            const generateEmbed = (baseEmbed, description, footer, premiumDiscount = false) => {
                const embed = EmbedBuilder.from(baseEmbed)
                    .setDescription(description)
                    .setFooter(footer);
                if (premiumDiscount) embed.setAuthor({ name: "Premium discount 20%" });
                return embed;
            };
            const generateOptions = (items, premium) => items.map(item => {
                const price = premium ? item.Price * 0.8 : item.Price;
                return new StringSelectMenuOptionBuilder()
                    .setLabel(item.Name)
                    .setDescription(`Price: ${price}`)
                    .setValue(item.Id);
            });
            const addItemsToEmbed = (embed, items, premium) => {
                let counter = 0;
                let firstPrinted = false;
                for (const item of items) {
                    const price = premium ? `~~${item.Price}~~ *(${item.Price * 0.8})*` : item.Price;
                    embed.addFields({
                        name: `${item.Icon} ${item.Name}`,
                        value: `<:Corner:1312847742703501332> **Price:** <a:Coin:1312847763226099712> ${price}`,
                        inline: true
                    });
                    if (counter === 2 || !firstPrinted) {
                        embed.addFields({ name: " ", value: " ", inline: true });
                        counter = 0;
                        firstPrinted = true;
                    }
                    counter++;
                }
            };
            await interaction.update({ components: interaction.components });
            const isPremium = interaction.values[0] === "premium";
            const embedDescription = isPremium
                ? "These are our premium items. Some are permanent and some are temporary. Show people in the chat that you treated yourself to it!"
                : "These are our PowerUps. Boost your own progress or help your friends!";
            const items = await Shop.find({ Type: isPremium ? "Premium" : "PowerUp" });
            const embed = generateEmbed(
                interaction.message.embeds[0],
                embedDescription,
                { text: `Current balance: ${user.Stats.Coins} Coins`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) },
                premium
            );
            addItemsToEmbed(embed, items, premium);
            const options = generateOptions(items, premium);
            await interaction.followUp({
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('buyItem')
                            .setPlaceholder('Select one of the options...')
                            .addOptions(options)
                    )
                ],
                ephemeral: true
            });
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'buyItem') {
            const itemId = interaction.values[0];
            const item = await Shop.findOne({ Id: itemId });
            if (!item) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<:Arrow:1312847779936211006> This item is currently not available or could not be found!")
                            .setColor("Yellow")
                    ],
                    ephemeral: true
                });
            }
            const premium = user.Ranks.includes("Premium");
            const modal = new ModalBuilder()
                .setCustomId('buyItemModal')
                .setTitle(`Enter quantity for ${item.Name}`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('quantityInput')
                            .setLabel('Quantity')
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(1)
                            .setMaxLength(4000)
                            .setPlaceholder('Enter a quantity')
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
            const filter = modalInteraction => modalInteraction.user.id === interaction.user.id;
            const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 15000 });
            const quantity = parseInt(modalInteraction.fields.getTextInputValue('quantityInput'));
            if (isNaN(quantity) || quantity <= 0) {
                return modalInteraction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<:Arrow:1312847779936211006> Please enter a valid quantity!")
                            .setColor("Red")
                    ],
                    ephemeral: true
                });
            }
            let userDoc = await User.findOne({ User: userId }) ?? await User.create({ User: userId });
            const totalPrice = (premium ? item.Price * 0.8 : item.Price) * quantity;
            if (userDoc.Stats.Coins < totalPrice) {
                return modalInteraction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("<:Arrow:1312847779936211006> You don't have enough coins to purchase this quantity of items!")
                            .setColor("Yellow")
                    ],
                    ephemeral: true
                });
            }
            item.Amount -= quantity;
            await item.save();
            userDoc = await User.findOneAndUpdate(
                { User: userId, "Inventory.Item": item.Id },
                { $inc: { "Inventory.$.Amount": quantity, "Stats.Coins": -totalPrice } },
                { new: true }
            );
            if (!userDoc) {
                userDoc = await User.findOneAndUpdate(
                    { User: userId },
                    {
                        $push: { Inventory: { Item: item.Id, Amount: quantity } },
                        $inc: { "Stats.Coins": -totalPrice }
                    },
                    { new: true }
                );
            }
            const premiumEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setFooter({ text: `Current balance: ${userDoc.Stats.Coins} Coins`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
            await modalInteraction.update({ embeds: [premiumEmbed], components: interaction.components });
            await modalInteraction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:Arrow:1312847779936211006> You successfully bought \`${quantity} ${item.Name}(s)\`! This item has been added to your inventory!`)
                        .setColor("Green")
                ],
                ephemeral: true
            });
        }
    }
};