import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Helper function to create organized folder structure
const createCategoryFolder = (category, productId) => {
    const categoryFolder = category ? `${category}` : 'general';
    const productFolder = path.join(uploadsDir, categoryFolder, productId.toString());

    if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
    }

    return productFolder;
};

// Helper function to compress and save image
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

// Test route to verify upload routes are working
router.get('/test', (req, res) => {
    console.log('Upload routes are working');
    res.json({ message: 'Upload routes are working', timestamp: new Date().toISOString() });
});

// Single image upload endpoint WITH AUTH
router.post('/single', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        console.log('=== SINGLE IMAGE UPLOAD START ===');
        console.log('Auth user:', req.user ? `${req.user.id} (${req.user.role})` : 'No user');
        console.log('File received:', req.file ? 'Yes' : 'No');
        console.log('Body:', req.body);

        if (!req.file) {
            console.log('No file provided');
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { category = 'general', productId = Date.now() } = req.body;
        console.log('Category:', category, 'ProductId:', productId);

        // Create folder structure
        const folderPath = createCategoryFolder(category, productId);
        console.log('Folder path:', folderPath);

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${category}-${timestamp}.jpg`;

        console.log('Processing image:', filename);

        // Process and save image
        await processAndSaveImage(req.file.buffer, filename, folderPath, {
            quality: 85,
            width: 2048,
            height: 2048
        });

        // Get file stats
        const filePath = path.join(folderPath, filename);
        const processedSize = fs.statSync(filePath).size;

        // Return relative path
        const relativePath = `/${path.relative('', filePath).replace(/\\/g, '/')}`;

        console.log('Success! Image saved to:', relativePath);
        console.log('=== SINGLE IMAGE UPLOAD END ===');

        res.status(200).json({
            imagePath: relativePath,
            filename,
            originalSize: req.file.size,
            processedSize: processedSize,
            compressionRatio: ((req.file.size - processedSize) / req.file.size * 100).toFixed(1) + '%'
        });

    } catch (error) {
        console.error('=== SINGLE IMAGE UPLOAD ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to upload image',
            details: error.stack
        });
    }
});

// Multiple images upload endpoint WITH AUTH
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

// Delete image endpoint WITH AUTH
router.delete('/delete', authMiddleware, async (req, res) => {
    try {
        console.log('=== DELETE IMAGE START ===');
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
        console.error('=== DELETE IMAGE ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to delete image'
        });
    }
});

// Legacy route for backward compatibility (NO AUTH)
router.post('/', upload.single('image'), (req, res) => {
    try {
        console.log('Using legacy upload route');
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${req.file.originalname}`;
        const legacyPath = path.join('Uploads', filename);

        // Ensure legacy folder exists
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

// Error handling middleware
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