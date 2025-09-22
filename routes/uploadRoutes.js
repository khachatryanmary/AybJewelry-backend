import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import authMiddleware from '../middleware/auth.js';
import { cloudinaryImage } from '../cloudinaryConfig.js';

const router = express.Router();

// Ensure uploads directory exists for local fallback
const uploadsDir = 'Uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });}

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        // Log the cloud name being used
        console.log('Cloudinary cloud name:', cloudinaryImage.config().cloud_name);

        const uploadStream = cloudinaryImage.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: options.folder || 'homepage',
                transformation: [
                    { width: 1920, height: 1080, crop: 'limit' },
                    { quality: 'auto:good' },
                    { format: 'auto' }
                ],
                ...options
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('Cloudinary upload success:', result.public_id);
                    resolve(result);
                }
            }
        );

        uploadStream.end(buffer);
    });
};

// Cloudinary upload endpoint (supports single 'image' and multiple 'images')
router.post('/cloudinary', authMiddleware, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), async (req, res) => {
    try {
        console.log('=== CLOUDINARY UPLOAD START ===');
        console.log('Auth user:', req.user ? `${req.user.id} (${req.user.role})` : 'No user');
        console.log('Files received:', req.files);
        console.log('Body:', req.body);

        const { accountType = 'image', folder = 'homepage', public_id, productId = Date.now() } = req.body;

        // Select Cloudinary instance based on accountType
        const cloudinaryInstance = accountType === 'video' ? cloudinaryVideo : cloudinaryImage;

        // Check configuration
        if (!cloudinaryInstance.config().cloud_name || !cloudinaryInstance.config().api_key || !cloudinaryInstance.config().api_secret) {
            console.error('Cloudinary configuration incomplete for', accountType);
            return res.status(500).json({ error: `Cloudinary configuration missing for ${accountType} account` });
        }

        if (!req.files || (!req.files.image && !req.files.images)) {
            console.log('No files provided');
            return res.status(400).json({ error: 'No image files provided' });
        }

        console.log('Uploading to Cloudinary folder:', folder);

        const uploadedImages = [];

        // Handle single image upload
        if (req.files.image) {
            const file = req.files.image[0];
            console.log('Original file size (single):', (file.size / 1024 / 1024).toFixed(2), 'MB');

            const result = await uploadToCloudinary(file.buffer, {
                folder,
                public_id: public_id || `${folder}/hero-${productId}`,
                cloudinaryInstance // Pass the selected instance
            });

            uploadedImages.push({
                public_id: result.public_id,
                secure_url: result.secure_url,
                url: result.url,
                bytes: result.bytes,
                format: result.format,
                width: result.width,
                height: result.height,
                folder: result.folder
            });
        }

        // Handle multiple image uploads
        if (req.files.images) {
            for (let i = 0; i < req.files.images.length; i++) {
                const file = req.files.images[i];
                console.log('Original file size (multi):', (file.size / 1024 / 1024).toFixed(2), 'MB');

                const result = await uploadToCloudinary(file.buffer, {
                    folder,
                    public_id: `${folder}/${folder.split('s')[0]}-slider-${productId}-${i}`,
                    cloudinaryInstance
                });

                uploadedImages.push({
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                    url: result.url,
                    bytes: result.bytes,
                    format: result.format,
                    width: result.width,
                    height: result.height,
                    folder: result.folder
                });
            }
        }

        console.log('=== CLOUDINARY UPLOAD END ===');

        if (uploadedImages.length === 1) {
            res.status(200).json(uploadedImages[0]);
        } else {
            res.status(200).json({
                success: true,
                images: uploadedImages,
                totalUploaded: uploadedImages.length
            });
        }

    } catch (error) {
        console.error('=== CLOUDINARY UPLOAD ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to upload image(s) to Cloudinary',
            details: error.stack
        });
    }
});

// Delete Cloudinary image endpoint
router.delete('/cloudinary', authMiddleware, async (req, res) => {
    try {
        console.log('=== DELETE CLOUDINARY IMAGE START ===');
        const { public_id } = req.body;

        if (!public_id) {
            return res.status(400).json({ error: 'Public ID is required' });
        }

        console.log('Attempting to delete from Cloudinary:', public_id);

        const result = await cloudinaryImage.uploader.destroy(public_id);
        console.log('Cloudinary delete result:', result);

        if (result.result === 'ok') {
            res.status(200).json({ message: 'Image deleted successfully from Cloudinary' });
        } else {
            res.status(404).json({ error: 'Image not found in Cloudinary' });
        }

    } catch (error) {
        console.error('=== DELETE CLOUDINARY IMAGE ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to delete image from Cloudinary'
        });
    }
});

// Local storage routes (kept for compatibility)
const createCategoryFolder = (category, productId) => {
    const categoryFolder = category ? `${category}` : 'general';
    const productFolder = path.join(UploadsDir, categoryFolder, productId.toString());

    if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
    }

    return productFolder;
};

const processAndSaveImage = async (buffer, filename, outputPath, options = {}) => {
    const {
        width = 1920,
        height = 1080,
        quality = 80
    } = options;

    try {
        await sharp(buffer)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality, progressive: true })
            .toFile(path.join(outputPath, filename));

        return filename;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image');
    }
};

router.post('/single', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        console.log('=== LOCAL SINGLE IMAGE UPLOAD START ===');
        console.log('Auth user:', req.user ? `${req.user.id} (${req.user.role})` : 'No user');
        console.log('File received:', req.file ? 'Yes' : 'No');
        console.log('Body:', req.body);

        if (!req.file) {
            console.log('No file provided');
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { category = 'general', productId = Date.now() } = req.body;
        console.log('Category:', category, 'ProductId:', productId);

        const folderPath = createCategoryFolder(category, productId);
        console.log('Folder path:', folderPath);

        const timestamp = Date.now();
        const filename = `${category}-${timestamp}.jpg`;

        console.log('Processing image:', filename);

        await processAndSaveImage(req.file.buffer, filename, folderPath, {
            quality: 85,
            width: 2048,
            height: 2048
        });

        const filePath = path.join(folderPath, filename);
        const processedSize = fs.statSync(filePath).size;

        const relativePath = `/${path.relative('', filePath).replace(/\\/g, '/')}`;

        console.log('Success! Image saved to:', relativePath);
        console.log('=== LOCAL SINGLE IMAGE UPLOAD END ===');

        res.status(200).json({
            imagePath: relativePath,
            filename,
            originalSize: req.file.size,
            processedSize: processedSize,
            compressionRatio: ((req.file.size - processedSize) / req.file.size * 100).toFixed(1) + '%'
        });

    } catch (error) {
        console.error('=== LOCAL SINGLE IMAGE UPLOAD ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to upload image',
            details: error.stack
        });
    }
});

router.post('/multiple', authMiddleware, upload.array('images', 10), async (req, res) => {
    try {
        console.log('=== MULTIPLE IMAGE UPLOAD START ===');
        console.log('Auth user:', req.user ? `${req.user.id} (${req.user.role})` : 'No user');
        console.log('Files received:', req.files ? req.files.length : 0);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }

        const { category = 'general', productId = Date.now() } = req.body;
        const folderPath = createCategoryFolder(category, productId);
        const uploadedImages = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const timestamp = Date.now();
            const filename = `${category}-slider-${timestamp}-${i}.jpg`;

            try {
                await processAndSaveImage(file.buffer, filename, folderPath, {
                    quality: 80,
                    width: 1920,
                    height: 1080
                });

                const filePath = path.join(folderPath, filename);
                const processedSize = fs.statSync(filePath).size;
                const relativePath = `/${path.relative('', filePath).replace(/\\/g, '/')}`;

                uploadedImages.push({
                    path: relativePath,
                    filename,
                    originalSize: file.size,
                    processedSize: processedSize
                });

            } catch (imageError) {
                console.error(`Failed to process image ${file.originalname}:`, imageError);
            }
        }

        console.log('=== MULTIPLE IMAGE UPLOAD END ===');
        res.status(200).json({
            images: uploadedImages,
            totalUploaded: uploadedImages.length,
            totalRequested: req.files.length
        });

    } catch (error) {
        console.error('=== MULTIPLE IMAGE UPLOAD ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to upload images'
        });
    }
});

router.delete('/delete', authMiddleware, async (req, res) => {
    try {
        console.log('=== DELETE LOCAL IMAGE START ===');
        const { imagePath } = req.body;

        if (!imagePath) {
            return res.status(400).json({ error: 'Image path is required' });
        }

        const fullPath = path.join(process.cwd(), imagePath);
        console.log('Attempting to delete:', fullPath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Image deleted successfully');
            res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            console.log('Image not found');
            res.status(404).json({ error: 'Image not found' });
        }

    } catch (error) {
        console.error('=== DELETE LOCAL IMAGE ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to delete image'
        });
    }
});

router.post('/', upload.single('image'), (req, res) => {
    try {
        console.log('Using legacy upload route');
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${req.file.originalname}`;
        const legacyPath = path.join('Uploads', filename);

        if (!fs.existsSync('Uploads')) {
            fs.mkdirSync('Uploads', { recursive: true });
        }

        fs.writeFileSync(legacyPath, req.file.buffer);
        res.status(200).json({ imagePath: `/Uploads/${filename}` });
    } catch (error) {
        console.error('Legacy upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

router.use((error, req, res, next) => {
    console.error('Upload router error:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File size too large. Maximum size is 100MB per file.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files. Maximum is 10 files per upload.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: `Unexpected field: ${error.field}. Expected 'image' or 'images'.`
            });
        }
    }

    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
            error: 'Invalid file type. Only image files are allowed.'
        });
    }

    res.status(500).json({
        error: 'Upload failed',
        details: error.message
    });
});

export default router;