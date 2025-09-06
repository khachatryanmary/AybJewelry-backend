import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: {
        type: String, // Optional custom string ID
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: String, // Keep as String to match your existing data
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    alt: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: true,
        enum: ['necklace', 'ring', 'earring', 'bracelet', 'hairclip'],
    },
    details: [{
        material: String,
        stone: String,
        finish: String,
        design: String,
        fit: String,
    }],
    images: [{
        type: String, // Array of image paths for slider
    }],
    productCollection: {
        type: String,
        default: 'Spring 2025',
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Add indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ productCollection: 1 });
productSchema.index({ category: 1, productCollection: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;