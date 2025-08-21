// Types for Public Banks feature

export type QuestionType =
	| 'single_choice'
	| 'multiple_choice'
	| 'short_text'
	| 'true_false'
	| 'text'
	| 'number';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type BankType = 'free' | 'paid';

export interface PublicBank {
	_id: string;
	title: string;
	description: string;
	type: BankType;
	priceOneTime?: number;
	tags: string[];
	locales: string[];
	isActive: boolean;
	questions?: Question[];
	questionCount?: number;
	usageCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface Question {
	_id?: string;
	text: string;
	description?: string;
	descriptionImage?: string;
	type: QuestionType;
	options?: (string | { text?: string; imageUrl?: string })[];
	correctAnswer?: number | number[] | string;
	explanation?: string;
	points: number;
	tags: string[];
	difficulty: QuestionDifficulty;
	createdAt?: string;
	updatedAt?: string;
}

export interface BankUsageData {
	totalUsage: number;
	uniqueCompanies: number;
	recentUsage: Array<{
		company: string;
		date: string;
		surveyTitle: string;
	}>;
	usageByMonth: Array<{
		month: string;
		count: number;
	}>;
}

export interface QuestionForm {
	text: string;
	description?: string;
	descriptionImage?: string;
	type: QuestionType;
	options?: (string | { text?: string; imageUrl?: string })[];
	correctAnswer?: number | number[] | string;
	explanation?: string;
	points: number;
	tags: string[];
	difficulty?: string;
}

export interface QuestionFormData {
	text: string;
	description: string;
	descriptionImage?: string;
	type: QuestionType;
	options: (string | { text?: string; imageUrl?: string })[];
	correctAnswer: any;
	explanation: string;
	points: number;
	tags: string[];
	difficulty: string;
}

export interface PublicBankFormData {
	title: string;
	description: string;
	type: BankType;
	priceOneTime: number;
	tags: string[];
	locales: string[];
	isActive: boolean;
}

export interface CSVImportResult {
	success: boolean;
	imported: number;
	failed: number;
	errors?: string[];
}
