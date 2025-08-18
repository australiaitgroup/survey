// ===== 基础类型定义 =====

export type SurveyType = 'survey' | 'assessment' | 'onboarding' | 'live_quiz';
export type SurveyStatus = 'draft' | 'active' | 'closed';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_text';
export type NavigationMode = 'step-by-step' | 'one-question-per-page';
export type SourceType = 'manual' | 'question_bank' | 'multi_question_bank' | 'manual_selection';
export type ScoringMode = 'percentage' | 'accumulated';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type DistributionMode = 'open' | 'targeted' | 'link';
export type UserRole = 'admin' | 'user' | 'student';

// ===== 选项类型 =====

export interface QuestionOption {
	text?: string;
	imageUrl?: string;
}

// ===== 公司相关接口 =====

export interface Company {
	_id: string;
	name: string;
	slug?: string;
	industry?: string;
	logoUrl?: string;
	description?: string;
	website?: string;
	// Onboarding fields
	size?: string;
	contactName?: string;
	contactEmail?: string;
	role?: string;
	themeColor?: string;
	customLogoEnabled?: boolean;
	defaultLanguage?: string;
	autoNotifyCandidate?: boolean;
	isOnboardingCompleted?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CompanyCreateRequest {
	name: string;
	industry?: string;
	logoUrl?: string;
	description?: string;
	website?: string;
	// Onboarding fields
	size?: string;
	contactName?: string;
	contactEmail?: string;
	role?: string;
	themeColor?: string;
	customLogoEnabled?: boolean;
	defaultLanguage?: string;
	autoNotifyCandidate?: boolean;
	isOnboardingCompleted?: boolean;
}

export interface CompanyUpdateRequest extends Partial<CompanyCreateRequest> {}

// ===== 用户相关接口 =====

export interface User {
	_id: string;
	name: string;
	email: string;
	role: UserRole;
	studentId?: string;
	companyId?: string;
	avatarUrl?: string;
	isActive: boolean;
	lastLoginAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface UserCreateRequest {
	name: string;
	email: string;
	password: string;
	role?: UserRole;
	studentId?: string;
	companyId?: string;
	avatarUrl?: string;
}

export interface UserUpdateRequest extends Partial<Omit<UserCreateRequest, 'password'>> {}

export interface UserLoginRequest {
	username: string; // can be email
	password: string;
}

export interface UserRegisterRequest {
	name: string;
	email: string;
	password: string;
	companyName?: string;
}

// ===== 认证相关接口 =====

export interface AuthResponse {
	success: boolean;
	token?: string;
	user?: {
		id: string;
		name: string;
		email: string;
		role: UserRole;
	};
	error?: string;
}

export interface ProfileData {
	user: {
		_id: string;
		name: string;
		email: string;
		avatarUrl?: string;
	};
	company: Company;
}

// ===== 问题相关接口 =====

export interface Question {
	_id: string;
	text: string;
	description?: string;
	imageUrl?: string;
	descriptionImage?: string;
	type: QuestionType;
	options?: string[] | QuestionOption[];
	correctAnswer?: number | number[] | string;
	explanation?: string;
	points?: number;
	tags?: string[];
	difficulty?: QuestionDifficulty;
}

export interface QuestionCreateRequest {
	text: string;
	description?: string;
	imageUrl?: string;
	descriptionImage?: string;
	type: QuestionType;
	options?: string[] | QuestionOption[];
	correctAnswer?: number | number[] | string;
	explanation?: string;
	points?: number;
	tags?: string[];
	difficulty?: QuestionDifficulty;
}

export interface QuestionUpdateRequest extends Partial<QuestionCreateRequest> {}

// ===== 题库相关接口 =====

export interface QuestionBank {
	_id: string;
	name: string;
	description: string;
	questions: Question[];
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	questionCount: number;
}

export interface QuestionBankCreateRequest {
	name: string;
	description: string;
}

export interface QuestionBankUpdateRequest extends Partial<QuestionBankCreateRequest> {}

// ===== Survey相关接口 =====

export interface MultiQuestionBankConfig {
	questionBankId: string;
	questionCount: number;
	isPublic?: boolean; // Flag to indicate if this is from a public bank
	filters?: {
		tags?: string[];
		difficulty?: QuestionDifficulty;
		questionTypes?: QuestionType[];
	};
}

export interface SelectedQuestion {
	questionBankId: string;
	questionId: string;
	isPublic?: boolean; // Flag to indicate if this is from a public bank
	questionSnapshot?: {
		text: string;
		type: string;
		options?: string[];
		correctAnswer?: unknown;
		explanation?: string;
		points?: number;
		tags?: string[];
		difficulty?: string;
	};
}

export interface ScoringSettings {
	scoringMode: ScoringMode;
	totalPoints: number;
	passingThreshold: number;
	showScore: boolean;
	showCorrectAnswers: boolean;
	showScoreBreakdown: boolean;
	customScoringRules: {
		useCustomPoints: boolean;
		defaultQuestionPoints: number;
	};
}

export interface Survey {
	_id: string;
	title: string;
	description: string;
	slug: string;
	type: SurveyType;
	questions: Question[];
	isActive: boolean;
	status: SurveyStatus;
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: NavigationMode;
	sourceType?: SourceType;
	questionBankId?: string;
	questionCount?: number;
	multiQuestionBankConfig?: MultiQuestionBankConfig[];
	selectedQuestions?: SelectedQuestion[];
	scoringSettings?: ScoringSettings;
	createdAt: string;
	updatedAt: string;
	// 新增：公司信息（用于assessment页面显示logo）
	company?: Company;
}

export interface SurveyCreateRequest {
	title: string;
	description: string;
	slug?: string;
	type: SurveyType;
	questions?: QuestionCreateRequest[];
	status?: SurveyStatus;
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: NavigationMode;
	sourceType?: SourceType;
	questionBankId?: string;
	questionCount?: number;
	multiQuestionBankConfig?: MultiQuestionBankConfig[];
	selectedQuestions?: SelectedQuestion[];
	scoringSettings?: ScoringSettings;
}

export interface SurveyUpdateRequest extends Partial<SurveyCreateRequest> {}

// ===== 回答相关接口 =====

export interface QuestionSnapshot {
	questionId?: string;
	questionIndex: number;
	questionData: Question;
	userAnswer: unknown;
	scoring: {
		isCorrect: boolean;
		pointsAwarded: number;
		maxPoints: number;
	};
}

export interface ResponseScore {
	totalPoints: number;
	correctAnswers: number;
	wrongAnswers: number;
	percentage: number;
	passed: boolean;
	scoringMode: ScoringMode;
	maxPossiblePoints: number;
	displayScore: number;
	scoringDetails: {
		questionScores: {
			questionIndex: number;
			pointsAwarded: number;
			maxPoints: number;
			isCorrect: boolean;
		}[];
	};
}

export interface Response {
	_id: string;
	name: string;
	email: string;
	surveyId: string;
	answers: Map<string, unknown> | Record<string, unknown>;
	questionSnapshots?: QuestionSnapshot[];
	selectedQuestions?: {
		originalQuestionId?: string;
		questionIndex?: number;
		questionData?: unknown;
	}[];
	score?: ResponseScore;
	timeSpent: number;
	isAutoSubmit: boolean;
	metadata?: {
		userAgent?: string;
		ipAddress?: string;
		deviceType?: string;
	};
	createdAt: string;
}

export interface ResponseCreateRequest {
	name: string;
	email: string;
	surveyId: string;
	answers: unknown[] | Record<string, unknown>;
	timeSpent?: number;
	isAutoSubmit?: boolean;
	// Answer durations for each question (questionId -> duration in seconds)
	answerDurations?: Record<string, number>;
	metadata?: {
		userAgent?: string;
		ipAddress?: string;
		deviceType?: string;
	};
}

// ===== 邀请相关接口 =====

export interface Invitation {
	_id: string;
	surveyId: string;
	invitationCode: string;
	distributionMode: DistributionMode;
	targetUsers: string[];
	targetEmails: string[];
	maxResponses?: number;
	currentResponses: number;
	expiresAt?: string;
	isActive: boolean;
	createdAt: string;
	createdBy?: string;
	accessLog: {
		userId?: string;
		email?: string;
		accessedAt: string;
		ipAddress?: string;
	}[];
	completedBy: {
		userId?: string;
		email?: string;
		completedAt: string;
	}[];
}

export interface InvitationCreateRequest {
	surveyId: string;
	distributionMode: DistributionMode;
	targetUsers?: string[];
	targetEmails?: string[];
	maxResponses?: number;
	expiresAt?: string;
	preventDuplicates?: boolean;
}

export interface InvitationUpdateRequest
	extends Partial<Omit<InvitationCreateRequest, 'surveyId'>> {}

// ===== 统计相关接口 =====

export interface QuestionStatistics {
	questionIndex: number;
	questionText: string;
	questionType: QuestionType;
	totalAnswers: number;
	optionStatistics: {
		optionIndex: number;
		optionText: string;
		count: number;
		percentage: number;
	}[];
	correctAnswerRate?: number;
}

export interface SurveyStatistics {
	totalResponses: number;
	averageScore: number;
	passRate: number;
	questionStatistics: QuestionStatistics[];
}

export interface UserResponseData {
	_id: string;
	name: string;
	email: string;
	answers: Record<string, string>;
	createdAt: string;
	timeSpent?: number;
	isAutoSubmit?: boolean;
	score?: {
		totalPoints: number;
		correctAnswers: number;
		wrongAnswers: number;
		percentage: number;
		displayScore: number;
		scoringMode: ScoringMode;
		maxPossiblePoints: number;
		passed: boolean;
		formattedScore?: string;
	};
}

export interface StatisticsResponse {
	aggregatedStats: {
		question: string;
		options: Record<string, number>;
	}[];
	userResponses: UserResponseData[];
	summary: {
		totalResponses: number;
		completionRate: number;
		totalQuestions: number;
	};
}

// ===== API响应包装器 =====

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface ApiError {
	success: false;
	error: string;
	statusCode?: number;
}

// ===== 邀请批量操作接口 =====

export interface InvitationBulkCreateRequest {
	surveyId: string;
	invitations: InvitationCreateRequest[];
}

export interface InvitationBulkResult {
	created: Invitation[];
	errors: {
		invitationData: InvitationCreateRequest;
		error: string;
	}[];
}

export interface InvitationEmailResult {
	email: string;
	status: 'success' | 'fail';
	error?: string;
}

// ===== Collections =====
export interface Collection {
	_id: string;
	name: string;
	description?: string;
	surveyIds: string[];
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CollectionCreateRequest {
	name: string;
	description?: string;
	surveyIds?: string[];
	tags?: string[];
}

export interface CollectionUpdateRequest extends Partial<CollectionCreateRequest> {}

// ===== 文件上传相关接口 =====

export interface FileUploadResponse {
	success: boolean;
	imageUrl?: string;
	originalName?: string;
	size?: number;
	error?: string;
}

// ===== Dashboard统计接口 =====

export interface DashboardStatistics {
	overview: {
		totalSurveys: number;
		activeSurveys: number;
		totalInvitations: number;
		activeInvitations: number;
		totalUsers: number;
		totalResponses: number;
	};
	charts: {
		surveysByType: { _id: SurveyType; count: number }[];
		invitationsByMode: { _id: DistributionMode; count: number }[];
		usersByRole: { _id: UserRole; count: number }[];
	};
	recent: {
		surveys: {
			_id: string;
			title: string;
			status: SurveyStatus;
			createdAt: string;
		}[];
		invitations: {
			_id: string;
			surveyId: {
				title: string;
			};
			distributionMode: DistributionMode;
			currentResponses: number;
			createdAt: string;
		}[];
	};
}

// ===== Assessment访问相关接口 =====

export interface AssessmentAccessResponse {
	survey: Survey & {
		company?: Company; // 确保包含公司信息用于显示logo
	};
	invitation?: {
		id: string;
		distributionMode: DistributionMode;
		maxResponses?: number;
		currentResponses: number;
		expiresAt?: string;
	};
}

// ===== 查询参数接口 =====

export interface StatisticsFilters {
	name?: string;
	email?: string;
	fromDate?: string;
	toDate?: string;
	status?: string;
}

export interface SurveyListQuery {
	type?: SurveyType;
	status?: SurveyStatus;
	search?: string;
	page?: number;
	limit?: number;
}

export interface ResponseListQuery {
	surveyId?: string;
	email?: string;
	fromDate?: string;
	toDate?: string;
	includeScores?: boolean;
}
