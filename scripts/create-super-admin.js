#!/usr/bin/env node

/**
 * Script to create or update a user to have superAdmin role
 * Usage: node scripts/create-super-admin.js <email>
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function createSuperAdmin() {
	try {
		// Connect to MongoDB
		await mongoose.connect(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('✓ Connected to MongoDB');

		const email = process.argv[2];

		if (!email) {
			console.error('❌ Please provide an email address');
			console.log('Usage: node scripts/create-super-admin.js <email>');
			process.exit(1);
		}

		// Find user by email
		const user = await User.findOne({ email });

		if (!user) {
			console.error(`❌ User with email ${email} not found`);
			console.log(
				'Please create a regular admin user first through the normal registration process'
			);
			process.exit(1);
		}

		// Update user role to superAdmin
		user.role = 'superAdmin';
		await user.save();

		console.log(`✅ User ${email} has been granted Super Admin role`);
		console.log('\nYou can now login at: http://localhost:5050/super-admin');
		console.log('Use your existing password to login');
	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
	}
}

createSuperAdmin();
