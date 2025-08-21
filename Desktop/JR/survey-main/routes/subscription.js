const express = require('express');
const router = express.Router();
const serviceContainer = require('../services/ServiceContainer');
const { jwtAuth: authenticateToken } = require('../middlewares/jwtAuth');

// Get subscription controller from service container
const subscriptionController = serviceContainer.resolve('subscriptionController');

// Create checkout session
router.post('/create-checkout-session', authenticateToken, (req, res) => {
	subscriptionController.createCheckoutSession(req, res);
});

// Create customer portal session
router.post('/create-portal-session', authenticateToken, (req, res) => {
	subscriptionController.createPortalSession(req, res);
});

// Get subscription status
router.get('/subscription-status', authenticateToken, (req, res) => {
	subscriptionController.getSubscriptionStatus(req, res);
});

// Get available plans
router.get('/plans', (req, res) => {
	subscriptionController.getAvailablePlans(req, res);
});

// Handle webhook events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
	subscriptionController.handleWebhook(req, res);
});

// Check feature access
router.get('/feature-access/:feature', authenticateToken, (req, res) => {
	subscriptionController.checkFeatureAccess(req, res);
});

module.exports = router;
