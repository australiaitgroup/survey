const { HTTP_STATUS, ERROR_MESSAGES } = require('../shared/constants');

// Middleware to require authentication
const requireAuth = (req, res, next) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	next();
};

module.exports = {
	requireAuth,
};
