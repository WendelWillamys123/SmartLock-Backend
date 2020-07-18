const Lock = require ("../../models/Lock");

const Group = require ("../../models/Group");
const PhysicalLocal = require ("../../models/PhysicalLocal");
const Organization = require("../../models/Organization");

module.exports = {

    async store (request, response){
        const {name, _id = null, Localtype="group"} = request.body;
        var NewLock;
        
        try{
            if(Localtype==="group"){
                const holderGroup = await Group.findById(_id);

                if(holderGroup!==null){
                    var exist= false;

                   holderGroup.locks.map(locks => {
                        if(locks.name===name){
                            exist = true;
                        }
                    })

                    if(exist===false){
                        var newHolder = holderGroup.holder;
                        newHolder.push (holderGroup._id);

                        if(holderGroup.holderPhysicalLocal!==null){
                            NewLock = await Lock.create({
                                name,
                                holder: newHolder,
                                holderPhysicalLocal: holderGroup.holderPhysicalLocal,
                                organization: holderGroup.organization
                            });
                        } else {
                            NewLock = await Lock.create({
                                name,
                                holder: newHolder,
                                organization: holderGroup.organization
                            });
                        }

                        let newContent = holderGroup.locks;
                        newContent.push(NewLock._id);

                        await Group.findByIdAndUpdate({ _id: holderGroup._id}, { locks: newContent}, {new: true});
                        await Organization.findByIdAndUpdate({ _id: holderGroup.organization}, { $push: {locks: NewLock._id}}, {new: true});
                            
                        return response.send({NewLock});
                        
                    } else return response.status(400).send({error: 'A lock with name informed already exist'});
                } else return response.status(400).send({error: 'Source group not found'});
            }

            if(Localtype==="physicalLocal"){
                const holderLocal = await PhysicalLocal.findById(_id);

                if(holderLocal!==null){
                    var exist= false;

                    holderLocal.locks.map(locks => {
                        if(locks.name===name){
                            exist = true;
                        }
                    })

                    if(exist===false){
                        NewLock = await Lock.create({
                            name,
                            holder: holderLocal.holder,
                            holderPhysicalLocal: holderLocal._id
                        });

                        let newContent = holderLocal.locks;
                        newContent.push(NewLock._id);
                        await PhysicalLocal.findByIdAndUpdate({ _id: holderLocal._id}, { locks: newContent}, {new: true});
                        await Organization.findByIdAndUpdate({ _id: holderGroup.organization}, { $push: {locks: NewLock._id}}, {new: true});

                        return response.send({NewLock});
                    } else return response.status(400).send({error: 'A lock with name informed already exist'});
                } else return response.status(400).send({error: 'Source physical local not found'});
            }

        } catch(error){
            if(NewLock._id!==null && NewLock._id!==undefined) await Lock.findByIdAndDelete(NewLock._id);
            return response.status(400).send({error: 'Create a new lock failed'});
        }
    },

    async index (request, response){
        const {owner} = request.owner;

        try{
            const lock = await Lock.find({organization: owner});
            return response.send({lock});

        } catch(error){
            return response.status(400).send({error: 'Locks not found'});
        }
    },
    
    async show (request, response){
        const {_id} = request.query;
        
        try{
            const lock = await Lock.findById(_id);
            return response.send({lock});

        } catch(error){
            return response.status(400).send({error: 'Locks not found'});
        }
    },

    async update (request, response){
        const {_id, name} = request.body;
        
        try{
            const lock = await Lock.findByIdAndUpdate (_id, {name}, {new: true});
            return response.send({lock});

        } catch(error){
            return response.status(400).send({error: 'Update of lock data failed'});
        }
    },

    async destroy (request, response){
        const {_id, Localtype="group"} = request.body;
        
        try{
            if(Localtype==="group"){
                const lock = await Lock.findByIdAndDelete(_id);
                await Group.findOneAndUpdate({locks: {$in: [_id]}}, {$pullAll: {locks: [_id]}}, {new: true});
                return response.send({error: false, message: 'Lock deleted', Lock: `${lock.name}`});
            } 
            if(Localtype==="physicalLocal"){
                const lock = await Lock.findByIdAndDelete(_id);
                await PhysicalLocal.findOneAndUpdate({locks: {$in: [_id]}}, {$pullAll: {locks: [_id]}}, {new: true});
            
                return response.send({error: false, message: 'Lock deleted', Lock: `${lock.name}`});
            }
        } catch(error){
            return response.status(400).send({error: 'Failed delete locks'});
        }
    },

    async move(request, response){
        const {_id, toId, Localtype = "group"} = request.body;

        try{
            var moving = await Lock.findById(_id);

            if(moving!==null){

                if(Localtype === "group"){
                    const to = await Group.findById(toId);

                if(to!==null){
                    moving.holder = to.holder;
                    moving.push(to._id);

                    if(moving.holderPhysicalLocal!==null){
                        moving.holderPhysicalLocal = null
                    }

                    await Group.findByIdAndUpdate({_id: to._id}, {$push : {locks: moving}}, {new: true});
                    await Lock.findByIdAndUpdate({_id: moving._id}, {holder: moving.holder }, {new: true});
                    } else return response.status(400).send({error: 'Source group not found'});
                }

                if(Localtype === "physicalLocal"){
                    const to = await PhysicalLocal.findById(toId);

                if(to!==null){
                    moving.holder = to.holder;
                    moving.holderPhysicalLocal = to._id;

                    await PhysicalLocal.findByIdAndUpdate({_id: to._id}, {$push : {locks: moving}}, {new: true});
                    await Lock.findByIdAndUpdate({_id: moving._id}, {holder: moving.holder, holderPhysicalLocal: moving.holderPhysicalLocal }, {new: true});
                    } else return response.status(400).send({error: 'Source physical local not found'});
                }
                

            } else return response.status(400).send({error: 'Lock not found'})
            
        } catch(error){

        }
    }

};