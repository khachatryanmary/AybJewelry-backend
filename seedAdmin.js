// seedAdmin.js - place this file in your backend folder
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js'; // Correct path assuming seedAdmin.js is in backend folder

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'marykhachatryan01@gmail.com';
        const adminPassword = 'm2004Khach';

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists, deleting first...');
            await Admin.deleteOne({ email: adminEmail });
        }

        // Create new admin (password will be hashed by the pre-save hook)
        const admin = new Admin({
            email: adminEmail,
            password: adminPassword, // This will be hashed by the pre-save hook in Admin.js
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('⚠️  Use these credentials to log in to the admin panel');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        console.error('Full error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
        process.exit(0);
    }
};

seedAdmin();