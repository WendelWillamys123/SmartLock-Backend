const mqtt = require ("mqtt");

const Group = require ("./models/Group");
const Lock = require ("./models/Lock");
const Role = require ("./models/Role");
const User = require ("./models/User");
const PhysicalLocal = require("./models/PhysicalLocal");

    const client = mqtt.connect("mqtt://broker.hivemq.com");

    client.on( "connect", () => {
            client.subscribe( "checkAccess", (error) => {
                    if (error !== true);
                });
        });

    client.on("message", async (topic, message) => {
        
        if (topic === "checkAccess"){
           
            message = JSON.parse(message);
            const _id = message._id;
            const pin = message.pin;
            const user = await User.findOne({pins: pin});
            
            if (user !== null)
            {
                const lock = await Lock.findById (_id);
                const groups = await Group.find({_id: {$in: lock.holder}});
                const physicalLocal = await PhysicalLocal.find({_id: {$in: lock.holder}});
                
                var allGroups = [];
                
                groups.map((group) => {
                    allGroups[group.holder.length] = group;
                });

                physicalLocal.map((local) => {allGroups[local.holder.length] = local;});
            
                var holderNames = [];
                var roleIds = [];

                allGroups.map((group, index) => {
                    holderNames[index] = group.name;
                    
                    group.roles.map((role) => {
                        if (roleIds.includes(role) === false){
                            roleIds.push(role);
                        }
                    });
                });

                if (roleIds.length !== 0 && user.roles.some ((value) => roleIds.indexOf(value) >= 0)) {
                    var currentTime = new Date;
                    currentTime = {
                        hour: (currentTime.getHours()*60)+currentTime.getMinutes (),
                        day: currentTime.getDay()
                    };

                    const roles = await Role.find({_id: {$in: roleIds}});
                    var usedTimes = [];
                    var usedRoles = [];
                    
                    roles.map((role) => {
                        role.times.map((time) => {
                            if (currentTime.hour >= time.start && currentTime.hour <= time.end && time.day [currentTime.day] === true) {
                                usedTimes.push (time);
                                usedRoles.push (role.name);
                            }
                        })
                    });
                }

                if (usedTimes.length > 0){
                    client.publish("respondAccess", _id+" true");
                } else {
                    client.publish("respondAccess", "false");
                }

            } else {
                client.publish("respondAccess", "false");
            }
        }
    }
);

    module.exports = client;