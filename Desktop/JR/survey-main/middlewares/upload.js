const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store files in memory for processing

const fileFilter = (req, file, cb) => {
	// Only allow CSV files
	if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
		cb(null, true);
	} else {
		cb(new Error('Only CSV files are allowed'), false);
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

module.exports = upload;
