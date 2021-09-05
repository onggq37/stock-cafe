const express = require("express");
const mongoose = require("mongoose");
const axios = require('axios').default;
const transactionModel = require("./models/transaction")
const methodOverride = require("method-override");
const stockCafeRoute = require('./controllers/stockCafe')

const app = express();
const port = 3000;

//Mongo Connection
const mongoURI = "mongodb://localhost:27017/stockCafe"
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("connection open!")
})
.catch(err => {
    console.log("There is an error");
    console.log(err);
})

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use('./stockCafe', stockCafeRoute);

app.listen(port, () => {
    console.log("hello world");
})