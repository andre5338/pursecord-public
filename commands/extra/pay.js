const { EmbedBuilder } = require('discord.js');
const Users = require('../../models/Global-Chat/User');

module.exports.payUser = async (interaction) => {
            const sender = interaction.user;
            const recipientInput = interaction.options.getString('recipient');
            const amountInput = interaction.options.getString('amount');

            const senderData = await Users.findOne({ User: sender.id });
            if (!senderData) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:Arrow:1361120667386515516> No account data found')], 
                    ephemeral: true
                });
            }

            let amount;
                amount = parseInt(amountInput);
                if (isNaN(amount)) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('<:Arrow:1361120667386515516> Invalid amount specified')], 
                        ephemeral: true
                    });
                }

            if (senderData.Stats.Coins < amount) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`<:Arrow:1361120667386515516> Insufficient coins\nNeeded: ${amount.toLocaleString()}\nYou have: ${senderData.Stats.Coins.toLocaleString()}`)], 
                    ephemeral: true
                });
            }

            if (recipientInput.toLowerCase() === 'all') {
                const allUsers = await Users.find({});
                const totalRecipients = allUsers.length - 1;
                const totalAmount = amount * totalRecipients;

                if (senderData.Stats.Coins < totalAmount) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`<:Arrow:1361120667386515516> Needed: ${totalAmount.toLocaleString()}\nYou have: ${senderData.Stats.Coins.toLocaleString()}`)], 
                        ephemeral: true
                    });
                }

                for (const user of allUsers) {
                    if (user.User !== sender.id) {
                        user.Stats.Coins += amount;
                        await user.save();
                    }
                }

                senderData.Stats.Coins -= totalAmount;
                await senderData.save();

                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('💸 Mass Payment')
                        .setDescription(`Sent ${amount.toLocaleString()} coins to ${totalRecipients} users`)
                        .addFields({ name: 'Your Balance', value: `${senderData.Stats.Coins.toLocaleString()}` })], 
                    ephemeral: true
                });
                return;
            }

            const recipient = await interaction.client.users.fetch(recipientInput).catch(() => null);
            if (!recipient || recipient.id === sender.id) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:Arrow:1361120667386515516> Invalid recipient specified')], 
                    ephemeral: true
                });
            }

            const recipientData = await Users.findOne({ User: recipient.id });
            if (!recipientData) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:Arrow:1361120667386515516> Recipient has no account')], 
                    ephemeral: true
                });
            }

            senderData.Stats.Coins -= amount;
            recipientData.Stats.Coins += amount;
            await senderData.save();
            await recipientData.save();

            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('💸 Payment Sent')
                    .setDescription(`${sender.username} → ${recipient.username}`)
                    .addFields(
                        { name: 'Amount', value: amount.toLocaleString(), inline: true },
                        { name: 'Your Balance', value: senderData.Stats.Coins.toLocaleString(), inline: true }
                    )], 
                ephemeral: true
            });

            try {
                await recipient.send({
                    embeds: [new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('💸 Received Coins')
                        .setDescription(`${sender.tag} sent you ${amount.toLocaleString()} coins`)
                        .addFields({ name: 'New Balance', value: recipientData.Stats.Coins.toLocaleString() })]
                });
            } catch {}
        };