const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadController');

// Secure uploads to authorized session users only
router.post('/upload', protect, upload.single('file'), uploadImage);

module.exports = router;
