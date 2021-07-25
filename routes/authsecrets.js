const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/secrets');
});

module.exports = router;