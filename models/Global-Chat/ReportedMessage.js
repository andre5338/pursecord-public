const mongoose = require('mongoose');

const reportedMessageSchema = new mongoose.Schema({
    reportReason: {
        type: String,
        required: true
    },
    reporterUsername: {
        type: String,
        required: false },
    reporterId: {
        type: String,
        required: true
    },
    reportedMessageId: {
        type: String,
        required: true
    },
    reportedMessageContent: {
        type: String,
        required: true
    },
    globalMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GlobalMessages',
        required: true
    },
    globalMessageAuthorId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ReportedMessage', reportedMessageSchema);