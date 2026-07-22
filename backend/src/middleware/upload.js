const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Disk storage for all files ────────────────────────────────────────────────
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
        return cb(null, true);
    cb(new Error('Only image files are allowed'));
};

const anyFileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()))
        return cb(null, true);
    cb(new Error('Only image or PDF files are allowed'));
};

// ── Combined upload: banner_image + pdf_file ──────────────────────────────────
// Uses disk storage directly — no sharp processing to avoid native crashes.
// Both files are saved to /uploads as-is.
const uploadWithPdfBase = multer({
    storage: diskStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: anyFileFilter
});

// Wrapper that matches the { fields: [...] } call signature used in routes
const uploadWithPdf = {
    fields: (fieldsConfig) => uploadWithPdfBase.fields(fieldsConfig)
};

// ── Simple image-only upload ──────────────────────────────────────────────────
const upload = multer({
    storage: diskStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: imageFilter
});

module.exports = { upload, uploadWithPdf };
