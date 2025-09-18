import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import os from 'os';

dotenv.config();

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

// -----------------------------
// Middleware
// -----------------------------

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Body: ${JSON.stringify(req.body)}`);
    next();
});

// Handle ngrok warning (if needed)
app.use((req, res, next) => {
    res.header('ngrok-skip-browser-warning', 'true');
    next();
});

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://61e09d2abdac.ngrok-free.app',
    'https://aybjewelry.com',
    'https://www.aybjewelry.com',
    'https://ayb-jewelry.vercel.app',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.log(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Cache-Control','X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'Uploads')));

// -----------------------------
// Health Check
// -----------------------------
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// -----------------------------
// Routes
// -----------------------------
app.use('/api/contact', contactRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRouter);
app.use('/api/homepage-assets', homepageAssetsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// -----------------------------
// Global Error Handler
// -----------------------------
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
    res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});

// -----------------------------
// Connect to MongoDB & Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');

        app.listen(PORT, '0.0.0.0', () => {
            const env = process.env.NODE_ENV || 'development';
            console.log(`➡️ Server running on port ${PORT} (${env})`);

            if (env === 'development') {
                const nets = os.networkInterfaces();
                for (const name of Object.keys(nets)) {
                    for (const net of nets[name]) {
                        if (net.family === 'IPv4' && !net.internal) {
                            console.log(`   Network URL: http://${net.address}:${PORT}`);
                        }
                    }
                }
            }
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

export default app;
