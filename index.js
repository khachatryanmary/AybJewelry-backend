import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import os from 'os';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

// Import routes
import productRoutes from './routes/products.js';
import uploadRoutes from './routes/uploadRoutes.js';
import wishlistRoutes from './routes/wishlist.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import authRouter from './routes/auth.js';
import homepageAssetsRoutes from './routes/homepageAssets.js';
import contactRoutes from './routes/contact.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminRoutes from './routes/adminRoutes.js';
import orderRoutes from './routes/orders.js';
import categoryRoutes from './routes/categories.js';

const app = express();
console.log('🔍 Initializing Express app');

// Security & Performance Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CORS configuration for production
const allowedOrigins = [
    'https://aybjewelry.com',
    'https://www.aybjewelry.com',
    'https://ayb-jewelry-4yh4.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204
}));

// JSON & URL-encoded body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'Uploads')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Route mounting helper
const mountRoute = (prefix, router, name) => {
    try {
        app.use(prefix, router.default || router);
        console.log(`✅ Mounted ${name} at ${prefix}`);
    } catch (err) {
        console.error(`❌ Failed to mount ${name} at ${prefix}:`, err.message);
    }
};

// Mount routes
mountRoute('/api/contact', contactRoutes, 'contactRoutes');
mountRoute('/api/wishlist', wishlistRoutes, 'wishlistRoutes');
mountRoute('/api/cart', cartRoutes, 'cartRoutes');
mountRoute('/api/products', productRoutes, 'productRoutes');
mountRoute('/api/upload', uploadRoutes, 'uploadRoutes');
mountRoute('/api/payment', paymentRoutes, 'paymentRoutes');
mountRoute('/api/auth', authRouter, 'authRouter');
mountRoute('/api/homepage-assets', homepageAssetsRoutes, 'homepageAssetsRoutes');
mountRoute('/api/orders', orderRoutes, 'orderRoutes');
mountRoute('/api/admin/auth', adminAuthRoutes, 'adminAuthRoutes');
mountRoute('/api/admin', adminRoutes, 'adminRoutes');
mountRoute('/api/categories', categoryRoutes, 'categoryRoutes');

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);
    res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// MongoDB connection & server start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        const PORT = process.env.PORT || 5000;
        const HOST = '0.0.0.0'; // Railway binds to 0.0.0.0
        app.listen(PORT, HOST, () => {
            console.log(`➡️ Server running on port ${PORT}`);
            if (process.env.NODE_ENV !== 'production') {
                const nets = os.networkInterfaces();
                for (const name of Object.keys(nets)) {
                    for (const net of nets[name]) {
                        if (net.family === 'IPv4' && !net.internal) {
                            console.log(`   Network: http://${net.address}:${PORT}`);
                        }
                    }
                }
            }
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

export default app;
