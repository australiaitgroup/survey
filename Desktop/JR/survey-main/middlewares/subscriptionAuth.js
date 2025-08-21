const serviceContainer = require('../services/ServiceContainer');

/**
 * Middleware to check subscription feature access
 * @param {string} feature - Feature name to check
 * @returns {Function} Express middleware
 */
function requireFeature(feature) {
	return (req, res, next) => {
		try {
			const subscriptionService = serviceContainer.resolve('subscriptionService');
			const user = req.user;

			if (!user) {
				return res.status(401).json({ error: 'Authentication required' });
			}

			const hasAccess = subscriptionService.hasFeatureAccess(user, feature);
			if (!hasAccess) {
				return res.status(403).json({
					error: 'Feature not available in your subscription plan',
					feature,
					subscriptionTier: user.subscriptionTier,
				});
			}

			next();
		} catch (error) {
			console.error('Error checking feature access:', error);
			res.status(500).json({ error: 'Failed to check feature access' });
		}
	};
}

/**
 * Middleware to check subscription limits
 * @param {string} limit - Limit name to check
 * @param {Function} getCurrentCount - Function to get current count
 * @returns {Function} Express middleware
 */
function checkLimit(limit, getCurrentCount) {
	return async (req, res, next) => {
		try {
			const subscriptionService = serviceContainer.resolve('subscriptionService');
			const user = req.user;

			if (!user) {
				return res.status(401).json({ error: 'Authentication required' });
			}

			const currentCount = await getCurrentCount(req);
			const userLimit = subscriptionService.getUserLimit(user, limit);

			if (userLimit !== -1 && currentCount >= userLimit) {
				return res.status(403).json({
					error: `Limit exceeded for ${limit}`,
					current: currentCount,
					limit: userLimit,
					subscriptionTier: user.subscriptionTier,
				});
			}

			next();
		} catch (error) {
			console.error('Error checking limit:', error);
			res.status(500).json({ error: 'Failed to check limit' });
		}
	};
}

/**
 * Middleware to check if user has active subscription
 * @returns {Function} Express middleware
 */
function requireActiveSubscription() {
	return (req, res, next) => {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		if (!user.hasActiveSubscription) {
			return res.status(403).json({
				error: 'Active subscription required',
				subscriptionStatus: user.subscriptionStatus,
			});
		}

		next();
	};
}

module.exports = {
	requireFeature,
	checkLimit,
	requireActiveSubscription,
};
