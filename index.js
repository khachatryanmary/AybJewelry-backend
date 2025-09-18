import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import path from 'path';
import os from 'os';

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

console.log('Environment Variables:', {
    CLOUDINARY_CLOUD_NAME_IMAGE: process.env.CLOUDINARY_CLOUD_NAME_IMAGE,
    CLOUDINARY_API_KEY_IMAGE: process.env.CLOUDINARY_API_KEY_IMAGE ? 'Set' : 'Missing',
    CLOUDINARY_API_SECRET_IMAGE: process.env.CLOUDINARY_API_SECRET_IMAGE ? 'Set' : 'Missing',
    CLOUDINARY_CLOUD_NAME_VIDEO: process.env.CLOUDINARY_CLOUD_NAME_VIDEO,
    CLOUDINARY_API_KEY_VIDEO: process.env.CLOUDINARY_API_KEY_VIDEO ? 'Set' : 'Missing',
    CLOUDINARY_API_SECRET_VIDEO: process.env.CLOUDINARY_API_SECRET_VIDEO ? 'Set' : 'Missing',
});

const app = express();

console.log('🔍 Initializing Express app');

// Log all requests
try {
    console.log('🔍 Mounting request logging middleware');
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${JSON.stringify(req.body)}`);
        next();
    });
    // console.log('✅ Request logging middleware mounted');
} catch (err) {
    console.error('❌ Failed to mount request logging middleware:', err.message);
}

// Handle ngrok warning
try {
    // console.log('🔍 Mounting ngrok header middleware');
    app.use((req, res, next) => {
        res.header('ngrok-skip-browser-warning', 'true');
        next();
    });
    // console.log('✅ Ngrok header middleware mounted');
} catch (err) {
    console.error('❌ Failed to mount ngrok header middleware:', err.message);
}

// CORS configuration
try {
    // console.log('🔍 Mounting CORS middleware');
    app.use(cors({
        origin: (origin, callback) => {
            console.log(`🔍 CORS origin received: ${origin || 'No origin'}`);
            const allowedOrigins = [
                'http://localhost:5173',
                'https://61e09d2abdac.ngrok-free.app',
                'https://aybjewelry.com',
                'https://www.aybjewelry.com',
                'http://192.168.10.87:5173',
                'https://ayb-jewelry-4yh4.vercel.app'
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                console.log(`✅ CORS allowed for: ${origin || 'No origin'}`);
                return callback(null, true);
            }
            console.log(`❌ CORS blocked for: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
        credentials: true,
        optionsSuccessStatus: 204
    }));
    // console.log('✅ CORS middleware mounted');
} catch (err) {
    console.error('❌ Failed to mount CORS middleware:', err.message);
}

// Fallback OPTIONS handler
try {
    // console.log('🔍 Mounting fallback OPTIONS handler');
    app.options('*', (req, res) => {
        console.log(`🔍 Handling OPTIONS for ${req.path}`);
        const allowedOrigins = [
            'http://localhost:5173',
            'https://61e09d2abdac.ngrok-free.app',
            'https://aybjewelry.com',
            'https://www.aybjewelry.com',
            'http://192.168.10.87:5173',
            'https://ayb-jewelry-fk7x.vercel.app'
        ];
        const origin = req.get('Origin');
        res.status(204).set({
            'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : false,
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control,X-Requested-With',
            'Access-Control-Allow-Credentials': 'true'
        }).end();
    });
    // console.log('✅ Fallback OPTIONS handler mounted');
} catch (err) {
    console.error('❌ Failed to mount fallback OPTIONS handler:', err.message);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// Mount routes with isolation
const mountRoute = (prefix, router, name) => {
    try {
        // console.log(`🔍 Attempting to mount ${name} at ${prefix}`);
        app.use(prefix, router.default || router);
        // console.log(`✅ Successfully mounted ${name}`);
    } catch (err) {
        // console.error(`❌ FAILED to mount ${name} at ${prefix}:`, err.message);
        console.error(`💡 ${name} may have invalid path syntax (e.g., unnamed * or ?). Check for /*, /:?, or regex chars like ().`);
    }
};

// Mount routes
mountRoute('/api/contact', contactRoutes, 'contactRoutes');
mountRoute('/api/wishlist', wishlistRoutes, 'wishlistRoutes');
mountRoute('/api/cart', cartRoutes, 'cartRoutes');
// console.log('productRoutes check:', productRoutes);
mountRoute('/api/products', productRoutes, 'productRoutes');
mountRoute('/api/upload', uploadRoutes, 'uploadRoutes');
mountRoute('/api/payment', paymentRoutes, 'paymentRoutes');
mountRoute('/api/auth', authRouter, 'authRouter');
mountRoute('/api/homepage-assets', homepageAssetsRoutes, 'homepageAssetsRoutes');
mountRoute('/api/orders', orderRoutes, 'orderRoutes');
mountRoute('/api/admin/auth', adminAuthRoutes, 'adminAuthRoutes');
mountRoute('/api/admin', adminRoutes, 'adminRoutes');
mountRoute('/api/categories', categoryRoutes, 'categoryRoutes');

// console.log('🎉 Route mounting complete (some may be skipped if broken)');

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);
    res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        const PORT = process.env.PORT || 5000;
        const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
        app.listen(PORT, HOST, () => {
            console.log(`➡️ Server running on http://localhost:${PORT}`);
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