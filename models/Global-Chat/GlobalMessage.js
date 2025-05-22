const mongoose = require('mongoose');

const globalMessageSchema = new mongoose.Schema({
    messageAuthor: {
        type: String,
        required: true,
        unique: false
    },
    messageIds: [{
        serverId: String,
        channelId: String,
        messageId: String
    }]
});

module.exports = mongoose.model('GlobalMessages', globalMessageSchema);