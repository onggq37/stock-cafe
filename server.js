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

function formatDate(date) {
    month = '' + (date.getMonth() + 1),
    day = '' + date.getDate(),
    year = date.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

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
    
    const allStocks = await transactionModel.find().distinct('symbol');
    const overall = [];
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
    
    const overallSell = await transactionModel.aggregate(
        [
            {
                $match: {
                    action: "sell"
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

    //find total units of each stock
    for( const elementBuy of overallBuy ) {
        const elementSell = overallSell.filter(obj => obj._id === elementBuy._id);
        let total = elementBuy.total - elementSell[0].total;
        overall.push({
            _id: elementBuy._id,
            total: total,
        })
    }

    //find average price of each stock
    for( const element of allStocks ) {
        const allTrans = await transactionModel.find({ symbol: element, action: "buy" }).sort('-date');
        //get the latest number * price, go to next one multiple by price
        console.log(allTrans);
    }


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
    const action = req.query.action;
    res.render("new.ejs", {
        success,
        action,
    });
})

//create
app.post("/stockCafe", async (req, res, next) => {
    const symbol = req.body.symbol;

    try{
        const getSymbolInfo = await axios.get(`https://api.polygon.io/v3/reference/tickers?ticker=${symbol}&active=true&sort=ticker&order=asc&limit=10&apiKey=S47tdjxsU3ApK1ky1qC426NglkL3DS4K`)
        if ( getSymbolInfo.data.results === null) {
            res.redirect("/stockCafe/new?success=false&action=symbol");
        } else {
            apiResults = getSymbolInfo.data.results;
            stockName = apiResults[0].name.split('.', 1)
            const input = {
                symbol: req.body.symbol,
                name: stockName[0],
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

//Show
app.get("/stockCafe/transactions", async (req,res) => {
    const success = req.query.success;
    const action = req.query.action;
    const transList = await transactionModel.find({}).sort('-date');
    res.render("transaction.ejs", {
        transList,
        success,
        action,
    } );
})

//edit
app.get("/stockCafe/:id/edit", async (req,res) => {
    const singleTrans = await transactionModel.find({ _id: `${req.params.id}` });
    const getDate = formatDate(singleTrans[0].date)
    res.render("edit.ejs",{
        singleTrans: singleTrans[0],
        date: getDate,
    });
})

//update
app.put("/stockCafe/:id", async (req,res) => {
    await transactionModel.updateOne(
        { _id: req.params.id },
        { $set: 
            {
                action: req.body.action,
                date: req.body.date,    
                units: req.body.units,
                price: req.body.price,
            }
        }
    )
    res.redirect("/stockCafe/transactions?success=true&action=update")
})

//destroy
app.delete("/stockCafe/:id", async (req,res) => {
    await transactionModel.deleteOne({ _id: req.params.id});
    res.redirect("/stockCafe/transactions?success=true&action=delete")
})

app.listen(port, () => {
    console.log("hello world");
})