const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

router.post('/', async (req, res, next) => {
    const userSecret = req.body.secret;

    await User.findById({ _id: req.user.id }, (err, result) => {
        if (!err && result) {
            result.secret = userSecret;
            result.validate({}, (err) => {
                if (!err) {
                    result.save();
                    res.redirect('/secrets');
                }
            });
        } else {
            next(err);
        }
    });

});

module.exports = router;