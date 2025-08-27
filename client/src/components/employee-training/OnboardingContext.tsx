import React, { createContext, useContext } from 'react';

// Types
interface OnboardingTemplate {
	_id: string;
	title: string;
	description?: string;
	instructions?: string;
	onboardingSettings: {
		sections: Array<{
			id: string;
			title: string;
			description: string;
			required: boolean;
			order: number;
		}>;
		learningPath: {
			type: 'sequential' | 'adaptive';
			allowSkipping: boolean;
			requireCompletion: boolean;
		};
		compliance: {
			required: boolean;
			minimumScore: number;
			certificateRequired: boolean;
		};
	};
	questions: Array<{
		_id: string;
		text: string;
		description?: string;
		type: 'single_choice' | 'multiple_choice' | 'short_text';
		options?: Array<{ text: string; imageUrl?: string }>;
		correctAnswer: any;
		explanation?: string;
		points: number;
		onboarding?: {
			hints: Array<{
				order: number;
				content: string;
				showAfterAttempts: number;
				isProgressive: boolean;
			}>;
			learningContext?: {
				background?: string;
				keyConcepts?: string[];
				relatedTopics?: string[];
			};
			learningObjectives?: string[];
			difficulty?: 'beginner' | 'intermediate' | 'advanced';
			maxAttempts?: number;
		};
	}>;
	timeLimit?: number;
	maxAttempts?: number;
}

interface OnboardingState {
	template: OnboardingTemplate | null;
	currentSectionIndex: number;
	currentQuestionIndex: number;
	answers: Record<string, any>;
	attempts: Record<string, number>;
	completedSections: string[];
	startedAt: Date | null;
	status: 'loading' | 'not_started' | 'in_progress' | 'completed' | 'failed';
	error: string | null;
}

interface OnboardingActions {
	submitAnswer: (questionId: string, answer: any) => Promise<void>;
	completeSection: (sectionId: string) => Promise<void>;
	loadOnboarding: () => Promise<void>;
}

interface OnboardingContextType {
	state: OnboardingState;
	actions: OnboardingActions;
}

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Custom hook to use the context
export const useOnboarding = () => {
	const context = useContext(OnboardingContext);
	if (context === undefined) {
		throw new Error('useOnboarding must be used within an OnboardingProvider');
	}
	return context;
};

// Provider component
export const OnboardingProvider: React.FC<{
	children: React.ReactNode;
	value: OnboardingContextType;
}> = ({ children, value }) => {
	return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export { OnboardingContext };
export type { OnboardingTemplate, OnboardingState, OnboardingActions };
