const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
	createCheckoutSession,
	createPortalSession,
	getSubscriptionDetails,
	getPlanTypeFromSubscription,
	stripe,
	SUBSCRIPTION_PLANS,
} = require('../services/stripe');

// Middleware to verify JWT token
const { jwtAuth: authenticateToken } = require('../middlewares/jwtAuth');

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
	try {
		const { planType } = req.body;
		const user = await User.findById(req.user._id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		if (!planType || !SUBSCRIPTION_PLANS[planType]) {
			return res.status(400).json({ error: 'Invalid plan type' });
		}

		const successUrl = `${process.env.FRONTEND_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
		const cancelUrl = `${process.env.FRONTEND_URL}/billing?canceled=true`;

		const session = await createCheckoutSession(user, planType, successUrl, cancelUrl);

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
});

// Create customer portal session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		if (!user.stripeCustomerId) {
			return res.status(400).json({ error: 'No Stripe customer found' });
		}

		const returnUrl = `${process.env.FRONTEND_URL}/billing`;
		const session = await createPortalSession(user, returnUrl);

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
});

// Get subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		let subscription = null;
		if (user.stripeSubscriptionId) {
			try {
				subscription = await getSubscriptionDetails(user.stripeSubscriptionId);
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
});

// Get available plans
router.get('/plans', (req, res) => {
	try {
		const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
			id: key,
			name: plan.name,
			price: plan.price,
			currency: plan.currency,
			interval: plan.interval,
			features: plan.features,
		}));

		res.json({ plans });
	} catch (error) {
		console.error('Error getting plans:', error);
		res.status(500).json({ error: 'Failed to get plans' });
	}
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
	// Check if Stripe is initialized
	if (!stripe) {
		console.log('Webhook received but Stripe is not initialized');
		return res.status(200).json({ received: true, message: 'Stripe not configured' });
	}

	const sig = req.headers['stripe-signature'];
	let event;

	try {
		event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	// Handle the event
	try {
		switch (event.type) {
		case 'checkout.session.completed':
			await handleCheckoutSessionCompleted(event.data.object);
			break;

		case 'customer.subscription.created':
		case 'customer.subscription.updated':
			await handleSubscriptionUpdate(event.data.object);
			break;

		case 'customer.subscription.deleted':
			await handleSubscriptionDeleted(event.data.object);
			break;

		case 'invoice.payment_succeeded':
			await handlePaymentSucceeded(event.data.object);
			break;

		case 'invoice.payment_failed':
			await handlePaymentFailed(event.data.object);
			break;

		default:
			console.log(`Unhandled event type ${event.type}`);
		}

		res.json({ received: true });
	} catch (error) {
		console.error('Error handling webhook:', error);
		res.status(500).json({ error: 'Webhook handler failed' });
	}
});

// Webhook handlers
async function handleCheckoutSessionCompleted(session) {
	try {
		if (!stripe) return;

		const userId = session.metadata.userId;
		const planType = session.metadata.planType;

		if (session.mode === 'subscription' && userId && planType) {
			const subscription = await stripe.subscriptions.retrieve(session.subscription);
			await updateUserSubscription(userId, subscription, planType);
		}
	} catch (error) {
		console.error('Error handling checkout session completed:', error);
	}
}

async function handleSubscriptionUpdate(subscription) {
	try {
		if (!stripe) return;

		const customer = await stripe.customers.retrieve(subscription.customer);
		const userId = customer.metadata.userId;

		if (userId) {
			const planType = getPlanTypeFromSubscription(subscription);
			await updateUserSubscription(userId, subscription, planType);
		}
	} catch (error) {
		console.error('Error handling subscription update:', error);
	}
}

async function handleSubscriptionDeleted(subscription) {
	try {
		if (!stripe) return;

		const customer = await stripe.customers.retrieve(subscription.customer);
		const userId = customer.metadata.userId;

		if (userId) {
			await User.findByIdAndUpdate(userId, {
				subscriptionStatus: 'canceled',
				subscriptionTier: null,
				stripeSubscriptionId: null,
				subscriptionCurrentPeriodEnd: null,
				subscriptionCancelAtPeriodEnd: false,
			});
		}
	} catch (error) {
		console.error('Error handling subscription deletion:', error);
	}
}

async function handlePaymentSucceeded(invoice) {
	try {
		if (!stripe) return;

		if (invoice.subscription) {
			const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
			const customer = await stripe.customers.retrieve(subscription.customer);
			const userId = customer.metadata.userId;

			if (userId) {
				const planType = getPlanTypeFromSubscription(subscription);
				await updateUserSubscription(userId, subscription, planType);
			}
		}
	} catch (error) {
		console.error('Error handling payment succeeded:', error);
	}
}

async function handlePaymentFailed(invoice) {
	try {
		if (!stripe) return;

		if (invoice.subscription) {
			const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
			const customer = await stripe.customers.retrieve(subscription.customer);
			const userId = customer.metadata.userId;

			if (userId) {
				await User.findByIdAndUpdate(userId, {
					subscriptionStatus: 'past_due',
				});
			}
		}
	} catch (error) {
		console.error('Error handling payment failed:', error);
	}
}

// Helper function to update user subscription
async function updateUserSubscription(userId, subscription, planType) {
	try {
		await User.findByIdAndUpdate(userId, {
			stripeSubscriptionId: subscription.id,
			subscriptionTier: planType,
			subscriptionStatus: subscription.status,
			subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
			subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
		});
	} catch (error) {
		console.error('Error updating user subscription:', error);
	}
}

module.exports = router;
