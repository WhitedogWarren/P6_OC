const Sauce = require("../models/sauce");
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error: new Error('Sauces non trouvée')}));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            res.status(200).json(sauce)
        })
        .catch(error => {
            console.log('sauce non trouvée');
            res.status(404).json({ error: new Error('Sauce non trouvée')});
        });
};

exports.addNewSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    let emptyFields = false;
    for (let field in sauceObject) {
        if(sauceObject[field] == undefined || sauceObject[field] == '') {
            emptyFields ? emptyFields.push(field) : emptyFields = [field];
        }
    }
    if(!req.file)
        emptyFields ? emptyFields.push('file') : emptyFields = ['file'];
    if(emptyFields) {
        return res.status(400).json({ message: "champs non remplis : " + emptyFields});
    }

    const sauce = new Sauce({
        userId: sauceObject.userId,
        name: sauceObject.name,
        manufacturer: sauceObject.manufacturer,
        description: sauceObject.description,
        mainPepper: sauceObject.mainPepper,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        heat: sauceObject.heat,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée'}))
        .catch(error => res.status(400).json({ error: new Error('Erreur lors de l\'enregistrement. Veuillez réessayer')}));
    
};

exports.updateSauce = (req, res, next) => { 
    Sauce.findOne({ _id: req.params.id}).then(sauce => {
        if(!sauce)
            res.status(404).json({ error: new Error('Sauce non trouvée')});
        if(sauce.userId !== req.auth.userId)
            res.status(401).json({ error: new Error('Requête non autorisée!')});
        const sauceObject = req.file ?
            {
                ...JSON.parse(req.body.sauce),
                imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            } : { ...req.body };

        let emptyFields = false;
        for(let field in sauceObject) {
            if(sauceObject[field] == undefined || sauceObject[field] == '') {
                emptyFields ? emptyFields.push(field) : emptyFields = [field];
            }
        }
        if(emptyFields) {
            console.log('champs vides : ');
            console.log(emptyFields);
            return res.status(400).json({ message: 'champs vides : ' + emptyFields});
        }
        function updateProcess() {
            Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id:req.params.id})
                .then(() => res.status(200).json({ message: 'Sauce modifiée' }))
                .catch(error => res.status(400).json({ error: new Error('Erreur lors de l\'enregistrement. Veuillez réessayer.')}));
        }

        if(req.file) {
            fs.unlink(sauce.imageUrl.substring(sauce.imageUrl.indexOf('images/')), () => {
                updateProcess();
            });
        }
        else {
            updateProcess();
        }
        
    })
    .catch(error => res.status(400).json({ error: new Error('Erreur lors de l\'enregistrement. Veuillez réessayer.')}));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }).then(
        (sauce) => {
            if(!sauce) {
                res.status(404).json({ error: new Error('Sauce non trouvée')});
            }
            if(sauce.userId !== req.auth.userId) {
                req.status(401).json({ error: new Error('Requête non autorisée!')});
            }
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Sauce supprimée'}))
                .catch(error => res.status(400).json({ error: new Error('Erreur lors de la suppression. Veuillez réessayer')}));
            });
        }
    )
    .catch(error => res.status(400).json({ error: new Error('Erreur lors de la suppression. Veuillez réessayer')}));
}

exports.addLike = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then((sauce) => {
            const likes = sauce.usersLiked;
            const dislikes = sauce.usersDisliked;
            if(req.body.like == 1) {
                if(likes.includes(req.auth.userId) || dislikes.includes(req.auth.userId)) {
                    res.status(401).json({ error: new Error('Vous ne pouvez émettre qu\'un seul like ou dislike!')});
                }
                likes.push(req.auth.userId);
                Sauce.updateOne({ _id: req.params.id}, {usersLiked: likes, likes: likes.length})
                    .then(() => res.status(200).json({ message: 'Sauce mise à jour'}))
                    .catch(error => res.status(400).json({ error: new Error('Erreur lors de la mise à jour des informations. Veuillez réessayer')}));
            }
            if(req.body.like == -1) {
                if(likes.includes(req.auth.userId) || dislikes.includes(req.auth.userId)) {
                    res.status(401).json({ error: new Error('Vous ne pouvez émette qu\'un seul like ou dislike!')});
                }
                dislikes.push(req.auth.userId);
                Sauce.updateOne({ _id: req.params.id}, {usersDisliked: dislikes, dislikes: dislikes.length})
                    .then(() => res.status(200).json({ message: 'sauce mise à jour'}))
                    .catch(error => res.status(400).json({ error: new Error('Erreur lors de la mise à jour des informations. Veuillez réessayer')}));
            }
            if(req.body.like == 0) {
                if(!likes.includes(req.auth.userId) && !dislikes.includes(req.auth.userId)) {
                    res.status(400).json({ error: new Error('Vous n\'avez pas encore voté pour cette sauce !')});
                }
                if(likes.includes(req.auth.userId)) {
                    likes.splice(likes.indexOf(req.auth.id), 1);
                }
                if(dislikes.includes(req.auth.userId)) {
                    dislikes.splice(dislikes.indexOf(req.auth.userId), 1);
                }
                Sauce.updateOne({ _id: req.params.id}, {usersLiked: likes, likes: likes.length, usersDisliked: dislikes, dislikes: dislikes.length})
                    .then(() => res.status(200).json({ message: 'Sauce mise à jour'}))
                    .catch(error => res.status(400).json({ error: new Error('Erreur lors de la mise à jour des informations. Veuillez réessayer')}));
            }
        })
        .catch(error => res.status(400).json({ error: new Error('Erreur lors de la mise à jour des informations. Veuillez réessayer')}));
}