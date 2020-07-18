const mongoose = require ("mongoose");
const mongoosePaginate = require ("mongoose-paginate");

const RoleSchema = new mongoose.Schema({
        
        name: {
            type: String,
            require: true
        },

        times: [{
            start: Number,
            end: Number,
            day: [Boolean],
            options: {
                track: Boolean,
                direct: Boolean
            }
        }],

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            require: true
        }
    });

module.exports = mongoose.model ("Role", RoleSchema);