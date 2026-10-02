const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');

// Configure multer for file uploads directly in memory (zero disk touches)
const storage = multer.memoryStorage();

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

// Helper to build fully accessible public URL matching client origin or host
const buildPublicUrl = (req, filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const origin = req.headers['origin'] || req.headers['referer'];
    if (origin) {
        try {
            const parsed = new URL(origin);
            const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
            return `${parsed.origin}${cleanPath}`;
        } catch (e) { /* ignore */ }
    }
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:5000';
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${proto}://${host}${cleanPath}`;
};

// Store original filename mapping
const filenameMapping = new Map();

exports.uploadFile = async (req, res) => {
    try {
        console.log('Upload request received');

        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate unique filename since memoryStorage keeps file in RAM
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = req.file.filename || (uniqueSuffix + path.extname(req.file.originalname));
        req.file.filename = filename;

        console.log('File uploaded to memory:', req.file.filename);

        // Determine file type and folder
        const ext = path.extname(req.file.filename).toLowerCase();
        let fileType = 'other';
        let folder = 'Documents';

        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            fileType = 'image';
            folder = 'Images';
        } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
            fileType = 'video';
            folder = 'Videos';
        } else if (['.pdf', '.doc', '.docx'].includes(ext)) {
            fileType = 'document';
            folder = 'Documents';
        }

        // Save to database with physical disk persistence (avoids memory exhaustion)
        const mediaData = {
            filename: req.file.filename,
            original_name: req.file.originalname,
            file_path: relativeUrl,
            file_type: fileType,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            folder: folder,
            uploaded_by: req.user ? req.user.id : null,
            file_data: null
        };

        const savedMedia = await Media.create(mediaData);
        console.log('Media saved to database and persisted to disk:', savedMedia.filename);

        res.json({
            message: 'File uploaded successfully',
            file: {
                id: savedMedia.id,
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: fullUrl,
                url: fullUrl,
                full_url: fullUrl,
                relative_url: relativeUrl
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

exports.getAllFiles = async (req, res) => {
    try {
        // Security check: If caller is not admin, restrict to user's own files
        if (req.user && req.user.role !== 'admin') {
            return exports.getUserFiles(req, res);
        }

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
        const formattedFiles = uniqueFiles.map(media => {
            const relativePath = media.file_path && media.file_path.startsWith('/') ? media.file_path : `/${media.file_path || `uploads/${media.filename}`}`;
            const fullUrl = buildPublicUrl(req, relativePath);
            return {
                id: media.id,
                name: media.original_name,
                filename: media.filename,
                type: media.file_type,
                url: fullUrl,
                full_url: fullUrl,
                relative_url: relativePath,
                path: fullUrl,
                thumbnail: media.file_type === 'image' ? fullUrl : null,
                size: media.file_size,
                folder: media.folder,
                createdAt: media.created_at,
                usageCount: 0,
                content_title: null,
            };
        });

        res.json({
            data: formattedFiles,
            total: uniqueFiles.length
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
};

exports.getUserFiles = async (req, res) => {
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
            uploaded_by: req.user.id, // Filter by current user
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
        const formattedFiles = uniqueFiles.map(media => {
            const relativePath = media.file_path && media.file_path.startsWith('/') ? media.file_path : `/${media.file_path || `uploads/${media.filename}`}`;
            const fullUrl = buildPublicUrl(req, relativePath);
            return {
                id: media.id,
                name: media.original_name,
                filename: media.filename,
                type: media.file_type,
                url: fullUrl,
                full_url: fullUrl,
                relative_url: relativePath,
                path: fullUrl,
                thumbnail: media.file_type === 'image' ? fullUrl : null,
                size: media.file_size,
                folder: media.folder,
                createdAt: media.created_at,
                usageCount: 0,
                content_title: null,
            };
        });

        res.json({
            data: formattedFiles,
            total: uniqueFiles.length
        });
    } catch (error) {
        console.error('Error fetching user files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
};

exports.getUserFolderCounts = async (req, res) => {
    try {
        const counts = await Media.getFolderCountsByUser(req.user.id);
        res.json(counts);
    } catch (error) {
        console.error('Error fetching user folder counts:', error);
        res.status(500).json({ message: 'Failed to fetch folder counts' });
    }
};

exports.getFolderCounts = async (req, res) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            return exports.getUserFolderCounts(req, res);
        }
        const counts = await Media.getFolderCounts();
        res.json(counts);
    } catch (error) {
        console.error('Error fetching folder counts:', error);
        res.status(500).json({ message: 'Failed to fetch folder counts' });
    }
};

exports.serveFile = async (req, res) => {
    try {
        const filename = path.basename(req.params.filename);
        const { download } = req.query;

        // First check disk filesystem (streaming, zero memory buffering)
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
            if (download === '1') {
                return res.download(filePath, filename);
            }
            return res.sendFile(filePath);
        }

        // Fallback: check database if old file was stored only in DB blob
        const [rows] = await require('../config/database').pool.query(
            'SELECT file_data, mime_type, original_name FROM media_files WHERE filename = ? LIMIT 1',
            [filename]
        );
        if (rows[0] && rows[0].file_data) {
            const mime = rows[0].mime_type || 'application/octet-stream';
            const originalName = rows[0].original_name || filename;
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            if (download === '1') {
                res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
            }
            return res.send(rows[0].file_data);
        }

        return res.status(404).json({ message: 'File not found' });
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

        // Non-admin users can only delete their own uploaded files
        if (req.user && req.user.role !== 'admin') {
            if (!media.uploaded_by || Number(media.uploaded_by) !== Number(req.user.id)) {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own media files' });
            }
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
