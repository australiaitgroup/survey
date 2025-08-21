/**
 * Payment Service Interface
 * Defines the contract for payment processing services
 */
class IPaymentService {
	/**
	 * Create a checkout session for subscription
	 * @param {Object} user - User object
	 * @param {string} planType - Subscription plan type
	 * @param {string} successUrl - Success redirect URL
	 * @param {string} cancelUrl - Cancel redirect URL
	 * @returns {Promise<Object>} Checkout session
	 */
	async createCheckoutSession(user, planType, successUrl, cancelUrl) {
		throw new Error('Method not implemented');
	}

	/**
	 * Create a customer portal session
	 * @param {Object} user - User object
	 * @param {string} returnUrl - Return URL
	 * @returns {Promise<Object>} Portal session
	 */
	async createPortalSession(user, returnUrl) {
		throw new Error('Method not implemented');
	}

	/**
	 * Get subscription details
	 * @param {string} subscriptionId - Subscription ID
	 * @returns {Promise<Object>} Subscription details
	 */
	async getSubscriptionDetails(subscriptionId) {
		throw new Error('Method not implemented');
	}

	/**
	 * Cancel subscription
	 * @param {string} subscriptionId - Subscription ID
	 * @param {boolean} cancelAtPeriodEnd - Cancel at period end
	 * @returns {Promise<Object>} Updated subscription
	 */
	async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
		throw new Error('Method not implemented');
	}

	/**
	 * Reactivate subscription
	 * @param {string} subscriptionId - Subscription ID
	 * @returns {Promise<Object>} Updated subscription
	 */
	async reactivateSubscription(subscriptionId) {
		throw new Error('Method not implemented');
	}

	/**
	 * Create or get customer
	 * @param {Object} user - User object
	 * @returns {Promise<Object>} Customer object
	 */
	async createOrGetCustomer(user) {
		throw new Error('Method not implemented');
	}

	/**
	 * Verify webhook signature
	 * @param {Buffer} payload - Request payload
	 * @param {string} signature - Webhook signature
	 * @param {string} secret - Webhook secret
	 * @returns {Object} Verified event
	 */
	verifyWebhookSignature(payload, signature, secret) {
		throw new Error('Method not implemented');
	}

	/**
	 * Check if service is available
	 * @returns {boolean} Service availability
	 */
	isAvailable() {
		throw new Error('Method not implemented');
	}
}

module.exports = IPaymentService;
