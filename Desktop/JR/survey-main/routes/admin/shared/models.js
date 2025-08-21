// Centralized model imports for admin routes
const Survey = require('../../../models/Survey');
const Response = require('../../../models/Response');
const Invitation = require('../../../models/Invitation');
const User = require('../../../models/User');
const Company = require('../../../models/Company');
const QuestionBank = require('../../../models/QuestionBank');

module.exports = {
	Survey,
	Response,
	Invitation,
	User,
	Company,
	QuestionBank,
};
