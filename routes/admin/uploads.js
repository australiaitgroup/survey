const express = require('express');
const { asyncHandler, jwtAuth, imageUpload } = require('./shared/middleware');
const { HTTP_STATUS } = require('./shared/constants');

const router = express.Router();

/**
 * @route   POST /admin/upload-image
 * @desc    Image upload endpoint for questions
 * @access  Private (Admin)
 */
router.post(
	'/upload-image',
	jwtAuth,
	imageUpload.single('image'),
	asyncHandler(async (req, res) => {
		if (!req.file) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'No image file provided',
			});
		}

		// Return the image URL
		const imageUrl = `/uploads/images/${req.file.filename}`;

		res.json({
			success: true,
			imageUrl: imageUrl,
			originalName: req.file.originalname,
			size: req.file.size,
		});
	})
);

module.exports = router;
