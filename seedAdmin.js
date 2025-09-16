// seedAdmin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'marykhachatryan01@gmail.com';
        const adminName = 'Mary';
        const adminPassword = 'Zp!9uT$k4w@B7fXq';

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists, deleting first...');
            await Admin.deleteOne({ email: adminEmail });
        }

        // Create new admin
        const admin = new Admin({
            email: adminEmail,
            name: adminName,
            password: adminPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('📧 Email:', adminEmail);
        console.log('👤 Name:', adminName);
        console.log('🔑 Password:', adminPassword);
        console.log('⚠️ Use these credentials to log in to the admin panel');

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