// Survey type constants
export const SURVEY_TYPE = {
	SURVEY: 'survey',
	ASSESSMENT: 'assessment',
	ONBOARDING: 'onboarding',
	LIVE_QUIZ: 'live_quiz',
} as const;

// Survey status constants
export const SURVEY_STATUS = {
	DRAFT: 'draft',
	ACTIVE: 'active',
	CLOSED: 'closed',
} as const;

// Question type constants
export const QUESTION_TYPE = {
	SINGLE_CHOICE: 'single_choice',
	MULTIPLE_CHOICE: 'multiple_choice',
	SHORT_TEXT: 'short_text',
} as const;

// Navigation mode constants
export const NAVIGATION_MODE = {
	STEP_BY_STEP: 'step-by-step',
	ONE_QUESTION_PER_PAGE: 'one-question-per-page',
} as const;

// Scoring mode constants
export const SCORING_MODE = {
	PERCENTAGE: 'percentage',
	ACCUMULATED: 'accumulated',
} as const;

// Tab constants
export const TAB_TYPES = {
	DETAIL: 'detail',
	INVITATIONS: 'invitations',
	STATISTICS: 'statistics',
	LIST: 'list',
	QUESTION_BANKS: 'question-banks',
	PREVIEW: 'preview',
} as const;

// Stats view constants
export const STATS_VIEW = {
	AGGREGATED: 'aggregated',
	INDIVIDUAL: 'individual',
} as const;

// Source type constants
export const SOURCE_TYPE = {
	MANUAL: 'manual',
	QUESTION_BANK: 'question_bank',
	MULTI_QUESTION_BANK: 'multi_question_bank',
	MANUAL_SELECTION: 'manual_selection',
} as const;

// Types for better type safety
export type SurveyType = (typeof SURVEY_TYPE)[keyof typeof SURVEY_TYPE];
export type SurveyStatus = (typeof SURVEY_STATUS)[keyof typeof SURVEY_STATUS];
export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];
export type NavigationMode = (typeof NAVIGATION_MODE)[keyof typeof NAVIGATION_MODE];
export type ScoringMode = (typeof SCORING_MODE)[keyof typeof SCORING_MODE];
export type TabType = (typeof TAB_TYPES)[keyof typeof TAB_TYPES];
export type StatsView = (typeof STATS_VIEW)[keyof typeof STATS_VIEW];
export type SourceType = (typeof SOURCE_TYPE)[keyof typeof SOURCE_TYPE];

// Types requiring answers
export const TYPES_REQUIRING_ANSWERS: SurveyType[] = [
	SURVEY_TYPE.ASSESSMENT,
	SURVEY_TYPE.LIVE_QUIZ,
];

// All valid types and statuses
export const VALID_SURVEY_TYPES = Object.values(SURVEY_TYPE);
export const VALID_SURVEY_STATUSES = Object.values(SURVEY_STATUS);
export const VALID_QUESTION_TYPES = Object.values(QUESTION_TYPE);
