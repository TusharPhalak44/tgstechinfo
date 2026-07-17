const { verifyToken } = require('../config/auth');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
    try {
        // Try to get token from httpOnly cookie first, fallback to Authorization header
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);

        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

exports.isUser = (req, res, next) => {
    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

// ✅ New: Check if user is content creator (not admin)
exports.isContentCreator = (req, res, next) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ 
            message: 'Admin cannot create content. Admin is only for reviewing and managing content.' 
        });
    }
    next();
};