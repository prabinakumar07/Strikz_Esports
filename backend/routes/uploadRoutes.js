const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload, validateMagicBytes } = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadController');

// Secure uploads to authorized session users only
// Magic byte validation runs after multer saves the file
router.post('/upload', protect, upload.single('file'), validateMagicBytes, uploadImage);

module.exports = router;
