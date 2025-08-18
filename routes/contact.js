const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

router.post(
	'/contact',
	asyncHandler(async (req, res) => {
		const { name, email, message } = req.body || {};
		if (!name || !email || !message) {
			return res.status(400).json({ message: 'name, email and message are required' });
		}
		const doc = await ContactMessage.create({
			name,
			email,
			message,
			meta: {
				ip: req.ip,
				userAgent: req.get('user-agent') || undefined,
				referrer: req.get('referer') || undefined,
			},
		});
		return res.status(201).json({ id: doc._id, createdAt: doc.createdAt });
	})
);

module.exports = router;
