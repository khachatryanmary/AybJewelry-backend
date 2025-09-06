import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

const router = express.Router();

// Helper function to format cart items
const formatCartItems = (items) => {
    const validItems = items.filter(item => item.productId != null);
    return validItems.map(item => ({
        id: item.productId._id.toString(),
        name: item.productId.name,
        price: item.productId.price,
        image: item.productId.image,
        category: item.productId.category,
        quantity: item.quantity,
        size: item.size,
        totalPrice: item.productId.price * item.quantity,
    }));
};

// GET user's cart
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log(`Invalid userId format: ${userId}`);
        return res.status(400).json({ message: 'Invalid userId format' });
    }

    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        console.log('Cart for userId', userId, ':', cart ? JSON.stringify(cart, null, 2) : 'No cart found');

        if (!cart) {
            console.log(`No cart found for userId: ${userId}`);
            return res.json([]);
        }

        const formatted = formatCartItems(cart.items);
        console.log(`Returning ${formatted.length} valid cart items for userId ${userId}`);
        res.json(formatted);
    } catch (err) {
        console.error('Error fetching cart for userId', userId, ':', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// ADD or update product in cart
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { productId, quantity = 1, size } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        console.log(`Invalid userId or productId: userId=${userId}, productId=${productId}`);
        return res.status(400).json({ message: 'Invalid userId or productId' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        console.log(`Invalid quantity: ${quantity}`);
        return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    if (size && typeof size !== 'string') {
        console.log(`Invalid size: ${size}`);
        return res.status(400).json({ message: 'Size must be a string' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product not found: productId=${productId}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        const isRing = product.category.toLowerCase() === 'ring';

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItem = cart.items.find(i => i.productId.toString() === productId && i.size === (isRing ? size : null));
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, size: isRing ? size : null });
        }

        await cart.save();
        await cart.populate('items.productId');
        const formatted = formatCartItems(cart.items);
        console.log(`Added/Updated item for userId ${userId}, productId ${productId}, size ${isRing ? size : 'none'}`);
        res.json(formatted);
    } catch (err) {
        console.error('Error adding to cart for userId', userId, ':', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// UPDATE quantity
router.patch('/:userId/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    const { quantity, size } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        console.log(`Invalid userId or productId: userId=${userId}, productId=${productId}`);
        return res.status(400).json({ message: 'Invalid userId or productId' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        console.log(`Invalid quantity: ${quantity}`);
        return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    if (size && typeof size !== 'string') {
        console.log(`Invalid size: ${size}`);
        return res.status(400).json({ message: 'Size must be a string' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product not found: productId=${productId}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        const isRing = product.category.toLowerCase() === 'ring';

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            console.log(`Cart not found for userId: ${userId}`);
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(i => i.productId.toString() === productId && i.size === (isRing ? size : null));
        if (!item) {
            console.log(`Item not found in cart for userId ${userId}, productId ${productId}, size ${isRing ? size : 'none'}`);
            return res.status(404).json({ message: 'Item not found' });
        }

        item.quantity = quantity;
        if (isRing && size) item.size = size;
        await cart.save();
        await cart.populate('items.productId');
        const formatted = formatCartItems(cart.items);
        console.log(`Updated quantity for userId ${userId}, productId ${productId}, size ${isRing ? size : 'none'} to ${quantity}`);
        res.json(formatted);
    } catch (err) {
        console.error('Error updating cart for userId', userId, ':', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// DELETE item from cart
router.delete('/:userId/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    const { size } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        console.log(`Invalid userId or productId: userId=${userId}, productId=${productId}`);
        return res.status(400).json({ message: 'Invalid userId or productId' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product not found: productId=${productId}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        const isRing = product.category.toLowerCase() === 'ring';

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            console.log(`Cart not found for userId: ${userId}`);
            return res.status(404).json({ message: 'Cart not found' });
        }

        console.log(`Before remove: userId=${userId}, productId=${productId}, size=${size || 'none'}, items=`, JSON.stringify(cart.items, null, 2));
        cart.items = cart.items.filter(
            (i) => !(i.productId.toString() === productId && (isRing ? i.size === size : i.size === null || size === 'null'))
        );
        console.log(`After remove: items=`, JSON.stringify(cart.items, null, 2));
        await cart.save();
        await cart.populate('items.productId');
        const formatted = formatCartItems(cart.items);
        console.log(`Removed item for userId ${userId}, productId ${productId}, size ${isRing ? size : 'none'}`);
        res.json(formatted);
    } catch (err) {
        console.error('Error removing item from cart for userId', userId, ':', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// CLEAR cart
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log(`Invalid userId format: ${userId}`);
        return res.status(400).json({ message: 'Invalid userId format' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            console.log(`Cart not found for userId: ${userId}`);
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();
        console.log(`Cleared cart for userId ${userId}`);
        res.json([]);
    } catch (err) {
        console.error('Error clearing cart for userId', userId, ':', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

export default router;