const express = require('express');
const router = express.Router();
const passport= require('passport');
const User = require('../models/user')

router.get('/register', (req,res) => {
    res.render('users/register.ejs');
});

router.post('/register', async(req,res) => {
    try{
        const { username, password } = req.body;    
        const user = new User({ username });
        const newUser = await User.register(user, password);
        req.login( newUser, err => {
            if(err) {
                return next(err);
            } else {
                req.flash('success', 'Welcome to Stock Cafe!'); 
                res.redirect('/stockCafe')
            }
        });
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
})

router.get('/login', (req,res) => {
    res.render('users/login.ejs')
})

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login'}), async(req,res) => {
    req.flash('success', "Welcome back to Stock Cafe!")
    res.redirect('/stockCafe');
})

router.get('/logout', (req,res) => {
    req.logout();
    req.flash("success", "See you soon, goodbye!");
    res.redirect('/login');
})
module.exports = router;