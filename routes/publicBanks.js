const express = require('express');
const router = express.Router();
const PublicBank = require('../models/PublicBank');
const BankPurchase = require('../models/BankPurchase');
const Entitlement = require('../models/Entitlement');
const User = require('../models/User');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/jwtAuth');
const { jwtAuth } = require('../middlewares/jwtAuth');

// Initialize Stripe (will use placeholder if not configured)
let stripe = null;
try {
	const stripeKey = process.env.STRIPE_SECRET_KEY;
	if (stripeKey && !stripeKey.includes('sk_test_placeholder')) {
		stripe = require('stripe')(stripeKey);
	}
} catch (error) {
	console.log('Stripe not initialized - payments will be simulated');
}

// GET /api/public-banks - Get list of public question banks with filters
router.get('/', jwtAuth, async (req, res) => {
	try {
		const { query, type, tag, page = 1, pageSize = 12 } = req.query;

		// Build filter query
		const filter = {
			isActive: true,
			isPublished: true,
		};

		// Search by title or description
		if (query) {
			filter.$or = [
				{ title: { $regex: query, $options: 'i' } },
				{ description: { $regex: query, $options: 'i' } },
			];
		}

		// Filter by type (free/paid)
		if (type && type !== 'all') {
			filter.type = type.toLowerCase();
		}

		// Filter by tags (can be multiple)
		if (tag) {
			const tags = Array.isArray(tag) ? tag : [tag];
			filter.tags = { $in: tags.map(t => t.toLowerCase()) };
		}

		// Calculate pagination
		const skip = (parseInt(page) - 1) * parseInt(pageSize);
		const limit = parseInt(pageSize);

		// Get total count for pagination
		const totalCount = await PublicBank.countDocuments(filter);

		// Fetch banks with pagination
		const banks = await PublicBank.find(filter)
			.select('title description tags questionCount type priceOneTime currency updatedAt')
			.sort({ updatedAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		// Get user's company and entitlements (accept ObjectId, email or username)
		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId subscription');
		let entitlements = [];

		if (user && user.companyId) {
			entitlements = await Entitlement.find({
				companyId: user.companyId,
				status: 'active',
				$or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
			}).select('bankId accessType');
		}

		const entitlementMap = {};
		entitlements.forEach(e => {
			entitlementMap[e.bankId.toString()] = e.accessType;
		});

		// Get all available tags for filtering
		const allTags = await PublicBank.distinct('tags', {
			isActive: true,
			isPublished: true,
		});

		// Transform banks with entitlement status
		const transformedBanks = banks.map(bank => {
			let entitlement = 'Locked';

			// Check if user has entitlement for this bank
			const accessType = entitlementMap[bank._id.toString()];
			if (accessType) {
				entitlement = 'Owned';
			}
			// Check if it's free
			else if (bank.type === 'free') {
				entitlement = 'Included';
			}
			// Check if user has premium subscription that includes paid banks
			else if (user && user.subscription && user.subscription.plan === 'premium') {
				entitlement = 'Included';
			}

			return {
				_id: bank._id,
				title: bank.title,
				description: bank.description,
				tags: bank.tags,
				questionCount: bank.questionCount,
				lastUpdated: bank.updatedAt,
				type: bank.type === 'free' ? 'FREE' : 'PAID',
				price: bank.type === 'paid' ? bank.priceOneTime : undefined,
				entitlement,
			};
		});

		res.json({
			banks: transformedBanks,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			currentPage: parseInt(page),
			availableTags: allTags,
		});
	} catch (error) {
		console.error('Error fetching public banks:', error);
		res.status(500).json({
			error: 'Failed to fetch public question banks',
			details: error.message,
		});
	}
});

// GET /api/public-banks/access - Get current company's entitlements
router.get('/access', jwtAuth, async (req, res) => {
	try {
		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId');

		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		const entitlements = await Entitlement.find({
			companyId: user.companyId,
			status: 'active',
			$or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
		}).populate('bankId', 'title type');

		res.json({
			entitlements: entitlements.map(e => ({
				bankId: e.bankId._id,
				bankTitle: e.bankId.title,
				accessType: e.accessType,
				grantedAt: e.grantedAt,
				expiresAt: e.expiresAt,
			})),
		});
	} catch (error) {
		console.error('Error fetching entitlements:', error);
		res.status(500).json({
			error: 'Failed to fetch access information',
			details: error.message,
		});
	}
});

// GET /api/public-banks/for-survey - Get public banks accessible for survey creation
router.get('/for-survey', async (req, res) => {
	try {
		// Optional auth: decode JWT if provided, but don't fail if missing/invalid
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.split(' ')[1];
			try {
				const payload = jwt.verify(token, JWT_SECRET);
				req.user = payload;
			} catch (e) {
				// ignore invalid token, proceed as anonymous
			}
		}
		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId subscription');
		const companyId = user && user.companyId ? user.companyId : null;

		// Get all active public banks
		const allBanks = await PublicBank.find({
			isActive: true,
			isPublished: true,
		})
			.select('title description tags questionCount type priceOneTime currency updatedAt')
			.sort({ title: 1 })
			.lean();

		// Get user's entitlements
		const entitlements = companyId
			? await Entitlement.find({
				companyId: companyId,
				status: 'active',
				$or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
			}).select('bankId accessType')
			: [];

		const entitlementMap = {};
		entitlements.forEach(e => {
			entitlementMap[e.bankId.toString()] = e.accessType;
		});

		// Separate banks into authorized and locked categories
		const authorizedBanks = [];
		const lockedBanks = [];

		allBanks.forEach(bank => {
			let hasAccess = false;
			let accessType = 'Locked';

			// Check if user has entitlement for this bank
			const userEntitlement = entitlementMap[bank._id.toString()];
			if (userEntitlement) {
				hasAccess = true;
				accessType = 'Owned';
			}
			// Check if it's free
			else if (bank.type === 'free') {
				hasAccess = true;
				accessType = 'Free';
			}
			// Check if user has premium subscription that includes paid banks
			else if (user && user.subscription && user.subscription.plan === 'premium') {
				hasAccess = true;
				accessType = 'Subscription';
			}

			const safeQuestionCount = Math.max(0, Number(bank.questionCount || 0));
			const bankData = {
				_id: bank._id,
				name: bank.title, // Use 'name' to match local question banks interface
				title: bank.title,
				description: bank.description,
				tags: bank.tags,
				questionCount: safeQuestionCount,
				questions: Array.from({ length: safeQuestionCount }, (_, i) => ({
					_id: `placeholder_${i}`,
				})), // Placeholder for question count
				lastUpdated: bank.updatedAt,
				type: bank.type === 'free' ? 'FREE' : 'PAID',
				price: bank.type === 'paid' ? bank.priceOneTime : undefined,
				accessType,
				isPublic: true, // Flag to distinguish from local banks
			};

			if (hasAccess) {
				authorizedBanks.push(bankData);
			} else {
				lockedBanks.push({
					...bankData,
					accessType: 'Locked',
					lockReason: bank.type === 'paid' ? 'purchase_required' : 'access_required',
				});
			}
		});

		res.json({
			authorized: authorizedBanks,
			locked: lockedBanks,
			totalAuthorized: authorizedBanks.length,
			totalLocked: lockedBanks.length,
		});
	} catch (error) {
		console.error('Error fetching survey public banks:', error);
		// Fail-soft: return empty dataset to keep UI functional
		res.status(200).json({
			authorized: [],
			locked: [],
			totalAuthorized: 0,
			totalLocked: 0,
			error: 'Failed to fetch public banks for survey creation',
		});
	}
});

// POST /api/public-banks/:id/purchase - Unified purchase endpoint for both free and paid banks
router.post('/:id/purchase', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
		});

		if (!bank) {
			return res.status(404).json({ error: 'Question bank not found' });
		}

		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId email');

		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		// Check if already has access
		const hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);
		if (hasAccess) {
			return res.status(400).json({ error: 'You already have access to this question bank' });
		}

		const baseUrl = process.env.CLIENT_URL || 'http://localhost:5051';

		// For free banks, redirect to checkout page
		if (bank.type === 'free') {
			return res.json({
				success: true,
				checkoutUrl: `${baseUrl}/admin/checkout?bank=${bank._id}`,
			});
		}

		// For paid banks, redirect to checkout page
		return res.json({
			success: true,
			checkoutUrl: `${baseUrl}/admin/checkout?bank=${bank._id}`,
		});
	} catch (error) {
		console.error('Error initiating purchase:', error);
		res.status(500).json({
			error: 'Failed to initiate purchase',
			details: error.message,
		});
	}
});

// POST /api/public-banks/:id/purchase-free - Process free bank purchase (create order and grant access)
router.post('/:id/purchase-free', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
			type: 'free',
		});

		if (!bank) {
			return res.status(404).json({ error: 'Free question bank not found' });
		}

		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId email');

		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		// Check if already has access
		const hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);
		if (hasAccess) {
			return res.status(400).json({ error: 'You already have access to this question bank' });
		}

		// Create order entry for analytics
		const order = new BankPurchase({
			companyId: user.companyId,
			bankId: bank._id,
			type: 'oneTime',
			status: 'completed',
			amount: 0,
			currency: 'USD',
			paymentMethod: 'free',
			transactionId: `free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			purchasedBy: user._id,
			purchasedAt: new Date(),
			notes: 'Free question bank purchase',
		});

		await order.save();

		// Grant access through entitlement
		const entitlement = await Entitlement.grantFreeAccess(user.companyId, bank._id, user._id);

		// Increment usage count if newly created
		if (entitlement.createdAt.getTime() === entitlement.updatedAt.getTime()) {
			await bank.incrementUsage();
		}

		res.json({
			success: true,
			message: 'Free question bank purchased successfully',
			order: {
				id: order._id,
				bankId: bank._id,
				bankTitle: bank.title,
				amount: 0,
				status: 'completed',
			},
			entitlement: {
				bankId: bank._id,
				bankTitle: bank.title,
				accessType: entitlement.accessType,
				grantedAt: entitlement.grantedAt,
			},
		});
	} catch (error) {
		console.error('Error processing free purchase:', error);
		res.status(500).json({
			error: 'Failed to process free purchase',
			details: error.message,
		});
	}
});

// POST /api/public-banks/:id/attach - Add free bank to company (idempotent) - DEPRECATED, use /purchase instead
router.post('/:id/attach', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
		});

		if (!bank) {
			return res.status(404).json({ error: 'Question bank not found' });
		}

		if (bank.type !== 'free') {
			return res.status(400).json({ error: 'This bank is not free' });
		}

		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId');

		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		// Grant free access (idempotent)
		const entitlement = await Entitlement.grantFreeAccess(user.companyId, bank._id, user._id);

		// Increment usage count if newly created
		if (entitlement.createdAt.getTime() === entitlement.updatedAt.getTime()) {
			await bank.incrementUsage();
		}

		res.json({
			success: true,
			message: 'Question bank added successfully',
			entitlement: {
				bankId: bank._id,
				bankTitle: bank.title,
				accessType: entitlement.accessType,
				grantedAt: entitlement.grantedAt,
			},
		});
	} catch (error) {
		console.error('Error attaching bank:', error);
		res.status(500).json({
			error: 'Failed to add question bank',
			details: error.message,
		});
	}
});

// POST /api/public-banks/:id/buy-once - Create Stripe checkout session for one-time purchase
router.post('/:id/buy-once', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
			type: 'paid',
		});

		if (!bank) {
			return res.status(404).json({ error: 'Paid question bank not found' });
		}

		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId email');

		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		// Check if already has access
		const hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);
		if (hasAccess) {
			return res.status(400).json({ error: 'You already have access to this question bank' });
		}

		// Create Stripe checkout session
		if (stripe) {
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: [
					{
						price_data: {
							currency: bank.currency || 'usd',
							product_data: {
								name: bank.title,
								description: bank.description,
							},
							unit_amount: Math.round(bank.priceOneTime * 100), // Stripe uses cents
						},
						quantity: 1,
					},
				],
				mode: 'payment',
				success_url: `${process.env.CLIENT_URL || 'http://localhost:5051'}/admin/checkout/confirmation?bank=${bank._id}&type=paid&payment=success`,
				cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5051'}/admin/question-banks?tab=marketplace&payment=cancelled`,
				metadata: {
					companyId: user.companyId.toString(),
					bankId: bank._id.toString(),
					userId: user._id.toString(),
					type: 'bank_purchase',
				},
				customer_email: user.email,
			});

			res.json({
				success: true,
				checkoutUrl: session.url,
				sessionId: session.id,
			});
		} else {
			// Simulate purchase for development - create order and entitlement
			const order = new BankPurchase({
				companyId: user.companyId,
				bankId: bank._id,
				type: 'oneTime',
				status: 'completed',
				amount: bank.priceOneTime,
				currency: bank.currency || 'USD',
				paymentMethod: 'stripe',
				transactionId: 'simulated_' + Date.now(),
				purchasedBy: user._id,
				purchasedAt: new Date(),
				notes: 'Simulated purchase (Stripe not configured)',
			});

			await order.save();

			const entitlement = await Entitlement.findOneAndUpdate(
				{ companyId: user.companyId, bankId: bank._id },
				{
					$set: {
						accessType: 'purchased',
						status: 'active',
						purchasePrice: bank.priceOneTime,
						currency: bank.currency || 'USD',
						grantedAt: new Date(),
						grantedBy: user._id,
						updatedAt: new Date(),
						stripePaymentIntentId: 'simulated_' + Date.now(),
					},
					$setOnInsert: {
						createdAt: new Date(),
					},
				},
				{
					upsert: true,
					new: true,
					runValidators: true,
				}
			);

			await bank.incrementPurchaseCount();

			// Redirect to confirmation page
			const baseUrl = process.env.CLIENT_URL || 'http://localhost:5051';
			res.json({
				success: true,
				checkoutUrl: `${baseUrl}/admin/checkout/confirmation?bank=${bank._id}&type=paid&payment=simulated`,
				order: {
					id: order._id,
					bankId: bank._id,
					bankTitle: bank.title,
					amount: bank.priceOneTime,
					status: 'completed',
				},
				entitlement: {
					bankId: bank._id,
					bankTitle: bank.title,
					accessType: entitlement.accessType,
				},
			});
		}
	} catch (error) {
		console.error('Error creating checkout session:', error);
		res.status(500).json({
			error: 'Failed to create checkout session',
			details: error.message,
		});
	}
});

// POST /api/public-banks/:id/subscribe - Create Stripe subscription for recurring access
router.post('/:id/subscribe', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
			type: 'paid',
		});

		if (!bank) {
			return res.status(404).json({ error: 'Paid question bank not found' });
		}

		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId email');
		const company = await Company.findById(user.companyId);

		if (!user || !company) {
			return res.status(403).json({ error: 'Company not found' });
		}

		// Check if already has access
		const hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);
		if (hasAccess) {
			return res.status(400).json({ error: 'You already have access to this question bank' });
		}

		// Create Stripe subscription session
		if (stripe) {
			// Create or retrieve Stripe customer
			let customerId = company.stripeCustomerId;

			if (!customerId) {
				const customer = await stripe.customers.create({
					email: user.email,
					metadata: {
						companyId: company._id.toString(),
					},
				});
				customerId = customer.id;

				// Save customer ID to company
				company.stripeCustomerId = customerId;
				await company.save();
			}

			// Create subscription checkout session
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: [
					{
						price_data: {
							currency: bank.currency || 'usd',
							product_data: {
								name: `${bank.title} - Subscription`,
								description: `Monthly access to ${bank.title}`,
							},
							unit_amount: Math.round(bank.priceOneTime * 0.3 * 100), // 30% of one-time price per month
							recurring: {
								interval: 'month',
							},
						},
						quantity: 1,
					},
				],
				mode: 'subscription',
				success_url: `${process.env.CLIENT_URL || 'http://localhost:5051'}/admin/question-banks?tab=marketplace&subscription=success&bank=${bank._id}`,
				cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5051'}/admin/question-banks?tab=marketplace&subscription=cancelled`,
				metadata: {
					companyId: user.companyId.toString(),
					bankId: bank._id.toString(),
					userId: user._id.toString(),
					type: 'bank_subscription',
				},
				customer: customerId,
			});

			res.json({
				success: true,
				checkoutUrl: session.url,
				sessionId: session.id,
			});
		} else {
			// Simulate subscription for development
			const entitlement = await Entitlement.findOneAndUpdate(
				{ companyId: user.companyId, bankId: bank._id },
				{
					$set: {
						accessType: 'subscription',
						status: 'active',
						purchasePrice: bank.priceOneTime * 0.3,
						currency: bank.currency || 'USD',
						grantedAt: new Date(),
						grantedBy: user._id,
						updatedAt: new Date(),
						stripeSubscriptionId: 'simulated_sub_' + Date.now(),
					},
					$setOnInsert: {
						createdAt: new Date(),
					},
				},
				{
					upsert: true,
					new: true,
					runValidators: true,
				}
			);

			await bank.incrementPurchaseCount();

			res.json({
				success: true,
				message: 'Subscription simulated (Stripe not configured)',
				entitlement: {
					bankId: bank._id,
					bankTitle: bank.title,
					accessType: entitlement.accessType,
				},
			});
		}
	} catch (error) {
		console.error('Error creating subscription:', error);
		res.status(500).json({
			error: 'Failed to create subscription',
			details: error.message,
		});
	}
});

// GET /api/public-banks/:id - Get single public bank details
router.get('/:id', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
		});

		if (!bank) {
			return res.status(404).json({ error: 'Question bank not found' });
		}

		// Check user's entitlement
		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId subscription');
		let entitlement = 'Locked';

		if (user && user.companyId) {
			const hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);

			if (hasAccess) {
				entitlement = 'Owned';
			} else if (bank.type === 'free') {
				entitlement = 'Included';
			} else if (user.subscription && user.subscription.plan === 'premium') {
				entitlement = 'Included';
			}
		}

		// Return bank details with limited info if not entitled
		const response = {
			_id: bank._id,
			title: bank.title,
			description: bank.description,
			tags: bank.tags,
			questionCount: bank.questionCount,
			type: bank.type === 'free' ? 'FREE' : 'PAID',
			price: bank.type === 'paid' ? bank.priceOneTime : undefined,
			entitlement,
			category: bank.category,
			difficulty: bank.difficulty,
			lastUpdated: bank.updatedAt,
		};

		// Include questions only if user has access
		if (entitlement === 'Owned' || entitlement === 'Included') {
			response.questions = bank.questions;
		} else {
			// Include preview questions for locked banks
			response.previewQuestions = bank.questions.slice(0, 3).map(q => ({
				text: q.text,
				type: q.type,
				difficulty: q.difficulty,
			}));
		}

		res.json(response);
	} catch (error) {
		console.error('Error fetching public bank:', error);
		res.status(500).json({
			error: 'Failed to fetch question bank',
			details: error.message,
		});
	}
});

// GET /api/public-banks/:id/sample-questions - Get sample questions for preview
router.get('/:id/sample-questions', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
		});

		if (!bank) {
			return res.status(404).json({ error: 'Question bank not found' });
		}

		// Check user's entitlement
		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId subscription');
		let hasAccess = false;

		if (user && user.companyId) {
			hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);

			// Also check if it's free or user has premium subscription
			if (!hasAccess) {
				if (bank.type === 'free') {
					hasAccess = true;
				} else if (user.subscription && user.subscription.plan === 'premium') {
					hasAccess = true;
				}
			}
		}

		let questions;

		if (hasAccess) {
			// User has access - return all questions
			questions = bank.questions.map(q => ({
				_id: q._id,
				text: q.text,
				description: q.description,
				type: q.type,
				options: q.options,
				correctAnswer: q.correctAnswer,
				explanation: q.explanation,
				points: q.points,
				tags: q.tags,
				difficulty: q.difficulty,
			}));
		} else {
			// User doesn't have access - return only preview questions (first 3, without correct answers)
			questions = bank.questions.slice(0, 3).map(q => ({
				_id: q._id,
				text: q.text,
				description: q.description,
				type: q.type,
				options: q.options,
				// Hide correct answer for locked content
				correctAnswer: null,
				explanation: null,
				points: q.points,
				tags: q.tags,
				difficulty: q.difficulty,
				isPreview: true,
			}));
		}

		res.json({
			bankId: bank._id,
			bankTitle: bank.title,
			hasAccess,
			questions,
			totalQuestions: bank.questions.length,
			previewOnly: !hasAccess,
		});
	} catch (error) {
		console.error('Error fetching sample questions:', error);
		res.status(500).json({
			error: 'Failed to fetch sample questions',
			details: error.message,
		});
	}
});

// POST /api/public-banks/:id/import - Import a public bank to user's library
router.post('/:id/import', jwtAuth, async (req, res) => {
	try {
		const bank = await PublicBank.findOne({
			_id: req.params.id,
			isActive: true,
			isPublished: true,
		});

		if (!bank) {
			return res.status(404).json({ error: 'Question bank not found' });
		}

		// Check user's entitlement
		const resolveUser = async (req, select) => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select(select);
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
		};
		const user = await resolveUser(req, 'companyId subscription email');

		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		// Check if user can import this bank
		const hasAccess = await Entitlement.hasAccess(user.companyId, bank._id);

		if (!hasAccess && bank.type === 'paid') {
			return res.status(403).json({
				error: 'You do not have access to import this question bank',
			});
		}

		// Create a copy in user's question banks
		const QuestionBank = require('../models/QuestionBank');

		const newBank = new QuestionBank({
			name: bank.title,
			description: bank.description,
			questions: bank.questions,
			createdBy: user.email,
			// Add reference to original public bank
			importedFrom: bank._id,
		});

		await newBank.save();

		// Increment usage count
		await bank.incrementUsage();

		res.json({
			message: 'Question bank imported successfully',
			questionBank: newBank,
		});
	} catch (error) {
		console.error('Error importing public bank:', error);
		res.status(500).json({
			error: 'Failed to import question bank',
			details: error.message,
		});
	}
});

// GET /api/public-banks/analytics/purchases - Get purchase analytics
router.get('/analytics/purchases', jwtAuth, async (req, res) => {
	try {
		const { startDate, endDate, bankId, companyId } = req.query;

		// Build filter for analytics
		const filter = {};

		if (startDate) {
			filter.purchasedAt = { $gte: new Date(startDate) };
		}
		if (endDate) {
			filter.purchasedAt = { ...filter.purchasedAt, $lte: new Date(endDate) };
		}
		if (bankId) {
			filter.bankId = bankId;
		}
		if (companyId) {
			filter.companyId = companyId;
		}

		// Get purchase statistics
		const totalPurchases = await BankPurchase.countDocuments(filter);
		const freePurchases = await BankPurchase.countDocuments({ 
			...filter, 
			amount: 0, 
			paymentMethod: 'free' 
		});
		const paidPurchases = await BankPurchase.countDocuments({ 
			...filter, 
			amount: { $gt: 0 } 
		});

		// Get purchases by bank
		const purchasesByBank = await BankPurchase.aggregate([
			{ $match: filter },
			{
				$group: {
					_id: '$bankId',
					totalPurchases: { $sum: 1 },
					freePurchases: {
						$sum: {
							$cond: [
								{ $and: [{ $eq: ['$amount', 0] }, { $eq: ['$paymentMethod', 'free'] }] },
								1,
								0
							]
						}
					},
					paidPurchases: {
						$sum: {
							$cond: [{ $gt: ['$amount', 0] }, 1, 0]
						}
					},
					totalRevenue: { $sum: '$amount' },
				}
			},
			{
				$lookup: {
					from: 'publicbanks',
					localField: '_id',
					foreignField: '_id',
					as: 'bank'
				}
			},
			{
				$unwind: '$bank'
			},
			{
				$project: {
					bankId: '$_id',
					bankTitle: '$bank.title',
					totalPurchases: 1,
					freePurchases: 1,
					paidPurchases: 1,
					totalRevenue: 1,
				}
			},
			{ $sort: { totalPurchases: -1 } }
		]);

		// Get purchases by company
		const purchasesByCompany = await BankPurchase.aggregate([
			{ $match: filter },
			{
				$group: {
					_id: '$companyId',
					totalPurchases: { $sum: 1 },
					freePurchases: {
						$sum: {
							$cond: [
								{ $and: [{ $eq: ['$amount', 0] }, { $eq: ['$paymentMethod', 'free'] }] },
								1,
								0
							]
						}
					},
					paidPurchases: {
						$sum: {
							$cond: [{ $gt: ['$amount', 0] }, 1, 0]
						}
					},
					totalSpent: { $sum: '$amount' },
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_id',
					foreignField: '_id',
					as: 'company'
				}
			},
			{
				$unwind: '$company'
			},
			{
				$project: {
					companyId: '$_id',
					companyName: '$company.name',
					totalPurchases: 1,
					freePurchases: 1,
					paidPurchases: 1,
					totalSpent: 1,
				}
			},
			{ $sort: { totalPurchases: -1 } }
		]);

		// Get purchase trends over time (last 30 days by default)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		
		const trendFilter = {
			...filter,
			purchasedAt: { $gte: startDate ? new Date(startDate) : thirtyDaysAgo }
		};

		const purchaseTrends = await BankPurchase.aggregate([
			{ $match: trendFilter },
			{
				$group: {
					_id: {
						year: { $year: '$purchasedAt' },
						month: { $month: '$purchasedAt' },
						day: { $dayOfMonth: '$purchasedAt' }
					},
					totalPurchases: { $sum: 1 },
					freePurchases: {
						$sum: {
							$cond: [
								{ $and: [{ $eq: ['$amount', 0] }, { $eq: ['$paymentMethod', 'free'] }] },
								1,
								0
							]
						}
					},
					paidPurchases: {
						$sum: {
							$cond: [{ $gt: ['$amount', 0] }, 1, 0]
						}
					},
					revenue: { $sum: '$amount' }
				}
			},
			{
				$project: {
					date: {
						$dateFromParts: {
							year: '$_id.year',
							month: '$_id.month',
							day: '$_id.day'
						}
					},
					totalPurchases: 1,
					freePurchases: 1,
					paidPurchases: 1,
					revenue: 1
				}
			},
			{ $sort: { date: 1 } }
		]);

		res.json({
			summary: {
				totalPurchases,
				freePurchases,
				paidPurchases,
				freePercentage: totalPurchases > 0 ? Math.round((freePurchases / totalPurchases) * 100) : 0,
			},
			purchasesByBank,
			purchasesByCompany,
			purchaseTrends,
		});
	} catch (error) {
		console.error('Error fetching purchase analytics:', error);
		res.status(500).json({
			error: 'Failed to fetch purchase analytics',
			details: error.message,
		});
	}
});

module.exports = router;
