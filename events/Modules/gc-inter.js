const { InteractionType, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Shop = require('../../models/Global-Chat/Shop');
const Users = require('../../models/Global-Chat/User');
const User = require('../../models/Global-Chat/User');
const Gift = require('../../models/Global-Chat/Gift');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        if (interaction.type === InteractionType.MessageComponent) {
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'showItemMenu') {
                    const userData = await Users.findOne({ User: interaction.user.id }) || await Users.create({ User: interaction.user.id });
                    const item = await Shop.findOne({ Id: interaction.values[0] });

                    if (!item) {
                        return await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`<:Arrow:1312847779936211006> This item could not be found!`)
                                    .setColor("Yellow")
                            ],
                            ephemeral: true
                        });
                    }

                    await interaction.update({ components: interaction.components });

                    const match = item.Icon.match(/<(a?):\w+:(\d+)>/);
                    const isAnimated = match[1] === 'a';
                    const emojiId = match[2];

                    await interaction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(item.Name)
                                .setThumbnail(`https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`)
                                .addFields({
                                    name: "<a:Messages:1312847719299027004> Description",
                                    value: ">>> " + (item.Description ?? "No description provided")
                                })
                                .setColor("#c7ebff")
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`useItem:${item.Id}`)
                                    .setLabel("Use Item")
                                    .setStyle(ButtonStyle.Success)
                            )
                        ],
                        ephemeral: true
                    });
                }
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'claimGifts') {
                    const gifts = await Gift.find({ User: interaction.user.id });

                    for (const gift of gifts) {
                        let userDokument = await User.findOneAndUpdate(
                            { User: interaction.user.id, "Inventory.Item": gift.Item },
                            { $inc: { "Inventory.$.Amount": 1 } },
                            { new: true }
                        );

                        if (!userDokument) {
                            userDokument = await User.findOneAndUpdate(
                                { User: interaction.user.id },
                                {
                                    $push: {
                                        Inventory: { Item: gift.Item, Amount: 1 }
                                    }
                                },
                                { new: true }
                            );
                        }

                        await Gift.findByIdAndDelete(gift._id);
                    }

                    return interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: `Your inbox is empty!`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                                .setColor("#c7ebff")
                                .setDescription(`You successfully claimed \`${gifts.length}\` gifts from your inbox!`)
                        ],
                        components: []
                    });
                }
            }
        }
    }
};