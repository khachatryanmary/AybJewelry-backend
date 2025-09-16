import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 1,
        },
        surname: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: true,
            match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
        },
        password: {
            type: String,
            required: true,
            minlength: [8, "Password must be at least 8 characters long"],
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
        role: {
            type: String,
            default: 'user',
            enum: ['user', 'admin'],
        },
        banned: {
            type: Boolean,
            default: false,
        },
        banReason: {
            type: String,
            default: null,
        },
        bannedAt: {
            type: Date,
            default: null,
        }
    },
    { timestamps: true }
);

// Case-insensitive unique index for email
userSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export default mongoose.model("User", userSchema);