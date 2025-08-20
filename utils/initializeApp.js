const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Initialize application with necessary data
 * This runs on every app startup but only creates data if it doesn't exist
 */
async function initializeApp() {
	try {
		// Get super admin credentials from environment variables
		const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@system.com';
		const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024!';
		const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'System Administrator';

		// Check if super admin already exists
		let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });

		if (superAdmin) {
			console.log('✓ Super Admin already exists');
			
			// Update role to superAdmin if needed
			if (superAdmin.role !== 'superAdmin') {
				superAdmin.role = 'superAdmin';
				await superAdmin.save();
				console.log('✓ Updated existing user to Super Admin role');
			}
			return;
		}

		// Check if system company exists
		let systemCompany = await Company.findOne({ slug: 'system' });

		if (!systemCompany) {
			// Create system company
			systemCompany = new Company({
				name: 'System',
				slug: 'system',
				industry: 'Technology',
				size: '1-10',
				description: 'System administration company',
				settings: {
					themeColor: '#3B82F6',
					customLogoEnabled: false,
					defaultLanguage: 'en',
					autoNotifyCandidate: false,
				},
				subscription: {
					type: 'enterprise',
					status: 'active',
					startDate: new Date(),
					endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
					features: {
						maxSurveys: -1, // unlimited
						maxResponses: -1, // unlimited
						maxUsers: -1, // unlimited
						customBranding: true,
						apiAccess: true,
						exportData: true,
						prioritySupport: true,
					},
				},
			});
			await systemCompany.save();
			console.log('✓ Created system company');
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

		// Create super admin user
		superAdmin = new User({
			name: SUPER_ADMIN_NAME,
			email: SUPER_ADMIN_EMAIL,
			password: hashedPassword,
			role: 'superAdmin',
			companyId: systemCompany._id,
			isEmailVerified: true,
			createdAt: new Date(),
			lastLogin: null,
			settings: {
				language: 'en',
				notifications: {
					email: false,
					inApp: true,
				},
			},
		});

		await superAdmin.save();
		console.log('✓ Created Super Admin user');

		// Only log credentials in development mode
		if (process.env.NODE_ENV === 'development') {
			console.log('\n========================================');
			console.log('🔐 Super Admin Account Created:');
			console.log('========================================');
			console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
			console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
			console.log('========================================\n');
		} else {
			console.log('✓ Super Admin account initialized (credentials in env vars)');
		}
	} catch (error) {
		console.error('❌ Error initializing app:', error.message);
		// Don't exit the process, just log the error
		// The app can still run without super admin
	}
}

module.exports = { initializeApp };