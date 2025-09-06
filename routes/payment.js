import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";

dotenv.config();
const router = express.Router();

// Create Payment Request
router.post("/create-payment-request", async (req, res) => {
    try {
        const { amount, orderId, lng } = req.body; // amount in AMD (whole drams, e.g., 25000)
        const paymentData = {
            apiKey: process.env.INECO_API_KEY,
            apiSecret: process.env.INECO_API_SECRET,
            amount, // e.g., 25000 for 24,000 AMD products + 1,000 AMD delivery
            currency: "AMD",
            orderId,
            callbackUrl: process.env.INECO_CALLBACK_URL,
            returnUrl: `${process.env.FRONTEND_URL}/${lng}/checkout/success?orderId=${orderId}`,
            description: "Ayb Jewelry Purchase",
            language: lng === "am" ? "hy" : lng,
        };

        const response = await axios.post(
            process.env.NODE_ENV === "production" ? process.env.INECO_PAYMENT_URL : process.env.INECO_TEST_PAYMENT_URL,
            paymentData
        );
        res.json({ paymentUrl: response.data.paymentUrl });
    } catch (error) {
        console.error("InecoBank payment error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create payment request" });
    }
});

// Callback Route
router.post("/callback", async (req, res) => {
    const { orderId, status, transactionId } = req.body;
    try {
        if (status === "SUCCESS") {
            const dbPath = "./db.json";
            const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
            const order = db.orders.find((o) => o.orderId === orderId);
            if (order) {
                order.status = "paid";
                order.transactionId = transactionId;
                await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
            }
        } else {
            console.error("Payment failed for order:", orderId);
        }
        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Callback error:", error.message);
        res.status(500).json({ error: "Callback processing failed" });
    }
});

export default router;