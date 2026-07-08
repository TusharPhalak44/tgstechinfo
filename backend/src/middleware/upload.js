const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage — file buffer milega, disk pe directly nahi jayega
const memoryStorage = multer.memoryStorage();

// Disk storage — PDF ke liye
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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

// Banner image: memory me lo, phir sharp se resize karo
const bannerUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: imageFilter
});

// PDF: disk pe directly save karo
const pdfUpload = multer({
    storage: diskStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: anyFileFilter
});

// Middleware: banner_image ko 1200x630 resize karke save karo, pdf_file ko disk pe
const uploadWithPdf = {
    fields: (fieldsConfig) => {
        return async (req, res, next) => {
            // Pehle multer se dono fields parse karo (banner memory me, pdf disk pe)
            // Lekin multer ek hi storage use karta hai per instance
            // Solution: combined memory multer use karo, phir pdf ko manually move karo
            const combinedMulter = multer({
                storage: memoryStorage,
                limits: { fileSize: 20 * 1024 * 1024 },
                fileFilter: anyFileFilter
            }).fields(fieldsConfig);

            combinedMulter(req, res, async (err) => {
                if (err) return next(err);

                try {
                    if (!req.files) return next();

                    // Banner image: resize to 1200x630
                    if (req.files.banner_image?.[0]) {
                        const file = req.files.banner_image[0];
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const filename = `banner_image-${uniqueSuffix}.webp`;
                        const outputPath = path.join(uploadDir, filename);

                        await sharp(file.buffer)
                            .resize(1200, 630, { fit: 'inside', withoutEnlargement: false })
                            .webp({ quality: 85 })
                            .toFile(outputPath);

                        req.files.banner_image[0].filename = filename;
                    }

                    // PDF: buffer ko disk pe save karo
                    if (req.files.pdf_file?.[0]) {
                        const file = req.files.pdf_file[0];
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const filename = `pdf_file-${uniqueSuffix}.pdf`;
                        const outputPath = path.join(uploadDir, filename);

                        fs.writeFileSync(outputPath, file.buffer);
                        req.files.pdf_file[0].filename = filename;
                    }

                    next();
                } catch (error) {
                    next(error);
                }
            });
        };
    }
};

const upload = multer({
    storage: diskStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter
});

module.exports = { upload, uploadWithPdf };
