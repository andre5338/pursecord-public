const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
    User: {
        type: String,
        required: true,
        unique: false
    },
    Item: {
        type: String,
        required: true
    },
    GiftetBy: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Gift', rankSchema);