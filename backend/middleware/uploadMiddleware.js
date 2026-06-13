const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure root-level uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate secure sanitized filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'upload-' + uniqueSuffix + ext);
    }
});

// File filter validation
const fileFilter = (req, file, cb) => {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    // Allowed mimetypes
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Security Lock: Only image uploads are permitted (jpeg, jpg, png, gif, webp, svg)'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB Max limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
