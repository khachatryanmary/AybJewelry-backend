import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const router = express.Router();

console.log('Loading contact.js routes');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model('Contact', contactSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post('/', async (req, res) => {
    console.log('Received POST /api/contact:', req.body);
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Save to MongoDB
        const contact = new Contact({ name, email, message });
        await contact.save();

        // Send email
        await transporter.sendMail({
            from: '"AYB Jewelry" <marykhachatryan01@gmail.com>',
            to: 'marykhachatryan01@gmail.com',
            replyTo: email,
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
        });

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact API error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/test-contact', (req, res) => {
    console.log('Received POST /api/contact/test-contact');
    res.json({ message: 'Test contact route works' });
});

export default router;