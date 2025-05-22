const { Schema, model } = require('mongoose');

const afkSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  notifications: [{ userId: String, count: { type: Number, default: 1 } }],
});

module.exports = model('AFK', afkSchema);