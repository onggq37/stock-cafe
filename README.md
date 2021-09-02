# stock-cafe
web app to track your stock portfolio

thing i want to add
- make row in table clickable instead of just the symbol
- cant sell if you dont have shares
- add fee

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
