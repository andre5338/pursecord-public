const mongoose = require('mongoose');

const commandSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    commandName: { type: String, required: true },
    response: { type: String, required: true },
    createdBy: { type: String, required: true }
});
commandSchema.index({ guildId: 1, commandName: 1 }, { unique: true });

module.exports = mongoose.model('CustomCommands', commandSchema);