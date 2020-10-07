const Group = require('../../models/Group');

const Lock = require('../../models/Lock');
const PhysicalLocal = require('../../models/PhysicalLocal');
const Organization = require('../../models/Organization'); 

module.exports = {

    async store(request, response){
        const {name, _id = null, Localtype = "group"} = request.body;
        var owner = request.headers.owner;
        var NewGroup;

        try{

            //Se o grupo esta sendo criado em um local fisico, em um grupo ou na raiz

            if(Localtype==="group"){
                const holderGroup = await Group.findOne({ _id: _id }).populate('groups').populate('physicalLocal');

                if(holderGroup!==null){
                    var exist= false;

                   holderGroup.groups.map(group => {
                        if(group.name===name){
                            exist = true;
                        }
                    })

                    if(exist===false){
                
                        var newHolder = holderGroup.holder;
                        newHolder.push (holderGroup._id);

                        //Se o grupo propietario esta em um grupo localizado em um local fisico

                        if(holderGroup.holderPhysicalLocal!==null){
                            NewGroup = await Group.create({
                                name,
                                holder: newHolder,
                                groups: [],
                                locks: [],
                                roles: holderGroup.roles,
                                holderPhysicalLocal: holderGroup.holderPhysicalLocal,
                                physicalLocal: [],
                                organization: holderGroup.organization,
                            });
                        }
                        else{
                            NewGroup = await Group.create({
                                name,
                                holder: newHolder,
                                groups: [],
                                locks: [],
                                role: holderGroup.roles,
                                holderPhysicalLocal: null,
                                physicalLocal: [],
                                organization: holderGroup.organization,
                            });
                        }

                        let newGroups = holderGroup.groups;
                        newGroups.push(NewGroup._id);
                        await Group.findByIdAndUpdate({ _id: holderGroup._id}, { groups: newGroups}, {new: true});
                        await Organization.findByIdAndUpdate({ _id: holderGroup.organization}, { $push: {groups: NewGroup._id}}, {new: true});

                        return response.send({NewGroup});
                    } else {
                        return response.status(400).send({error: 'A group with name informed already exist'})
                    }

                } else {
                    //cria grupo na raiz

                    owner = await Organization.findById(owner).populate('groups');
                    var exist = false;

                    owner.groups.map(group => {
                        if(group.name===name){
                            exist = true;
                        }
                    })

                    if(exist===false){

                    NewGroup = await Group.create({
                        name: name,
                        holder: [],
                        groups: [],
                        locks: [],
                        roles: [],
                        holderPhysicalLocal: null,
                        physicalLocal: [],
                        organization: owner._id,
                    });

                    await Organization.findByIdAndUpdate({ _id: NewGroup.organization}, { $push: {groups: NewGroup._id}}, {new: true});
                    return response.send(NewGroup);
                    
                    }  return response.status(400).send({error: 'A group with name informed already exist'})

                }
            
            } else if(Localtype==="physicalLocal"){
                    const holderLocal = await PhysicalLocal.findById(_id).populate('groups');
    
                    if(holderLocal!==null){
                        var exist= false;
    
                       holderLocal.groups.map(group => {
                            if(group.name===name){
                                exist = true;
                            }
                        })
    
                        if(exist===false){
    
                            NewGroup = await Group.create({
                                    name,
                                    holder: holderLocal.holder,
                                    groups: [],
                                    locks: [],
                                    role: holderLocal.roles,
                                    holderPhysicalLocal: holderLocal._id,
                                    physicalLocal: [],
                                    organization: holderLocal.organization,
                                });
    
                            let newGroups = holderLocal.groups;
                            newGroups.push(NewGroup._id);
                            await PhysicalLocal.findByIdAndUpdate({ _id: holderLocal._id}, { groups: newGroups}, {new: true});
                            await Organization.findByIdAndUpdate({ _id: holderLocal.organization}, { $push: {groups: NewGroup._id}}, {new: true});

                            return response.send ({NewGroup});
                        } else {
                            return response.status(400).send({error: 'A group with name informed already exist'})
                        }
    
                    } else {
                        return response.status(400).send({error: 'Source physical local not found'})
                    }
            } else{
                return response.status(400).send({error: 'The new group could not be created'})
            }

        } catch(error){
            console.log(error)
            if(NewGroup._id!==null && NewGroup._id!==undefined) await Group.findByIdAndDelete(NewGroup._id);
            return response.status(400).send({error: 'Create a new group failed'});
        }
   
    },

    async index(request, response){
        const owner = request.headers.owner;
        try{
            const groups = await Group.find({organization: owner}).populate('physicalLocal').populate('holderPhysicalLocal').populate('holder').populate('locks').populate('roles').populate('groups');
            return response.send(groups);
        }catch(error){
            return response.status(400).send({error: 'Groups not found'});
        }
    },

    async show(request, response){
        const { _id } = request.body;
    
        try{
            const group = await Group.findById(_id).populate('groups').populate('locks').populate('physicalLocal');
            return response.send({group});
        } catch(error){
            return response.status(400).send({error: 'Group not found'})
        }
    },

    async findName (request, response){
        const {name, owner} = request.headers;
                
        try{
            const data = await Group.find({organization: owner});
            const groups = data.filter( local =>  (local.name.includes(name)));
            return response.send(groups);

        } catch(error){
            return response.status(400).send({error: 'Physical local(s) not found'});
        }
    },

    async update(request, response){
        const {_id, name} = request.body;
        const owner = request.headers.owner;

        try{
            group = await Group.findById(_id);

            if(group.holder !== null){
      
                group = await Group.findById(_id).populate('holder');

                var exists = false;

                Promise.all(group.holder.map(async item => {
                    var holder = await Group.findById(item._id).populate('groups');
                    holder.groups.map(el => {
                        if (group._id === el._id) if (el.name === name) exists = true;
                        
                    })
                }));
    
                    if (exists===false) {
                        group = await Group.findByIdAndUpdate(_id, {name}, {new: true});
                        return response.send(group);
    
                   } else return response.status(400).send({error: 'A group with email informed already exist'})
                 
            } else {

                const organization = await Organization.findById(owner).populate('groups');

                if(name !== group.name){
                    var exists = false;
                    
                  organization.groups.map(item => {
                        if (item.holder === null) 
                            if(item.name === name) exists = true;
                    
                });

                    if (exists===false) {
                        group = await Group.findByIdAndUpdate(_id, {name, groups, locks, physicalLocal, roles}, {new: true});
                        return response.send({group});
    
                   } else return response.status(400).send({error: 'A group with email informed already exist'})
                } else {
                    group = await Group.findByIdAndUpdate(_id, {name, groups, locks, physicalLocal, roles}, {new: true});
                    return response.send({group});
                } 
            }
            
        } catch(error){
            console.log(error)
            return response.status(400).send({error: 'Update of group data failed'})
        }
    },

    async destroy(request, response){
        const {_id} = request.headers;

        var group;
        try{
            group = await Group.findByIdAndRemove(_id);
            await Group.findOneAndUpdate({groups: {$in: [_id]}}, {$pullAll: {groups: [_id]}}, {new: true});
            await Organization.findOneAndUpdate({groups: {$in: [_id]}}, {$pullAll: {groups: [_id]}}, {new: true});          
            await PhysicalLocal.findOneAndUpdate({groups: {$in: [_id]}}, {$pullAll: {groups: [_id]}}, {new: true});
            await PhysicalLocal.deleteMany({holder: {$in: [_id]}});
            await Group.deleteMany({holder: {$in: [_id]}});
            await Lock.deleteMany({holder: {$in: [_id]}});

            return response.send({error: false, message: 'Group deleted', group: group.name});
        } catch(error){
            console.log(error)
            return response.status(400).send({error: 'Failed delete group'});
        }
    },
   
}