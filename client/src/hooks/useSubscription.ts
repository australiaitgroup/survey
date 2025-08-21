import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

interface SubscriptionInfo {
	subscriptionTier: 'free' | 'basic' | 'pro' | null;
	subscriptionStatus: string | null;
	subscriptionCurrentPeriodEnd: string | null;
	subscriptionCancelAtPeriodEnd: boolean;
	hasActiveSubscription: boolean;
}

interface PlanFeatures {
	maxSurveys: number;
	maxQuestionsPerSurvey: number;
	maxInvitees: number;
	csvImport: boolean;
	imageQuestions: boolean;
	advancedAnalytics: boolean;
	randomQuestions: boolean;
	fullQuestionBank: boolean;
	templates: number;
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
	free: {
		maxSurveys: 3,
		maxQuestionsPerSurvey: 10,
		maxInvitees: 10,
		csvImport: false,
		imageQuestions: false,
		advancedAnalytics: false,
		randomQuestions: false,
		fullQuestionBank: false,
		templates: 1,
	},
	basic: {
		maxSurveys: 10,
		maxQuestionsPerSurvey: 20,
		maxInvitees: 30,
		csvImport: false,
		imageQuestions: false,
		advancedAnalytics: false,
		randomQuestions: false,
		fullQuestionBank: false,
		templates: 3,
	},
	pro: {
		maxSurveys: -1,
		maxQuestionsPerSurvey: -1,
		maxInvitees: -1,
		csvImport: true,
		imageQuestions: true,
		advancedAnalytics: true,
		randomQuestions: true,
		fullQuestionBank: true,
		templates: -1,
	},
};

export const useSubscription = () => {
	const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSubscriptionInfo = useCallback(async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem('token');
			if (!token) {
				setError('No authentication token found');
				setLoading(false);
				return;
			}

			const response = await api.get('/stripe/subscription-status');

			setSubscriptionInfo(response.data);
			setError(null);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to fetch subscription info');
			console.error('Error fetching subscription info:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSubscriptionInfo();
	}, [fetchSubscriptionInfo]);

	// User always has access to free tier features
	const hasActiveSubscription = true;

	// Use free plan as default if no subscription info
	const currentTier = subscriptionInfo?.subscriptionTier || 'free';
	const currentPlanFeatures = PLAN_FEATURES[currentTier];

	// Check if user can access a specific feature
	const canAccessFeature = useCallback(
		(feature: keyof PlanFeatures): boolean => {
			if (!currentPlanFeatures) return false;
			const featureValue = currentPlanFeatures[feature];
			return featureValue === true || featureValue === -1;
		},
		[currentPlanFeatures]
	);

	// Check if user has reached limit for a feature
	const hasReachedLimit = useCallback(
		(feature: keyof PlanFeatures, currentCount: number): boolean => {
			if (!currentPlanFeatures) return true;
			const limit = currentPlanFeatures[feature];
			if (typeof limit === 'number') {
				if (limit === -1) return false; // unlimited
				return currentCount >= limit;
			}
			return false;
		},
		[currentPlanFeatures]
	);

	// Get limit for a specific feature
	const getFeatureLimit = useCallback(
		(feature: keyof PlanFeatures): number => {
			if (!currentPlanFeatures) return 0;
			const limit = currentPlanFeatures[feature];
			return typeof limit === 'number' ? limit : 0;
		},
		[currentPlanFeatures]
	);

	// Check if user needs to upgrade for a feature
	const needsUpgradeFor = useCallback(
		(feature: keyof PlanFeatures): boolean => {
			if (!hasActiveSubscription) return true;

			if (subscriptionInfo?.subscriptionTier === 'pro') return false;

			// If user has basic plan, check if feature requires pro
			const proFeatures = PLAN_FEATURES.pro;
			const basicFeatures = PLAN_FEATURES.basic;

			return proFeatures[feature] && !basicFeatures[feature];
		},
		[hasActiveSubscription, subscriptionInfo?.subscriptionTier]
	);

	// Format subscription end date
	const getFormattedEndDate = useCallback((): string | null => {
		if (!subscriptionInfo?.subscriptionCurrentPeriodEnd) return null;

		return new Date(subscriptionInfo.subscriptionCurrentPeriodEnd).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}, [subscriptionInfo?.subscriptionCurrentPeriodEnd]);

	// Get upgrade prompt message
	const getUpgradeMessage = useCallback(
		(feature: keyof PlanFeatures): string => {
			const featureNames: Record<keyof PlanFeatures, string> = {
				maxSurveys: 'create more surveys',
				maxQuestionsPerSurvey: 'add more questions',
				maxInvitees: 'invite more users',
				csvImport: 'import CSV files',
				imageQuestions: 'add image questions',
				advancedAnalytics: 'access advanced analytics',
				randomQuestions: 'use random question selection',
				fullQuestionBank: 'access full question bank',
				templates: 'use more templates',
			};

			const featureName = featureNames[feature] || feature;

			if (!hasActiveSubscription) {
				return `You need an active subscription to ${featureName}.`;
			}

			if (subscriptionInfo?.subscriptionTier === 'basic') {
				return `Upgrade to Pro plan to ${featureName}.`;
			}

			return `This feature requires a subscription to ${featureName}.`;
		},
		[hasActiveSubscription, subscriptionInfo?.subscriptionTier]
	);

	// Get remaining usage for a feature
	const getRemainingUsage = useCallback(
		(feature: keyof PlanFeatures, currentCount: number): number => {
			if (!currentPlanFeatures) return 0;
			const limit = currentPlanFeatures[feature];
			if (typeof limit === 'number') {
				if (limit === -1) return Infinity; // unlimited
				return Math.max(0, limit - currentCount);
			}
			return 0;
		},
		[currentPlanFeatures]
	);

	// Check if upgrade is available
	const canUpgrade = useCallback((): boolean => {
		return subscriptionInfo?.subscriptionTier === 'basic' || !hasActiveSubscription;
	}, [subscriptionInfo?.subscriptionTier, hasActiveSubscription]);

	// Check if downgrade is available
	const canDowngrade = useCallback((): boolean => {
		return subscriptionInfo?.subscriptionTier === 'pro';
	}, [subscriptionInfo?.subscriptionTier]);

	return {
		subscriptionInfo,
		loading,
		error,
		hasActiveSubscription,
		currentPlanFeatures,
		canAccessFeature,
		hasReachedLimit,
		getFeatureLimit,
		needsUpgradeFor,
		getFormattedEndDate,
		getUpgradeMessage,
		getRemainingUsage,
		canUpgrade,
		canDowngrade,
		refetch: fetchSubscriptionInfo,
	};
};

export default useSubscription;
