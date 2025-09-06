import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
    const { name, surname, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            surname: surname || "", // Handle optional surname
            email,
            password: hashedPassword,
        });
        await newUser.save();
        const userToReturn = {
            id: newUser._id,
            name: newUser.name,
            surname: newUser.surname,
            email: newUser.email,
        };
        res.status(201).json(userToReturn);
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        const userToReturn = {
            id: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            token: token,
        };
        res.status(200).json(userToReturn);
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// @route   PATCH /api/auth/update-profile
router.patch("/update-profile", async (req, res) => {
    const { name, surname } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    console.log("Update profile request:", { name, surname, token });

    if (!token) {
        console.error("No token provided");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    if (!name || name.trim().length < 1) {
        console.error("Invalid name:", name);
        return res.status(400).json({ message: "Name must be at least 1 character long" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded JWT:", decoded);

        const userId = decoded.id;
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found for ID:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name: name.trim(), surname: surname ? surname.trim() : "" },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error("Failed to update user:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Profile updated successfully:", updatedUser.name, updatedUser.surname);
        res.json({ name: updatedUser.name, surname: updatedUser.surname });
    } catch (err) {
        console.error("Error updating profile:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
        });

        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        res.status(500).json({ message: "Session expired. Please log in again.", error: err.message });
    }
});

// @route   POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    const { email, lng } = req.body;

    try {
        if (!lng) {
            return res.status(400).json({ message: "Language parameter (lng) is required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetLink = `${frontendUrl}/${lng}/reset-password/${resetToken}`;
        console.log("Generated resetLink:", resetLink);

        await transporter.sendMail({
            from: `"Ayb Jewelry" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.`,
            html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p><p>If you did not request this, please ignore this email.</p>`,
        }).catch(err => {
            console.error("Email sending error:", {
                message: err.message,
                code: err.code,
                response: err$response,
            });
            throw new Error(`Failed to send email: ${err.message}`);
        });

        res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (err) {
        console.error("Forgot password error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// @route   POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
        console.error("Reset password error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;