// models/productModel.js
import mongoose from 'mongoose';

// Sub-schema for details (disable _id here)
const detailSchema = new mongoose.Schema({
    material: String,
    stone: String,
    finish: String,
    design: String,
    fit: String
}, { _id: false });

const productSchema = new mongoose.Schema({
    id: { type: String },
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
    alt: { type: String },
    description: { type: String },
    category: { type: String, required: true },
    productCollection: { type: String, default: 'Classic' },

    // Use detailSchema here
    details: [detailSchema],

    images: [String],

    // New fields for enhanced admin features
    status: {
        type: String,
        enum: ['available', 'sold-out', 'discontinued', 'pre-order'],
        default: 'available'
    },
    stock: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    tags: [String],
    seoTitle: String,
    seoDescription: String
}, {
    timestamps: true
});

export default mongoose.model('Product', productSchema);
