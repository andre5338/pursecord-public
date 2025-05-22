const mongoose = require('mongoose');

const premiumLogSchema = new mongoose.Schema({
    User: {
        type: String,
        required: true,
    },
    ExpiresAt: {
        type: Date,
        required: false,
    }
});

module.exports = mongoose.model('PremiumLog', premiumLogSchema);