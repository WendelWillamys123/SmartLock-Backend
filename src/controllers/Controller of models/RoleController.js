const Role = require ("../../models/Role");

const User = require ("../../models/User");
const Group = require ("../../models/Group");
const Organization = require("../../models/Organization");
const Lock = require("../../models/Lock");
const PhysicalLocal = require("../../models/PhysicalLocal");

module.exports = {

    async store (request, response){
        const {name, times = []} = request.body;
        var owner = request.headers.owner;
        var newRole;

        try{

            owner = await Organization.findById(owner);

            if(owner!==null){
                newRole = await Role.findOne({organization: owner._id, name: name});
                if(newRole===null){
                    newRole = await Role.create({
                        name,
                        times,
                        organization: owner._id
                    });
                    console.log(newRole)
                    await Organization.findByIdAndUpdate({ _id: owner._id}, { $push: {roles: newRole._id}}, {new: true});
                    return response.send(newRole);

                } else return response.status(400).send({error: 'A role with name informed already exist'})
            } else return response.status(400).send({error: 'Source owner not found'})

        } catch(error){
            if(newRole._id!==null && newRole._id!==undefined) await Role.findByIdAndDelete(newRole._id);
            return response.status(400).send({error: 'Create a new role failed'})
        }
    },

    async index (request, response){
        const owner = request.headers.owner;

        try{
            const roles = await Role.find({organization: owner});
            return response.send(roles);
        } catch(error){
            return response.status(400).send({error: 'Roles not found'})
        }
        
    },

    async show (request, response){
        const {_id} = request.headers;

        try{
            const role = await Role.findById(_id);
            return response.send({role});
        } catch(error){
            return response.status(400).send({error: 'Role not found'})
        }
    },

    async update (request, response){
        const {_id, name, times} = request.body;
        console.log(times);

        const owner = request.headers.owner;
        var newRole;

        try{
            const role = await Role.findById(_id);

            if (role !== null) {
                if(name === role.name){
                    newRole = await Role.findByIdAndUpdate({_id: _id}, {name: name, times: times}, {new: true});
                    return response.send(newRole);

                } else {
                    const exist = await Role.findOne({name, organization: owner});

                    if(exist===null){
                        newRole = await Role.findByIdAndUpdate({_id: _id}, {name, times}, {new: true});
                        console.log(newRole);
                        return response.send(newRole);

                    } else return response.status(400).send({error: 'A role with name informed already exist'});
                }
                
            } else return response.status(400).send({error: 'Role not found'});
            
        } catch(error){
            return response.status(400).send({error: 'Update of role data failed'})
        }
    },

    async newShedule (request, response){
        const {_id, time} = request.body;

        const owner = request.headers.owner;
        var newRole;

        try{
            const role = await Role.findById(_id);

            if (role !== null) {

                var exist = false;

                role.times.map(tm => {
                    if(tm.name === time.name){
                        exist = true
                    }
                })

                if(exist === false){
                    var newTime = role.times;
                    newTime.push(time);

                    newRole = await Role.findByIdAndUpdate({_id: _id}, {times: newTime}, {new: true});

                    return response.send(newRole);
                }
            
            } else  return response.status(400).send({error: 'Role not found'})    
           
        } catch(error){
            return response.status(400).send({error: 'Add a new shedule failed'})
        }
    },

    async destroy (request, response){
        const {_id} = request.headers;
        try{
            const role = await Role.findByIdAndDelete(_id);
            await Organization.findByIdAndUpdate({ _id: role.organization}, {$pullAll: {roles: [role._id]}}, {new: true})
            await User.updateMany({roles: {$in: [_id]}}, {$pullAll: {roles: [_id]}});
            await Group.updateMany({roles: {$in: [_id]}}, {$pullAll: {roles: [_id]}});

            return response.json ({error: false, message: 'Role deleted', Role: role.name});
        } catch(error){
            return response.status(400).send({error: 'Failed delete role'})
        }        
    },

    async assign(request, response){
        const {_id, componentID, type} = request.body;


        try {
            const role = await Role.findById(_id);
            if(role!==null){
               
                if(type === "groups"){
                    const toWhom = await Group.findById(componentID);
                    var exist = false;
                    
                    if(toWhom.roles !== null){
                        if(toWhom.roles !== undefined){
                            toWhom.roles.map(role =>{
                                if(role.toString() === _id.toString()) exist = true
                            })
                        }
                    }

                    if(exist === false){
                    await Group.findByIdAndUpdate({_id: componentID}, { $push: {roles: role._id}}, {new: true});
                    await Group.updateMany({holder: {$in: [componentID]}}, { $push: {roles: role._id}}, {new: true});
                    await Lock.updateMany({holder: {$in: [componentID]}}, { $push: {roles: role._id}}, {new: true});
                    await PhysicalLocal.updateMany ({holder: {$in: [componentID]}}, { $push: {roles: role._id}}, {new: true});
                    return response.send({error: false, message: `The ${toWhom.name} group received the role ${role.name} and its components also inherited it`})
                    } 
                    
                    else return response.status(400).send({error: 'The group in question already has this role'})

                    
                }
                if(type === "physicalLocal"){

                    const toWhom = await PhysicalLocal.findById(componentID);
                    var exist = false;

                    if(toWhom.roles !== null){
                        if(toWhom.roles !== undefined){
                            toWhom.roles.map(role =>{
                                if(role.toString() === _id.toString()) exist = true
                            })
                        }
                    }

                    if(exist === false){
                        await PhysicalLocal.findByIdAndUpdate({_id: componentID}, { $push: {roles: role._id}}, {new: true});
                        await Group.updateMany({holder: {$in: [componentID]}}, { $push: {roles: role._id}}, {new: true});
                        await Lock.updateMany({holder: {$in: [componentID]}}, { $push: {roles: role._id}}, {new: true});
                        return response.send({error: false, message: `The ${toWhom.name} physical local received the role ${role.name} and its components also inherited it`})   
                    } 
                    
                    else return response.status(400).send({error: 'The physical local in question already has this role'});
                }
                if(type === "locks"){

                    const toWhom = await Lock.findById(componentID);
                    var exist = false;

                    if(toWhom.roles !== null){
                        if(toWhom.roles !== undefined){
                            toWhom.roles.map(role =>{
                                if(role.toString() === _id.toString()) exist = true
                            })
                        }
                    }

                    if(exist === false){
                        await Lock.findByIdAndUpdate({_id: componentID}, { $push: {roles: role._id}}, {new: true});
                        return response.send({error: false, message: `The ${toWhom.name} lock received the role ${role.name}`})
                    } 
                    
                    else return response.status(400).send({error: 'The lock in question already has this role'})

                       
                }
                if(type === "users"){

                    const toWhom = await User.findById(componentID);
                    var exist = false;

                    

                    if(toWhom.roles !== undefined){
                        if(toWhom.roles !== null){
                            toWhom.roles.map(role =>{
                                if(role.toString() === _id.toString()) exist = true
                            })
                        } 
                    } 

                    if(exist === false){
                        if(toWhom.roles === null) toWhom.roles = [];
                        toWhom.roles.push(_id)
                        await User.findByIdAndUpdate({_id: toWhom._id}, {roles: toWhom.roles}, {new: true});
                        return response.send({error: false, message: `User ${toWhom.name} received the role ${role.name}`})    
                    }  else return response.status(400).send({error: 'The user in question already has this role'})

                   
                }
        }else return response.status(400).send({error: true, message: "Role not found"})
            
        } catch (error) {
           console.log(error);
            return response.status(400).send({error: 'Could not assign the role'})
        }
    }
};