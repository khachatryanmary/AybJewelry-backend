import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Product from './models/productModel.js';

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        const rawData = fs.readFileSync('./data/db.json', 'utf-8');
        const data = JSON.parse(rawData);

        const products = [
            ...(data.necklaces || []),
            ...(data.rings || []),
            ...(data.earrings || []),
            ...(data.bracelets || []),
            ...(data.hairclips || []),
        ].map(product => ({
            ...product,
            productCollection: product.productCollection || product.collection || 'Spring 2025', // Preserve db.json productCollection
        }));

        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('❌ No products found in db.json');
        }

        console.log('Products to import:', JSON.stringify(products, null, 2)); // Debug log
        await Product.deleteMany();
        await Product.insertMany(products);

        console.log(`✅ Imported ${products.length} products successfully`);
        process.exit();
    } catch (err) {
        console.error('❌ Error importing products:', err);
        process.exit(1);
    }
};

importData();