const Group = require('../../models/Group');

const Lock = require('../../models/Lock');
const PhysicalLocal = require('../../models/PhysicalLocal');
const Organization = require('../../models/Organization'); 

module.exports = {

    async store(request, response){
        const {name, _id = null, Localtype = "group"} = request.body;
        var {owner} = request.owner;
        var NewGroup;

        try{

            //Se o grupo esta sendo criado em um local fisico, em um grupo ou na raiz

            if(Localtype==="group"){
                const holderGroup = await Group.findOne({ _id: _id }).populated('groups').populate('physicalLocal');

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

                    owner = await Organization.findById(owner);

                    NewGroup = await Group.create({
                        name,
                        holder: [],
                        groups: [],
                        locks: [],
                        roles: [],
                        holderPhysicalLocal: null,
                        physicalLocal: [],
                        organization: owner._id,
                    });

                    await Organization.findByIdAndUpdate({ _id: owner._id}, { $push: {groups: NewGroup._id}}, {new: true});
                }
            
            } else if(Localtype==="physicalLocal"){
                    const holderLocal = await PhysicalLocal.findById(_id).populated('groups');
    
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
            if(NewGroup._id!==null && NewGroup._id!==undefined) await Group.findByIdAndDelete(NewGroup._id);
            return response.status(400).send({error: 'Create a new group failed'});
        }
   
    },

    async index(request, response){
        const { owner } = request.owner;
        try{
            const groups = await Group.find({organization: owner});
            return response.send({groups});
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

    async update(request, response){
        const {_id, name, groups, locks, physicalLocal, roles } = request.body;
        
        try{
            const group = await Group.findById(_id).populate('holder');

            var holderGroup;

            group.holder.map(item => {
                item.groups.map(el => {
                    if (group._id === el) holderGroup = item;
                })
            })
            
            holderGroup = await Group.findById(holderGroup._id).populate('groups');

            if(name !== group.name){
                var exists = false;
                
                holderGroup.groups.map(group => {
                    if(group.name===name){
                        exist = true;
                    }
                })

                if (exists===false) {
                    group = await Group.findByIdAndUpdate(_id, {name, groups, locks, physicalLocal, roles}, {new: true});
                    return response.send({group});

               } else return response.status(400).send({error: 'A group with email informed already exist'})
            } else {
                group = await Group.findByIdAndUpdate(_id, {name, groups, locks, physicalLocal, roles}, {new: true});
                return response.send({group});
            } 
        } catch(error){
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
            await PhysicalLocal.deleteMany({holder: {$in: [_id]}});
            await Group.deleteMany({holder: {$in: [_id]}});
            await Lock.deleteMany({holder: {$in: [_id]}});

            return response.send({error: false, message: 'Group deleted', group: group.name});
        } catch(error){
            return response.status(400).send({error: 'Failed delete group'});
        }
    },
   
}