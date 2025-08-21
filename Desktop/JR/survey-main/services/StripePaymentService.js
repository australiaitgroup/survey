const Stripe = require('stripe');
const IPaymentService = require('../interfaces/IPaymentService');

/**
 * Stripe Payment Service Implementation
 * Implements IPaymentService interface for Stripe
 */
class StripePaymentService extends IPaymentService {
	constructor() {
		super();
		this.stripe = this.initializeStripe();
	}

	/**
	 * Initialize Stripe instance
	 * @returns {Stripe|null} Stripe instance or null
	 */
	initializeStripe() {
		if (
			process.env.STRIPE_SECRET_KEY &&
			process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here'
		) {
			try {
				const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
				console.log('Stripe initialized successfully');
				return stripe;
			} catch (error) {
				console.error('Stripe initialization failed:', error.message);
				return null;
			}
		} else {
			console.log('Stripe not initialized - missing or placeholder API key');
			return null;
		}
	}

	/**
	 * Check if service is available
	 * @returns {boolean} Service availability
	 */
	isAvailable() {
		return this.stripe !== null;
	}

	/**
	 * Create or get Stripe customer
	 * @param {Object} user - User object
	 * @returns {Promise<Object>} Customer object
	 */
	async createOrGetCustomer(user) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			if (user.stripeCustomerId) {
				// Return existing customer
				return await this.stripe.customers.retrieve(user.stripeCustomerId);
			}

			// Create new customer
			const customer = await this.stripe.customers.create({
				email: user.email,
				name: user.name,
				metadata: {
					userId: user._id.toString(),
				},
			});

			// Update user with Stripe customer ID
			user.stripeCustomerId = customer.id;
			await user.save();

			return customer;
		} catch (error) {
			console.error('Error creating/getting Stripe customer:', error);
			throw error;
		}
	}

	/**
	 * Create checkout session
	 * @param {Object} user - User object
	 * @param {string} planType - Plan type
	 * @param {string} successUrl - Success URL
	 * @param {string} cancelUrl - Cancel URL
	 * @returns {Promise<Object>} Checkout session
	 */
	async createCheckoutSession(user, planType, successUrl, cancelUrl) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			const plan = this.getPlanByType(planType);
			if (!plan) {
				throw new Error('Invalid plan type');
			}

			const customer = await this.createOrGetCustomer(user);

			const session = await this.stripe.checkout.sessions.create({
				customer: customer.id,
				payment_method_types: ['card'],
				line_items: [
					{
						price: plan.priceId,
						quantity: 1,
					},
				],
				mode: 'subscription',
				success_url: successUrl,
				cancel_url: cancelUrl,
				metadata: {
					userId: user._id.toString(),
					planType: planType,
				},
				allow_promotion_codes: true,
				billing_address_collection: 'required',
				subscription_data: {
					metadata: {
						userId: user._id.toString(),
						planType: planType,
					},
				},
			});

			return session;
		} catch (error) {
			console.error('Error creating checkout session:', error);
			throw error;
		}
	}

	/**
	 * Create customer portal session
	 * @param {Object} user - User object
	 * @param {string} returnUrl - Return URL
	 * @returns {Promise<Object>} Portal session
	 */
	async createPortalSession(user, returnUrl) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			if (!user.stripeCustomerId) {
				throw new Error('User does not have a Stripe customer ID');
			}

			const session = await this.stripe.billingPortal.sessions.create({
				customer: user.stripeCustomerId,
				return_url: returnUrl,
			});

			return session;
		} catch (error) {
			console.error('Error creating portal session:', error);
			throw error;
		}
	}

	/**
	 * Get subscription details
	 * @param {string} subscriptionId - Subscription ID
	 * @returns {Promise<Object>} Subscription details
	 */
	async getSubscriptionDetails(subscriptionId) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			return await this.stripe.subscriptions.retrieve(subscriptionId);
		} catch (error) {
			console.error('Error getting subscription details:', error);
			throw error;
		}
	}

	/**
	 * Cancel subscription
	 * @param {string} subscriptionId - Subscription ID
	 * @param {boolean} cancelAtPeriodEnd - Cancel at period end
	 * @returns {Promise<Object>} Updated subscription
	 */
	async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			if (cancelAtPeriodEnd) {
				return await this.stripe.subscriptions.update(subscriptionId, {
					cancel_at_period_end: true,
				});
			} else {
				return await this.stripe.subscriptions.cancel(subscriptionId);
			}
		} catch (error) {
			console.error('Error canceling subscription:', error);
			throw error;
		}
	}

	/**
	 * Reactivate subscription
	 * @param {string} subscriptionId - Subscription ID
	 * @returns {Promise<Object>} Updated subscription
	 */
	async reactivateSubscription(subscriptionId) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			return await this.stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: false,
			});
		} catch (error) {
			console.error('Error reactivating subscription:', error);
			throw error;
		}
	}

	/**
	 * Verify webhook signature
	 * @param {Buffer} payload - Request payload
	 * @param {string} signature - Webhook signature
	 * @param {string} secret - Webhook secret
	 * @returns {Object} Verified event
	 */
	verifyWebhookSignature(payload, signature, secret) {
		if (!this.isAvailable()) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}

		try {
			return this.stripe.webhooks.constructEvent(payload, signature, secret);
		} catch (error) {
			console.error('Webhook signature verification failed:', error.message);
			throw error;
		}
	}

	/**
	 * Get plan by type (helper method)
	 * @param {string} planType - Plan type
	 * @returns {Object|null} Plan or null
	 */
	getPlanByType(planType) {
		const plans = {
			basic: { priceId: process.env.STRIPE_BASIC_PRICE_ID },
			pro: { priceId: process.env.STRIPE_PRO_PRICE_ID },
		};
		return plans[planType] || null;
	}
}

module.exports = StripePaymentService;
