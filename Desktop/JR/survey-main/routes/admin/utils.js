const express = require('express');

const router = express.Router();

/**
 * @route   GET /admin/debug-timestamp
 * @desc    Debug route to check if server updated
 * @access  Public
 */
router.get('/debug-timestamp', (req, res) => {
	res.json({
		timestamp: new Date().toISOString(),
		message: 'Server updated at this time',
	});
});

module.exports = router;
