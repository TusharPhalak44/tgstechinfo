const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
console.log('MediaController uploadDir:', uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
 cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|mp4|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        // Only check extension, not mimetype (more lenient)
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
        }
    }
});

// Store original filename mapping
const filenameMapping = new Map();

exports.uploadFile = async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('Req file:', req.file);
        console.log('Req body:', req.body);
        
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        console.log('File uploaded successfully:', req.file.filename);
        console.log('File path:', req.file.path);
        
        // Determine file type and folder
        const ext = path.extname(req.file.filename).toLowerCase();
        let fileType = 'other';
        let folder = 'Documents';
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            fileType = 'image';
            folder = 'Images';
        } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
            fileType = 'video';
            folder = 'Videos';
        } else if (ext === '.pdf') {
            fileType = 'document';
            folder = 'Documents';
        }
        
        // Save to database
        const mediaData = {
            filename: req.file.filename,
            original_name: req.file.originalname,
            file_path: `/uploads/${req.file.filename}`,
            file_type: fileType,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            folder: folder,
            uploaded_by: req.user ? req.user.id : null
        };
        
        const savedMedia = await Media.create(mediaData);
        console.log('Media saved to database:', savedMedia);
        
        res.json({
            message: 'File uploaded successfully',
            file: {
                id: savedMedia.id,
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

exports.getAllFiles = async (req, res) => {
    try {
        const { file_type, folder, search } = req.query;
        
        const filters = {
            file_type: file_type || 'all',
            folder: folder || 'all',
            search: search || '',
            limit: 100,
            offset: 0
        };
        
        const mediaFiles = await Media.findAll(filters);
        const totalCount = await Media.getCount(filters);
        
        // Transform database records to match frontend format
        const formattedFiles = mediaFiles.map(media => ({
            id: media.id,
            name: media.original_name,
            filename: media.filename,
            type: media.file_type,
            url: media.file_path,
            thumbnail: media.file_type === 'image' ? media.file_path : null,
            size: media.file_size,
            folder: media.folder,
            createdAt: media.created_at,
            usageCount: 0,
            content_title: null,
        }));
        
        console.log('Media files from database:', formattedFiles.length);
        
        res.json({
            data: formattedFiles,
            total: totalCount
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
};

exports.getFolderCounts = async (req, res) => {
    try {
        const counts = await Media.getFolderCounts();
        res.json(counts);
    } catch (error) {
        console.error('Error fetching folder counts:', error);
        res.status(500).json({ message: 'Failed to fetch folder counts' });
    }
};

exports.uploadMiddleware = upload.single('file');
