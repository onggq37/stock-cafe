const express = require("express");
const mongoose = require("mongoose");
const axios = require('axios').default;
const transactionModel = require("./models/transaction")
const methodOverride = require("method-override");
const e = require("express");


const app = express();

const port = 3000;

console.log( new Date("08/26/2021"));

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

//index
app.get("/stockCafe", (req,res) => {
    res.render("index.ejs");
})

//new
app.get("/stockCafe/new", (req,res) => {
    const success = req.query.success;
    const symbol = req.query.symbol;
    res.render("new.ejs", {
        success,
        symbol,
    });
})

//create
app.post("/stockCafe", async (req,res) => {
    const symbol = req.body.symbol;
    try{
        const getSymbolInfo = await axios.get(`https://api.polygon.io/v3/reference/tickers?ticker=${symbol}&active=true&sort=ticker&order=asc&limit=10&apiKey=S47tdjxsU3ApK1ky1qC426NglkL3DS4K`)
        if ( getSymbolInfo.data.results === null) {
            res.redirect("/stockCafe/new?success=false&symbol=invalid");
        } else {
            const input = {
                symbol: req.body.symbol,
                action: req.body.action,
                date: req.body.date,
                units: req.body.units,
                price: req.body.price,
            }
            const newTransaction = await transactionModel.create(input);
            res.redirect("/stockCafe")
        }
    } catch (e) {
        console.log("Error", e)
    }


});

//show
app.get("/stockCafe/:id", (req,res) => {
    res.send("show");
})

//edit
app.get("/stockCafe/:id/edit", (req,res) => {
    res.send("edit");
})

//update
app.put("/stockCafe/:id", (req,res) => {
    console.log("update");
    res.redirect(`stockCafe/${req.params.id}`)
})

//destroy
app.delete("/stockCafe", (req,res) => {
    console.log("delete");
    res.redirect("/stockCafe")
})

app.listen(port, () => {
    console.log("hello world");
})