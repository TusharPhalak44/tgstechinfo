const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
             connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173", "http://localhost:5174"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(url => url.trim());
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Trust proxy for IP address detection - only trust localhost in development
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : ['loopback', 'linklocal', 'uniquelocal']);

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute (increased for development)
    message: 'Too many requests, please try again later.',
    skip: (req) => process.env.NODE_ENV === 'development' || true // Skip in development
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/public', require('./src/routes/publicRoutes'));
app.use('/api/cookie-consent', require('./src/routes/cookieConsentRoutes'));
app.use('/api/tracking', require('./src/routes/trackingRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/admin/chatbot/analytics', require('./src/routes/chatbotAnalyticsRoutes'));
app.use('/api/rbac', require('./src/routes/rbacRoutes'));
app.use('/api/media', require('./src/routes/mediaRoutes'));
 

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Catch unhandled promise rejections and exceptions so nodemon doesn't silently crash
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});