const express = require("express");
const axios = require('axios').default;
const transactionModel = require("../models/transaction");
const router = express.Router();
const { isLoggedIn } = require('../middleware.js');

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

//index
router.get("/", isLoggedIn, async (req,res) => {

    const allStocks = await transactionModel.find({ user: `${req.user.username}` }).distinct('symbol');
    const overallPortfolio = [];
    const overallBuy = await transactionModel.aggregate(
        [
            {
                $match: {
                    action: "buy",
                    user: `${req.user.username}`
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
                    action: "sell",
                    user: `${req.user.username}`
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
        const allTrans = await transactionModel.find({ user: `${req.user.username}`, symbol: overallPortfolio[i]._id, action: "buy" }).sort('-date');
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

    let overallPnl = overallSum - overallCost;
    let overallPnlPercent = (overallPnl/overallCost) * 100;
    let overallPnlColor = 0;

    if (overallPnl > 0){
        overallPnlColor = 1;
    } else if (overallPnl < 0) {
        overallPnlColor = -1;
    } else {
        overallPnlColor = 0;
    }

    overallPnl = numberWithCommas(overallPnl.toFixed(2));
    overallPnlPercent = numberWithCommas(overallPnlPercent.toFixed(2));
    overallSum = numberWithCommas(overallSum.toFixed(2));


    const summary = {
        overallSum,
        overallPnl,
        overallPnlPercent,
        overallPnlColor,
    };
    
    //format commas
    for(let j=0; j<overallPortfolio.length;j++) {
        if (overallPortfolio[j].pnl > 0){
            overallPortfolio[j]['pnlColor'] = 1;
        } else if (overallPortfolio[j].pnl < 0) {
            overallPortfolio[j]['pnlColor'] = -1;
        } else {
            overallPortfolio[j]['pnlColor'] = 0;
        }

        for (const element in overallPortfolio[j]) {
            if( typeof(overallPortfolio[j][`${element}`]) === "number" && element !== "pnlColor") {
                overallPortfolio[j][`${element}`] = numberWithCommas(overallPortfolio[j][`${element}`].toFixed(2));
            }
        }
    };


    res.render("stock/index.ejs", {
        overallPortfolio,
        summary,
    });
});

//new
router.get("/new", isLoggedIn, (req,res) => {
    res.render("stock/new.ejs", {
    });
});

//create
router.post("/", isLoggedIn, async (req, res, next) => {
    const symbol = req.body.symbol;
    try {
        const getSymbolInfo = await axios.get(`https://api.polygon.io/v3/reference/tickers?ticker=${symbol}&active=true&sort=ticker&order=asc&limit=10&apiKey=S47tdjxsU3ApK1ky1qC426NglkL3DS4K`)
        if ( getSymbolInfo.data.results === null) {
            req.flash("error","Symbol not found")
            res.redirect("/stockCafe/new");
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
                user: req.user.username,
            }
            const newTransaction = await transactionModel.create(input);
            req.flash("success", "Successfully added a transaction")
            res.redirect("/stockCafe/transactions");
        }
    } catch (e) {
        req.flash('error', "Missing field/s");
        res.redirect('/stockCafe/new');
    }

});

//Show
router.get("/transactions", isLoggedIn, async (req,res) => {
    const transList = await transactionModel.find({ user: `${req.user.username}` }).sort('-date');
    res.render("stock/transaction.ejs", {
        transList,
    } );
});

//edit
router.get("/:id/edit", isLoggedIn, async (req,res) => {
    const singleTrans = await transactionModel.find({ _id: `${req.params.id}` });
    const getDate = formatDate(singleTrans[0].date)
    res.render("stock/edit.ejs",{
        singleTrans: singleTrans[0],
        date: getDate,
    });
});

//update
router.put("/:id", isLoggedIn, async (req,res) => {
    try {
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
        );
        req.flash("success", "Transaction updated successfully");
        res.redirect("/stockCafe/transactions");
    } catch(e) {
        req.flash("error", "Missing field/s");
        res.redirect(`/stockCafe/${req.params.id}`);
    }
});

//destroy
router.delete("/:id", isLoggedIn, async (req,res) => {
    try {
        await transactionModel.deleteOne({ _id: req.params.id});
        req.flash("success","Transaction deleted successfully");
        res.redirect("/stockCafe/transactions");
    } catch(e) {
        req.flash('error', "Fail to delete. Please try again.");
        res.redirect(`/stockCafe/${req.params.id}`);
    }

});

module.exports = router;