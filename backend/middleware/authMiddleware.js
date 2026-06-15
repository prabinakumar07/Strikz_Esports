const jwt = require('jsonwebtoken');
const { models, clean } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                res.status(500);
                return next(new Error('Server configuration error: JWT_SECRET not set'));
            }

            const decoded = jwt.verify(token, secret);
            const user = await models.User.findOne({ id: decoded.id })
                .select('id uid username email role avatar status')
                .lean();

            if (!user) {
                res.status(401);
                return next(new Error('Not authorized, user not found'));
            }

            // Block suspended users from all protected endpoints
            if (user.status === 'suspended') {
                res.status(403);
                return next(new Error('Your account has been suspended. Contact support.'));
            }

            req.user = clean(user);
            return next();
        } catch (error) {
            res.status(401);
            return next(new Error('Not authorized, token failed'));
        }
    }

    res.status(401);
    next(new Error('Not authorized, no token provided'));
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        next(new Error('Access denied, administrator role required'));
    }
};

module.exports = { protect, admin };
