const express = require('express');
const router = express.Router();
const {
    register,
    login,
    googleLogin,
    getGoogleConfig,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    searchUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Auth Endpoints
router.get('/config', getGoogleConfig);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private User Profile Endpoints
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/users/search', protect, searchUsers);

module.exports = router;
