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

        roles: [{ 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null
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