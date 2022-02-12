const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    
    let fieldErrors;
    if(req.body.email == 'undefined' || req.body.email == '') {
        fieldErrors = "l'email n'a pas été saisi";
    }
    const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(req.body.email && !emailRegExp.test(req.body.email)) {
        fieldErrors = 'Ceci n\'est pas une adresse mail valide.';
    }
    if(req.body.password == 'undefined' || req.body.password == '') {
        fieldErrors ? fieldErrors += 'Aucun mot de passe saisi' : fieldErrors = 'Aucun mot de passe saisi';
    }
    const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    if(req.body.password && !passwordRegExp.test(req.body.password)) {
        fieldErrors ? fieldErrors += '\nVotre mot de passe doit contenir au moins 8 caractères dont au moins une majuscule, une minuscule et un chiffre' : fieldErrors = 'Votre mot de passe doit contenir au moins 8 caractères dont au moins une majuscule, une minuscule et un chiffre';
    }
    
    if(fieldErrors) {
        return res.status(400).json({message: 'Formulaire invalide :\n' + fieldErrors});
    }
    
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({ message: 'user créé'}))
                .catch(error => res.status(400).json(error));
        })
        .catch(error => {
            console.log('.catch');
            res.status(500).json(error);
        });
};

exports.login = (req, res, next) => {
    
    User.findOne({ email: req.body.email })
        .then(user => {
            if(!user) {
                return res.status(401).json({ message: 'Utilisateur non trouvé'});
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if(!valid) {
                        return res.status(401).json({ message: 'Mot de passe icorrect !'});
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.TOKEN_SECRET,
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json(error));
        })
        .catch(error => res.status(500).json(error));
};
