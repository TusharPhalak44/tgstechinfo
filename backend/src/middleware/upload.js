const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
console.log('Upload middleware uploadDir:', uploadDir);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Disk storage for files that are not stored in the database ────────────────
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Banner images are persisted in media_files.file_data, so keep them in memory
// and never create a permanent copy in the uploads directory.
const contentStorage = {
    _handleFile: (req, file, cb) => {
        if (file.fieldname !== 'banner_image') {
            return diskStorage._handleFile(req, file, cb);
        }

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
        if (file.fieldname !== 'banner_image') {
            return diskStorage._removeFile(req, file, cb);
        }
        delete file.buffer;
        cb(null);
    }
};

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
        return cb(null, true);
    cb(new Error('Only image files are allowed'));
};

const anyFileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|mp4|webm|mov|avi|mkv/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()))
        return cb(null, true);
    cb(new Error('Only image, PDF, or video files are allowed'));
};

// ── Combined upload: banner_image + pdf_file + video_file ──────────────────────────────────
// Uses disk storage for PDFs/videos and memory storage for banners.
// Banner bytes are persisted by the controllers in media_files.file_data.
const uploadWithPdfBase = multer({
    storage: contentStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB for videos
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
