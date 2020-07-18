const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes');
const cors = require('cors');


const app= express();

mongoose.connect('mongodb+srv://lemonpunch:20181D12GR0342@cluster0-qijat.mongodb.net/Smartlock?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(cors());

app.use(express.json());

require('./controllers/Authentication/AuthController')(app);
app.use(routes);

app.listen(3333);

module.exports = app;

const client = require ("./mqtt");