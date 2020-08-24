const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Admin = require('../../models/Admin');

module.exports = {
    async store(request, response){ 
        var { _id = null, name = null, email = null, pin = [], registry = null, roles = [], organization = null } = request.body;
        var newUser;

        try{

            if(_id !== null){
                const admin = await Admin.findById(_id);
                
                const user = await User.findOne({ email: admin.email });
               
                if(admin === null){
                    return response.status(400).send({error: 'Source admin not found'});
                } else {

                    if(user === null){
                        newUser = await User.create({
                            name: admin.name,
                            email: admin.email,
                            pins: pin,
                            registry,
                            roles,
                            organization: admin.organization
                        });

                        await Organization.findByIdAndUpdate({ _id: admin.organization}, {$push: {users: newUser._id}}, {new: true});
                        await Organization.findByIdAndUpdate({ _id: admin.organization}, {$pullAll: {admins: [admin._id]}}, {new: true});
                        await Admin.findByIdAndDelete(admin._id)
                        return response.send(newUser);
                    
                    } else return response.status(400).send({error: 'User already exists'});  
                }
           
            } else {
                const OwnerOrganization = await Organization.findOne({_id: organization});
                
                if(!OwnerOrganization) return response.status(400).send({error: 'Owner oganization not found'});
                else {
                    const user = await User.findOne({ email });

                    if(!user){

                        newUser = await User.create({
                            name,
                            email,
                            pins: pin,
                            registry,
                            roles,
                            organization: organization
                        });

                    await Organization.findByIdAndUpdate({ _id: organization}, {$push: {users: newUser._id}}, {new: true});
                    return response.send(newUser);

                    } else {
                    return response.status(400).send({error: 'User already exists'});
                    }
                }
            }
        } catch(error){
            if(newUser._id!==null && newUser._id!==undefined) await User.findByIdAndDelete(newUser._id);
            return response.status(400).send({error: 'Create a new user failed'});
        }
    },
   
    async index(request, response){
        const owner = request.headers.owner;
        try{
           const users = await User.find({organization: owner});
           return response.send({users});
        } catch(error){
            return response.status(400).send({error: 'Users not found'});
        }
    },

    async show(request, response){
        const { _id } = request.headers;

        try{
            const usersBusca = await User.findById(_id);
            return response.send(usersBusca);
        } catch(error){
            return response.status(400).send({error: 'User not found'})
        }
    },

    async update(request, response){
        const {_id, name, email, pins, registry, roles} = request.body;

        try{
            const user = await User.findById(_id);
            if(email !== user.email){
                const exists = User.find({email: email, organization: user.organization});

                if (exists!==null) {
                    user.email = email;
                    user = await User.findByIdAndUpdate(_id, {name, email, pins, registry, roles}, {new: true});
                    return response.send({user});

               } else return response.status(400).send({error: 'A user with email informed already exist'})
            } else {
                user = await User.findByIdAndUpdate(_id, {name, email, pins, registry, roles}, {new: true});
                return response.send({user});
            } 

        } catch(error){
            console.log(error)
            return response.status(400).send({error: 'Update of user data failed'})
        }
    },

    async destroy(request, response){
        const { _id } = request.headers;
        var user;

        try{
            user = await User.findByIdAndDelete(_id);
            await Organization.findOneAndUpdate({_id: user.organization}, {$pullAll: {users: [_id]}}, {new: true});
            return response.send({error: false, message: 'User deleted', user: user.name});

            } catch(error){
                if(user!==null){
                    user = await User.find({_id: user._id, organization: user.organization});
                    if(user === null){
                        const newUser = await User.create({
                            name: user.name,
                            email: user.email,
                            pins: user.pin,
                            registry: user.registry,
                            roles: user.roles,
                            organization: user.organization
                        });

                        await Organization.findByIdAndUpdate({ _id: newUser.organization}, {$push: {users: newUser._id}}, {new: true});
                        return response.status(400).send({error: 'Failed delete user', user: newUser.name});

                    } else return response.status(400).send({error: 'Failed delete user'})
                } else return response.status(400).send({error: 'Failed delete user'})
            }
    }

}