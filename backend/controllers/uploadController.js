// @desc    Upload an image file
// @route   POST /api/v1/upload
// @access  Private
const uploadImage = (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            return next(new Error('No file uploaded or file did not pass security verification'));
        }

        // Return path relative to the root URL
        const imageUrl = `/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully to Strikz static servers',
            imageUrl: imageUrl
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { uploadImage };
