const asyncHandler = require('../../../middlewares/asyncHandler');
const { jwtAuth } = require('../../../middlewares/jwtAuth');
const imageUpload = require('../../../middlewares/imageUpload');

module.exports = {
	asyncHandler,
	jwtAuth,
	imageUpload,
};
