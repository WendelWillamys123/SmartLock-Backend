const Organization = require('../../models/Organization');  
const Admin = require('../../models/Admin');

const OrganizationController = require('../Controller of models/OrganizationController');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

const { Router } = require('express');

const router = Router();

//Routes Organization

router.get('/organizations/search', OrganizationController.show);
router.get('/organizations', OrganizationController.index);
router.delete('/organizations/delete', OrganizationController.destroy);
router.put('/organizations/update', OrganizationController.Update);

router.post('/register',  async (request, response) => {
        const {name, email, password} = request.body;
        
        try{
        let NewOrganization = await Organization.findOne({ email });

        if(!NewOrganization){
            NewOrganization = await Organization.create({
                name,
                email,
                password
            })
        } else {
            return response.status(400).send({error: 'Organization already exists'})   
        }
        
        NewOrganization.password= undefined;

        const token = jwt.sign({id: NewOrganization._id}, authConfig.secret, { expiresIn: 86400})

        return response.send({NewOrganization, token});
        }catch(error){
            return response.status(400).send({error: 'New organization registration failed'})    
        }
    
    });

    router.post('/authenticate', async (request, response) =>{
        const {email, password} = request.body;

        try{
            const organization = await Organization.findOne({email}).select('+password');

            if(!organization){
                return response.status(400).send({error: 'Organization not found'})
            } 
            if(!await bcrypt.compare(password, organization.password)){
                return response.status(400).send({error: 'Invalid password'})
            }

            organization.password = undefined;

            const token = jwt.sign({id: organization._id}, authConfig.secret, { expiresIn: 86400})

            return response.send({organization, token});
        }catch(error){
            return response.status(400).send({error: 'Organization  failed'})    
        }
    });

    router.post('/authenticate/admins', async (request, response) =>{
        const {email, password} = request.body;

        try{
            const admin = await Admin.findOne({email}).select('+password');

            if(!admin){
                return response.status(400).send({error: 'Admin not found'})
            } 
            if(!await bcrypt.compare(password, admin.password)){
                return response.status(400).send({error: 'Invalid password'})
            }

            admin.password = undefined;

            const token = jwt.sign({idAdmin: admin._id}, authConfig.secret, { expiresIn: 86400})

            return response.send({admin, token});
        }catch(error){
            return response.status(400).send({error: 'Organization  failed'})    
        }
    });
 

    module.exports = app => app.use('/app', router);

