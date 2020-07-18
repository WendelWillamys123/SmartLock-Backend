const mongoose = require ("mongoose");
const PointSchema = require("./utils/PointSchema")

const LocalSchema = new mongoose.Schema ({

        name: {
            type: String,
            require: true
        },

        holder: [{
            type: mongoose.Schema.Types.ObjectId,
            ref : 'Group'
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
        
        location : {
            type: PointSchema,
            index: '2dsphere'
        },

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            require: true
        }
    }
);

module.exports = mongoose.model ("PhysicalLocal", LocalSchema);