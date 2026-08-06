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
        fileSize: 500 * 1024 * 1024 // 500MB limit
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
        
        // Only store file binary in DB for small images/PDFs (under 5MB).
        // For videos and large files, store metadata only — serve from disk.
        const MAX_BLOB_SIZE = 5 * 1024 * 1024; // 5MB
        const isVideo = fileType === 'video';
        const isLarge = req.file.size > MAX_BLOB_SIZE;
        let fileData = null;
        if (!isVideo && !isLarge) {
            try {
                fileData = fs.readFileSync(req.file.path);
            } catch (readErr) {
                console.warn('Could not read file into DB blob (non-fatal):', readErr.message);
            }
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
            uploaded_by: req.user ? req.user.id : null,
            file_data: fileData
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
        
        // Capitalize folder to match DB values (images -> Images)
        const folderValue = folder && folder !== 'all'
            ? folder.charAt(0).toUpperCase() + folder.slice(1)
            : 'all';

        const filters = {
            file_type: file_type || 'all',
            folder: folderValue,
            search: search || '',
            limit: 500,
            offset: 0
        };
        
        const mediaFiles = await Media.findAll(filters);
        
        // Show all DB records — file_data in DB or file on filesystem
        const seenFilenames = new Set();
        const uniqueFiles = mediaFiles.filter(media => {
            if (seenFilenames.has(media.filename)) return false;
            seenFilenames.add(media.filename);
            return true;
        });
        
        // Transform database records to match frontend format
        const formattedFiles = uniqueFiles.map(media => ({
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
        
        res.json({
            data: formattedFiles,
            total: uniqueFiles.length
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

exports.serveFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const { download } = req.query;
        const [rows] = await require('../config/database').pool.query(
            'SELECT file_data, mime_type, original_name FROM media_files WHERE filename = ? LIMIT 1',
            [filename]
        );
        if (!rows[0] || !rows[0].file_data) {
            // Fallback to filesystem
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) return res.sendFile(filePath);
            return res.status(404).json({ message: 'File not found' });
        }
        const mime = rows[0].mime_type || 'application/octet-stream';
        const originalName = rows[0].original_name || filename;
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        if (download === '1') {
            res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        }
        res.send(rows[0].file_data);
    } catch (error) {
        console.error('Serve file error:', error);
        res.status(500).json({ message: 'Failed to serve file' });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get media record before deletion
        const media = await Media.findById(id);
        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }
        
        // Delete from database
        const deleted = await Media.delete(id);
        
        if (deleted) {
            // Try to delete from filesystem as well
            const filePath = path.join(uploadDir, media.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('File deleted from filesystem:', media.filename);
            }
            
            res.json({ message: 'Media deleted successfully' });
        } else {
            res.status(404).json({ message: 'Media not found' });
        }
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
};

exports.uploadMiddleware = upload.single('file');
