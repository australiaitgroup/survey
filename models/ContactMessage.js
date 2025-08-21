const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 200 },
		email: { type: String, required: true, trim: true, lowercase: true },
		message: { type: String, required: true, trim: true, maxlength: 5000 },
		meta: {
			ip: String,
			userAgent: String,
			referrer: String,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
