const User = require('../models/User');
const Survey = require('../models/Survey');
const Invitation = require('../models/Invitation');

// Subscription plans features
const SUBSCRIPTION_FEATURES = {
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
		maxSurveys: -1, // unlimited
		maxQuestionsPerSurvey: -1, // unlimited
		maxInvitees: -1, // unlimited
		csvImport: true,
		imageQuestions: true,
		advancedAnalytics: true,
		randomQuestions: true,
		fullQuestionBank: true,
		templates: -1, // unlimited
	},
};

// Middleware to check if user has paid subscription (basic or pro)
const requireActiveSubscription = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const hasActiveSubscription =
			user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
		const hasPaidSubscription = hasActiveSubscription && user.subscriptionTier !== 'free';

		if (!hasPaidSubscription) {
			return res.status(403).json({
				error: 'Paid subscription required',
				code: 'PAID_SUBSCRIPTION_REQUIRED',
				message: 'You need to upgrade to a paid plan to access this feature.',
			});
		}

		req.user = user;
		next();
	} catch (error) {
		console.error('Error checking subscription:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

// Middleware to check specific feature access
const requireFeature = feature => {
	return async (req, res, next) => {
		try {
			const user = await User.findById(req.user._id);

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			// Default to free plan if no subscription tier set
			const userTier = user.subscriptionTier || 'free';
			const plan = SUBSCRIPTION_FEATURES[userTier];

			if (!plan) {
				return res.status(403).json({
					error: 'Invalid subscription plan',
					code: 'INVALID_PLAN',
					message: 'Your subscription plan is invalid.',
				});
			}

			const hasFeature = plan[feature] === true || plan[feature] === -1;

			if (!hasFeature) {
				const requiredPlan =
					feature === 'csvImport' ||
					feature === 'imageQuestions' ||
					feature === 'advancedAnalytics' ||
					feature === 'randomQuestions' ||
					feature === 'fullQuestionBank'
						? 'pro'
						: 'basic';

				return res.status(403).json({
					error: `Feature '${feature}' not available in your plan`,
					code: 'FEATURE_NOT_AVAILABLE',
					requiredPlan,
					message: `This feature is only available in the ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan. Please upgrade your subscription.`,
					currentPlan: userTier,
				});
			}

			req.user = user;
			next();
		} catch (error) {
			console.error('Error checking feature access:', error);
			res.status(500).json({ error: 'Internal server error' });
		}
	};
};

// Middleware to check usage limits
const checkUsageLimit = feature => {
	return async (req, res, next) => {
		try {
			const user = await User.findById(req.user._id);

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			// Default to free plan if no subscription tier set
			const userTier = user.subscriptionTier || 'free';
			const plan = SUBSCRIPTION_FEATURES[userTier];

			if (!plan) {
				return res.status(403).json({
					error: 'Invalid subscription plan',
					code: 'INVALID_PLAN',
					message: 'Your subscription plan is invalid.',
				});
			}

			const limit = plan[feature];
			if (limit === -1) {
				// Unlimited, proceed
				req.user = user;
				return next();
			}

			// Check current usage based on feature type
			let currentCount = 0;

			switch (feature) {
			case 'maxSurveys':
				currentCount = await Survey.countDocuments({ creator: user._id });
				break;
			case 'maxInvitees':
				currentCount = await Invitation.countDocuments({ inviter: user._id });
				break;
			case 'templates':
				// This would need to be implemented based on your template usage tracking
				currentCount = 0; // Placeholder
				break;
			default:
				currentCount = 0;
			}

			if (currentCount >= limit) {
				const nextPlan = userTier === 'free' ? 'basic' : 'pro';
				return res.status(403).json({
					error: `You have reached the limit of ${limit} for ${feature}`,
					code: 'USAGE_LIMIT_REACHED',
					currentCount,
					limit,
					requiredPlan: nextPlan,
					message: `You've reached your plan limit of ${limit} ${feature.replace('max', '').toLowerCase()}. Upgrade to ${nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)} for ${nextPlan === 'pro' ? 'unlimited' : 'more'} access.`,
					currentPlan: userTier,
				});
			}

			req.user = user;
			req.currentUsage = { [feature]: currentCount };
			next();
		} catch (error) {
			console.error('Error checking usage limit:', error);
			res.status(500).json({ error: 'Internal server error' });
		}
	};
};

// Middleware to check question limit for a survey
const checkQuestionLimit = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);
		const { surveyId } = req.params;
		const questionsToAdd = req.body.questions ? req.body.questions.length : 1;

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const hasActiveSubscription =
			user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

		if (!hasActiveSubscription) {
			return res.status(403).json({
				error: 'Active subscription required',
				code: 'SUBSCRIPTION_REQUIRED',
				message: 'You need an active subscription to access this feature.',
			});
		}

		const plan = SUBSCRIPTION_FEATURES[user.subscriptionTier];
		if (!plan) {
			return res.status(403).json({
				error: 'Invalid subscription plan',
				code: 'INVALID_PLAN',
				message: 'Your subscription plan is invalid.',
			});
		}

		const limit = plan.maxQuestionsPerSurvey;
		if (limit === -1) {
			// Unlimited, proceed
			req.user = user;
			return next();
		}

		// Get current question count for the survey
		const survey = await Survey.findById(surveyId);
		if (!survey) {
			return res.status(404).json({ error: 'Survey not found' });
		}

		const currentQuestionCount = survey.questions ? survey.questions.length : 0;
		const totalAfterAdd = currentQuestionCount + questionsToAdd;

		if (totalAfterAdd > limit) {
			return res.status(403).json({
				error: `Adding ${questionsToAdd} questions would exceed the limit of ${limit} questions per survey`,
				code: 'QUESTION_LIMIT_REACHED',
				currentCount: currentQuestionCount,
				limit,
				requiredPlan: 'pro',
				message: `Your ${user.subscriptionTier} plan allows up to ${limit} questions per survey. Upgrade to Pro for unlimited questions.`,
				currentPlan: user.subscriptionTier,
			});
		}

		req.user = user;
		req.currentUsage = { questionsInSurvey: currentQuestionCount };
		next();
	} catch (error) {
		console.error('Error checking question limit:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

// Helper function to get user's subscription info
const getSubscriptionInfo = async userId => {
	try {
		const user = await User.findById(userId);
		if (!user) return null;

		const hasActiveSubscription =
			user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
		const features = hasActiveSubscription
			? SUBSCRIPTION_FEATURES[user.subscriptionTier]
			: null;

		return {
			tier: user.subscriptionTier,
			status: user.subscriptionStatus,
			hasActiveSubscription,
			features,
			currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
			cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
		};
	} catch (error) {
		console.error('Error getting subscription info:', error);
		return null;
	}
};

// Helper function to check if user can perform action
const canPerformAction = async (userId, action, currentCount = 0) => {
	try {
		const user = await User.findById(userId);
		if (!user) return { allowed: false, reason: 'User not found' };

		const hasActiveSubscription =
			user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

		if (!hasActiveSubscription) {
			return {
				allowed: false,
				reason: 'No active subscription',
				code: 'SUBSCRIPTION_REQUIRED',
			};
		}

		const plan = SUBSCRIPTION_FEATURES[user.subscriptionTier];
		if (!plan) {
			return {
				allowed: false,
				reason: 'Invalid subscription plan',
				code: 'INVALID_PLAN',
			};
		}

		// Check feature access
		if (typeof plan[action] === 'boolean') {
			return {
				allowed: plan[action],
				reason: plan[action] ? null : 'Feature not available in current plan',
				code: plan[action] ? null : 'FEATURE_NOT_AVAILABLE',
			};
		}

		// Check usage limits
		if (typeof plan[action] === 'number') {
			const limit = plan[action];
			if (limit === -1) {
				return { allowed: true, reason: null };
			}

			const withinLimit = currentCount < limit;
			return {
				allowed: withinLimit,
				reason: withinLimit ? null : `Limit of ${limit} reached`,
				code: withinLimit ? null : 'USAGE_LIMIT_REACHED',
				limit,
				currentCount,
			};
		}

		return { allowed: true, reason: null };
	} catch (error) {
		console.error('Error checking if user can perform action:', error);
		return { allowed: false, reason: 'Internal error' };
	}
};

module.exports = {
	requireActiveSubscription,
	requireFeature,
	checkUsageLimit,
	checkQuestionLimit,
	getSubscriptionInfo,
	canPerformAction,
	SUBSCRIPTION_FEATURES,
};
