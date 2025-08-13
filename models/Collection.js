const mongoose = require('mongoose');
const { COLLECTION_STATUS } = require('../shared/constants');

const collectionSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		surveyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Survey' }],
		tags: [{ type: String }],
		status: {
			type: String,
			enum: [COLLECTION_STATUS.DRAFT, COLLECTION_STATUS.ACTIVE, COLLECTION_STATUS.ARCHIVED],
			default: COLLECTION_STATUS.DRAFT,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);
