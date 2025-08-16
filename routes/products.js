import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/productModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const { category } = req.query;
    try {
        const query = category ? { category } : {};
        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get product by MongoDB _id
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new product
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
