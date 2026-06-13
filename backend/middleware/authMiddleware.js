const jwt = require('jsonwebtoken');
const { models, clean } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcyberpunkgamershieldkey2026');
            const user = await models.User.findOne({ id: decoded.id }).select('id username email role avatar').lean();

            if (!user) {
                res.status(401);
                return next(new Error('Not authorized, user not found'));
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
