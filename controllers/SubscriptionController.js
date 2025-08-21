/**
 * Subscription Controller
 * Handles subscription-related HTTP requests
 */
class SubscriptionController {
	constructor(subscriptionService, paymentService) {
		this.subscriptionService = subscriptionService;
		this.paymentService = paymentService;
	}

	/**
	 * Create checkout session
	 * @param {Object} req - Express request
	 * @param {Object} res - Express response
	 */
	async createCheckoutSession(req, res) {
		try {
			const { planType } = req.body;
			const user = req.user;

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			if (!planType || !this.subscriptionService.getPlanByType(planType)) {
				return res.status(400).json({ error: 'Invalid plan type' });
			}

			const successUrl = `${process.env.FRONTEND_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
			const cancelUrl = `${process.env.FRONTEND_URL}/billing?canceled=true`;

			const session = await this.paymentService.createCheckoutSession(
				user,
				planType,
				successUrl,
				cancelUrl
			);

			res.json({
				sessionId: session.id,
				url: session.url,
			});
		} catch (error) {
			console.error('Error creating checkout session:', error);
			if (error.message && error.message.includes('Stripe is not initialized')) {
				res.status(503).json({
					error: 'Payment system is not configured. Please contact support.',
				});
			} else {
				res.status(500).json({ error: 'Failed to create checkout session' });
			}
		}
	}

	/**
	 * Create customer portal session
	 * @param {Object} req - Express request
	 * @param {Object} res - Express response
	 */
	async createPortalSession(req, res) {
		try {
			const user = req.user;

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			if (!user.stripeCustomerId) {
				return res.status(400).json({ error: 'No Stripe customer found' });
			}

			const returnUrl = `${process.env.FRONTEND_URL}/billing`;
			const session = await this.paymentService.createPortalSession(user, returnUrl);

			res.json({ url: session.url });
		} catch (error) {
			console.error('Error creating portal session:', error);
			if (error.message && error.message.includes('Stripe is not initialized')) {
				res.status(503).json({
					error: 'Payment system is not configured. Please contact support.',
				});
			} else {
				res.status(500).json({ error: 'Failed to create portal session' });
			}
		}
	}

	/**
	 * Get subscription status
	 * @param {Object} req - Express request
	 * @param {Object} res - Express response
	 */
	async getSubscriptionStatus(req, res) {
		try {
			const user = req.user;

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			let subscription = null;
			if (user.stripeSubscriptionId && this.paymentService.isAvailable()) {
				try {
					subscription = await this.paymentService.getSubscriptionDetails(
						user.stripeSubscriptionId
					);
				} catch (error) {
					console.error('Error fetching subscription from Stripe:', error);
				}
			}

			res.json({
				subscriptionTier: user.subscriptionTier,
				subscriptionStatus: user.subscriptionStatus,
				subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
				subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
				hasActiveSubscription: user.hasActiveSubscription,
				subscription: subscription,
			});
		} catch (error) {
			console.error('Error getting subscription status:', error);
			res.status(500).json({ error: 'Failed to get subscription status' });
		}
	}

	/**
	 * Get available plans
	 * @param {Object} req - Express request
	 * @param {Object} res - Express response
	 */
	async getAvailablePlans(req, res) {
		try {
			const plans = this.subscriptionService.getAvailablePlans();
			const formattedPlans = Object.entries(plans).map(([key, plan]) => ({
				id: key,
				name: plan.name,
				price: plan.price,
				currency: plan.currency,
				interval: plan.interval,
				features: plan.features,
			}));

			res.json({ plans: formattedPlans });
		} catch (error) {
			console.error('Error getting plans:', error);
			res.status(500).json({ error: 'Failed to get plans' });
		}
	}

	/**
	 * Handle webhook events
	 * @param {Object} req - Express request
	 * @param {Object} res - Express response
	 */
	async handleWebhook(req, res) {
		if (!this.paymentService.isAvailable()) {
			return res.status(503).json({
				error: 'Payment system is not configured. Please contact support.',
			});
		}

		const sig = req.headers['stripe-signature'];
		let event;

		try {
			event = this.paymentService.verifyWebhookSignature(
				req.body,
				sig,
				process.env.STRIPE_WEBHOOK_SECRET
			);
		} catch (err) {
			console.error('Webhook signature verification failed:', err.message);
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		try {
			switch (event.type) {
			case 'checkout.session.completed':
				await this.subscriptionService.handleSubscriptionCreated(event.data.object);
				break;

			case 'customer.subscription.created':
			case 'customer.subscription.updated':
				await this.subscriptionService.handleSubscriptionUpdated(event.data.object);
				break;

			case 'customer.subscription.deleted':
				await this.subscriptionService.handleSubscriptionDeleted(event.data.object);
				break;

			case 'invoice.payment_succeeded':
				await this.subscriptionService.handlePaymentSucceeded(event.data.object);
				break;

			case 'invoice.payment_failed':
				await this.subscriptionService.handlePaymentFailed(event.data.object);
				break;

			default:
				console.log(`Unhandled event type ${event.type}`);
			}

			res.json({ received: true });
		} catch (error) {
			console.error('Error handling webhook:', error);
			res.status(500).json({ error: 'Webhook handler failed' });
		}
	}

	/**
	 * Check feature access
	 * @param {Object} req - Express request
	 * @param {Object} res - Express response
	 */
	async checkFeatureAccess(req, res) {
		try {
			const user = req.user;
			const { feature } = req.params;

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			const hasAccess = this.subscriptionService.hasFeatureAccess(user, feature);
			const limit = this.subscriptionService.getUserLimit(user, feature);

			res.json({
				hasAccess,
				limit,
				subscriptionTier: user.subscriptionTier,
			});
		} catch (error) {
			console.error('Error checking feature access:', error);
			res.status(500).json({ error: 'Failed to check feature access' });
		}
	}
}

module.exports = SubscriptionController;
