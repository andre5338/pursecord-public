const { Schema, model } = require('mongoose');

const countingSchema = new Schema({
    guildId: { 
        type: String, 
        required: true,
        unique: true
    },
    channelId: String,
    allowMath: { type: Boolean, default: false },
    lastCount: { type: Number, default: 0 },
    lastMember: { type: String, default: "" },
    users: { 
        type: Map, 
        of: Number, 
        default: {}
    }
});

module.exports = {
    Counting: model('Counting', countingSchema)
};