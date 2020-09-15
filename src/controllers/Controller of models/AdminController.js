const Admin = require('../../models/Admin');
const User = require('../../models/User');
const Organization = require('../../models/Organization');

module.exports = {
    async store(request, response){ 
        var { _id = null, name = null, email = null, password } = request.body;
        const organization = request.headers.owner;
         var newAdmin; 
        try{

            // Admin vindo de um user
            if(_id !== null){
                const user = await User.findOne({_id: _id});
                
                const admin = await Admin.findOne({ email: user.email });

                if(user === null){
                    return response.status(400).send({error: 'Source user not found'});
                } else {

                    if(admin === null){
                        newAdmin = await Admin.create({
                            name: user.name,
                            email: user.email,
                            password,
                            organization: user.organization
                        });

                        await Organization.findByIdAndUpdate({ _id: user.organization}, {$push: {admins: newAdmin._id}}, {new: true});
                        await Organization.findByIdAndUpdate({ _id: user.organization}, {$pullAll: {users: [user._id]}}, {new: true});
                        await User.findByIdAndDelete(user._id)
                        return response.send(newAdmin);
                    } else{
                        return response.status(400).send({error: 'Admin already exists'});
                    }
                }
           
            }else {
                const OwnerOrganization = await Organization.findOne({_id: organization});
            
                if(!OwnerOrganization) return response.status(400).send({error: 'Owner oganization not found'});
                
                else {
                const admin = await Admin.findOne({organization: organization, email: email });

                    if(!admin){
                        newAdmin = await Admin.create({
                            name,
                            email,
                            password,
                            organization: OwnerOrganization._id
                        });

                        console.log( organization, newAdmin);
                    await Organization.findByIdAndUpdate({ _id: organization}, {$push: {admins: newAdmin._id}}, {new: true});
                    return response.send(newAdmin);

                    } else {
                    return response.status(400).send({error: 'Admin already exists'});
                        }
                }
            }
                
        } catch(error){
            
            if(newAdmin._id!==null && newAdmin._id!==undefined) await Admin.findByIdAndDelete(newAdmin._id);
            return response.status(400).send({error: 'Create a new admin failed'});
        }
    },
   
    async index(request, response){
        const {owner} = request.owner;
        try{
           const admins = await Admin.find({organization: owner});
           return response.send({admins});

        } catch(error){
            return response.status(400).send({error: 'Admins not found'});
        }
    },

    async show(request, response){
        const { _id } = request.headers;

        try{
            const adminsBusca = await Admin.findById(_id).populate('organização');
            return response.send(adminsBusca);
        } catch(error){
            return response.status(400).send({error: 'Admin not found'})
        }
    },

    async update(request, response){
        const {_id, name, email, password} = request.body;

        try{
            const admin = await Admin.findById(_id);
            if(email !== admin.email){
                const exists = Admin.find({email: email, organization: admin.organization});

                if (exists!==null) {
                    admin.email = email;
                    const hash = await bcript.hash(password, 10);
                    admin = await Admin.findByIdAndUpdate(_id, {name, email, password: hash}, {new: true});
                    return response.send({admin});

               } else return response.status(400).send({error: 'A admin with email informed already exist'})
            } else {
                const hash = await bcript.hash(password, 10);
                admin = await Admin.findByIdAndUpdate(_id, {name, email, password: hash}, {new: true});
                return response.send({admin});
            } 
            
        } catch(error){
            return response.status(400).send({error: 'Update of admin data failed'})
        }
    },

    async destroy(request, response){
        const { _id } = request.headers;
        var admin;

        try{
            admin = await Admin.findOneAndDelete( {_id: _id});
            const organization = await Organization.findOneAndUpdate({_id: admin.organization}, {$pullAll: {admins: [_id]}}, {new: true});
            return response.send({error: false, message: 'Admin deleted', admin: `${admin.name}`, organization: `${organization}`});
            
        } catch(error){
                if(admin!==null){
                    admin = await Admin.find({_id: admin._id, organization: admin.organization});
                    if(admin === null){
                        const newAdmin = await Admin.create({
                            name: admin.name,
                            email: admin.email,
                            password: admin.password,
                            organization: admin.organization
                        });

                        await Organization.findByIdAndUpdate({ _id: newAdmin.organization}, {$push: {admins: newAdmin._id}}, {new: true});
                        return response.status(400).send({error: 'Failed delete admin', admin: newAdmin.name});

                    } else return response.status(400).send({error: 'Failed delete admin'})
                } else return response.status(400).send({error: 'Failed delete admin'})
            }
    }

}