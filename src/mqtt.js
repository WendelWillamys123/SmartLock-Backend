const mqtt = require ("mqtt");

const Group = require ("./models/Group");
const Lock = require ("./models/Lock");
const Role = require ("./models/Role");
const User = require ("./models/User");
const PhysicalLocal = require("./models/PhysicalLocal");

    const client = mqtt.connect("mqtt://broker.hivemq.com");

    client.on( "connect", () => {
            client.subscribe( "checkAccess", (error) => {
                    if (error !== true){
                        /*  setTimeout
                        (
                            () =>
                            {
                                client.publish
                                (
                                    "checkAccess",
                                    JSON.stringify
                                    (
                                        {
                                            _id: "5fa45f8cd6dbe745d44c5286",
                                            pin: "12345"
                                        }
                                    )
                                );
                            },
                            2000
                        );*/
                    }
                    
                });
        });

    client.on("message", async (topic, message) => {
        
        

        if (topic === "checkAccess"){
           
            message = JSON.parse(message);

            console.log(message);
            
            const _id = message._id;
            const pin = message.pin;
            const user = await User.findOne({pins: pin});
            
            if (user !== null)
            {
                const lock = await Lock.findById(_id);
                const groups = await Group.find({_id: {$in: lock.holder}});
                const physicalLocal = await PhysicalLocal.find({_id: lock.holderPhysicalLocal});

                var allGroups = [];
                
                allGroups.push(...groups);
                if(physicalLocal !== null || physicalLocal !== undefined ) allGroups.push(...physicalLocal);

                var holderNames = [];
                var roleIds = [];

                allGroups.map((group, index) => {
                    holderNames[index] = group.name;
                    
                    group.roles.map((role) => {
                        if (roleIds.includes(role.toString()) === false){
                            roleIds.push(role.toString());
                        }
                    });
                });
                
                var usedTimes = [];
                var usedRoles = [];

                console.log(roleIds);
                console.log("-------------------------");
                console.log(user.roles);


                if (roleIds.length !== 0 && user.roles.some ((value) => roleIds.indexOf(value.toString()) >= 0)) {
                    var currentTime = new Date;
                    
                    currentTime = {
                        hour: (currentTime.getHours ()*60)+currentTime.getMinutes (),
                        day: currentTime.getDay()
                    };

                    const roles = await Role.find({_id: {$in: roleIds}});
                    
                    
                    roles.map((role) => {
                        role.times.map((time) => {
                            var start = (time.start.hours*60)+time.start.minutes;
                            var end = (time.end.hours*60)+time.end.minutes;

                            if (currentTime.hour >= start && currentTime.hour <= end && time.day [currentTime.day] === true) {
                               
                                usedTimes.push(time);
                                usedRoles.push (role.name);
                            }
                        })
                    });
                }

                

                if (usedTimes.length > 0){
                    console.log(user.name+" accessed the " + lock.name + " lock")
                    client.publish(`respondAccess/${_id}`, "true");
                } else {
                    client.publish(`respondAccess/${_id}`, "false");
                }

            } else {
                client.publish(`respondAccess/${_id}`, "false");
            }
        }
    }
);

    module.exports = client;