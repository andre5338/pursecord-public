const { Events } = require('discord.js');
const math = require('mathjs');
const { Counting } = require('../../models/Counting');
const config = require('../../config.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const counting = await Counting.findOne({ guildId: message.guild.id });
        if (!counting || message.channel.id !== counting.channelId) return;

        let count;
        try {
            count = counting.allowMath ? math.evaluate(message.content) : Number(message.content);
            if (isNaN(count)) throw new Error('Invalid number');
        } catch {
            count = NaN;
        }

        if (isNaN(count)) return;

        if (count === counting.lastCount + 1) {
            if (counting.lastMember === message.author.id) {
                await message.react(config.counting.no);
                await message.channel.send(`${config.counting.no} **You can't count two times in a row!** The count has been reset.`);
                counting.lastCount = 0;
                counting.lastMember = "";
                await counting.save();
                return;
            }

            counting.lastCount = count;
            counting.lastMember = message.author.id;
            await counting.save();

            if (count % 100 === 0) {
                await message.react('🎉');
                await message.react(config.counting.yes);
                await message.channel.send(`🎉 **Milestone reached: ${count}!** 🎉`);
            } else {
                await message.react(config.counting.yes);
            }
        } else {
            await message.channel.send(`${config.counting.no} **Wrong number!** The count has been reset.`);
            await message.react(config.counting.no);
            counting.lastCount = 0;
            counting.lastMember = "";
            await counting.save();
        }
    },
};