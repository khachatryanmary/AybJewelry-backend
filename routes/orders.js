const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Create order
router.post("/", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: "Order saved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
