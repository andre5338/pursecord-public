const mongoose = require('mongoose');

const AutoMessageSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    message: { type: String, required: true },
    interval: { type: Number, required: true },
    nextExecution: { type: Date, required: true },
    isEmbed: { type: Boolean, default: false },
});

const autoDeleteSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    duration: { type: Number, required: true },
});

const AutoMessage = mongoose.model('AutoMessage', AutoMessageSchema);
const AutoDelete = mongoose.model('AutoDelete', autoDeleteSchema);

module.exports = { AutoMessage, AutoDelete };