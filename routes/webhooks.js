const express = require('express');
const router = express.Router();
const Entitlement = require('../models/Entitlement');
const PublicBank = require('../models/PublicBank');
const User = require('../models/User');
const Company = require('../models/Company');

// Initialize Stripe (will use placeholder if not configured)
let stripe = null;
try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes('sk_test_placeholder')) {
        stripe = require('stripe')(stripeKey);
    }
} catch (error) {
    console.log('Stripe not initialized - webhook will skip processing');
}

// POST /api/webhooks/stripe - Handle Stripe webhook events
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        console.log('Stripe webhook received but Stripe not configured');
        return res.status(200).json({ received: true, message: 'Stripe not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        if (endpointSecret) {
            // Verify webhook signature
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // For development without webhook secret
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('Stripe webhook event received:', event.type);
    
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                // Handle subscription renewal
                await handleSubscriptionPaymentSucceeded(event.data.object);
                break;
                
            case 'customer.subscription.deleted':
                // Handle subscription cancellation
                await handleSubscriptionDeleted(event.data.object);
                break;
                
            case 'customer.subscription.updated':
                // Handle subscription updates
                await handleSubscriptionUpdated(event.data.object);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ 
            error: 'Webhook processing failed',
            details: error.message 
        });
    }
});

// Handle successful checkout session completion
async function handleCheckoutSessionCompleted(session) {
    console.log('Processing checkout session completion:', session.id);
    
    const { companyId, bankId, userId, type } = session.metadata;
    
    if (!companyId || !bankId || !userId) {
        console.error('Missing required metadata in checkout session');
        return;
    }
    
    // Verify the bank exists
    const bank = await PublicBank.findById(bankId);
    if (!bank) {
        console.error('Bank not found for checkout session:', bankId);
        return;
    }
    
    // Create or update entitlement
    let accessType = 'purchased';
    let stripeData = {};
    
    if (session.mode === 'subscription') {
        accessType = 'subscription';
        stripeData.stripeSubscriptionId = session.subscription;
    } else {
        stripeData.stripePaymentIntentId = session.payment_intent;
    }
    
    const entitlement = await Entitlement.findOneAndUpdate(
        { companyId, bankId },
        {
            $set: {
                accessType,
                status: 'active',
                purchasePrice: session.amount_total / 100, // Convert from cents
                currency: session.currency.toUpperCase(),
                grantedAt: new Date(),
                grantedBy: userId,
                updatedAt: new Date(),
                ...stripeData
            },
            $setOnInsert: {
                createdAt: new Date(),
            }
        },
        { 
            upsert: true, 
            new: true,
            runValidators: true
        }
    );
    
    // Increment purchase count
    await bank.incrementPurchaseCount();
    
    console.log('Entitlement created/updated for successful payment:', {
        companyId,
        bankId,
        accessType,
        entitlementId: entitlement._id
    });
}

// Handle successful subscription payment (renewal)
async function handleSubscriptionPaymentSucceeded(invoice) {
    console.log('Processing subscription payment success:', invoice.id);
    
    if (invoice.billing_reason !== 'subscription_cycle') {
        // Only process recurring payments, not initial payments (handled by checkout.session.completed)
        return;
    }
    
    const subscriptionId = invoice.subscription;
    
    // Find and update the entitlement
    const entitlement = await Entitlement.findOne({
        stripeSubscriptionId: subscriptionId,
        status: 'active'
    });
    
    if (entitlement) {
        // Extend subscription (if there was an expiration date)
        // For bank subscriptions, we typically don't set expiration dates
        entitlement.updatedAt = new Date();
        await entitlement.save();
        
        console.log('Subscription payment processed for entitlement:', entitlement._id);
    } else {
        console.error('No active entitlement found for subscription:', subscriptionId);
    }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription) {
    console.log('Processing subscription deletion:', subscription.id);
    
    // Find and update the entitlement
    const entitlement = await Entitlement.findOne({
        stripeSubscriptionId: subscription.id
    });
    
    if (entitlement) {
        entitlement.status = 'cancelled';
        entitlement.updatedAt = new Date();
        await entitlement.save();
        
        console.log('Subscription entitlement cancelled:', entitlement._id);
    } else {
        console.error('No entitlement found for cancelled subscription:', subscription.id);
    }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
    console.log('Processing subscription update:', subscription.id);
    
    // Find the entitlement
    const entitlement = await Entitlement.findOne({
        stripeSubscriptionId: subscription.id
    });
    
    if (entitlement) {
        // Update status based on subscription status
        if (subscription.status === 'active') {
            entitlement.status = 'active';
        } else if (['canceled', 'incomplete_expired', 'unpaid'].includes(subscription.status)) {
            entitlement.status = 'cancelled';
        }
        
        entitlement.updatedAt = new Date();
        await entitlement.save();
        
        console.log('Subscription entitlement updated:', {
            entitlementId: entitlement._id,
            newStatus: entitlement.status,
            subscriptionStatus: subscription.status
        });
    } else {
        console.error('No entitlement found for updated subscription:', subscription.id);
    }
}

module.exports = router;