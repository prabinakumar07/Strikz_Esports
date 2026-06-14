const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const { models, nextNumberId } = require('../config/db');
const { sendEmail } = require('../utils/email');

// Zero-dependency HTTPS JSON request helper for compatibility across Node runtimes
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
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
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretcyberpunkgamershieldkey2026', {
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

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400);
            return next(new Error('Please provide all registration credentials'));
        }

        if (password.length < 6) {
            res.status(400);
            return next(new Error('Password must be at least 6 characters long'));
        }

        const existing = await models.User.findOne({
            $or: [{ email }, { username }]
        }).lean();

        if (existing) {
            res.status(400);
            return next(new Error('Gamer tag or email already registered in the arena'));
        }

        const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
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

        // Create user with isVerified: false initially
        const user = await models.User.create({
            id: await nextNumberId(models.User),
            uid,
            username,
            email,
            password_hash: passwordHash,
            role: 'user',
            avatar,
            isVerified: false
        });

        // 1. Email Verification & OTP: Generate 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

        // Store OTP securely (remove old OTPs first)
        await models.OtpCode.deleteMany({ email });
        await models.OtpCode.create({
            email,
            code: otpCode,
            expires_at: expiry
        });

        // Send OTP email
        const emailService = require('../utils/emailService');
        await emailService.sendOtpEmail(email, username, otpCode);

        res.status(201).json({
            success: true,
            requiresVerification: true,
            email,
            message: 'Registration successful! A 6-digit verification code has been dispatched to your email.'
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            res.status(400);
            return next(new Error('Please enter username/email and password'));
        }

        const user = await models.User.findOne({
            $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
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

        // Verify account activation status (skip if not set/undefined for older seeded accounts, but catch false)
        if (user.isVerified === false) {
            // Re-send OTP if they attempt to log in but aren't verified yet
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            await models.OtpCode.deleteMany({ email: user.email });
            await models.OtpCode.create({ email: user.email, code: otpCode, expires_at: expiry });
            
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

        const client_id = process.env.GOOGLE_CLIENT_ID;
        if (client_id && client_id !== 'your-google-client-id-here' && payload.aud !== client_id) {
            res.status(400);
            return next(new Error('Google ID token audience mismatch'));
        }

        let user = await models.User.findOne({
            $or: [{ email }, { google_id: sub }]
        });

        let isNew = false;
        if (user) {
            let updatedFields = {};
            if (!user.google_id) {
                updatedFields.google_id = sub;
            }
            if (user.isVerified !== true) {
                updatedFields.isVerified = true;
            }
            if (Object.keys(updatedFields).length > 0) {
                await models.User.updateOne({ id: user.id }, { $set: updatedFields });
            }
        } else {
            isNew = true;
            let uniqueUsername = name || email.split('@')[0];
            uniqueUsername = uniqueUsername.replace(/[^a-zA-Z0-9._-]/g, '');
            if (!uniqueUsername) {
                uniqueUsername = 'gamer' + Math.floor(1000 + Math.random() * 9000);
            }
            
            let usernameExists = await models.User.exists({ username: uniqueUsername });
            while (usernameExists) {
                uniqueUsername = `${uniqueUsername}${Math.floor(10 + Math.random() * 90)}`;
                usernameExists = await models.User.exists({ username: uniqueUsername });
            }

            let base = (uniqueUsername || 'gamer').toLowerCase().replace(/[^a-z0-9]/g, '');
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
                email,
                role: 'user',
                avatar: picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(uniqueUsername)}&backgroundColor=0a0a0f`,
                google_id: sub,
                isVerified: true
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

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400);
            return next(new Error('Please enter your registered email address'));
        }

        const user = await models.User.findOne({ email });
        if (!user) {
            res.status(404);
            return next(new Error('No account found with that email address'));
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/#/reset-password?token=${resetToken}`;
        const message = `Hello gamer ${user.username},\n\nA password reset request was initiated for your Strikz Esports account. Please complete the process by visiting the link below:\n\n${resetUrl}\n\nThis security cryptokey expires in 1 hour. If you did not request this, please ignore this email.`;

        await sendEmail({
            to: email,
            subject: 'Strikz Esports - Password Reset Request',
            text: message,
            html: `<div style="font-family: sans-serif; background: #0a0a0f; color: #fff; padding: 30px; border-radius: 8px; border: 1px solid #ffe600;">
                     <h2 style="color: #ff5e00;">STRIKZ ARENA SECURITY GATE</h2>
                     <p>You requested a password reset for your gamer profile: <strong>${user.username}</strong>.</p>
                     <p>Click the button below to initialize the crypto key override:</p>
                     <a href="${resetUrl}" style="background: #ff5e00; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block; margin: 15px 0;">RESET PASSWORD</a>
                     <p style="color: #888; font-size: 11px;">If you did not request this, you can safely ignore this alert.</p>
                   </div>`
        });

        res.json({ success: true, message: 'Arena Reset Token dispatched successfully to email' });
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

        user.password_hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
        user.reset_token = null;
        user.reset_token_expiry = null;
        await user.save();

        res.json({ success: true, message: 'Password overrides complete. Profile security updated.' });
    } catch (err) {
        next(err);
    }
};

const getProfile = async (req, res) => {
    res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res, next) => {
    try {
        const { username, avatar } = req.body;
        const userId = req.user.id;

        if (!username) {
            res.status(400);
            return next(new Error('Gamer tag cannot be left empty'));
        }

        const existing = await models.User.findOne({ username, id: { $ne: userId } }).lean();
        if (existing) {
            res.status(400);
            return next(new Error('Gamer tag already claimed by another survivor'));
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
            { $set: { username, uid: newUid, avatar: avatar || req.user.avatar } },
            { new: true }
        ).lean();

        res.json({ success: true, user: userPayload(user) });
    } catch (err) {
        next(err);
    }
};

const searchUsers = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) {
            return res.json({ success: true, users: [] });
        }

        const cleanQuery = query.trim();
        const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const users = await models.User.find({
            $or: [
                { username: regex },
                { uid: regex }
            ],
            id: { $ne: req.user.id } // Exclude self
        })
        .select('username uid avatar')
        .limit(10)
        .lean();

        res.json({ success: true, users });
    } catch (err) {
        next(err);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400);
            return next(new Error('Please provide email and OTP code'));
        }

        const otpRecord = await models.OtpCode.findOne({ email, code }).lean();
        if (!otpRecord) {
            res.status(400);
            return next(new Error('Invalid OTP code'));
        }

        const now = new Date();
        const expiry = new Date(otpRecord.expires_at);
        if (now > expiry) {
            res.status(400);
            return next(new Error('OTP has expired. Please request a new one.'));
        }

        // Activate the user account
        const user = await models.User.findOneAndUpdate(
            { email },
            { $set: { isVerified: true } },
            { new: true }
        );

        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        // Clean up OTP codes
        await models.OtpCode.deleteMany({ email });

        // Return token and logged in user
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

        const user = await models.User.findOne({ email }).lean();
        if (!user) {
            res.status(404);
            return next(new Error('User not registered'));
        }

        if (user.isVerified) {
            res.status(400);
            return next(new Error('Account is already verified'));
        }

        // Rate limit OTP resend: check if last OTP was sent less than 1 minute ago
        const lastOtp = await models.OtpCode.findOne({ email }).sort({ created_at: -1 }).lean();
        if (lastOtp) {
            const timeSinceLast = Date.now() - new Date(lastOtp.created_at).getTime();
            if (timeSinceLast < 60 * 1000) {
                res.status(429);
                return next(new Error('Please wait 60 seconds before requesting a new OTP.'));
            }
        }

        // Generate and save new OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await models.OtpCode.deleteMany({ email });
        await models.OtpCode.create({
            email,
            code: otpCode,
            expires_at: expiry
        });

        // Dispatch new OTP email
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
