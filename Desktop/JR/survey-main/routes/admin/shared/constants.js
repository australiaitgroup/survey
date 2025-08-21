const { ERROR_MESSAGES, DATA_TYPES, HTTP_STATUS } = require('../../../shared/constants');
const AppError = require('../../../utils/AppError');
const { readJson } = require('../../../utils/file');
const path = require('path');

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

// File paths
const RESPONSES_FILE = path.join(__dirname, '..', '..', '..', 'responses.json');

module.exports = {
	ERROR_MESSAGES,
	DATA_TYPES,
	HTTP_STATUS,
	AppError,
	readJson,
	ADMIN_USERNAME,
	ADMIN_PASSWORD,
	RESPONSES_FILE,
};
