import express from 'express';
import EnhancedOrder from '../models/EnhancedOrder.js';

const router = express.Router();

// Create Order
router.post('/', async (req, res) => {
    try {
        const {
            customer: { email, firstName, lastName, phone, region, address, apartment, postalCode, deliveryType },
            cart,
            total,
            paymentIntentId,
        } = req.body;

        // Validate required fields
        if (!email || !firstName || !lastName || !phone || !cart || !total || !paymentIntentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: 'Cart cannot be empty' });
        }
        if (deliveryType === 'delivery' && (!region || !address || !postalCode)) {
            return res.status(400).json({ error: 'Delivery requires region, address, and postal code' });
        }

        const newOrder = new EnhancedOrder({
            email,
            firstName,
            lastName,
            phone,
            region: deliveryType === 'delivery' ? region : undefined,
            address: deliveryType === 'delivery' ? address : undefined,
            apartment: deliveryType === 'delivery' ? apartment : undefined,
            postalCode: deliveryType === 'delivery' ? postalCode : undefined,
            deliveryMethod: deliveryType,
            cartItems: cart,
            total,
            paymentIntentId,
            status: 'pending',
            paymentStatus: 'pending',
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order saved successfully!', orderId: newOrder._id, orderNumber: newOrder.orderNumber });
    } catch (err) {
        console.error('Order creation error:', err.message);
        res.status(500).json({ error: `Failed to save order: ${err.message}` });
    }
});

export default router;
