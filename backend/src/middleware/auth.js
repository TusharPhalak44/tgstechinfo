const { verifyToken } = require('../config/auth');
const User = require('../models/User');
const UserSession = require('../models/UserSession');

exports.authenticate = async (req, res, next) => {
    try {
        // Try to get token from httpOnly cookie first, fallback to Authorization header
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        const sessionToken = req.cookies?.sessionToken;
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (sessionToken) {
            const session = await UserSession.findBySessionToken(sessionToken);
            if (!session || !session.is_active || session.expires_at < new Date()) {
                if (sessionToken) {
                    await UserSession.deactivate(sessionToken);
                }
                res.clearCookie('accessToken', { path: '/' });
                res.clearCookie('refreshToken', { path: '/' });
                res.clearCookie('sessionToken', { path: '/' });
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }

            const idleTimeoutMs = 30 * 60 * 1000;
            const lastActivity = new Date(session.last_activity || session.created_at);
            const timeSinceActivity = Date.now() - lastActivity.getTime();

            if (timeSinceActivity > idleTimeoutMs) {
                await UserSession.deactivate(sessionToken);
                res.clearCookie('accessToken', { path: '/' });
                res.clearCookie('refreshToken', { path: '/' });
                res.clearCookie('sessionToken', { path: '/' });
                return res.status(401).json({ message: 'Session expired due to inactivity. Please login again.' });
            }

            await UserSession.updateLastActivity(sessionToken);
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

// Alias for isAdmin (for clarity in some routes)
exports.requireAdmin = exports.isAdmin;

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
