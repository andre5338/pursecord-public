const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
    Id: {
        type: String,
        required: true,
    },
    Name: {
        type: String,
        required: false,
    },
    Icon: {
        type: String,
        required: false
    },
    Description: {
        type: String,
        required: false
    },
    Amount: {
        type: Number,
        required: false,
        default: 0,
    },
    Price: {
        type: Number,
        required: false,
        default: 0,
    },
    Type: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("shops", shopSchema);