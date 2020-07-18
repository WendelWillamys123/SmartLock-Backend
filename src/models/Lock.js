const mongoose = require ("mongoose");

const LockSchema = new mongoose.Schema({
        name: {
            type: String,
            require: true
        },

        holder: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }],

        holderPhysicalLocal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PhysicalLocal'
        },

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            require: true
        }
    }
);

module.exports = mongoose.model ("Lock", LockSchema);