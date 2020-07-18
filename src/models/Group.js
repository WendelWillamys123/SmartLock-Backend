const mongoose = require ("mongoose");

const GroupSchema = new mongoose.Schema
(
    {   
        name: {
            type: String,
            require: true
        },

        holder: [{
            type: mongoose.Schema.Types.ObjectId,
            ref : 'Group',
            default: null
        }],

        groups: [{
            type: mongoose.Schema.Types.ObjectId,
            ref : 'Group',
            default: null
        }],

        locks: [{ 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lock',
            default: null
        }],

        roles: [{ 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null
        }],

        holderPhysicalLocal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PhysicalLocal',
            default: null
        }, 

        physicalLocal: [{
             type: mongoose.Schema.Types.ObjectId,
             ref: 'PhysicalLocal',
             default: null
            }],

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            require: true
        }
    },
);

module.exports = mongoose.model ("Group", GroupSchema);