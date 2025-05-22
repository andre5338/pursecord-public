const Channel = require('../models/Global-Chat/Channel');

class MessageQueue {
    constructor(client) {
        this.client = client;
        this.queue = [];
        this.isProcessing = false;
        this.RATE_LIMIT = 1100;
    }

    add(message) {
        this.queue.push(message);
        if (!this.isProcessing) this.process();
    }

    async process() {
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const msg = this.queue.shift();
            try {
                const channel = await this.client.channels.fetch(msg.channelID);
                if (channel) {
                    await channel.send(msg.content);
                    await Channel.updateOne(
                        { Channel: msg.channelID },
                        { LastMessage: Date.now() }
                    );
                }
            } catch (error) {
                if ([50001, 50003, 50013].includes(error.code)) {
                    await Channel.deleteOne({ Channel: msg.channelID });
                }
            }
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT));
        }
        this.isProcessing = false;
    }
}

module.exports = MessageQueue;