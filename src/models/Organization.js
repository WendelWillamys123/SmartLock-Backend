const mongoose = require ("mongoose");
const bcrypt = require("bcryptjs");

const OrganizationSchema = new mongoose.Schema
(
    {
        name: {
            type: String,
            require: true
        },

        email: {
            type: String,
            require: true
        },

        password: {
            type: String,
            require: true,
            select: false
        },
        
        groups: [{
            type: mongoose.Schema.Types.ObjectId,
            ref : 'Group',
            default: null
        }],
        
        locks: [{ type: mongoose.Schema.Types.ObjectId,
            ref: 'Lock',
            default: null
        }], 

        physicalLocal: [{
             type: mongoose.Schema.Types.ObjectId,
             ref: 'PhysicalLocal',
             default: null
            }],
        
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }],

        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        }]
    }
);

OrganizationSchema.pre('save', async function(next){
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;

    next();
})


module.exports = mongoose.model ("Organization", OrganizationSchema);