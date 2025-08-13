const { ZodError } = require('zod');
const { HTTP_STATUS } = require('../shared/constants');

function errorHandler(err, req, res, next) {
	// Default values
	let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
	let message = 'Internal server error';

    if (err instanceof ZodError) {
		status = HTTP_STATUS.BAD_REQUEST;
        message = err.errors.map(e => e.message).join(', ');
	} else if (err.statusCode) {
		status = err.statusCode;
		message = err.message || message;
	} else if (err.message) {
		status = HTTP_STATUS.BAD_REQUEST;
		message = err.message;
	}

    // Include i18n key for client-side translation where applicable
    const response = { success: false, message, statusCode: status };
    if (err.i18nKey) {
        response.i18nKey = err.i18nKey;
    }
    res.status(status).json(response);
}

module.exports = errorHandler;
