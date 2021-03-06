const { Router } = require('express');
const authMiddleware = require('./middlewares/auth');

const UserController = require('./controllers/Controller of models/UserController');
const AdminController = require('./controllers/Controller of models/AdminController');
const GroupController = require('./controllers/Controller of models/GroupController');
const LockController = require('./controllers/Controller of models/LockController');
const PhysicalLocalController = require('./controllers/Controller of models/PhysicalLocalController');
const RoleController = require('./controllers/Controller of models/RoleController');

const routes = Router();
routes.use(authMiddleware);

//Routes of admin

routes.post('/admins/create', AdminController.store);
routes.get('/admins/search', AdminController.show);
routes.get('/admins', AdminController.index);
routes.put('/admins/update', AdminController.update);
routes.delete('/admins/delete', AdminController.destroy);

//Routes of user

routes.post('/users/create', UserController.store);
routes.get('/users/search', UserController.show);
routes.get('/users/search/name', UserController.findName);
routes.get('/users', UserController.index);
routes.put('/users/update', UserController.update);
routes.delete('/users/delete', UserController.destroy);
routes.put('/users/removeRole', UserController.removeRole);

//Routes of groups

routes.post('/groups/create', GroupController.store);
routes.get('/groups/search', GroupController.show);
routes.get('/groups/search/name', GroupController.findName);
routes.get('/groups', GroupController.index);
routes.put('/groups/update', GroupController.update);
routes.delete('/groups/delete', GroupController.destroy);
routes.put('/groups/removeRole', GroupController.removeRole);

//Routes of locks

routes.post('/locks/create', LockController.store);
routes.get('/locks/search', LockController.show);
routes.get('/locks/search/name', LockController.findName);
routes.get('/locks', LockController.index);
routes.put('/locks/update', LockController.update);
routes.delete('/locks/delete', LockController.destroy);
routes.put('/locks/removeRole', LockController.removeRole);

//Routes of physical local

routes.post('/physicalLocals/create', PhysicalLocalController.store);
routes.get('/physicalLocals/search', PhysicalLocalController.show);
routes.get('/physicalLocals/search/name', PhysicalLocalController.findName);
routes.get('/physicalLocals', PhysicalLocalController.index);
routes.put('/physicalLocals/update', PhysicalLocalController.update);
routes.delete('/physicalLocals/delete', PhysicalLocalController.destroy);
routes.put('/physicalLocals/removeRole', PhysicalLocalController.removeRole);

//Rotes of roles

routes.post('/roles/create', RoleController.store);
routes.post('/roles/assign', RoleController.assign);
routes.get('/roles/search', RoleController.show);
routes.get('/roles', RoleController.index);
routes.put('/roles/update', RoleController.update);
routes.post('/roles/newShedule', RoleController.newShedule);
routes.delete('/roles/delete', RoleController.destroy);

module.exports = routes;