const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
    RankName: {
        type: String,
        required: true,
        unique: true
    },
    RankId: {
        type: Number,
        required: true,
        unique: true
    },
    Url: {
        type: String,
        required: true,
        unique: false
    },
    Color: {
        type: String,
        required: true,
        unique: false
    },
    Perms: {
        type: Array,
        required: true,
        unique: false
    },
    Staff: {
        type: Boolean,
        required: true,
        unique: false
    },
    Priority: {
        type: Number,
        required: true,
        unique: false
    }
});

module.exports = mongoose.model('Ranks', rankSchema);