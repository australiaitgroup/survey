import type { Survey as ApiSurvey, Question as ApiQuestion, Company } from '../../types/api';
import type { ScoringMode } from '../../constants';

export type Survey = ApiSurvey;
export type Question = ApiQuestion;
export type { Company };

export interface FormState {
    name: string;
    email: string;
    answers: Record<string, string | string[]>;
}

export interface AssessmentResult {
	questionId: string;
	questionText: string;
	questionDescription?: string;
	userAnswer: string | string[];
	correctAnswer: string;
	isCorrect: boolean;
	pointsAwarded: number;
	maxPoints: number;
	descriptionImage?: string;
}

export interface ScoringResult {
	totalPoints: number;
	maxPossiblePoints: number;
	correctAnswers: number;
	wrongAnswers: number;
	displayScore: number;
	passed: boolean;
	scoringMode: ScoringMode;
	scoringDescription: string;
}
