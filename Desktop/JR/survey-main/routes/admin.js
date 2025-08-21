/**
 * Admin API Routes - Refactored Entry Point
 *
 * This file replaces the original 2149-line monolithic admin.js file.
 * All routes have been split into organized modules while maintaining
 * the exact same API paths and functionality.
 *
 * Route Modules:
 * - auth.js: Authentication (login, register, check-auth, logout)
 * - surveys.js: Survey CRUD and scoring settings
 * - questions.js: Question banks and survey questions management
 * - responses.js: Response analytics and statistics
 * - distribution.js: Survey publishing and invitations
 * - profile.js: User profile and company management
 * - dashboard.js: Dashboard statistics
 * - uploads.js: File upload handling
 * - utils.js: Debug and utility routes
 *
 * Original file backed up as: admin.js.backup
 *
 * Last refactored: 2025-08-08
 */

module.exports = require('./admin/index');
