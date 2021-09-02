const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema (
    {
        symbol: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        date: { 
            type: Date,
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

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;