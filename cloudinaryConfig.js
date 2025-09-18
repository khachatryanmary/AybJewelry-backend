// cloudinaryConfig.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ✅ Image account configuration
const cloudinaryImage = cloudinary;
cloudinaryImage.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_IMAGE,
    api_key: process.env.CLOUDINARY_API_KEY_IMAGE,
    api_secret: process.env.CLOUDINARY_API_SECRET_IMAGE,
    secure: true,
});

// ✅ Video account configuration
const cloudinaryVideo = cloudinary;
cloudinaryVideo.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_VIDEO,
    api_key: process.env.CLOUDINARY_API_KEY_VIDEO,
    api_secret: process.env.CLOUDINARY_API_SECRET_VIDEO,
    secure: true,
});

export { cloudinaryImage, cloudinaryVideo };
