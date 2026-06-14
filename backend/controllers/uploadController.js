const fs = require('fs');
const { models } = require('../config/db');

// @desc    Upload an image file
// @route   POST /api/v1/upload
// @access  Private
const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            return next(new Error('No file uploaded or file did not pass security verification'));
        }

        // Read file from disk and convert to base64
        const filePath = req.file.path;
        let base64Data;
        try {
            const fileData = fs.readFileSync(filePath);
            base64Data = fileData.toString('base64');
        } catch (readErr) {
            res.status(500);
            return next(new Error('Failed to read uploaded file on server'));
        }

        // Save to MongoDB UploadedFile collection
        await models.UploadedFile.create({
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            data: base64Data
        });

        // Delete temporary file from disk
        try {
            fs.unlinkSync(filePath);
        } catch (unlinkErr) {
            console.error('Failed to delete temp upload file:', unlinkErr);
        }

        // Return path relative to the root URL
        const imageUrl = `/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully and persisted in database',
            imageUrl: imageUrl
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { uploadImage };
