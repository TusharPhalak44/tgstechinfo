const User = require('../models/User');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, generateCSRFToken } = require('../config/auth');
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

        // Generate tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const csrfToken = generateCSRFToken();

        // Set httpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Remove password from response
        delete user.password_hash;

        res.status(201).json({
            message: 'User registered successfully',
            user,
            csrfToken
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

        // Check if account is locked
        const isLocked = await User.isAccountLocked(email);
        if (isLocked) {
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
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            await User.incrementFailedLogin(email);
            const attempts = await User.getFailedLoginAttempts(email);
            if (attempts && attempts.attempts >= 5) {
                await User.lockAccount(email);
                return res.status(429).json({ 
                    message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.' 
                });
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ message: 'Account is disabled' });
        }

        // Reset failed login attempts on successful login
        await User.resetFailedLogin(email);

        // Generate tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const csrfToken = generateCSRFToken();

        // Set httpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Remove password from response
        delete user.password_hash;

        res.json({
            message: 'Login successful',
            user,
            csrfToken
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
        // Clear cookies
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token not found' });
        }

        const { verifyRefreshToken, generateToken } = require('../config/auth');
        const decoded = verifyRefreshToken(refreshToken);
        
        const user = await User.findById(decoded.id);
        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid user' });
        }

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
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};