import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Debug: Log request body and Admin model
        console.log('Login request body:', req.body);
        console.log('Admin model:', Admin);

        // Find admin
        const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
        console.log('Found admin:', admin); // Debug
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password match:', isMatch); // Debug
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;