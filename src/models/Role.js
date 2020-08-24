const mongoose = require ("mongoose");

const RoleSchema = new mongoose.Schema({
        
        name: {
            type: String,
            require: true
        },

        times: [{
            start: {
                hours: Number,
                minutes: Number
            },
            end: {
                hours: Number,
                minutes: Number
            },
            day: [Boolean],
        }],

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            require: true
        }
    });

module.exports = mongoose.model ("Role", RoleSchema);