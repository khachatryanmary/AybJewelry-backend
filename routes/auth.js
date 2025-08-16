import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user exists by email
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Return user (without password)
        const userToReturn = {
            id: newUser._id,
            username: newUser.username,
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
    const { usernameOrEmail, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
        });

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
            username: user.username,
            email: user.email,
            token: token,
        };

        res.status(200).json(userToReturn);
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// @route   PATCH /api/auth/update-username
router.patch("/update-username", async (req, res) => {
    const { username } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    console.log("Update username request:", { username, token });

    if (!token) {
        console.error("No token provided");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    if (!username || username.trim().length < 3) {
        console.error("Invalid username:", username);
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
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
            { username: username.trim() },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error("Failed to update user:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Username updated successfully:", updatedUser.username);
        res.json({ username: updatedUser.username });
    } catch (err) {
        console.error("Error updating username:", {
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
        if (err.name === "MongoServerError" && err.code === 11000) {
            return res.status(400).json({ message: "Duplicate username error (index not dropped)" });
        }
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

export default router;