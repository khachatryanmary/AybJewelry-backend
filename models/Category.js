// models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

export default mongoose.model('Category', categorySchema);

// models/Collection.js
const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Generate slug before saving
collectionSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

export const Collection = mongoose.model('Collection', collectionSchema);

// Enhanced Order.js (to replace your existing one)
const enhancedOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    // Customer info (keeping your existing fields)
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },

    // Address info (keeping your existing fields)
    region: String,
    address: String,
    apartment: String,
    postalCode: String,
    deliveryMethod: {
        type: String,
        enum: ['pickup', 'delivery'],
        required: true
    },

    // Cart and pricing (keeping your existing fields)
    cartItems: [{
        type: mongoose.Schema.Types.Mixed
    }],
    total: {
        type: Number,
        required: true
    },

    // Enhanced status tracking
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

    // Payment info (keeping your existing field)
    paymentIntentId: String,
    transactionId: String,

    // Additional tracking fields
    notes: String,
    adminNotes: String,
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date,

    // User reference (optional, for registered users)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate order number before saving
enhancedOrderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.orderNumber = `ORD-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

export const EnhancedOrder = mongoose.model('EnhancedOrder', enhancedOrderSchema);