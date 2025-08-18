const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		surveyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Survey' }],
		tags: [{ type: String }],
		companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);
