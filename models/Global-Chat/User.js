const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    User: {
        type: String,
        required: true,
        unique: true
    },
    Username: {
        type: String,
        required: false,
        default: ""
    },
    Ranks: {
        type: [String],
        required: false,
        default: ['User']
    },
    Stats: {
        Coins: {
            type: Number,
            required: false,
            default: 0
        },
        Messages: {
            type: Number,
            required: false,
            default: 0
        }
    },
    IsStaff: {
        type: Boolean,
        required: false,
        default: false
    },
    Banned: {
        type: Boolean,
        required: false,
        default: false
    },
    Inventory: [{
        Item: {
            type: String,
            required: false,
        },
        Amount: {
            type: Number,
            required: false,
        },
    }],
    Clan: [{
        ClanId: {
            type: String,
            required: true
        },
        Owner: {
            type: String,
            required: true
        },
        Name: {
            type: String,
            required: true
        },
        Tag: {
            type: String,
            required: true
        },
        Desc: {
            type: String,
            required: true
        },
        Size: {
            type: Number,
            required: false,
            default: 20
        },
        CreatedAt: {
            type: Date,
            required: false,
            default: () => Date.now()
        },
        Rank: {
            type: String,
            required: false,
            default: "Bronze"
        },
        Stats: {
            Coins: {
                type: Number,
                required: false,
                default: 0
            },
            Messages: {
                type: Number,
                required: false,
                default: 0
            }
        },
        Reference: {
            type: String,
            unique: false,
            default: ""
        }
    }]
});

module.exports = mongoose.model('Users', userSchema);