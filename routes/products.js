import express from 'express';
import Product from '../models/productModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all products (public) - NEWEST FIRST
router.get('/', async (req, res) => {
    const { category, collection } = req.query;
    try {
        const query = {};
        if (category) query.category = category;
        if (collection) query.productCollection = collection;

        // Sort by createdAt in descending order (newest first)
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get product by _id (public)
router.get('/:id', async (req, res) => {
    try {
        console.log('Fetching product with _id:', req.params.id);
        const product = await Product.findById(req.params.id);
        if (!product) {
            console.log('Product not found for _id:', req.params.id);
            return res.status(404).json({ message: 'Product not found' });
        }
        console.log('Product found:', product.name);
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Create new product (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const newProduct = new Product({
            id: req.body.id,
            name: req.body.name,
            price: req.body.price,
            image: req.body.image,
            alt: req.body.alt,
            description: req.body.description,
            category: req.body.category,
            details: req.body.details || [],
            images: req.body.images || [],
            productCollection: req.body.productCollection || 'Spring 2025',
        });

        await newProduct.save();
        console.log('✅ New product created:', newProduct.name, 'at', new Date().toISOString());
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update product (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        console.log('✅ Product updated:', product.name);
        res.json(product);
    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete product (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        console.log('✅ Product deleted:', product.name);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;