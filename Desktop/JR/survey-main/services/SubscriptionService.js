const User = require('../models/User');
const ISubscriptionService = require('../interfaces/ISubscriptionService');
const SubscriptionConfig = require('../config/SubscriptionConfig');

/**
 * Subscription Service Implementation
 * Handles subscription business logic
 */
class SubscriptionService extends ISubscriptionService {
	constructor(paymentService) {
		super();
		this.paymentService = paymentService;
		this.config = new SubscriptionConfig();
	}

	/**
	 * Get available subscription plans
	 * @returns {Object} Available plans
	 */
	getAvailablePlans() {
		return this.config.getAllPlans();
	}

	/**
	 * Get plan by type
	 * @param {string} planType - Plan type
	 * @returns {Object} Plan details
	 */
	getPlanByType(planType) {
		return this.config.getPlanByType(planType);
	}

	/**
	 * Get plan type from subscription
	 * @param {Object} subscription - Subscription object
	 * @returns {string} Plan type
	 */
	getPlanTypeFromSubscription(subscription) {
		const priceId = subscription.items.data[0].price.id;

		if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
			return 'basic';
		} else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
			return 'pro';
		}

		return null;
	}

	/**
	 * Update user subscription
	 * @param {string} userId - User ID
	 * @param {Object} subscription - Subscription object
	 * @param {string} planType - Plan type
	 * @returns {Promise<Object>} Updated user
	 */
	async updateUserSubscription(userId, subscription, planType) {
		try {
			const user = await User.findById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			// Update subscription details
			user.stripeSubscriptionId = subscription.id;
			user.subscriptionTier = planType;
			user.subscriptionStatus = subscription.status;
			user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
			user.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end;
			user.hasActiveSubscription = subscription.status === 'active';

			await user.save();
			return user;
		} catch (error) {
			console.error('Error updating user subscription:', error);
			throw error;
		}
	}

	/**
	 * Handle subscription creation
	 * @param {Object} session - Checkout session
	 * @returns {Promise<void>}
	 */
	async handleSubscriptionCreated(session) {
		try {
			const userId = session.metadata.userId;
			const planType = session.metadata.planType;

			if (session.mode === 'subscription' && userId && planType) {
				const subscription = await this.paymentService.getSubscriptionDetails(
					session.subscription
				);
				await this.updateUserSubscription(userId, subscription, planType);
			}
		} catch (error) {
			console.error('Error handling subscription creation:', error);
			throw error;
		}
	}

	/**
	 * Handle subscription update
	 * @param {Object} subscription - Subscription object
	 * @returns {Promise<void>}
	 */
	async handleSubscriptionUpdated(subscription) {
		try {
			const customer = await this.paymentService.stripe.customers.retrieve(
				subscription.customer
			);
			const userId = customer.metadata.userId;

			if (userId) {
				const planType = this.getPlanTypeFromSubscription(subscription);
				await this.updateUserSubscription(userId, subscription, planType);
			}
		} catch (error) {
			console.error('Error handling subscription update:', error);
			throw error;
		}
	}

	/**
	 * Handle subscription deletion
	 * @param {Object} subscription - Subscription object
	 * @returns {Promise<void>}
	 */
	async handleSubscriptionDeleted(subscription) {
		try {
			const customer = await this.paymentService.stripe.customers.retrieve(
				subscription.customer
			);
			const userId = customer.metadata.userId;

			if (userId) {
				await User.findByIdAndUpdate(userId, {
					stripeSubscriptionId: null,
					subscriptionTier: null,
					subscriptionStatus: 'canceled',
					subscriptionCurrentPeriodEnd: null,
					subscriptionCancelAtPeriodEnd: false,
					hasActiveSubscription: false,
				});
			}
		} catch (error) {
			console.error('Error handling subscription deletion:', error);
			throw error;
		}
	}

	/**
	 * Handle payment success
	 * @param {Object} invoice - Invoice object
	 * @returns {Promise<void>}
	 */
	async handlePaymentSucceeded(invoice) {
		try {
			if (invoice.subscription) {
				const subscription = await this.paymentService.getSubscriptionDetails(
					invoice.subscription
				);
				const customer = await this.paymentService.stripe.customers.retrieve(
					subscription.customer
				);
				const userId = customer.metadata.userId;

				if (userId) {
					const planType = this.getPlanTypeFromSubscription(subscription);
					await this.updateUserSubscription(userId, subscription, planType);
				}
			}
		} catch (error) {
			console.error('Error handling payment success:', error);
			throw error;
		}
	}

	/**
	 * Handle payment failure
	 * @param {Object} invoice - Invoice object
	 * @returns {Promise<void>}
	 */
	async handlePaymentFailed(invoice) {
		try {
			if (invoice.subscription) {
				const subscription = await this.paymentService.getSubscriptionDetails(
					invoice.subscription
				);
				const customer = await this.paymentService.stripe.customers.retrieve(
					subscription.customer
				);
				const userId = customer.metadata.userId;

				if (userId) {
					await User.findByIdAndUpdate(userId, {
						subscriptionStatus: subscription.status,
						hasActiveSubscription: subscription.status === 'active',
					});
				}
			}
		} catch (error) {
			console.error('Error handling payment failure:', error);
			throw error;
		}
	}

	/**
	 * Get subscription status types
	 * @returns {Object} Status types
	 */
	getSubscriptionStatusTypes() {
		return this.config.getAllStatusTypes();
	}

	/**
	 * Check if user has feature access
	 * @param {Object} user - User object
	 * @param {string} feature - Feature name
	 * @returns {boolean} Has access
	 */
	hasFeatureAccess(user, feature) {
		if (!user.subscriptionTier) {
			return false;
		}
		return this.config.hasFeature(user.subscriptionTier, feature);
	}

	/**
	 * Get user's plan limit
	 * @param {Object} user - User object
	 * @param {string} limit - Limit name
	 * @returns {number} Limit value
	 */
	getUserLimit(user, limit) {
		if (!user.subscriptionTier) {
			return 0;
		}
		return this.config.getPlanLimit(user.subscriptionTier, limit);
	}

	/**
	 * Validate user can create survey
	 * @param {Object} user - User object
	 * @param {number} currentCount - Current survey count
	 * @returns {boolean} Can create
	 */
	canCreateSurvey(user, currentCount) {
		const limit = this.getUserLimit(user, 'maxSurveys');
		return limit === -1 || currentCount < limit;
	}

	/**
	 * Validate user can add questions
	 * @param {Object} user - User object
	 * @param {number} currentCount - Current question count
	 * @returns {boolean} Can add
	 */
	canAddQuestions(user, currentCount) {
		const limit = this.getUserLimit(user, 'maxQuestionsPerSurvey');
		return limit === -1 || currentCount < limit;
	}
}

module.exports = SubscriptionService;
