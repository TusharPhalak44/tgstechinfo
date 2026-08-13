const { verifyToken } = require('../config/auth');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { clearAuthCookies } = require('../utils/cookieOptions');

exports.authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        const sessionToken = req.cookies?.sessionToken;

        if (!token) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] 401: No access token provided. Cookies:', Object.keys(req.cookies || {}), '| Auth header present:', !!req.header('Authorization'));
            }
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (sessionToken) {
            const session = await UserSession.findBySessionToken(sessionToken);
            if (!session) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Auth] 401: Session token not found in DB:', sessionToken.substring(0, 12) + '...');
                }
                await UserSession.deactivate(sessionToken);
                clearAuthCookies(res);
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }
            if (!session.is_active) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Auth] 401: Session is_active=false for session:', session.id);
                }
                clearAuthCookies(res);
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }
            if (session.expires_at < new Date()) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Auth] 401: Session expired_at passed for session:', session.id, 'exp:', session.expires_at);
                }
                await UserSession.deactivate(sessionToken);
                clearAuthCookies(res);
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }

            const idleTimeoutMs = 30 * 60 * 1000;
            const lastActivity = new Date(session.last_activity || session.created_at);
            const timeSinceActivity = Date.now() - lastActivity.getTime();

            if (timeSinceActivity > idleTimeoutMs) {
                if (process.env.NODE_ENV === 'development') {
                    const minutesIdle = Math.round(timeSinceActivity / 60000);
                    console.log(`[Auth] 401: Idle timeout for session ${session.id}: ${minutesIdle}min > 30min`);
                }
                await UserSession.deactivate(sessionToken);
                clearAuthCookies(res);
                return res.status(401).json({ message: 'Session expired due to inactivity. Please login again.' });
            }

            await UserSession.updateLastActivity(sessionToken);
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] Warning: accessToken present but no sessionToken cookie. Skipping session checks.');
            }
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (verifyErr) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] 401: verifyToken failed:', verifyErr.message, '| token prefix:', token.substring(0, 20) + '...');
            }
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] 401: User not found for decoded id:', decoded.id);
            }
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }
        if (!user.is_active) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] 401: User is_active=false for id:', user.id);
            }
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('[Auth] Unexpected middleware error:', error.message, error.stack);
        clearAuthCookies(res);
        res.status(401).json({ message: 'Invalid token' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

exports.requireAdmin = exports.isAdmin;

exports.isUser = (req, res, next) => {
    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

exports.isContentCreator = (req, res, next) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({
            message: 'Admin cannot create content. Admin is only for reviewing and managing content.'
        });
    }
    next();
};
