// ... (your existing imports and middleware)
const express = require('express'); // Note: You're using ESM (`import`), so keep consistent
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const os = require('os');

dotenv.config();

const app = express();

// Middleware (your existing CORS, logging, etc., are fine)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:4173',
            'https://61e09d2abdac.ngrok-free.app',
            'https://aybjewelry.com',
            'https://www.aybjewelry.com',
            'https://ayb-jewelry-4yh4.vercel.app',
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.log(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
}));
app.use('/uploads', express.static(path.join(process.cwd(), 'Uploads')));
app.use((req, res, next) => {
    res.header('ngrok-skip-browser-warning', 'true');
    next();
});

// Routes (all good)
app.use('/api/contact', require('./routes/contact'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/products', require('./routes/products'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/homepage-assets', require('./routes/homepageAssets'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/categories', require('./routes/categories'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
    res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});

// MongoDB & Server
const PORT = process.env.PORT || 3000; // Change default to 3000
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`➡️ Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

module.exports = app;