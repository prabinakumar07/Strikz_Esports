const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure root-level uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed file types — SVG EXCLUDED (XSS vector)
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|gif|webp)$/i;
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Magic byte signatures for each allowed type
// This validates the actual file content, not just the client-reported MIME type
const MAGIC_BYTES = {
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF] // JPEG
    ],
    'image/jpg': [
        [0xFF, 0xD8, 0xFF]
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
    ],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ],
    'image/webp': [
        // RIFF....WEBP — check bytes 0-3 and 8-11
        null // Handled separately in checkMagicBytes
    ]
};

/**
 * Validates file magic bytes after upload.
 * Returns true if bytes match expected file type.
 */
function checkMagicBytes(buffer, mimeType) {
    const normalizedMime = mimeType.toLowerCase();

    if (normalizedMime === 'image/webp') {
        // RIFF + WEBP marker
        return (
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
        );
    }

    const signatures = MAGIC_BYTES[normalizedMime];
    if (!signatures) return false;

    return signatures.some((sig) =>
        sig && sig.every((byte, i) => buffer[i] === byte)
    );
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate secure sanitized filename — no path traversal possible
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        cb(null, 'upload-' + uniqueSuffix + ext);
    }
});

// File filter — validates extension and client-reported MIME type
const fileFilter = (req, file, cb) => {
    const hasAllowedExt = ALLOWED_EXTENSIONS.test(file.originalname);
    const hasAllowedMime = ALLOWED_MIMETYPES.includes(file.mimetype.toLowerCase());

    if (hasAllowedMime && hasAllowedExt) {
        return cb(null, true);
    }
    cb(new Error('Security Lock: Only image uploads are permitted (jpeg, jpg, png, gif, webp). SVG files are not allowed.'));
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB Max limit
        files: 1 // Only one file per request
    },
    fileFilter: fileFilter
});

/**
 * Middleware to validate magic bytes after multer saves the file.
 * Must be used after upload.single() in routes.
 */
const validateMagicBytes = (req, res, next) => {
    if (!req.file) return next();

    try {
        // Read first 12 bytes of file for magic byte check
        const fd = fs.openSync(req.file.path, 'r');
        const buffer = Buffer.alloc(12);
        fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);

        const isValid = checkMagicBytes(buffer, req.file.mimetype);
        if (!isValid) {
            // Delete the suspicious file
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
            res.status(400);
            return next(new Error('Security: File content does not match declared type. Upload rejected.'));
        }

        next();
    } catch (err) {
        try { if (req.file) fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        res.status(500);
        next(new Error('File validation failed'));
    }
};

module.exports = { upload, validateMagicBytes };
