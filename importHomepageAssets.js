import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HomepageAssets from './models/HomepageAssetsModel.js';

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        const assets = {
            collectionName: 'Spring 2025',
            imageUrl: '/Uploads/homePage/modelImg.jpg',
            videoUrls: [
                'https://res.cloudinary.com/dc6a3ofls/video/upload/v1755694298/new-collection_uvph1b.mp4',
                'https://res.cloudinary.com/dc6a3ofls/video/upload/v1755694483/C8699_nriprv.mp4',
            ],
            title: 'Spring 2025',
            description: 'Explore our Spring 2025 collection.',
            updatedAt: new Date(),
        };

        await HomepageAssets.deleteMany({});
        await HomepageAssets.create(assets);

        console.log('✅ Imported homepage assets successfully');
        process.exit();
    } catch (err) {
        console.error('❌ Error importing homepage assets:', err);
        process.exit(1);
    }
};

importData();