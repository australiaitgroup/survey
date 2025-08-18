class AppError extends Error {
	constructor(message, statusCode = 400, i18nKey = null) {
		super(message);
		this.statusCode = statusCode;
		this.i18nKey = i18nKey;
	}
}

module.exports = AppError;
