// 导入并重用api.ts中的类型定义
import type {
	Survey as ApiSurvey,
	Question as ApiQuestion,
	Company as ApiCompany,
	QuestionBank as ApiQuestionBank,
	User as ApiUser,
	SurveyType,
	SurveyStatus,
	QuestionType,
	NavigationMode,
	SourceType,
	ScoringMode,
	QuestionDifficulty,
	SelectedQuestion,
	MultiQuestionBankConfig,
} from './api';

// 前端特有的Survey接口，继承API接口
export interface Survey extends ApiSurvey {
	// 可以在这里添加前端特有的属性
	createdAt: string;
	isActive: boolean;
	lastActivity?: string;
	responseCount?: number;
}

// 重用API接口定义
export interface QuestionBank extends ApiQuestionBank {}
export interface Question extends ApiQuestion {}
export interface Company extends ApiCompany {}

export interface StatsItem {
	question: string;
	options: Record<string, number>;
}

export interface UserResponse {
	_id: string;
	name: string;
	email: string;
	answers: Record<string, string>;
	createdAt: string;
	timeSpent?: number;
	isAutoSubmit?: boolean;
	metadata?: {
		userAgent?: string;
		ipAddress?: string;
		deviceType?: string;
	};
	// Optional scoring info for assessment/quiz/iq
	score?: {
		totalPoints: number;
		correctAnswers: number;
		wrongAnswers: number;
		percentage: number;
		displayScore: number;
		scoringMode: 'percentage' | 'accumulated';
		maxPossiblePoints: number;
		passed: boolean;
		formattedScore?: string;
	};
}

export interface StatsSummary {
	totalResponses: number;
	completionRate: number;
	totalQuestions: number;
}

export interface EnhancedStats {
	aggregatedStats: StatsItem[];
	userResponses: UserResponse[];
	summary: StatsSummary;
}

export type TabType = 'list' | 'detail' | 'collections' | 'question-banks' | 'profile' | 'billing';
export type StatsViewType = 'aggregated' | 'individual';

export interface QuestionForm {
	text: string;
	description?: string;
	descriptionImage?: string;
	options?: string[] | { text?: string; imageUrl?: string }[];
	type: 'single_choice' | 'multiple_choice' | 'short_text';
	correctAnswer?: number | number[] | string;
	points?: number;
	explanation?: string;
	tags?: string[];
	difficulty?: 'easy' | 'medium' | 'hard';
}

export interface LoginForm {
	username: string;
	password: string;
}

export interface RegisterForm {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	companyName?: string;
}

export interface NewSurveyForm {
	title: string;
	description: string;
	slug: string;
	type: 'survey' | 'assessment' | 'onboarding' | 'live_quiz';
	questions: {
		text: string;
		imageUrl?: string;
		descriptionImage?: string;
		type?: 'single_choice' | 'multiple_choice' | 'short_text';
		options?: string[] | { text?: string; imageUrl?: string }[];
		correctAnswer?: number | number[] | string;
		points?: number;
	}[];
	status: 'draft' | 'active' | 'closed';
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: 'step-by-step' | 'one-question-per-page';
	sourceType?: 'manual' | 'question_bank' | 'multi_question_bank' | 'manual_selection';
	questionBankId?: string;
	questionCount?: number;
	multiQuestionBankConfig?: MultiQuestionBankConfig[];
	selectedQuestions?: SelectedQuestion[];
	scoringSettings?: {
		scoringMode: 'percentage' | 'accumulated';
		totalPoints: number;
		passingThreshold: number;
		showScore: boolean;
		showCorrectAnswers: boolean;
		showScoreBreakdown: boolean;
		customScoringRules: {
			useCustomPoints: boolean;
			defaultQuestionPoints: number;
		};
		multipleChoiceScoring?: {
			enablePartialScoring: boolean;
			partialScoringMode: 'proportional' | 'all_or_nothing';
		};
		includeShortTextInScore?: boolean;
	};
	securitySettings?: {
		antiCheatEnabled: boolean;
	};
}

export interface QuestionBankForm {
	name: string;
	description: string;
}

export interface AdminUser extends ApiUser {}

export interface ProfileData {
	user: AdminUser;
	company: Company;
}

export interface ProfileForm {
	name: string;
	email: string;
	avatarUrl?: string;
}

export interface PasswordForm {
	currentPassword: string;
	newPassword: string;
}

export interface CompanyForm {
	name: string;
	industry?: string;
	logoUrl?: string;
	description?: string;
	website?: string;
	// Additional fields from onboarding
	size?: string;
	foundedYear?: number;
	contactEmail?: string;
	contactPhone?: string;
	// Address information
	address?: {
		street?: string;
		city?: string;
		state?: string;
		country?: string;
		postalCode?: string;
	};
	// Onboarding settings
	themeColor?: string;
	customLogoEnabled?: boolean;
	defaultLanguage?: string;
	autoNotifyCandidate?: boolean;
}
