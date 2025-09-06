// testPassword.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const testPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        const admin = await Admin.findOne({ email: 'ad@gmail.com' });
        if (!admin) {
            console.log('Admin not found');
            process.exit(1);
        }

        const isMatch = await bcrypt.compare('ad123', admin.password);
        console.log('Password match:', isMatch);
        console.log('Stored hash:', admin.password);
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

testPassword();