import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME_VIDEO,
    api_key: process.env.CLOUDINARY_API_KEY_VIDEO,
    api_secret: process.env.CLOUDINARY_API_SECRET_VIDEO,
});

async function listVideos() {
    try {
        const result = await cloudinary.api.resources({
            resource_type: 'video',
            max_results: 100,
        });
        const videos = result.resources.map((resource) => ({
            public_id: resource.public_id,
            url: resource.secure_url,
        }));
        console.log('Videos found:', JSON.stringify(videos, null, 2));
    } catch (error) {
        console.error('Error listing videos:', error.message);
    }
}

listVideos();