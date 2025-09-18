import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HomepageAssets from './models/homepageAssetsModel.js';

dotenv.config();

const importData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected');

        const assets = {
            collectionName: 'Spring 2025',
            imageUrl: 'https://res.cloudinary.com/dnies3wxf/image/upload/v1757759096/modelImg_1_kmmtnc.jpg',
            videoUrls: [
                'https://res.cloudinary.com/dc6a3ofls/video/upload/v1755694298/new-collection_uvph1b.mp4',
                'https://res.cloudinary.com/dc6a3ofls/video/upload/v1755694483/C8699_nriprv.mp4',
            ],
            title: 'Spring 2025',
            description: 'Explore our Spring 2025 collection.',
            updatedAt: new Date(),
        };

        // Clear existing assets and insert new ones
        await HomepageAssets.deleteMany({});
        await HomepageAssets.create(assets);

        console.log('✅ Imported homepage assets successfully');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit();
    } catch (error) {
        console.error('❌ Error importing homepage assets:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

importData();