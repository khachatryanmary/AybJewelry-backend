import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            minlength: 3,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);