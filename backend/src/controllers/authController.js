const User = require('../models/User');
const UserSession = require('../models/UserSession');
const LoginHistory = require('../models/LoginHistory');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, generateCSRFToken } = require('../config/auth');
const { parseUserAgent, generateSessionToken, generateRefreshToken: genRefreshToken, getClientIP } = require('../utils/deviceFingerprint');
const { validationResult } = require('express-validator');
const { sendTemplatedEmail } = require('../config/email');
const logAudit = require('../utils/auditLogger');
const { setAuthCookies, clearAuthCookies, getCookieOptions } = require('../utils/cookieOptions');

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { first_name, last_name, email, password, role } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const password_hash = await hashPassword(password);

        const user = await User.create({
            first_name,
            last_name,
            email,
            password_hash,
            role: role || 'user'
        });

        const deviceInfo = parseUserAgent(req.headers['user-agent']);
        const ipAddress = getClientIP(req);

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const sessionToken = generateSessionToken();
        const csrfToken = generateCSRFToken();

        const sessionExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const session = await UserSession.create({
            user_id: user.id,
            session_token: sessionToken,
            refresh_token: refreshToken,
            device_name: deviceInfo.device_name,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
            user_agent: req.headers['user-agent'],
            expires_at: sessionExpiresAt
        });

        await LoginHistory.create({
            user_id: user.id,
            session_id: session.id,
            device_name: deviceInfo.device_name,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
            user_agent: req.headers['user-agent'],
            login_status: 'success'
        });

        setAuthCookies(res, { accessToken, refreshToken, sessionToken });

        delete user.password_hash;

        try {
            const { pool } = require('../config/database');
            const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            const frontendUrl = rawFrontend.split(',')[0].trim();

            await sendTemplatedEmail('registration', user.email, {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                login_url: `${frontendUrl}/login`
            });
        } catch (emailError) {
            console.error('Registration email error:', emailError);
        }

        res.status(201).json({
            message: 'User registered successfully',
            user,
            csrfToken,
            session: {
                id: session.id,
                device_name: session.device_name,
                device_type: session.device_type,
                expires_at: session.expires_at
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const deviceInfo = parseUserAgent(req.headers['user-agent']);
        const ipAddress = getClientIP(req);

        const isLocked = await User.isAccountLocked(email);
        if (isLocked) {
            await LoginHistory.create({
                user_id: (await User.findByEmail(email))?.id || null,
                device_name: deviceInfo.device_name,
                device_type: deviceInfo.device_type,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                ip_address: ipAddress,
                user_agent: req.headers['user-agent'],
                login_status: 'blocked',
                failure_reason: 'Account locked'
            });
            return res.status(429).json({
                message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            await User.incrementFailedLogin(email);
            const attempts = await User.getFailedLoginAttempts(email);
            if (attempts && attempts.attempts >= 4) {
                await User.lockAccount(email);
            }
            await LoginHistory.create({
                user_id: null,
                device_name: deviceInfo.device_name,
                device_type: deviceInfo.device_type,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                ip_address: ipAddress,
                user_agent: req.headers['user-agent'],
                login_status: 'failed',
                failure_reason: 'Invalid credentials - user not found'
            });
            await logAudit(req, 'login', 'user', null, `Failed login attempt for email: ${email}`, 'failed');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            await User.incrementFailedLogin(email);
            const attempts = await User.getFailedLoginAttempts(email);
            if (attempts && attempts.attempts >= 5) {
                await User.lockAccount(email);
                await LoginHistory.create({
                    user_id: user.id,
                    device_name: deviceInfo.device_name,
                    device_type: deviceInfo.device_type,
                    browser: deviceInfo.browser,
                    os: deviceInfo.os,
                    ip_address: ipAddress,
                    user_agent: req.headers['user-agent'],
                    login_status: 'blocked',
                    failure_reason: 'Account locked after 5 failed attempts'
                });
                return res.status(429).json({
                    message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.'
                });
            }
            await LoginHistory.create({
                user_id: user.id,
                device_name: deviceInfo.device_name,
                device_type: deviceInfo.device_type,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                ip_address: ipAddress,
                user_agent: req.headers['user-agent'],
                login_status: 'failed',
                failure_reason: 'Invalid password'
            });
            await logAudit(req, 'login', 'user', user.id, `Failed login - wrong password for: ${email}`, 'failed');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            await LoginHistory.create({
                user_id: user.id,
                device_name: deviceInfo.device_name,
                device_type: deviceInfo.device_type,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                ip_address: ipAddress,
                user_agent: req.headers['user-agent'],
                login_status: 'failed',
                failure_reason: 'Account disabled'
            });
            return res.status(403).json({ message: 'Account is disabled' });
        }

        await User.resetFailedLogin(email);

        const activeSessionCount = await UserSession.countActiveSessions(user.id);
        const MAX_CONCURRENT_SESSIONS = 3;

        if (activeSessionCount >= MAX_CONCURRENT_SESSIONS) {
            const activeSessions = await UserSession.findByUserId(user.id);
            const oldestSession = activeSessions[activeSessions.length - 1];
            if (oldestSession) {
                await UserSession.deactivate(oldestSession.session_token);
            }
        }

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const sessionToken = generateSessionToken();
        const csrfToken = generateCSRFToken();

        const sessionExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const session = await UserSession.create({
            user_id: user.id,
            session_token: sessionToken,
            refresh_token: refreshToken,
            device_name: deviceInfo.device_name,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
            user_agent: req.headers['user-agent'],
            expires_at: sessionExpiresAt
        });

        await LoginHistory.create({
            user_id: user.id,
            session_id: session.id,
            device_name: deviceInfo.device_name,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
            user_agent: req.headers['user-agent'],
            login_status: 'success'
        });

        setAuthCookies(res, { accessToken, refreshToken, sessionToken });

        await logAudit(req, 'login', 'user', user.id, `User logged in: ${user.email}`, 'success');

        delete user.password_hash;

        res.json({
            message: 'Login successful',
            user,
            csrfToken,
            session: {
                id: session.id,
                device_name: session.device_name,
                device_type: session.device_type,
                expires_at: session.expires_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { first_name, last_name, email } = req.body;
        const user = await User.update(req.user.id, { first_name, last_name, email });
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken;

        if (sessionToken) {
            await UserSession.deactivate(sessionToken);
        }

        await logAudit(req, 'logout', 'user', req.user?.id, `User logged out: ${req.user?.email}`, 'success');

        clearAuthCookies(res);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        clearAuthCookies(res);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const sessionToken = req.cookies.sessionToken;

        if (!refreshToken) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Refresh] 401: No refreshToken cookie present. Cookies:', Object.keys(req.cookies || {}));
            }
            return res.status(401).json({ message: 'Refresh token not found' });
        }

        const { verifyRefreshToken, generateToken } = require('../config/auth');
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (verifyErr) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Refresh] 401: verifyRefreshToken failed:', verifyErr.message);
            }
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const user = await User.findById(decoded.id);
        if (!user || !user.is_active) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Refresh] 401: User invalid or inactive. decoded.id:', decoded.id, 'found:', !!user, 'active:', user?.is_active);
            }
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Invalid user' });
        }

        const session = await UserSession.findBySessionToken(sessionToken);
        if (!session || !session.is_active || session.expires_at < new Date()) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Refresh] 401: Session invalid. found:', !!session, 'active:', session?.is_active, 'exp:', session?.expires_at);
            }
            await UserSession.deactivate(sessionToken);
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }

        const IDLE_TIMEOUT = 30 * 60 * 1000;
        const lastActivity = new Date(session.last_activity);
        const timeSinceActivity = Date.now() - lastActivity.getTime();

        if (timeSinceActivity > IDLE_TIMEOUT) {
            if (process.env.NODE_ENV === 'development') {
                const minutesIdle = Math.round(timeSinceActivity / 60000);
                console.log(`[Refresh] 401: Idle timeout: ${minutesIdle}min > 30min`);
            }
            await UserSession.deactivate(sessionToken);
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Session expired due to inactivity. Please login again.' });
        }

        await UserSession.updateLastActivity(sessionToken);

        const newAccessToken = generateToken(user);
        const newCSRFToken = generateCSRFToken();

        res.cookie('accessToken', newAccessToken, getCookieOptions('accessToken'));

        res.json({
            message: 'Token refreshed successfully',
            csrfToken: newCSRFToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        clearAuthCookies(res);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await UserSession.findByUserId(req.user.id);
        const currentSessionToken = req.cookies?.sessionToken;

        const sessionsWithCurrent = sessions.map(session => ({
            id: session.id,
            device_name: session.device_name,
            device_type: session.device_type,
            browser: session.browser,
            os: session.os,
            ip_address: session.ip_address,
            last_activity: session.last_activity,
            created_at: session.created_at,
            expires_at: session.expires_at,
            is_current: session.session_token === currentSessionToken,
            is_active: session.is_active
        }));

        res.json({ sessions: sessionsWithCurrent });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await UserSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await UserSession.deactivate(session.session_token);

        res.json({ message: 'Session revoked successfully' });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({
            message: error.message || 'Failed to revoke session',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.revokeAllSessions = async (req, res) => {
    try {
        const currentSessionToken = req.cookies?.sessionToken;
        const currentSession = await UserSession.findBySessionToken(currentSessionToken);

        await UserSession.deactivateAllForUser(req.user.id, currentSession?.id);

        res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
        console.error('Revoke all sessions error:', error);
        res.status(500).json({
            message: error.message || 'Failed to revoke sessions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getLoginHistory = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const history = await LoginHistory.findByUserId(req.user.id, parseInt(limit));

        res.json({ history });
    } catch (error) {
        console.error('Get login history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findByEmail(email);

        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        await User.setResetToken(user.id, hashedToken, resetExpiry);

        const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
        const frontendUrl = rawFrontend.split(',')[0].trim();
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        try {
            await sendTemplatedEmail('password_reset', user.email, {
                first_name: user.first_name,
                last_name: user.last_name,
                reset_url: resetUrl
            });
        } catch (emailError) {
            console.error('Forgot password email error:', emailError);
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (password.length < 12) {
            return res.status(400).json({ message: 'Password must be at least 12 characters' });
        }

        const crypto = require('crypto');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findByResetToken(hashedToken);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashed = await hashPassword(password);
        await User.updatePassword(user.id, hashed);

        await UserSession.deactivateAllForUser(user.id);

        res.json({ message: 'Password reset successfully. Please login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        console.log('[changePassword] Request received for user:', userId);

        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (new_password.length < 12) {
            return res.status(400).json({ message: 'New password must be at least 12 characters' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
        if (!passwordRegex.test(new_password)) {
            return res.status(400).json({
                message: 'Password must include uppercase, lowercase, number and special character'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('[changePassword] User found, verifying current password');

        const isPasswordValid = await comparePassword(current_password, user.password_hash);
        if (!isPasswordValid) {
            console.log('[changePassword] Current password incorrect');
            try {
                await logAudit(req, 'change_password', 'user', userId, `Failed password change attempt - wrong current password`, 'failed');
            } catch (auditError) {
                console.error('[changePassword] Audit log error (non-fatal):', auditError);
            }
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const isSamePassword = await comparePassword(new_password, user.password_hash);
        if (isSamePassword) {
            console.log('[changePassword] New password same as current');
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        console.log('[changePassword] Hashing new password');

        const hashedPassword = await hashPassword(new_password);

        console.log('[changePassword] Updating password in database');

        await User.updatePassword(userId, hashedPassword);

        console.log('[changePassword] Password updated successfully');

        try {
            await logAudit(req, 'change_password', 'user', userId, `Password changed successfully`, 'success');
        } catch (auditError) {
            console.error('[changePassword] Audit log error (non-fatal):', auditError);
        }

        try {
            const currentSessionToken = req.cookies?.sessionToken;
            if (currentSessionToken) {
                const currentSession = await UserSession.findBySessionToken(currentSessionToken);
                if (currentSession) {
                    await UserSession.deactivateAllForUser(userId, currentSession.id);
                    console.log('[changePassword] Other sessions invalidated');
                }
            }
        } catch (sessionError) {
            console.error('[changePassword] Session invalidation error (non-fatal):', sessionError);
        }

        res.json({ message: 'Password changed successfully. Other sessions have been logged out.' });
    } catch (error) {
        console.error('[changePassword] Error:', error);
        console.error('[changePassword] Stack:', error.stack);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
