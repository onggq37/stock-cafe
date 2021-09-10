require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const session = require('express-session');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const app = express();
const port = process.env.PORT;

const stockCafeRoute = require('./controllers/stockCafe');
const userAuthRoute = require('./controllers/userAuth');
const homePageRoute = require('./controllers/homePage');

//Mongo Connection
const mongoURI = process.env.MONGOURL;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("connection open!")
})
.catch(err => {
    console.log("There is an error");
    console.log(err);
})

const sessionConfig = {
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session(sessionConfig))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate())); //use local strategy, use method call authenticate from user model
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/stockCafe', stockCafeRoute);
app.use('/', userAuthRoute);
app.use('/', homePageRoute);

app.listen(process.env.PORT, () => {
    console.log("hello world");
})