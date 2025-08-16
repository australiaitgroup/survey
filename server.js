const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

const questionsRouter = require('./routes/questions');
const responsesRouter = require('./routes/responses');
const adminRouter = require('./routes/admin');
const surveysRouter = require('./routes/surveys');
const assessmentsRouter = require('./routes/assessments');
const usersRouter = require('./routes/users');
const invitationsRouter = require('./routes/invitations');
const questionBanksRouter = require('./routes/questionBanks');
const subscriptionRouter = require('./routes/subscription');
const collectionsRouter = require('./routes/collections');
const companiesRouter = require('./routes/companies');
const superAdminRouter = require('./routes/superAdmin');
const errorHandler = require('./middlewares/errorHandler');
const { extractTenantFromUrl, multiTenant } = require('./middlewares/multiTenant');

// Initialize service container
const serviceContainer = require('./services/ServiceContainer');

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log('✓ Connected to MongoDB');
	})
	.catch(err => {
		console.error('✗ MongoDB connection failed:', err.message);
		process.exit(1);
	});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	session({
		secret: 'change-me',
		resave: false,
		saveUninitialized: false,
	})
);

// Multi-tenant middleware - extract tenant info from URL
app.use(extractTenantFromUrl);

// Regular API routes (non-tenant)
app.use('/api', questionsRouter);
// Multi-tenant routes with company validation (must come before static files)
app.use('/:companySlug/api', multiTenant, questionsRouter);
app.use('/:companySlug/api', multiTenant, responsesRouter);
app.use('/:companySlug/api', multiTenant, surveysRouter);
app.use('/:companySlug/api', multiTenant, assessmentsRouter);
app.use('/:companySlug/api/invitations', multiTenant, invitationsRouter);

// Regular API routes
app.use('/api', responsesRouter);
app.use('/api', surveysRouter);
app.use('/api', assessmentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/question-banks', questionBanksRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/companies', companiesRouter);
// Super Admin API (cross-tenant)
app.use('/api/sa', superAdminRouter);
// Collections API
app.use('/api', collectionsRouter);

app.use(errorHandler);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Super Admin routes
// In development: Super Admin runs on port 3000 (npm run dev)
// In production: Serve built static files
if (process.env.NODE_ENV === 'production') {
	app.get('/super-admin', (req, res) => {
		res.redirect('/super-admin/login');
	});

	app.get('/super-admin/login', (req, res) => {
		res.sendFile(path.join(__dirname, 'super-admin', 'public', 'pages', 'login.html'));
	});

	app.get('/super-admin/*', (req, res) => {
		res.sendFile(path.join(__dirname, 'super-admin', 'dist', 'index.html'));
	});

	// Serve Super Admin static files (JS, CSS, etc)
	app.use('/super-admin', express.static(path.join(__dirname, 'super-admin', 'dist')));
} else {
	// In development, redirect to the dev server
	app.get('/super-admin*', (req, res) => {
		res.redirect('http://localhost:3000');
	});
}

// Serve static files from the React build
const CLIENT_BUILD_PATH = path.join(__dirname, 'client', 'dist');
app.use(express.static(CLIENT_BUILD_PATH));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
	res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
