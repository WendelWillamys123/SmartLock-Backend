const PhysicalLocal = require('../../models/PhysicalLocal');

const Group = require('../../models/Group');
const Lock = require('../../models/Lock');
const Organization = require('../../models/Organization');

module.exports = {

    async store(request, response){
        const {name, _id, longitude, latitude} = request.body;
        var NewLocal;

        try{
            const holderGroup = await Group.findById(_id);
         
            if(holderGroup!==null){
                var exist= false;

                   holderGroup.physicalLocal.map(physicalLocal => {
                        if(physicalLocal.name===name){
                            exist = true;
                        }
                    })

                if(exist===false){
                    
                    var newHolder = holderGroup.holder;
                    newHolder.push(holderGroup._id);

                    const location = {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    }

                    NewLocal = await PhysicalLocal.create({
                        name,
                        holder: newHolder,
                        groups: [],
                        locks: [],
                        roles: holderGroup.roles,
                        location: location,
                        organization: holderGroup.organization
                    });

                    let newPhysicalLocal = holderGroup.physicalLocal;
                    newPhysicalLocal.push(NewLocal._id);

                    await Group.findByIdAndUpdate({ _id: holderGroup._id}, { physicalLocal: newPhysicalLocal}, {new: true});
                    await Organization.findByIdAndUpdate({ _id: holderGroup.organization}, { $push: {physicalLocal: NewLocal._id}}, {new: true});
                    return response.send(NewLocal);

                } else return response.status(400).send({error: 'A physical local with name informed already exist'});
            } else return response.status(400).send({error: 'Source group not found'});
        
        } catch(error){
            if(NewLocal._id!==null) await PhysicalLocal.findByIdAndDelete(NewLocal._id);
            if(NewLocal._id!==undefined) await PhysicalLocal.findByIdAndDelete(NewLocal._id);

            return response.status(400).send({error: 'Create a new physical local failed'});
        }
   
    }, 

    async index(request, response){
        const {owner} = request.headers;
        try{
            const physicalLocal = await PhysicalLocal.find({organization: owner}).populate('holder').populate('locks').populate('roles').populate('groups');
            return response.send(physicalLocal);

        } catch(error){
            return response.status(400).send({error: 'Physical locals not found'});
        }
    },

    async show(request, response){
        const { _id } = request.body;
        
        try{
            const physicalLocal = await PhysicalLocal.findById(_id).populate('groups').populate('locks').populate('holder');
            return response.send(physicalLocal);

        } catch(error){
            return response.status(400).send({error: 'Physical local not found'});
        }
    },

    async findName (request, response){
        const {name, owner} = request.headers;
                
        try{
            const data = await PhysicalLocal.find({organization: owner});
            const physicalLocals = data.filter( local =>  (local.name.includes(name)));
            return response.send(physicalLocals);

        } catch(error){
            return response.status(400).send({error: 'Physical local(s) not found'});
        }
    },

    async update(request, response){
        const {_id, name, groups, locks, roles } = request.body;
        
        try{
            const physicalLocal = await PhysicalLocal.findById(_id).populate('holder');

            var holderGroup;

            physicalLocal.holder.map(item => {
                item.physicalLocal.map(el => {
                    if (physicalLocal._id === el) holderGroup = item;
                })
            })
            
            holderGroup = await Group.findById(holderGroup._id).populate('physicalLocal');

            if(name !== physicalLocal.name){
                var exists = false;
                
                holderGroup.physicalLocal.map(local => {
                    if(local.name===name){
                        exist = true;
                    }
                })

                if (exists===false) {
                    physicalLocal = await Group.findByIdAndUpdate(_id, {name, groups, locks, roles}, {new: true});
                    return response.send(physicalLocal);

               } else return response.status(400).send({error: 'A physical local with email informed already exist'})
            } else {
                physicalLocal = await Group.findByIdAndUpdate(_id, {name, groups, locks, roles}, {new: true});
                return response.send(physicalLocal);
            } 
        } catch(error){
            return response.status(400).send({error: 'Update of physical local data failed'})
        }
    },    

    async destroy(request, response){
        const {_id} = request.body;
    
        try{
            const physicalLocal = await PhysicalLocal.findByIdAndRemove(_id);
            await Group.findOneAndUpdate({physicalLocal: {$in: [_id]}}, {$pullAll: {physicalLocal: [_id]}}, {new: true});
            await Organization.findOneAndUpdate({groups: {$in: [_id]}}, {$pullAll: {groups: [_id]}}, {new: true});
            await Group.deleteMany ({holderPhysicalLocal: {$in: [_id]}});
            await Lock.deleteMany ({holderPhysicalLocal: {$in: [_id]}});

            return response.send({error: false, message: 'Physical local deleted', PhysicalLocal: physicalLocal.name});

        }   catch(error){
            return response.status(400).send({error: 'Failed delete physical local'});
        }
    },

}