import express from 'express';
import Product from '../models/productModel.js';
import authMiddleware from '../middleware/auth.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to sync all products to db.json
const syncToDbJson = async () => {
    try {
        // Get all products from database
        const products = await Product.find({}).sort({ createdAt: -1 }).lean();

        // Path to db.json (adjust this path based on your project structure)
        const dbPath = path.join(__dirname, '../../db.json');

        let dbData = {
            products: [],
            categories: [],
            collections: [],
            lastUpdated: new Date().toISOString()
        };

        // Try to read existing db.json to preserve other data
        try {
            const existingData = await fs.readFile(dbPath, 'utf8');
            dbData = { ...JSON.parse(existingData), products, lastUpdated: new Date().toISOString() };
        } catch (readError) {
            console.log('Creating new db.json file...');
        }

        // Update products in db.json
        dbData.products = products;

        // Extract unique categories and collections from products
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        const collections = [...new Set(products.map(p => p.productCollection).filter(Boolean))];

        dbData.categories = categories.map(cat => ({ name: cat, slug: cat.toLowerCase() }));
        dbData.collections = collections.map(col => ({ name: col, slug: col.toLowerCase().replace(/\s+/g, '-') }));

        // Write to db.json with pretty formatting
        await fs.writeFile(dbPath, JSON.stringify(dbData, null, 2));

        console.log(`📄 db.json synced successfully with ${products.length} products`);
        return true;
    } catch (error) {
        console.error('❌ Error syncing to db.json:', error);
        return false;
    }
};

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

        // Sync to db.json after creating product
        await syncToDbJson();

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

        // Sync to db.json after updating product
        await syncToDbJson();

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

        // Sync to db.json after deleting product
        await syncToDbJson();

        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
});

// Manual sync endpoint (admin only) - optional
router.post('/sync-db-json', authMiddleware, async (req, res) => {
    try {
        const success = await syncToDbJson();
        if (success) {
            res.json({
                success: true,
                message: 'db.json synced successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to sync db.json'
            });
        }
    } catch (error) {
        console.error('❌ Manual sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;