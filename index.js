import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Routes
import productRoutes from './routes/products.js';
import uploadRoutes from './routes/uploadRoutes.js';
import wishlistRoutes from './routes/wishlist.js';
import cartRoutes from "./routes/cart.js";
import paymentRoutes from "./routes/payment.js";
import authRouter from './routes/auth.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));

// Middleware
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), '/uploads')));

// Routes
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/auth', authRouter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
