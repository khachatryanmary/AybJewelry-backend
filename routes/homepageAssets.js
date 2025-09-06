import express from 'express';
import HomepageAssets from '../models/HomepageAssetsModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get homepage assets (PUBLIC - no auth required)
router.get('/', async (req, res) => {
    try {
        console.log('📖 Fetching homepage assets (public)');
        let assets = await HomepageAssets.findOne();

        if (!assets) {
            // Create default assets if none exist
            console.log('🔄 No assets found, creating default');
            assets = new HomepageAssets({
                collectionName: 'Spring 2025',
                imageUrl: '',
                videoUrls: [],
                title: 'Spring 2025',
                description: 'Explore our Spring 2025 collection.',
            });
            await assets.save();
        }

        console.log('✅ Homepage assets fetched:', assets.collectionName);
        res.json(assets);
    } catch (error) {
        console.error('❌ Error fetching homepage assets:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update homepage assets (ADMIN ONLY - auth required)
router.put('/', authMiddleware, async (req, res) => {
    try {
        console.log('🔄 Updating homepage assets');
        console.log('Data received:', req.body);

        const { collectionName, imageUrl, videoUrls, title, description } = req.body;

        // Validate required fields
        if (!collectionName || !title || !description) {
            return res.status(400).json({
                message: 'Collection name, title, and description are required'
            });
        }

        // Find existing assets or create new one
        let assets = await HomepageAssets.findOne();

        if (assets) {
            // Update existing
            assets.collectionName = collectionName;
            assets.imageUrl = imageUrl || assets.imageUrl;
            assets.videoUrls = videoUrls || assets.videoUrls;
            assets.title = title;
            assets.description = description;
            assets.updatedAt = new Date();
        } else {
            // Create new
            assets = new HomepageAssets({
                collectionName,
                imageUrl,
                videoUrls: videoUrls || [],
                title,
                description,
                updatedAt: new Date(),
            });
        }

        await assets.save();

        console.log('✅ Homepage assets updated successfully');
        console.log('Updated collection:', assets.collectionName);

        res.json(assets);
    } catch (error) {
        console.error('❌ Error updating homepage assets:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all collections (PUBLIC - no auth required for products page)
router.get('/collections', async (req, res) => {
    try {
        console.log('📋 Fetching collections list (public)');

        // Get featured collection from homepage assets
        const assets = await HomepageAssets.findOne();
        const featuredCollection = assets?.collectionName || 'Spring 2025';

        // For now, return the featured collection plus Classic
        // In the future, you could query products to get unique collections
        const collections = [featuredCollection, 'Classic'];

        // Remove duplicates
        const uniqueCollections = [...new Set(collections)];

        console.log('✅ Collections fetched:', uniqueCollections);
        res.json(uniqueCollections);
    } catch (error) {
        console.error('❌ Error fetching collections:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete old image when updating (ADMIN ONLY - auth required)
router.delete('/image', authMiddleware, async (req, res) => {
    try {
        const { imagePath } = req.body;

        if (!imagePath) {
            return res.status(400).json({ error: 'Image path is required' });
        }

        const fs = await import('fs');
        const path = await import('path');

        const fullPath = path.join(process.cwd(), imagePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('✅ Old homepage image deleted:', imagePath);
            res.json({ message: 'Image deleted successfully' });
        } else {
            console.log('⚠️ Homepage image not found:', imagePath);
            res.status(404).json({ error: 'Image not found' });
        }

    } catch (error) {
        console.error('❌ Error deleting homepage image:', error);
        res.status(500).json({
            error: error.message || 'Failed to delete image'
        });
    }
});

export default router;