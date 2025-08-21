const express = require('express');

// Import all route modules
const authRoutes = require('./auth');
const surveyRoutes = require('./surveys');
const questionRoutes = require('./questions');
const responseRoutes = require('./responses');
const distributionRoutes = require('./distribution');
const profileRoutes = require('./profile');
const dashboardRoutes = require('./dashboard');
const uploadRoutes = require('./uploads');
const utilRoutes = require('./utils');

const router = express.Router();

// Mount all route modules
router.use(authRoutes);
router.use(surveyRoutes);
router.use(questionRoutes);
router.use(responseRoutes);
router.use(distributionRoutes);
router.use(profileRoutes);
router.use(dashboardRoutes);
router.use(uploadRoutes);
router.use(utilRoutes);

module.exports = router;
