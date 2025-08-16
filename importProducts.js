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

        // Combine all product categories into one array
        const products = [
            ...(data.necklaces || []),
            ...(data.rings || []),
            ...(data.earrings || []),
            ...(data.bracelets || []),
            ...(data.brooches || [])
        ];

        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('❌ No products found in db.json');
        }

        // Clear old data (optional)
        await Product.deleteMany();

        // Insert new products
        await Product.insertMany(products);

        console.log(`✅ Imported ${products.length} products successfully`);
        process.exit();
    } catch (err) {
        console.error('❌ Error importing products:', err);
        process.exit(1);
    }
};

importData();
