import mongoose from 'mongoose';

const homepageAssetsSchema = new mongoose.Schema({
    collectionName: { type: String, required: true, default: 'Spring 2025' },
    imageUrl: { type: String, required: true },
    videoUrls: [{ type: String }], // Array for multiple videos
    title: { type: String, required: true },
    description: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
}, { collection: 'homepageAssets' });

export default mongoose.model('HomepageAssets', homepageAssetsSchema);