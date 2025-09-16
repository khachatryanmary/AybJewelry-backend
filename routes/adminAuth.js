// routes/adminAuth.js - Modified to use User model
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js'; // Changed from Admin to User

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        console.log('Admin login attempt for:', email);

        // Find user with admin role
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            role: 'admin' // Only allow users with admin role
        });

        console.log('Found admin user:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is banned
        if (user.banned) {
            return res.status(403).json({ message: 'Account is banned' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name || user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Extended for admin sessions
        );

        // Return response with admin details
        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: user._id,
                email: user.email,
                name: user.name || user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;