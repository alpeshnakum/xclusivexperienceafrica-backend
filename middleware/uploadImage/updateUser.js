const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

const ensureDirectoryExistence = async (filePath) => {
    try {
        await fs.mkdir(filePath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
};

const generateFilename = (originalname) => {
    const timestamp = Date.now();
    const ext = path.extname(originalname);
    const baseName = path.basename(originalname, ext);
    return `${baseName}-${timestamp}${ext}`;
};

const deleteExistingAvatar = async (userId, uploadPath) => {
    try {
        const avatarDir = path.resolve(__dirname, '..', '..', uploadPath, userId);
        if (!existsSync(avatarDir)) return;

        const files = await fs.readdir(avatarDir);
        const existingAvatar = files[0];

        if (existingAvatar) {
            await fs.unlink(path.join(avatarDir, existingAvatar));
        }
    } catch (err) {
        console.error(`Failed to delete existing avatar for user ${userId}:`, err); // Fixed email typo
    }
};

const documentsStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const userId = req.user?._id?.toString() || 'anonymous';
            let uploadPath = `uploads/docs/${userId}/`;
            if (file.fieldname === 'avatar') {
                uploadPath = `uploads/avatars/${userId}/`;
                if (req.user?._id) {
                    await deleteExistingAvatar(userId, 'uploads/avatars');
                }
            }
            const fullPath = path.resolve(__dirname, '..', '..', uploadPath);
            await ensureDirectoryExistence(fullPath);
            cb(null, fullPath);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        try {
            const filename = generateFilename(file.originalname);
            cb(null, filename);
        } catch (err) {
            cb(err);
        }
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError('INVALID_FILE_TYPE', 'Only images (JPEG, PNG, JPG) and PDFs are allowed.'), false);
    }
};

const documentUpload = multer({
    storage: documentsStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 },
});

const updateUserPassportImage = documentUpload.fields([
    { name: 'documents', maxCount: 10 },
    { name: 'avatar', maxCount: 1 },
]);

const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds 15MB limit.' });
        }
        if (err.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files uploaded.' });
        }
        return res.status(400).json({ message: 'File upload error.', error: err.message });
    }
    if (err) {
        return res.status(500).json({ message: 'Server error during file upload.', error: err.message });
    }
    next();
};

module.exports = {
    updateUserPassportImage,
    multerErrorHandler,
};