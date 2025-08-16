import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-payment-intent", async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (!amount || !currency) {
            return res.status(400).json({ error: "Amount and currency are required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true }
        });

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
