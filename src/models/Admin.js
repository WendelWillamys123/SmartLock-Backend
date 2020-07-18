const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
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

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        require: true
    }
});

AdminSchema.pre('save', async function(next){
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;

    next();
})

module.exports = mongoose.model('Admin', AdminSchema);