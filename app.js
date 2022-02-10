const express = require('express');
const app = express();
const path = require('path');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");

//gestion des connexion bdd
const dbclient = new MongoClient(process.env.DB_HOST, { useUnifiedTopology: true });
let _dbConnexion = null;
dbclient.connect(function(err, dbConnexion){
    console.log("Connected successfully to db from app.js");
    assert.equal(null, err);
    _dbConnexion = dbConnexion;
})
app.use(function(req, res, next) {
    res.locals.dbConnexion = _dbConnexion;
    next();
});


mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useUnifiedTopology: true});
let _mongooseDBconnexion = null;
const mongooseDBconnexion = mongoose.connection;
mongooseDBconnexion.on('error', console.error.bind(console, 'mongoose connection error : '));
mongooseDBconnexion.once('open', function() {
    console.log('connected to mongooseDB from app.js');
    _mongooseDBconnexion = mongooseDBconnexion;
});
app.use(function(req, res, next) {
    res.locals.mongooseDBconnexion = _mongooseDBconnexion;
    next();
});

//gestion du cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

//Permet la récupération des données POST ( req.body )
app.use(express.json());

// Protection contre les attaques DoS
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
})

//app.use('/api/', apiLimiter);

//Protection contre les attaques "force brute"
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false
})

app.use('/api/auth/login', loginLimiter);

//création des routes
app.use('/images', express.static(path.join(__dirname, 'images')));
const authRoute = require('./routes/auth');
const saucesRoute = require('./routes/sauces');
app.use('/api/auth', authRoute);
app.use('/api/sauces', saucesRoute);

app.use((req, res) => {
    res.status(404).json({ message: 'Votre requête a bien été reçue, mais aucune route ne correspond à votre demande' }); 
});


module.exports = app;