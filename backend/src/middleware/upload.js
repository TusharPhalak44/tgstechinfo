const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ── In-Memory Storage for all uploads (Zero disk touches) ───────────────────
// All media files are persisted directly in media_files.file_data in the database.
const memoryStorage = {
    _handleFile: (req, file, cb) => {
        const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        const chunks = [];
        let size = 0;
        file.stream.on('data', chunk => {
            chunks.push(chunk);
            size += chunk.length;
        });
        file.stream.on('error', cb);
        file.stream.on('end', () => cb(null, {
            filename,
            buffer: Buffer.concat(chunks),
            size
        }));
    },
    _removeFile: (req, file, cb) => {
        delete file.buffer;
        cb(null);
    }
};

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
        return cb(null, true);
    cb(new Error('Only image files are allowed'));
};

const anyFileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf|mp4|webm|mov|avi|mkv/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()))
        return cb(null, true);
    cb(new Error('Only image, PDF, or video files are allowed'));
};

// ── Combined upload: banner_image + pdf_file + video_file ──────────────────────
// Uses in-memory storage for all files (saved directly into database BLOB).
const uploadWithPdfBase = multer({
    storage: memoryStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    fileFilter: anyFileFilter
});

const uploadWithPdf = {
    fields: (fieldsConfig) => uploadWithPdfBase.fields(fieldsConfig)
};

// ── Simple image-only upload (avatars, etc.) ───────────────────────────────────
const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: imageFilter
});

module.exports = { upload, uploadWithPdf };
