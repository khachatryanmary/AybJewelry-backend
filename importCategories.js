import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Category from './models/Category.js';

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        const rawData = fs.readFileSync('./data/db.json', 'utf-8');
        const data = JSON.parse(rawData);

        // Get categories from db.json
        const categories = data.categories || [];

        if (!Array.isArray(categories) || categories.length === 0) {
            throw new Error('❌ No categories found in db.json');
        }

        // Map categories to match schema requirements, including image from db.json
        const categoryDocs = categories.map((category, index) => ({
            name: category.name,
            slug: category.name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
            image: category.image, // Include Cloudinary image URL
            description: category.description || '', // Add description if needed later
            isActive: true,
            sortOrder: index // Set sort order based on array position
        }));

        console.log('Categories to import:', JSON.stringify(categoryDocs, null, 2)); // Debug log

        // Delete existing categories and import new ones
        await Category.deleteMany();
        await Category.insertMany(categoryDocs);

        console.log(`✅ Imported ${categoryDocs.length} categories successfully`);
        process.exit();
    } catch (err) {
        console.error('❌ Error importing categories:', err);
        process.exit(1);
    }
};

importData();