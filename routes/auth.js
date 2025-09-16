// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// User registration route
router.post('/register', async (req, res) => {
    try {
        const { name, surname, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            console.log('Missing required fields:', { name, email, password });
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name: name.trim(),
            surname: surname ? surname.trim() : '',
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: 'user',
        });

        // Save user to database
        await user.save();
        console.log('User registered successfully:', email);

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (excluding password)
        res.status(201).json({
            id: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role,
            token,
            message: 'Registration successful',
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// User login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        console.log('User login attempt for:', email);

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.banned) {
            console.log('User is banned:', user.email);
            return res.status(403).json({
                message: user.banReason
                    ? `Your account has been banned. Reason: ${user.banReason}`
                    : 'Your account has been banned. Please contact support.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role || 'user',
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('User login successful');

        res.json({
            id: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role || 'user',
            token,
            message: 'Login successful',
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Update profile route (NEW)
router.patch('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { name, surname } = req.body;
        const userId = req.user.id;

        console.log('Update profile request for user:', userId);
        console.log('Request body:', { name, surname });

        // Validate input
        if (!name || name.trim().length < 1) {
            return res.status(400).json({ message: 'Name must be at least 1 character long' });
        }

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        user.name = name.trim();
        user.surname = surname ? surname.trim() : '';

        // Save updated user
        await user.save();
        console.log('User profile updated successfully:', user.email);

        // Return updated user data (excluding password)
        res.json({
            id: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

export default router;