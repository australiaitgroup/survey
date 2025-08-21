const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('../shared/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Middleware to verify JWT token
const jwtAuth = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({
			error: 'No token provided',
		});
	}

	const token = authHeader.split(' ')[1];

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload; // { id: string, username: string }
		next();
	} catch (error) {
		console.error('JWT verification failed:', error.message);
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({
			error: 'Invalid or expired token',
		});
	}
};

module.exports = {
	jwtAuth,
	JWT_SECRET,
};
