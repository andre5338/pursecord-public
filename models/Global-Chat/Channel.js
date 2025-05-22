const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
    Guild: {
        type: String,
        required: true,
    },
    Channel: {
        type: String,
        required: true,
        unique: true
    },
    LastMessage: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Channel', channelSchema);