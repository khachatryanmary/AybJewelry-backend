// seedAdminUser.js - Create admin user in User collection
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';

dotenv.config();

const seedAdminUser = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'marykhachatryan@gmail.com';
        const adminName = 'Mary';
        const adminPassword = '123';

        // Check if admin user already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            console.log('Admin user already exists, updating role and password...');

            // Hash the password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Update existing user to admin
            existingUser.role = 'admin';
            existingUser.password = hashedPassword;
            existingUser.banned = false; // Ensure admin is not banned
            await existingUser.save();

            console.log('✅ Existing user updated to admin successfully');
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const adminUser = new User({
                email: adminEmail,
                name: adminName,
                password: hashedPassword,
                role: 'admin',
                banned: false
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully');
        }

        console.log('📧 Email:', adminEmail);
        console.log('👤 Name:', adminName);
        console.log('🔑 Password:', adminPassword);
        console.log('👑 Role: admin');
        console.log('⚠️ Use these credentials to log in to the admin panel');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        console.error('Full error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
        process.exit(0);
    }
};

seedAdminUser();