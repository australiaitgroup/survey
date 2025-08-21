/**
 * Subscription Service Interface
 * Defines the contract for subscription management
 */
class ISubscriptionService {
	/**
	 * Get available subscription plans
	 * @returns {Array} Available plans
	 */
	getAvailablePlans() {
		throw new Error('Method not implemented');
	}

	/**
	 * Get plan by type
	 * @param {string} planType - Plan type
	 * @returns {Object} Plan details
	 */
	getPlanByType(planType) {
		throw new Error('Method not implemented');
	}

	/**
	 * Get plan type from subscription
	 * @param {Object} subscription - Subscription object
	 * @returns {string} Plan type
	 */
	getPlanTypeFromSubscription(subscription) {
		throw new Error('Method not implemented');
	}

	/**
	 * Update user subscription
	 * @param {string} userId - User ID
	 * @param {Object} subscription - Subscription object
	 * @param {string} planType - Plan type
	 * @returns {Promise<Object>} Updated user
	 */
	async updateUserSubscription(userId, subscription, planType) {
		throw new Error('Method not implemented');
	}

	/**
	 * Handle subscription creation
	 * @param {Object} session - Checkout session
	 * @returns {Promise<void>}
	 */
	async handleSubscriptionCreated(session) {
		throw new Error('Method not implemented');
	}

	/**
	 * Handle subscription update
	 * @param {Object} subscription - Subscription object
	 * @returns {Promise<void>}
	 */
	async handleSubscriptionUpdated(subscription) {
		throw new Error('Method not implemented');
	}

	/**
	 * Handle subscription deletion
	 * @param {Object} subscription - Subscription object
	 * @returns {Promise<void>}
	 */
	async handleSubscriptionDeleted(subscription) {
		throw new Error('Method not implemented');
	}

	/**
	 * Handle payment success
	 * @param {Object} invoice - Invoice object
	 * @returns {Promise<void>}
	 */
	async handlePaymentSucceeded(invoice) {
		throw new Error('Method not implemented');
	}

	/**
	 * Handle payment failure
	 * @param {Object} invoice - Invoice object
	 * @returns {Promise<void>}
	 */
	async handlePaymentFailed(invoice) {
		throw new Error('Method not implemented');
	}

	/**
	 * Get subscription status types
	 * @returns {Object} Status types
	 */
	getSubscriptionStatusTypes() {
		throw new Error('Method not implemented');
	}
}

module.exports = ISubscriptionService;
