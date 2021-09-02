const express = require("express");
const mongoose = require("mongoose");
const axios = require('axios').default;
const transactionModel = require("./models/transaction")
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

app.get('/stockCafe/seed', async (req, res) => {
    const seedTrans =
    [
        {
          symbol: 'TSLA',
          action: 'buy',
          date: new date("2021-08-10T00:00:00.000Z"),
          units: 10,
          price: 500,
        },
        {
          symbol: 'TSLA',
          action: 'buy',
          date: new date("2021-08-10T00:00:00.000Z"),
          units: 5,
          price: 250,
        },
        {
          symbol: 'TSLA',
          action: 'buy',
          date: new date("2021-08-11T00:00:00.000Z"),
          units: 1,
          price: 750,
        },
        {
          symbol: 'TSLA',
          action: 'sell',
          date: new date("2021-08-04T00:00:00.000Z"),
          units: 6,
          price: 600,
        }
      ]
  
    try {
      const seedItems = await transactionModel.create(seedTrans)
      res.send(seedItems)
    } catch (err) {
      res.send(err.message)
    }
});

//index
app.get("/stockCafe", async (req,res) => {
    
    const allTrans = await transactionModel.find();
    console.log(allTrans)
    const symbols = [];
    const allStocks = await transactionModel.find().distinct('symbol');
    console.log(allStocks);
    const overallBuy = await transactionModel.aggregate(
        [
            {
                $match: {
                    action: "buy"
                }
            },
            {
                $group: {
                    _id: "$symbol", 
                    total: {
                        $sum: "$units"
                    }
                }
            }
        ]
    )

    //Getting all the distinct symbol from db
    
    /*
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
app.post("/stockCafe", async (req, res, next) => {
    const symbol = req.body.symbol;

    try{
        const getSymbolInfo = await axios.get(`https://api.polygon.io/v3/reference/tickers?ticker=${symbol}&active=true&sort=ticker&order=asc&limit=10&apiKey=S47tdjxsU3ApK1ky1qC426NglkL3DS4K`)
        console.log(getSymbolInfo.data.results);
        if ( getSymbolInfo.data.results === null) {
            res.redirect("/stockCafe/new?success=false&symbol=invalid");
        } else {
            nameOfStock = getSymbolInfo.data.results.name.split('.');
            const input = {
                symbol: req.body.symbol,
                name: nameOfStock[0],
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

    /*
    try{
        const getSymbolInfo = await axios.get(`https://api.polygon.io/v3/reference/tickers?ticker=${symbol}&active=true&sort=ticker&order=asc&limit=10&apiKey=S47tdjxsU3ApK1ky1qC426NglkL3DS4K`)
        if ( getSymbolInfo.data.results === null) {
            res.redirect("/stockCafe/new?success=false&symbol=invalid");
            next();
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
                next();
            } else {
                if( req.body.action === "buy" ) {
                    const newUnitsBuy = stockProperty.units + stockInput.units;
                    const newPriceBuy = ((stockProperty.price * stockProperty.units) + (stockInput.price * stockInput.units))/newUnitsBuy;
                    try {
                        await stockModel.updateOne({ symbol : `${stockInput.symbol}`}, { $set: { units: newUnitsBuy, price: newPriceBuy }});
                    } catch (e) {
                        res.send(e.message);
                    }
                } else if (req.body.action === "sell" ) {
                    const newUnitsSell = stockProperty.units - stockInput.units;

                    //calculating the price after selling which is can be found here https://support.zerodha.com/category/console/portfolio/articles/how-is-the-buy-average-calculated-in-q
                    const sellList = await transactionModel.find({ symbol: `${req.body.symbol}`, action: "sell" });
                    let sumOfSellUnits = 0;
                    for( const element of sellList ) {
                        sumOfSellUnits += element.units;
                    }

                    sumOfSellUnits += stockInput.units;

                    const buyList = await transactionModel.find({ symbol: `${req.body.symbol}`, action: "buy" });
                    let totalPrice = 0;
                    let unitsLeft = 0;
                    for ( const element of buyList ) {
                        if( element.units > sumOfSellUnits ) {
                            unitsLeft = element.units - sumOfSellUnits;
                            totalPrice += unitsLeft * element.price;
                            console.log(unitsLeft,totalPrice);

                            sumOfSellUnits -= sumOfSellUnits;
                        } else {
                            sumOfSellUnits -= element.units;
                        }
                    }
                    const newPriceSell = totalPrice/newUnitsSell;

                    if ( newUnitsSell < 0 ) {
                        res.redirect("/stockCafe/new?success=false&action=invalid");
                        next();
                    } else if ( newUnitsSell === 0 ) {
                        try {
                            await stockModel.deleteOne({ symbol: `${stockInput.symbol}` })
                        } catch(e) {
                            res.send(e.message);
                        }
                    } else {
                        try {
                            await stockModel.updateOne({ symbol : `${stockInput.symbol}`}, { $set: { units: newUnitsSell, price: newPriceSell }});
                        } catch (e) {
                            res.send(e.message);
                        }
                    }
                }
            }
            console.log("here");

            // const TransInput = {
            //     symbol: req.body.symbol,
            //     action: req.body.action,
            //     date: req.body.date,
            //     units: parseInt(req.body.units),
            //     price: parseInt(req.body.price),
            // }
            // const newTransaction = await transactionModel.create(TransInput);
            // res.redirect("/stockCafe")
        }
    } catch (e) {
        res.send(e.message);
    }
    */


});

//Show
app.get("/stockCafe/transactions", async (req,res) => {
    const transList = await transactionModel.find({}).sort('-date');
    res.render("transaction.ejs", {
        transList,
    } );
})

//edit
app.get("/stockCafe/:id/edit", async (req,res) => {
    const singleTrans = await transactionModel.find({ _id: `${req.params.id}` });
    console.log(singleTrans);
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