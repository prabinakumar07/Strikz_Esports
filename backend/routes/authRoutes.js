const express = require('express');
const router = express.Router();
const {
    register,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Auth Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private User Profile Endpoints
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
