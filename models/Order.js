const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    email: String,
    firstName: String,
    lastName: String,
    phone: String,
    region: String,
    address: String,
    apartment: String,
    deliveryMethod: String,
    cartItems: Array,
    total: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
