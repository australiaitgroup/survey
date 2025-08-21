const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadsDir)) {
	try {
		fs.mkdirSync(uploadsDir, { recursive: true });
		console.log('✓ Created uploads directory:', uploadsDir);
	} catch (error) {
		console.warn('⚠️  Could not create uploads directory:', error.message);
		console.warn('   Make sure the directory exists and has proper permissions');
	}
}

// Configure storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		// Generate unique filename
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, 'question-image-' + uniqueSuffix + ext);
	},
});

// File filter for images
const fileFilter = (req, file, cb) => {
	const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

	const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
	const ext = path.extname(file.originalname).toLowerCase();

	if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
		cb(null, true);
	} else {
		cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'), false);
	}
};

const imageUpload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit for images
	},
});

module.exports = imageUpload;
