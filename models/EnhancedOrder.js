// models/EnhancedOrder.js
import mongoose from 'mongoose';

const EnhancedOrderSchema = new mongoose.Schema({
    // Customer Information
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },

    // Address Information
    region: String,
    address: String,
    apartment: String,
    postalCode: String,

    // Order Details
    deliveryMethod: {
        type: String,
        enum: ['delivery', 'pickup'],
        default: 'delivery'
    },
    cartItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        image: String,
        category: String
    }],

    // Financial Information
    total: { type: Number, required: true },
    subtotal: Number,
    shippingCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    // Order Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },

    // Order Management
    orderNumber: String,
    trackingNumber: String,
    adminNotes: String,
    customerNotes: String,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    // User Reference
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Generate order number before saving
EnhancedOrderSchema.pre('save', function(next) {
    if (!this.orderNumber) {
        this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
    next();
});

// Index for better query performance
EnhancedOrderSchema.index({ email: 1, createdAt: -1 });
EnhancedOrderSchema.index({ status: 1, createdAt: -1 });
EnhancedOrderSchema.index({ orderNumber: 1 });

export default mongoose.model('EnhancedOrder', EnhancedOrderSchema);