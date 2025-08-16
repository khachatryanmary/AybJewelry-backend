import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            addedAt: { type: Date, default: Date.now }
        }
    ]
});

export default mongoose.model('Wishlist', wishlistSchema);
