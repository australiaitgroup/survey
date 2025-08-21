# 🚀 Stripe Subscription Setup Guide

This guide will help you set up the complete Stripe subscription system for your survey application with Basic ($19/month) and Pro ($49/month) plans.

## 📋 Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Node.js**: Ensure you have Node.js >= 20 installed
3. **MongoDB**: Running MongoDB instance
4. **Environment Variables**: Properly configured `.env` files

## 🛠️ Setup Steps

### 1. Install Dependencies

Dependencies are already included in your `package.json` files:

- Backend: `stripe: ^18.4.0`
- Frontend: `@stripe/stripe-js: ^2.4.0`

### 2. Configure Stripe Dashboard

#### Create Products and Prices:

1. **Go to Stripe Dashboard** → Products
2. **Create Basic Plan**:
    - Name: "Basic Plan"
    - Description: "Essential survey features for small teams"
    - Price: $19.00 USD/month (recurring)
    - Copy the Price ID (starts with `price_`)

3. **Create Pro Plan**:
    - Name: "Pro Plan"
    - Description: "Advanced survey features for growing businesses"
    - Price: $49.00 USD/month (recurring)
    - Copy the Price ID (starts with `price_`)

#### Set up Webhook:

1. **Go to Webhooks** → Add endpoint
2. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
3. **Select Events**:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
4. **Copy Webhook Secret** (starts with `whsec_`)

### 3. Environment Variables

Create `.env` file in root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/survey-app

# JWT
JWT_SECRET=your-jwt-secret-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from Step 2)
STRIPE_BASIC_PRICE_ID=price_basic_plan_monthly_id
STRIPE_PRO_PRICE_ID=price_pro_plan_monthly_id

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=3000
NODE_ENV=development
```

Create `client/.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# API Base URL
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Database Migration

The User model has been updated with subscription fields. Existing users will have `null` values for subscription fields, which is expected behavior.

### 5. Frontend Integration

Add the billing page to your router. Example with React Router:

```tsx
// In your main App.tsx or routing file
import BillingPage from './components/BillingPage';

// Add this route
<Route path="/billing" element={<BillingPage />} />;
```

## 🎯 Feature Implementation Examples

### 1. Survey Creation with Limits

```tsx
// In your survey creation component
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from '../components/UpgradePrompt';

const SurveyCreation = () => {
	const { hasReachedLimit, getUpgradeMessage } = useSubscription();
	const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
	const [currentSurveyCount, setCurrentSurveyCount] = useState(0);

	const handleCreateSurvey = async () => {
		if (hasReachedLimit('maxSurveys', currentSurveyCount)) {
			setShowUpgradePrompt(true);
			return;
		}

		// Proceed with survey creation
		try {
			const response = await axios.post('/api/surveys', surveyData, {
				headers: { Authorization: `Bearer ${token}` },
			});
			// Handle success
		} catch (error) {
			if (error.response?.data?.code === 'USAGE_LIMIT_REACHED') {
				setShowUpgradePrompt(true);
			}
		}
	};

	return (
		<div>
			<button onClick={handleCreateSurvey}>Create New Survey</button>

			{showUpgradePrompt && (
				<UpgradePrompt
					message={getUpgradeMessage('maxSurveys')}
					currentPlan={subscriptionInfo?.subscriptionTier}
					onClose={() => setShowUpgradePrompt(false)}
					showFeatureComparison={true}
				/>
			)}
		</div>
	);
};
```

### 2. Backend Route Protection

```javascript
// In your survey routes
const { requireActiveSubscription, checkUsageLimit } = require('../middlewares/subscription');

// Protect survey creation with subscription check and usage limit
router.post(
	'/surveys',
	authenticateToken,
	requireActiveSubscription,
	checkUsageLimit('maxSurveys'),
	async (req, res) => {
		// Survey creation logic
	}
);

// Protect CSV import feature
router.post(
	'/surveys/:id/import-csv',
	authenticateToken,
	requireFeature('csvImport'),
	async (req, res) => {
		// CSV import logic
	}
);
```

### 3. Feature-Based UI Rendering

```tsx
// In your survey editor
const SurveyEditor = () => {
	const { canAccessFeature, needsUpgradeFor } = useSubscription();

	return (
		<div>
			{/* CSV Import Button */}
			{canAccessFeature('csvImport') ? (
				<button onClick={handleCSVImport}>Import from CSV</button>
			) : (
				<UpgradePrompt
					inline={true}
					message="CSV import is available in Pro plan"
					currentPlan={subscriptionInfo?.subscriptionTier}
				/>
			)}

			{/* Image Questions */}
			{canAccessFeature('imageQuestions') ? (
				<button onClick={addImageQuestion}>Add Image Question</button>
			) : (
				<div className="opacity-50 cursor-not-allowed">
					<button disabled>Add Image Question (Pro Only)</button>
				</div>
			)}
		</div>
	);
};
```

## 🔒 Subscription Middleware Usage

### Available Middleware:

1. **`requireActiveSubscription`**: Ensures user has active subscription
2. **`requireFeature(featureName)`**: Checks if user's plan includes specific feature
3. **`checkUsageLimit(featureName)`**: Validates usage limits
4. **`checkQuestionLimit`**: Special middleware for question limits per survey

### Example Route Protection:

```javascript
// Require active subscription
router.get('/protected-route', authenticateToken, requireActiveSubscription, handler);

// Require specific feature
router.post('/csv-import', authenticateToken, requireFeature('csvImport'), handler);

// Check usage limits
router.post('/surveys', authenticateToken, checkUsageLimit('maxSurveys'), handler);

// Check question limits
router.post('/surveys/:id/questions', authenticateToken, checkQuestionLimit, handler);
```

## 📊 Plan Feature Matrix

| Feature                  | Basic Plan | Pro Plan  |
| ------------------------ | ---------- | --------- |
| Max Surveys              | 3          | Unlimited |
| Max Questions per Survey | 20         | Unlimited |
| Max Invitees             | 30         | Unlimited |
| CSV Import               | ❌         | ✅        |
| Image Questions          | ❌         | ✅        |
| Advanced Analytics       | ❌         | ✅        |
| Random Questions         | ❌         | ✅        |
| Full Question Bank       | ❌         | ✅        |
| Survey Templates         | 3          | Unlimited |

## 🧪 Testing

### Test Cards (Stripe Test Mode):

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

### Test Webhook Locally:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🚀 Deployment Checklist

### Before Production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Update Environment Variables** with live keys
3. **Configure Production Webhook** endpoint
4. **Test Live Payments** with real cards
5. **Set up Monitoring** for webhook failures

### Security Considerations:

1. **Webhook Signature Verification**: Already implemented
2. **Environment Variables**: Never commit to version control
3. **HTTPS Required**: For production webhooks
4. **Rate Limiting**: Consider implementing for API endpoints

## 🔧 Troubleshooting

### Common Issues:

1. **Webhook Signature Verification Failed**:
    - Check webhook secret in environment variables
    - Ensure raw body parsing for webhook endpoint

2. **Subscription Not Updating**:
    - Verify webhook events are configured correctly
    - Check webhook endpoint is accessible

3. **Checkout Session Creation Failed**:
    - Verify Stripe keys and price IDs
    - Check user authentication

4. **Feature Access Denied**:
    - Ensure subscription status is 'active' or 'trialing'
    - Verify plan features configuration

### Debug Mode:

Enable detailed logging by setting:

```env
NODE_ENV=development
```

## 📞 Support

For issues with this implementation:

1. Check the console for error messages
2. Verify Stripe Dashboard for webhook delivery status
3. Test with Stripe's test cards
4. Review the subscription middleware responses

## 🎉 Success!

Once configured, your users will be able to:

- ✅ Subscribe to Basic or Pro plans
- ✅ Access features based on their subscription
- ✅ Upgrade/downgrade plans anytime
- ✅ Manage billing through Stripe Customer Portal
- ✅ Receive real-time subscription updates via webhooks

The system automatically enforces plan limits and provides upgrade prompts when users hit restrictions.
