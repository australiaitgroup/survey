/**
 * Subscription Configuration
 * Manages subscription plans and features
 */
class SubscriptionConfig {
	constructor() {
		this.plans = this.initializePlans();
		this.statusTypes = this.initializeStatusTypes();
	}

	/**
	 * Initialize subscription plans
	 * @returns {Object} Plans configuration
	 */
	initializePlans() {
		return {
			basic: {
				name: 'Basic Plan',
				price: 1900, // $19.00 in cents
				currency: 'usd',
				interval: 'month',
				priceId: process.env.STRIPE_BASIC_PRICE_ID,
				features: {
					maxSurveys: 3,
					maxQuestionsPerSurvey: 20,
					maxInvitees: 30,
					csvImport: false,
					imageQuestions: false,
					advancedAnalytics: false,
					randomQuestions: false,
					fullQuestionBank: false,
					templates: 3,
				},
			},
			pro: {
				name: 'Pro Plan',
				price: 4900, // $49.00 in cents
				currency: 'usd',
				interval: 'month',
				priceId: process.env.STRIPE_PRO_PRICE_ID,
				features: {
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
			},
		};
	}

	/**
	 * Initialize subscription status types
	 * @returns {Object} Status types
	 */
	initializeStatusTypes() {
		return {
			ACTIVE: 'active',
			CANCELED: 'canceled',
			INCOMPLETE: 'incomplete',
			INCOMPLETE_EXPIRED: 'incomplete_expired',
			PAST_DUE: 'past_due',
			TRIALING: 'trialing',
			UNPAID: 'unpaid',
		};
	}

	/**
	 * Get all plans
	 * @returns {Object} All plans
	 */
	getAllPlans() {
		return this.plans;
	}

	/**
	 * Get plan by type
	 * @param {string} planType - Plan type
	 * @returns {Object|null} Plan or null
	 */
	getPlanByType(planType) {
		return this.plans[planType] || null;
	}

	/**
	 * Get plan features
	 * @param {string} planType - Plan type
	 * @returns {Object|null} Plan features or null
	 */
	getPlanFeatures(planType) {
		const plan = this.getPlanByType(planType);
		return plan ? plan.features : null;
	}

	/**
	 * Check if plan has feature
	 * @param {string} planType - Plan type
	 * @param {string} feature - Feature name
	 * @returns {boolean} Has feature
	 */
	hasFeature(planType, feature) {
		const features = this.getPlanFeatures(planType);
		return features ? features[feature] === true : false;
	}

	/**
	 * Get plan limit
	 * @param {string} planType - Plan type
	 * @param {string} limit - Limit name
	 * @returns {number} Limit value
	 */
	getPlanLimit(planType, limit) {
		const features = this.getPlanFeatures(planType);
		return features ? features[limit] || 0 : 0;
	}

	/**
	 * Get all status types
	 * @returns {Object} All status types
	 */
	getAllStatusTypes() {
		return this.statusTypes;
	}

	/**
	 * Validate plan type
	 * @param {string} planType - Plan type
	 * @returns {boolean} Is valid
	 */
	isValidPlanType(planType) {
		return !!this.plans[planType];
	}

	/**
	 * Get plan price in dollars
	 * @param {string} planType - Plan type
	 * @returns {number} Price in dollars
	 */
	getPlanPriceInDollars(planType) {
		const plan = this.getPlanByType(planType);
		return plan ? plan.price / 100 : 0;
	}

	/**
	 * Add new plan (extensible)
	 * @param {string} planType - Plan type
	 * @param {Object} planConfig - Plan configuration
	 */
	addPlan(planType, planConfig) {
		if (this.plans[planType]) {
			throw new Error(`Plan type '${planType}' already exists`);
		}
		this.plans[planType] = planConfig;
	}

	/**
	 * Update existing plan
	 * @param {string} planType - Plan type
	 * @param {Object} planConfig - Plan configuration
	 */
	updatePlan(planType, planConfig) {
		if (!this.plans[planType]) {
			throw new Error(`Plan type '${planType}' does not exist`);
		}
		this.plans[planType] = { ...this.plans[planType], ...planConfig };
	}
}

module.exports = SubscriptionConfig;
