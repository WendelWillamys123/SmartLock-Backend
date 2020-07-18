const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },

    email: {
        type: String,
        require: true
    },

    pins: [{
        type: String,
        default: null
    }],

    registry: {
        type: String
    },

    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    }],

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        require: true
    }
});

module.exports = mongoose.model('User', UserSchema);