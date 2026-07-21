const User = require('../models/User');
const UserSession = require('../models/UserSession');
const LoginHistory = require('../models/LoginHistory');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, generateCSRFToken } = require('../config/auth');
const { parseUserAgent, generateSessionToken, generateRefreshToken: genRefreshToken, getClientIP } = require('../utils/deviceFingerprint');
const { validationResult } = require('express-validator');
 
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
 
        const { first_name, last_name, email, password, role } = req.body;
 
        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
 
        // Hash password
        const password_hash = await hashPassword(password);
 
        // Create user
        const user = await User.create({
            first_name,
            last_name,
            email,
            password_hash,
            role: role || 'user'
        });
 
        // Parse device info
        const deviceInfo = parseUserAgent(req.headers['user-agent']);
        const ipAddress = getClientIP(req);
       
        // Generate tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const sessionToken = generateSessionToken();
        const csrfToken = generateCSRFToken();
 
        // Create session record
        const sessionExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours absolute timeout
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
 
        // Log successful login
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
 
        // Set httpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });
 
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });
 
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            path: '/'
        });
 
        // Remove password from response
        delete user.password_hash;
 
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
 
        // Parse device info
        const deviceInfo = parseUserAgent(req.headers['user-agent']);
        const ipAddress = getClientIP(req);
 
        // Check if account is locked
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
 
        // Find user
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
            return res.status(401).json({ message: 'Invalid credentials' });
        }
 
        // Check password
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
            return res.status(401).json({ message: 'Invalid credentials' });
        }
 
        // Check if user is active
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
 
        // Reset failed login attempts on successful login
        await User.resetFailedLogin(email);
 
        // Check concurrent session limit (max 3 active sessions)
        const activeSessionCount = await UserSession.countActiveSessions(user.id);
        const MAX_CONCURRENT_SESSIONS = 3;
       
        if (activeSessionCount >= MAX_CONCURRENT_SESSIONS) {
            // Deactivate oldest session
            const activeSessions = await UserSession.findByUserId(user.id);
            const oldestSession = activeSessions[activeSessions.length - 1];
            if (oldestSession) {
                await UserSession.deactivate(oldestSession.session_token);
            }
        }
 
        // Generate tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const sessionToken = generateSessionToken();
        const csrfToken = generateCSRFToken();
 
        // Create session record
        const sessionExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours absolute timeout
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
 
        // Log successful login
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
 
        // Set httpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });
 
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });
 
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            path: '/'
        });
 
        // Remove password from response
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
        res.json(user);
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
       
        // Deactivate session if exists
        if (sessionToken) {
            await UserSession.deactivate(sessionToken);
        }
       
        // Clear cookies
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });
        res.clearCookie('sessionToken', { path: '/' });
       
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
 
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const sessionToken = req.cookies.sessionToken;
       
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token not found' });
        }
 
        // Verify refresh token
        const { verifyRefreshToken, generateToken } = require('../config/auth');
        const decoded = verifyRefreshToken(refreshToken);
       
        const user = await User.findById(decoded.id);
        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid user' });
        }
 
        // Verify session exists and is active
        const session = await UserSession.findBySessionToken(sessionToken);
        if (!session || !session.is_active || session.expires_at < new Date()) {
            // Session expired or invalid
            await UserSession.deactivate(sessionToken);
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/' });
            res.clearCookie('sessionToken', { path: '/' });
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }
 
        // Check idle timeout (30 minutes)
        const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        const lastActivity = new Date(session.last_activity);
        const timeSinceActivity = Date.now() - lastActivity.getTime();
       
        if (timeSinceActivity > IDLE_TIMEOUT) {
            await UserSession.deactivate(sessionToken);
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/' });
            res.clearCookie('sessionToken', { path: '/' });
            return res.status(401).json({ message: 'Session expired due to inactivity. Please login again.' });
        }
 
        // Update session last activity
        await UserSession.updateLastActivity(sessionToken);
 
        const newAccessToken = generateToken(user);
        const newCSRFToken = generateCSRFToken();
 
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            path: '/'
        });
 
        res.json({
            message: 'Token refreshed successfully',
            csrfToken: newCSRFToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });
        res.clearCookie('sessionToken', { path: '/' });
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
        res.status(500).json({ message: 'Server error' });
    }
};
 
exports.revokeAllSessions = async (req, res) => {
    try {
        const currentSessionToken = req.cookies?.sessionToken;
        const currentSession = await UserSession.findBySessionToken(currentSessionToken);
       
        // Deactivate all sessions except current
        await UserSession.deactivateAllForUser(req.user.id, currentSession?.id);
 
        res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
        console.error('Revoke all sessions error:', error);
        res.status(500).json({ message: 'Server error' });
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
 