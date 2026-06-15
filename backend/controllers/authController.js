const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const { models, nextNumberId } = require('../config/db');
const { sendEmail } = require('../utils/email');

// ==========================================
// SECURITY HELPERS
// ==========================================

// HTML entity encoder — prevents XSS from user-supplied strings injected into HTML
const escapeHtml = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Zero-dependency HTTPS JSON request helper
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        statusCode: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data))
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => { reject(err); });
    });
};

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not configured');
    }
    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRY || '24h'
    });
};

const userPayload = (user) => ({
    id: user.id,
    uid: user.uid,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar
});

// ==========================================
// REGISTRATION
// ==========================================

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400);
            return next(new Error('Please provide all registration credentials'));
        }

        // Validate username (alphanumeric, dots, underscores, hyphens only)
        if (!/^[a-zA-Z0-9._-]{2,30}$/.test(username)) {
            res.status(400);
            return next(new Error('Gamer tag must be 2–30 characters and contain only letters, numbers, dots, underscores, or hyphens'));
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400);
            return next(new Error('Please enter a valid email address'));
        }

        if (password.length < 6) {
            res.status(400);
            return next(new Error('Password must be at least 6 characters long'));
        }

        const existing = await models.User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        }).lean();

        if (existing) {
            res.status(400);
            return next(new Error('Gamer tag or email already registered in the arena'));
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}&backgroundColor=0a0a0f`;

        let base = (username || 'gamer').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!base) base = 'gamer';
        let uid;
        let exists = true;
        while (exists) {
            const randomNum = Math.floor(10 + Math.random() * 900);
            uid = `${base}_${randomNum}`;
            exists = await models.User.exists({ uid });
        }

        const user = await models.User.create({
            id: await nextNumberId(models.User),
            uid,
            username,
            email: email.toLowerCase(),
            password_hash: passwordHash,
            role: 'user',
            avatar,
            isVerified: false,
            status: 'pending'
        });

        // Generate and store hashed OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await models.OtpCode.deleteMany({ email: email.toLowerCase() });
        await models.OtpCode.create({
            email: email.toLowerCase(),
            code_hash: otpHash,
            expires_at: expiry
        });

        const emailService = require('../utils/emailService');
        await emailService.sendOtpEmail(email, username, otpCode);

        res.status(201).json({
            success: true,
            requiresVerification: true,
            email: email.toLowerCase(),
            message: 'Registration successful! A 6-digit verification code has been dispatched to your email.'
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// LOGIN
// ==========================================

const login = async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            res.status(400);
            return next(new Error('Please enter username/email and password'));
        }

        const normalised = usernameOrEmail.toLowerCase();
        const user = await models.User.findOne({
            $or: [{ email: normalised }, { username: usernameOrEmail }]
        }).lean();

        if (!user) {
            res.status(401);
            return next(new Error('Access Denied: Invalid credentials'));
        }

        if (!user.password_hash) {
            res.status(400);
            return next(new Error('This account was created via Google Sign-In. Please click the Google button to enter the arena.'));
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401);
            return next(new Error('Access Denied: Invalid credentials'));
        }

        // Check if account is suspended (SEC-008 fix)
        if (user.status === 'suspended') {
            res.status(403);
            return next(new Error('Your account has been suspended. Please contact support at support@strikzesports.com'));
        }

        // Verify account activation
        if (user.isVerified === false) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
            const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            await models.OtpCode.deleteMany({ email: user.email });
            await models.OtpCode.create({ email: user.email, code_hash: otpHash, expires_at: expiry });

            const emailService = require('../utils/emailService');
            await emailService.sendOtpEmail(user.email, user.username, otpCode);

            return res.status(200).json({
                success: false,
                requiresVerification: true,
                email: user.email,
                message: 'Your account is not verified yet. A new verification OTP code has been dispatched to your email.'
            });
        }

        res.json({ success: true, token: generateToken(user.id), user: userPayload(user) });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// GOOGLE LOGIN
// ==========================================

const googleLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            res.status(400);
            return next(new Error('Google verification token is required'));
        }

        const tokeninfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
        const verifyRes = await fetchJson(tokeninfoUrl);
        if (!verifyRes.ok) {
            res.status(400);
            return next(new Error('Authentication failed: Invalid Google token'));
        }

        const payload = await verifyRes.json();
        const { email, email_verified, name, picture, sub } = payload;

        if (!email || (email_verified !== 'true' && email_verified !== true)) {
            res.status(400);
            return next(new Error('Google login requires a verified email address'));
        }

        // SEC-009: Always validate audience — GOOGLE_CLIENT_ID is now required at startup
        const client_id = process.env.GOOGLE_CLIENT_ID;
        if (!payload.aud || payload.aud !== client_id) {
            res.status(400);
            return next(new Error('Google ID token audience mismatch — invalid token'));
        }

        let user = await models.User.findOne({
            $or: [{ email: email.toLowerCase() }, { google_id: sub }]
        });

        let isNew = false;
        if (user) {
            // Check suspension for existing users
            if (user.status === 'suspended') {
                res.status(403);
                return next(new Error('Your account has been suspended. Please contact support.'));
            }

            let updatedFields = {};
            if (!user.google_id) updatedFields.google_id = sub;
            if (user.isVerified !== true) updatedFields.isVerified = true;
            if (user.status === 'pending') updatedFields.status = 'active';
            if (Object.keys(updatedFields).length > 0) {
                await models.User.updateOne({ id: user.id }, { $set: updatedFields });
            }
        } else {
            isNew = true;
            let uniqueUsername = name || email.split('@')[0];
            uniqueUsername = uniqueUsername.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 25);
            if (!uniqueUsername) uniqueUsername = 'gamer' + Math.floor(1000 + Math.random() * 9000);

            let usernameExists = await models.User.exists({ username: uniqueUsername });
            while (usernameExists) {
                uniqueUsername = `${uniqueUsername.slice(0, 20)}${Math.floor(10 + Math.random() * 90)}`;
                usernameExists = await models.User.exists({ username: uniqueUsername });
            }

            let base = uniqueUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!base) base = 'gamer';
            let uid;
            let exists = true;
            while (exists) {
                const randomNum = Math.floor(10 + Math.random() * 900);
                uid = `${base}_${randomNum}`;
                exists = await models.User.exists({ uid });
            }

            user = await models.User.create({
                id: await nextNumberId(models.User),
                uid,
                username: uniqueUsername,
                email: email.toLowerCase(),
                role: 'user',
                avatar: picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(uniqueUsername)}&backgroundColor=0a0a0f`,
                google_id: sub,
                isVerified: true,
                status: 'active'
            });
        }

        res.json({ success: true, token: generateToken(user.id), user: userPayload(user), isNewUser: isNew });
    } catch (err) {
        next(err);
    }
};

const getGoogleConfig = async (req, res, next) => {
    try {
        res.json({
            success: true,
            googleClientId: process.env.GOOGLE_CLIENT_ID || ''
        });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// FORGOT / RESET PASSWORD
// ==========================================

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400);
            return next(new Error('Please enter your registered email address'));
        }

        // SEC-012: Always return the same response whether email exists or not (prevent user enumeration)
        const genericResponse = { success: true, message: 'If that email is registered, a reset link has been dispatched.' };

        const user = await models.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Return identical response — do NOT reveal whether email exists
            return res.json(genericResponse);
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/#/reset-password?token=${resetToken}`;
        const safeUsername = escapeHtml(user.username);
        const message = `Hello gamer ${user.username},\n\nA password reset request was initiated. Visit:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`;

        await sendEmail({
            to: email,
            subject: 'Strikz Esports - Password Reset Request',
            text: message,
            html: `<div style="font-family: sans-serif; background: #0a0a0f; color: #fff; padding: 30px; border-radius: 8px; border: 1px solid #ffe600;">
                     <h2 style="color: #ff5e00;">STRIKZ ARENA SECURITY GATE</h2>
                     <p>You requested a password reset for your gamer profile: <strong>${safeUsername}</strong>.</p>
                     <p>Click the button below to initialize the crypto key override:</p>
                     <a href="${resetUrl}" style="background: #ff5e00; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block; margin: 15px 0;">RESET PASSWORD</a>
                     <p style="color: #888; font-size: 11px;">If you did not request this, you can safely ignore this alert.</p>
                   </div>`
        });

        res.json(genericResponse);
    } catch (err) {
        next(err);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400);
            return next(new Error('Cryptokey token and new password are required'));
        }

        if (password.length < 6) {
            res.status(400);
            return next(new Error('Password must be at least 6 characters long'));
        }

        const resetHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await models.User.findOne({
            reset_token: resetHash,
            reset_token_expiry: { $gt: new Date() }
        });

        if (!user) {
            res.status(400);
            return next(new Error('Reset token is invalid or has expired'));
        }

        user.password_hash = await bcrypt.hash(password, 12);
        user.reset_token = null;
        user.reset_token_expiry = null;
        await user.save();

        res.json({ success: true, message: 'Password overrides complete. Profile security updated.' });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// PROFILE
// ==========================================

const getProfile = async (req, res) => {
    res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res, next) => {
    try {
        // Whitelist only allowed fields (SEC-006 fix for profiles)
        const { username, avatar } = req.body;
        const userId = req.user.id;

        if (!username) {
            res.status(400);
            return next(new Error('Gamer tag cannot be left empty'));
        }

        if (!/^[a-zA-Z0-9._-]{2,30}$/.test(username)) {
            res.status(400);
            return next(new Error('Gamer tag must be 2–30 characters and contain only letters, numbers, dots, underscores, or hyphens'));
        }

        const existing = await models.User.findOne({ username, id: { $ne: userId } }).lean();
        if (existing) {
            res.status(400);
            return next(new Error('Gamer tag already claimed by another survivor'));
        }

        // Validate avatar URL if provided (allow local uploads, data URIs, and valid absolute URLs)
        let sanitizedAvatar = req.user.avatar;
        if (avatar) {
            const isRelativeUpload = avatar.startsWith('/uploads/');
            const isDataUri = avatar.startsWith('data:image/');
            let isValidAbsolute = false;
            try {
                const url = new URL(avatar);
                if (['http:', 'https:'].includes(url.protocol)) {
                    isValidAbsolute = true;
                }
            } catch (e) {
                // not a valid absolute URL
            }

            if (isRelativeUpload || isDataUri || isValidAbsolute) {
                sanitizedAvatar = avatar;
            } else {
                res.status(400);
                return next(new Error('Invalid avatar URL format'));
            }
        }

        let newUid = req.user.uid;
        if (username !== req.user.username) {
            let base = username.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!base) base = 'gamer';
            let exists = true;
            while (exists) {
                const randomNum = Math.floor(10 + Math.random() * 900);
                newUid = `${base}_${randomNum}`;
                exists = await models.User.exists({ uid: newUid, id: { $ne: userId } });
            }
        }

        const user = await models.User.findOneAndUpdate(
            { id: userId },
            { $set: { username, uid: newUid, avatar: sanitizedAvatar } },
            { new: true }
        ).lean();

        res.json({ success: true, user: userPayload(user) });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// USER SEARCH
// ==========================================

const searchUsers = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) {
            return res.json({ success: true, users: [] });
        }

        const cleanQuery = query.trim().slice(0, 50); // Limit query length
        const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const users = await models.User.find({
            $or: [{ username: regex }, { uid: regex }],
            id: { $ne: req.user.id }
        })
        .select('username uid avatar')
        .limit(10)
        .lean();

        res.json({ success: true, users });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// OTP VERIFICATION
// ==========================================

const verifyOtp = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400);
            return next(new Error('Please provide email and OTP code'));
        }

        // Validate code format (must be 6 digits)
        if (!/^\d{6}$/.test(code)) {
            res.status(400);
            return next(new Error('OTP must be a 6-digit numeric code'));
        }

        const normalizedEmail = email.toLowerCase();
        // Hash the provided code to compare against stored hash
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        const otpRecord = await models.OtpCode.findOne({ email: normalizedEmail, code_hash: codeHash }).lean();
        if (!otpRecord) {
            res.status(400);
            return next(new Error('Invalid OTP code'));
        }

        const now = new Date();
        const expiry = new Date(otpRecord.expires_at);
        if (now > expiry) {
            await models.OtpCode.deleteMany({ email: normalizedEmail });
            res.status(400);
            return next(new Error('OTP has expired. Please request a new one.'));
        }

        const user = await models.User.findOneAndUpdate(
            { email: normalizedEmail },
            { $set: { isVerified: true, status: 'active' } },
            { new: true }
        );

        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        await models.OtpCode.deleteMany({ email: normalizedEmail });

        res.json({
            success: true,
            token: generateToken(user.id),
            user: userPayload(user),
            message: 'Account verified successfully!'
        });
    } catch (err) {
        next(err);
    }
};

const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400);
            return next(new Error('Please provide your email address'));
        }

        const normalizedEmail = email.toLowerCase();
        const user = await models.User.findOne({ email: normalizedEmail }).lean();
        if (!user) {
            res.status(404);
            return next(new Error('User not registered'));
        }

        if (user.isVerified) {
            res.status(400);
            return next(new Error('Account is already verified'));
        }

        // Rate limit: check if last OTP was sent less than 60 seconds ago
        const lastOtp = await models.OtpCode.findOne({ email: normalizedEmail }).sort({ created_at: -1 }).lean();
        if (lastOtp) {
            const timeSinceLast = Date.now() - new Date(lastOtp.created_at).getTime();
            if (timeSinceLast < 60 * 1000) {
                res.status(429);
                return next(new Error('Please wait 60 seconds before requesting a new OTP.'));
            }
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await models.OtpCode.deleteMany({ email: normalizedEmail });
        await models.OtpCode.create({
            email: normalizedEmail,
            code_hash: otpHash,
            expires_at: expiry
        });

        const emailService = require('../utils/emailService');
        await emailService.sendOtpEmail(email, user.username, otpCode);

        res.json({
            success: true,
            message: 'Verification OTP has been resent to your email.'
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    googleLogin,
    getGoogleConfig,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    searchUsers,
    verifyOtp,
    resendOtp
};
