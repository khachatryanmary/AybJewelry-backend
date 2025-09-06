import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// Routes
import productRoutes from './routes/products.js';
import uploadRoutes from './routes/uploadRoutes.js';
import wishlistRoutes from './routes/wishlist.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import authRouter from './routes/auth.js';
import homepageAssetsRoutes from './routes/homepageAssets.js';
import contactRoutes from './routes/contact.js';
import adminAuthRoutes from './routes/adminAuth.js';

dotenv.config();
const app = express();

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${JSON.stringify(req.body)}`);
    next();
});

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/Uploads', express.static(path.join(process.cwd(), 'Uploads')));


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRouter);
app.use('/api/homepage-assets', homepageAssetsRoutes);
app.use('/api/admin/auth', adminAuthRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        // Start server only after MongoDB connection
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // Exit if MongoDB fails to connect
    });


//