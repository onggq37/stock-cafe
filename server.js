const express = require("express");
const mongoose = require("mongoose");
const axios = require('axios').default;
const transactionModel = require("./models/transaction")
const stockModel = require("./models/stock")
const methodOverride = require("method-override");


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

//index
app.get("/stockCafe", async (req,res) => {
    const symbols = [];

    //Getting all the distinct symbol from db
    /*
    const allStocks = await transactionModel.find().distinct('symbol');
    for(const element of allStocks) {
        const stockAttr = {
            name: element,
            units: 0,
            price: 0,
        }
        symbols.push(stockAttr);
    }

    //Get all transaction from db
    const allTrans = await transactionModel.find({});
    console.log(allTrans);
    for ( const element of allTrans ) {

    }
    */
    res.render("index.ejs");
})

//new
app.get("/stockCafe/new", (req,res) => {
    const success = req.query.success;
    const symbol = req.query.symbol;
    const action = req.query.action;
    res.render("new.ejs", {
        success,
        symbol,
        action,
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
            const stockInput = {
                symbol: req.body.symbol,
                units: parseInt(req.body.units),
                price: parseInt(req.body.price),
            }
            const stockArr = await stockModel.find({symbol: `${req.body.symbol}`});
            const stockProperty = stockArr[0];
            //Add new stock symbol into stock collection else update if exist
            if( stockArr.length === 0 && req.body.action === "buy" ) {
                await stockModel.create(stockInput);
            } else if (stockArr.length === 0 && req.body.action === "sell") {
                res.redirect("/stockCafe/new?success=false&action=invalid");
            } else {
                if( req.body.action === "buy" ) {
                    const newUnitsBuy = stockProperty.units + stockInput.units;
                    const newPriceBuy = ((stockProperty.price * stockProperty.units) + (stockInput.price * stockInput.units))/newUnitsBuy;
                    try {
                        await stockModel.updateOne({ symbol : `${stockInput.symbol}`}, { $set: { units: newUnitsBuy,price: newPriceBuy }});
                    } catch (e) {
                        res.send(e.message);
                    }
                } else if (req.body.action === "sell" ) {
                    const newUnitsSell = stockProperty.units - stockInput.units;
                    const newPriceSell = ((stockProperty.price * stockProperty.units) - (stockInput.price * stockInput.units))/newUnitsSell;
                    if ( newUnitsSell < 0 ) {
                        res.redirect("/stockCafe/new?success=false&action=invalid");
                    } else if ( newUnitsSell === 0 ) {
                        try {
                            await stockModel.deleteOne({ symbol: `${stockInput.symbol}` })
                        } catch(e) {
                            res.send(e.message);
                        }
                    } else {
                        try {
                            await stockModel.updateOne({ symbol : `${stockInput.symbol}`}, { $set: { units: newUnitsSell,price: newPriceSell }});
                        } catch (e) {
                            res.send(e.message);
                        }
                    }
                }
            }

            const TransInput = {
                symbol: req.body.symbol,
                action: req.body.action,
                date: req.body.date,
                units: parseInt(req.body.units),
                price: parseInt(req.body.price),
            }
            const newTransaction = await transactionModel.create(TransInput);

            res.redirect("/stockCafe")
        }
    } catch (e) {
        res.send(e.message);

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