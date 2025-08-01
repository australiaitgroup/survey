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

export type TabType = 'list' | 'detail' | 'question-banks' | 'profile';
export type StatsViewType = 'aggregated' | 'individual';

export interface QuestionForm {
	text: string;
	imageUrl?: string;
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
	type: 'survey' | 'assessment';
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
	navigationMode?: 'step-by-step' | 'paginated' | 'all-in-one';
	sourceType?: 'manual' | 'question_bank' | 'multi_question_bank' | 'manual_selection';
	questionBankId?: string;
	questionCount?: number;
	multiQuestionBankConfig?: {
		questionBankId: string;
		questionCount: number;
		filters?: {
			tags?: string[];
			difficulty?: 'easy' | 'medium' | 'hard';
			questionTypes?: ('single_choice' | 'multiple_choice' | 'short_text')[];
		};
	}[];
	selectedQuestions?: {
		questionBankId: string;
		questionId: string;
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
	}[];
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
}
