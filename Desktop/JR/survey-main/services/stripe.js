const Stripe = require('stripe');

// Initialize Stripe with secret key only if available
let stripe = null;
if (
	process.env.STRIPE_SECRET_KEY &&
	process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here'
) {
	stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
	console.log('Stripe initialized successfully');
} else {
	console.log('Stripe not initialized - missing or placeholder API key');
}

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
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

// Subscription status types
const SUBSCRIPTION_STATUS = {
	ACTIVE: 'active',
	CANCELED: 'canceled',
	INCOMPLETE: 'incomplete',
	INCOMPLETE_EXPIRED: 'incomplete_expired',
	PAST_DUE: 'past_due',
	TRIALING: 'trialing',
	UNPAID: 'unpaid',
};

// Create or get Stripe customer
async function createOrGetCustomer(user) {
	try {
		if (!stripe) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}
		if (user.stripeCustomerId) {
			// Return existing customer
			return await stripe.customers.retrieve(user.stripeCustomerId);
		}

		// Create new customer
		const customer = await stripe.customers.create({
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

// Create checkout session
async function createCheckoutSession(user, planType, successUrl, cancelUrl) {
	try {
		if (!stripe) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}
		const plan = SUBSCRIPTION_PLANS[planType];
		if (!plan) {
			throw new Error('Invalid plan type');
		}

		const customer = await createOrGetCustomer(user);

		const session = await stripe.checkout.sessions.create({
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

// Create customer portal session
async function createPortalSession(user, returnUrl) {
	try {
		if (!stripe) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}
		if (!user.stripeCustomerId) {
			throw new Error('User does not have a Stripe customer ID');
		}

		const session = await stripe.billingPortal.sessions.create({
			customer: user.stripeCustomerId,
			return_url: returnUrl,
		});

		return session;
	} catch (error) {
		console.error('Error creating portal session:', error);
		throw error;
	}
}

// Get subscription details
async function getSubscriptionDetails(subscriptionId) {
	try {
		if (!stripe) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}
		return await stripe.subscriptions.retrieve(subscriptionId);
	} catch (error) {
		console.error('Error getting subscription details:', error);
		throw error;
	}
}

// Cancel subscription
async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
	try {
		if (!stripe) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}
		if (cancelAtPeriodEnd) {
			return await stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: true,
			});
		} else {
			return await stripe.subscriptions.cancel(subscriptionId);
		}
	} catch (error) {
		console.error('Error canceling subscription:', error);
		throw error;
	}
}

// Reactivate subscription
async function reactivateSubscription(subscriptionId) {
	try {
		if (!stripe) {
			throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
		}
		return await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: false,
		});
	} catch (error) {
		console.error('Error reactivating subscription:', error);
		throw error;
	}
}

// Get plan type from subscription
function getPlanTypeFromSubscription(subscription) {
	const priceId = subscription.items.data[0].price.id;

	if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
		return 'basic';
	} else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
		return 'pro';
	}

	return null;
}

module.exports = {
	stripe,
	SUBSCRIPTION_PLANS,
	SUBSCRIPTION_STATUS,
	createOrGetCustomer,
	createCheckoutSession,
	createPortalSession,
	getSubscriptionDetails,
	cancelSubscription,
	reactivateSubscription,
	getPlanTypeFromSubscription,
};
