import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Storage engine
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
    res.status(200).json({ imagePath: `/uploads/${req.file.filename}` });
});

export default router;
