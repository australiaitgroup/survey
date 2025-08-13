// 错误消息常量
const ERROR_MESSAGES = {
	SURVEY_NOT_FOUND: 'Survey not found',
	INVALID_STATUS: 'Invalid status. Must be one of: draft, active, closed',
	COLLECTION_NOT_FOUND: 'Collection not found',
	UNAUTHORIZED: 'unauthorized',
	INVALID_DATA: 'invalid data',
	INVALID_CORRECT_ANSWER: 'invalid correctAnswer',
	INVALID_QUESTION_TYPE:
		'Invalid question type. Must be one of: single_choice, multiple_choice, short_text',
	MISSING_CORRECT_ANSWER: 'Quiz/Assessment questions must have correct answers',
	INVALID_MULTIPLE_CHOICE_ANSWER: 'Multiple choice answers must be an array of indices',
};

// 状态常量
const SURVEY_STATUS = {
	DRAFT: 'draft',
	ACTIVE: 'active',
	CLOSED: 'closed',
};

// 类型常量
const SURVEY_TYPE = {
	SURVEY: 'survey',
	ASSESSMENT: 'assessment',
	QUIZ: 'quiz',
	IQ: 'iq',
};

// 问题类型常量
const QUESTION_TYPE = {
	SINGLE_CHOICE: 'single_choice',
	MULTIPLE_CHOICE: 'multiple_choice',
	SHORT_TEXT: 'short_text',
};

// 数据类型常量
const DATA_TYPES = {
	STRING: 'string',
	NUMBER: 'number',
	ARRAY: 'array',
};

// HTTP状态码常量
const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
};

// 有效状态数组
const VALID_STATUSES = [SURVEY_STATUS.DRAFT, SURVEY_STATUS.ACTIVE, SURVEY_STATUS.CLOSED];


// 需要正确答案的题目类型
const TYPES_REQUIRING_ANSWERS = [SURVEY_TYPE.ASSESSMENT, SURVEY_TYPE.QUIZ, SURVEY_TYPE.IQ];

// 问题来源类型常量
const SOURCE_TYPE = {
	MANUAL: 'manual',
	QUESTION_BANK: 'question_bank',
	MULTI_QUESTION_BANK: 'multi_question_bank',
	MANUAL_SELECTION: 'manual_selection',
};

// 有效问题类型数组
const VALID_QUESTION_TYPES = [
	QUESTION_TYPE.SINGLE_CHOICE,
	QUESTION_TYPE.MULTIPLE_CHOICE,
	QUESTION_TYPE.SHORT_TEXT,
];

// 有效来源类型数组
const VALID_SOURCE_TYPES = [
	SOURCE_TYPE.MANUAL,
	SOURCE_TYPE.QUESTION_BANK,
	SOURCE_TYPE.MULTI_QUESTION_BANK,
	SOURCE_TYPE.MANUAL_SELECTION,
];

module.exports = {
	ERROR_MESSAGES,
	SURVEY_STATUS,
	SURVEY_TYPE,
	QUESTION_TYPE,
	SOURCE_TYPE,
	DATA_TYPES,
	HTTP_STATUS,
	VALID_STATUSES,
	TYPES_REQUIRING_ANSWERS,
	VALID_QUESTION_TYPES,
	VALID_SOURCE_TYPES,
};
