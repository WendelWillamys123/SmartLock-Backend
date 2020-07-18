const Organization = require('../../models/Organization');
const Group = require('../../models/Group');
const Lock = require('../../models/Lock');
const LocalFisico = require('../../models/LocalFisico');
const Admin = require('../../models/Admin');
const User = require('../../models/User');
const Role = require('../../models/Role');

const bcrypt = require('bcryptjs');


module.exports = {
    async index(request, response){
        try{
            const organization = await Organization.find().populate('users').populate('admins')
            return response.json(organization);
        } catch(error){
            return response.status(400).send({error: 'Organizations not found'})    
            }
    },

    async show(request, response){
        const { _id } = request.body;

        try{
            const organizationBusca = await Organization.findById(_id).populate('users').populate('admins');
            return response.send({organizationBusca});
        } catch(error){
            return response.status(400).send({error: 'Organization not found'});
        }
    },

    async Update(request, response){
        const {_id, name, email, password} = request.body;

        try{
            const hash = await bcrypt.hash(password, 10);
            const organization = await Organization.findByIdAndUpdate(_id, {name, email, password: hash}, {new: true});
            return response.json({organization});
        } catch(error){
            return response.status(400).send({error: 'Organization update failed'})    
        }
    },

    async destroy(request, response){
        const { _id } = request.body;

        try {
            const organization = await Organization.findByIdAndRemove(_id);
            await LocalFisico.deleteMany ({organization: {$in: [_id]}});
            await Group.deleteMany ({organization: {$in: [_id]}});
            await Lock.deleteMany ({organization: {$in: [_id]}});
            await User.deleteMany ({organization: {$in: [_id]}});
            await Admin.deleteMany ({organization: {$in: [_id]}});
           

            return response.send({error: false, message: 'Organization deleted'});
        } catch(error){
            return response.status(400).send({error: 'Failure to deleting organization'})
        }
    },
}