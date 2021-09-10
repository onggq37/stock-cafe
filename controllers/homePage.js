const express = require('express');
const router = express.Router();

router.get('/', (req,res) => {
    res.render("home/homepage.ejs");
});

module.exports = router;