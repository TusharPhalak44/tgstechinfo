const express = require('express');

const cors = require('cors');

const cookieParser = require('cookie-parser');

const dotenv = require('dotenv');

const helmet = require('helmet');

const rateLimit = require('express-rate-limit');

const path = require('path');



dotenv.config({ override: false });



const app = express();



const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const ENV_ORIGINS = (process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(Boolean);

const ALLOWED_ORIGINS = [...new Set([...DEV_ORIGINS, ...ENV_ORIGINS])];



const CSP_CONNECT_SRC = [

    "'self'",

    ...ALLOWED_ORIGINS,

    'http://localhost:5000',

    'http://127.0.0.1:5000',

    'ws://localhost:5173',

    'ws://localhost:5174',

    'wss://*.ngrok-free.app',

    'https://*.ngrok-free.app',

    'https://*.ngrok.app',

    'https://*.ngrok.io',

    'wss://*.supabase.co',

    'https://*.supabase.co'

];



app.use(helmet({

    contentSecurityPolicy: {

        directives: {

            defaultSrc: ["'self'"],

            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

            fontSrc: ["'self'", "https://fonts.gstatic.com"],

            imgSrc: ["'self'", "data:", "https:"],

            scriptSrc: ["'self'"],

            connectSrc: CSP_CONNECT_SRC,

            frameSrc: ["'none'"],

            objectSrc: ["'none'"],

            mediaSrc: ["'self'"],

            manifestSrc: ["'self'"]

        }

    },

    hsts: process.env.NODE_ENV === 'production' ? {

        maxAge: 31536000,

        includeSubDomains: true,

        preload: true

    } : false,

    noSniff: true,

    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    xssFilter: true,

    crossOriginEmbedderPolicy: false,

    crossOriginResourcePolicy: false

}));



app.use(cors({

    origin: function(origin, callback) {

        if (
            !origin ||
            ALLOWED_ORIGINS.includes(origin) ||
            origin.includes('ngrok-free.app') ||
            origin.includes('ngrok.io') ||
            origin.includes('ngrok.app') ||
            /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):517[3-4]$/.test(origin)
        ) {

            callback(null, true);

        } else {

            console.warn(`CORS blocked origin: ${origin} | Allowed: ${ALLOWED_ORIGINS.join(', ')}`);

            callback(null, false);

        }

    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],

    optionsSuccessStatus: 200

}));



app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : ['loopback', 'linklocal', 'uniquelocal']);



const limiter = rateLimit({

    windowMs: 60 * 1000,

    max: 1000,

    message: 'Too many requests, please try again later.',

    skip: (req) => process.env.NODE_ENV === 'development'

});

app.use('/api', limiter);



app.use(express.json({ limit: '20mb' }));

app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(cookieParser());



const uploadsDir = path.join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadsDir));



// Also serve branding folder specifically

const brandingDir = path.join(__dirname, 'uploads', 'branding');

app.use('/uploads/branding', express.static(brandingDir));



app.use('/uploads/:filename', async (req, res, next) => {

    try {

        const { pool } = require('./src/config/database');

        const filename = req.params.filename;



        const filePath = path.join(uploadsDir, filename);

        if (require('fs').existsSync(filePath)) {

            return res.sendFile(filePath);

        }



        const [rows] = await pool.query(

            'SELECT file_data, mime_type FROM media_files WHERE filename = ? LIMIT 1',

            [filename]

        );



        if (rows[0] && rows[0].file_data) {

            res.setHeader('Content-Type', rows[0].mime_type || 'application/octet-stream');

            res.setHeader('Cache-Control', 'public, max-age=31536000');

            return res.send(rows[0].file_data);

        }



        const placeholder = Buffer.from(

            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',

            'base64'

        );

        res.setHeader('Content-Type', 'image/png');

        res.setHeader('Cache-Control', 'no-cache');

        res.setHeader('X-Image-Missing', 'true');

        return res.send(placeholder);

    } catch (e) {

        next(e);

    }

});



app.use('/api/auth', require('./src/routes/authRoutes'));

app.use('/api/admin', require('./src/routes/adminRoutes'));

app.use('/api/user', require('./src/routes/userRoutes'));

app.use('/api/public', require('./src/routes/publicRoutes'));

app.use('/api/cookie-consent', require('./src/routes/cookieConsentRoutes'));

app.use('/api/tracking', require('./src/routes/trackingRoutes'));

app.use('/api/analytics', require('./src/routes/analyticsRoutes'));

app.use('/api/analytics', require('./src/routes/geographicAnalyticsRoutes'));

app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));

app.use('/api/admin/chatbot/analytics', require('./src/routes/chatbotAnalyticsRoutes'));

app.use('/api/rbac', require('./src/routes/rbacRoutes'));

app.use('/api/media', require('./src/routes/mediaRoutes'));

app.use('/api/seo', require('./src/routes/seoRoutes'));

app.use('/api/tags', require('./src/routes/tagsRoutes'));

app.use('/api/email-templates', require('./src/routes/emailTemplateRoutes'));

app.use('/api/site-settings', require('./src/routes/siteSettingsRoutes'));

app.use('/api/audit-logs', require('./src/routes/auditLogRoutes'));

app.use('/api/audience', require('./src/routes/audienceRoutes'));

app.use('/api/admin/audience', require('./src/routes/adminAudienceRoutes'));



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

    console.log(`[Startup] NODE_ENV=${process.env.NODE_ENV}`);

    console.log(`[Startup] CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

    console.log(`[Startup] CSP connectSrc: ${CSP_CONNECT_SRC.join(', ')}`);

});



process.on('uncaughtException', (err) => {

    console.error('❌ Uncaught Exception:', err.message, err.stack);

});

process.on('unhandledRejection', (reason) => {

    console.error('❌ Unhandled Rejection:', reason);

});

