const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stockSchema = new Schema (
    {
        symbol: {
            type: String,
            required: true,
        },
        units: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        }
    }
)

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;