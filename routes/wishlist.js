import express from 'express';
import Wishlist from '../models/wishlistModel.js';

const router = express.Router();

// ✅ Get wishlist with flattened populated product data
router.get('/:userId', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.params.userId }).populate('items.productId');

        if (!wishlist) {
            return res.json({ items: [] });
        }

        // 🔧 Flatten and return just the populated product objects
        const products = wishlist.items
            .map(i => i.productId)
            .filter(p => p); // just in case some products were deleted

        res.json({ items: products });
    } catch (err) {
        console.error("Error fetching wishlist:", err.message);
        res.status(500).json({ message: "Failed to fetch wishlist", error: err.message });
    }
});

// ✅ Add product to wishlist
router.post('/:userId', async (req, res) => {
    const { productId } = req.body;
    try {
        let wishlist = await Wishlist.findOne({ userId: req.params.userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId: req.params.userId, items: [] });
        }

        const alreadyAdded = wishlist.items.find(i => i.productId.toString() === productId);

        if (!alreadyAdded) {
            wishlist.items.push({ productId });
            await wishlist.save();
        }

        res.json(wishlist);
    } catch (err) {
        console.error("Error adding to wishlist:", err.message);
        res.status(500).json({ message: "Failed to add to wishlist", error: err.message });
    }
});

// ✅ Remove product from wishlist
router.delete('/:userId/:productId', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.params.userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.items = wishlist.items.filter(
            i => i.productId.toString() !== req.params.productId
        );

        await wishlist.save();
        res.json(wishlist);
    } catch (err) {
        console.error("Error removing from wishlist:", err.message);
        res.status(500).json({ message: "Failed to remove from wishlist", error: err.message });
    }
});

// ✅ Clear all items from wishlist
router.delete('/:userId', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.params.userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.items = [];
        await wishlist.save();
        res.json({ message: 'Wishlist cleared successfully', items: [] });
    } catch (err) {
        console.error("Error clearing wishlist:", err.message);
        res.status(500).json({ message: "Failed to clear wishlist", error: err.message });
    }
});

export default router;