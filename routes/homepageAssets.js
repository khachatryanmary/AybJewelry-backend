import express from 'express';
import HomepageAssets from '../models/homepageAssetsModel.js';
import { cloudinaryVideo } from '../cloudinaryConfig.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Get homepage assets
router.get('/', async (req, res) => {
    try {
        console.log('Fetching homepage assets...');
        let assets = await HomepageAssets.findOne();
        if (!assets) {
            assets = await HomepageAssets.create({
                collectionName: 'Spring 2025',
                imageUrl: 'https://res.cloudinary.com/dnies3wxf/image/upload/v1757759096/modelImg_1_kmmtnc.jpg',
                videoUrls: [],
                title: 'Spring 2025',
                description: 'Explore our Spring 2025 collection.',
                updatedAt: new Date(),
            });
        }
        console.log('Homepage assets fetched:', assets);
        res.json(assets);
    } catch (error) {
        console.error('Error fetching homepage assets:', error);
        res.status(500).json({ error: 'Failed to fetch homepage assets' });
    }
});

// Update homepage assets
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('Updating homepage assets:', req.body);
        const assets = await HomepageAssets.findOneAndUpdate(
            {},
            { ...req.body, updatedAt: new Date() },
            { new: true, upsert: true }
        );
        console.log('Homepage assets updated:', assets);
        res.json(assets);
    } catch (error) {
        console.error('Error updating homepage assets:', error);
        res.status(500).json({ error: 'Failed to update homepage assets' });
    }
});

// List videos from Cloudinary
router.get('/videos', async (req, res) => {
    try {
        console.log('Fetching videos from Cloudinary...');
        const result = await cloudinaryVideo.api.resources({
            resource_type: 'video',
            prefix: 'videos',
            max_results: 100,
        });
        const videos = result.resources.map((resource) => ({
            public_id: resource.public_id,
            url: resource.secure_url,
        }));
        console.log('Videos fetched from Cloudinary:', videos.length);
        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos from Cloudinary:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

export default router;