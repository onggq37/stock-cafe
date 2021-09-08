const express = require('express');
const router = express.Router();
const User = require('../models/user')

router.get('/register', (req,res) => {
    console.log('here')
    res.render('users/register.ejs');
});

router.post('/register', async(req,res) => {
    try{
        const { username, password } = req.body;    
        const user = new User({ username });
        const newUser = await User.register(user, password);
        res.redirect('/stockCafe?success=true&action=register')
    } catch(e) {
        res.redirect('register');
    }

})

module.exports = router;