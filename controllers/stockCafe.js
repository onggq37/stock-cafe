const express = require("express");
const axios = require('axios').default;
const transactionModel = require("../models/transaction")
const router = express.Router();

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

function numberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

router.get('/seed', async (req, res) => {
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
router.get("/", async (req,res) => {
    
    const allStocks = await transactionModel.find().distinct('symbol');
    const overallPortfolio = [];
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
        let totalUnits = 0;

        if( elementSell.length <= 0 ){
            totalUnits = elementBuy.total;
        }
        else {
            totalUnits = elementBuy.total - elementSell[0].total;
        }

        overallPortfolio.push({
            _id: elementBuy._id,
            totalUnits: totalUnits,
        })
    }

    //find average price of each stock
    for( let i=0; i<overallPortfolio.length; i++ ) {
        const allTrans = await transactionModel.find({ symbol: overallPortfolio[i]._id, action: "buy" }).sort('-date');
        let calUnits = overallPortfolio[i].totalUnits;
        let totalPrice = 0;
        let avgPrice = 0;
        //take number of units left and calculate the total price from the latest transaction
        for ( const transaction of allTrans ) {
            if( transaction.units - calUnits < 0 ) {
                totalPrice += transaction.units * transaction.price;
                calUnits -= transaction.units;
            } else {
                totalPrice += calUnits * transaction.price;
                break;
            }
        }
        
        avgPrice = totalPrice/overallPortfolio[i].totalUnits;
        
        overallPortfolio[i]['name'] = allTrans[0].name;
        overallPortfolio[i]['avgPrice'] = avgPrice;
        const prevClose = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${overallPortfolio[i]._id}/prev?adjusted=true&apiKey=S47tdjxsU3ApK1ky1qC426NglkL3DS4K`);
        overallPortfolio[i]['close'] = prevClose.data.results[0].c;
        overallPortfolio[i]['value'] = overallPortfolio[i].totalUnits * prevClose.data.results[0].c;
        overallPortfolio[i]['pnl'] = (overallPortfolio[i].close - overallPortfolio[i].avgPrice) * overallPortfolio[i].totalUnits;
        overallPortfolio[i]['pnlPercent'] = overallPortfolio[i].pnl/(overallPortfolio[i].avgPrice * overallPortfolio[i].totalUnits) * 100;
    }

    let overallSum = 0;
    let overallCost = 0;
    for (const element of overallPortfolio) {
        overallSum += element.value;
        overallCost += (element.avgPrice * element.totalUnits);
    }

    const overallPnl = overallSum - overallCost;
    const overallPnlPercent = (overallPnl/overallCost) * 100;

    overallSum = numberWithCommas(overallSum.toFixed(2))
    const summary = {
        overallSum,
        overallPnl,
        overallPnlPercent,
    };

    const success = req.query.success;
    const action = req.query.action;
    res.render("stock/index.ejs", {
        overallPortfolio,
        summary,
        action,
        success,

    });
})

//new
router.get("/new", (req,res) => {
    const success = req.query.success;
    const action = req.query.action;
    res.render("stock/new.ejs", {
        success,
        action,
    });
})

//create
router.post("/", async (req, res, next) => {
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
                type: apiResults[0].type,
                action: req.body.action,
                date: req.body.date,
                units: req.body.units,
                price: req.body.price,
            }
            const newTransaction = await transactionModel.create(input);
            //req.flash("correct","correctly")
            res.redirect("/stockCafe");
        }
    } catch (e) {
        console.log("Error", e)
    }

});

//Show
router.get("/transactions", async (req,res) => {
    const success = req.query.success;
    const action = req.query.action;
    const transList = await transactionModel.find({}).sort('-date');
    res.render("stock/transaction.ejs", {
        transList,
        success,
        action,
    } );
})

//edit
router.get("/:id/edit", async (req,res) => {
    const singleTrans = await transactionModel.find({ _id: `${req.params.id}` });
    const getDate = formatDate(singleTrans[0].date)
    res.render("stock/edit.ejs",{
        singleTrans: singleTrans[0],
        date: getDate,
    });
})

//update
router.put("/:id", async (req,res) => {
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
router.delete("/:id", async (req,res) => {
    await transactionModel.deleteOne({ _id: req.params.id});
    res.redirect("/stockCafe/transactions?success=true&action=delete")
})

module.exports = router;