const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { jwtAuth } = require('../middlewares/jwtAuth');

// Get current user's company information
router.get('/current', jwtAuth, async (req, res) => {
	try {
		// Handle legacy admin login where id is 'admin' string
		let user;
		if (req.user.id === 'admin') {
			// For legacy admin, find or create a default admin user
			user = await User.findOne({ role: 'admin' }).populate('companyId');
			if (!user) {
				// Create default admin user if none exists
				user = new User({
					name: 'Administrator',
					email: 'admin@example.com',
					role: 'admin',
				});
				await user.save();
			}
		} else {
			// For database users, use the ObjectId
			user = await User.findById(req.user.id).populate('companyId');
		}

		if (!user.companyId) {
			return res.status(404).json({
				success: false,
				error: 'No company associated with this user',
			});
		}

		// Ensure company has a slug (auto-generate for legacy companies)
		const companyDoc = await Company.findById(user.companyId);
		if (companyDoc && !companyDoc.slug) {
			const generateSlug = name => {
				return (name || 'company')
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, '')
					.replace(/\s+/g, '-')
					.replace(/-+/g, '-')
					.replace(/(^-)|(-$)/g, '');
			};

			let slug = generateSlug(companyDoc.name);
			const originalSlug = slug;
			let counter = 1;
			// Ensure uniqueness
			// eslint-disable-next-line no-await-in-loop
			while (await Company.findOne({ slug, _id: { $ne: companyDoc._id } })) {
				slug = `${originalSlug}-${counter}`;
				counter++;
			}

			companyDoc.slug = slug;
			await companyDoc.save();
		}

		// Reload lean doc for response
		const companyForResponse = await Company.findById(user.companyId).lean();

		res.json({
			success: true,
			company: companyForResponse,
		});
	} catch (error) {
		console.error('Error fetching company:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch company information',
		});
	}
});

// Update company information (for onboarding steps)
router.patch('/current', jwtAuth, async (req, res) => {
	try {
		// Handle legacy admin login where id is 'admin' string
		let user;
		if (req.user.id === 'admin') {
			// For legacy admin, find or create a default admin user
			user = await User.findOne({ role: 'admin' });
			if (!user) {
				// Create default admin user if none exists
				user = new User({
					name: 'Administrator',
					email: 'admin@example.com',
					role: 'admin',
				});
				await user.save();
			}
		} else {
			// For database users, use the ObjectId
			user = await User.findById(req.user.id);
		}

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found',
			});
		}

		let company;

		// If user doesn't have a company, create one
		if (!user.companyId) {
			const generateSlug = name => {
				return name
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
					.replace(/\s+/g, '-') // Replace spaces with hyphens
					.replace(/-+/g, '-') // Replace multiple hyphens with single
					.trim('-'); // Remove leading/trailing hyphens
			};

			const companyName = req.body.name || 'My Company';
			let slug = generateSlug(companyName);

			// Ensure slug is unique
			let counter = 1;
			let originalSlug = slug;
			while (await Company.findOne({ slug })) {
				slug = `${originalSlug}-${counter}`;
				counter++;
			}

			company = new Company({
				name: companyName,
				slug: slug,
				...req.body,
			});
			await company.save();

			// Link company to user
			user.companyId = company._id;
			await user.save();
		} else {
			// Update existing company
			company = await Company.findById(user.companyId);
			if (!company) {
				return res.status(404).json({
					success: false,
					error: 'Company not found',
				});
			}

			// If name is changing, regenerate a unique slug unless an explicit slug is provided
			if (req.body.name && req.body.name !== company.name && !req.body.slug) {
				const generateSlug = name => {
					return name
						.toLowerCase()
						.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
						.replace(/\s+/g, '-') // Replace spaces with hyphens
						.replace(/-+/g, '-') // Replace multiple hyphens with single
						.replace(/(^-)|(-$)/g, ''); // Trim leading/trailing hyphens
				};

				let slug = generateSlug(req.body.name);
				const originalSlug = slug;
				let counter = 1;
				// Ensure uniqueness excluding current company
				// eslint-disable-next-line no-await-in-loop
				while (await Company.findOne({ slug, _id: { $ne: company._id } })) {
					slug = `${originalSlug}-${counter}`;
					counter++;
				}
				company.slug = slug;
			}

			// Update other company fields
			Object.keys(req.body).forEach(key => {
				if (req.body[key] !== undefined && key !== 'slug') {
					company[key] = req.body[key];
				}
			});

			await company.save();
		}

		res.json({
			success: true,
			message: 'Company information updated successfully',
			company: company,
		});
	} catch (error) {
		console.error('Error updating company:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to update company information',
		});
	}
});

// Complete onboarding
router.post('/complete-onboarding', jwtAuth, async (req, res) => {
	try {
		// Handle legacy admin login where id is 'admin' string
		let user;
		if (req.user.id === 'admin') {
			// For legacy admin, find or create a default admin user
			user = await User.findOne({ role: 'admin' });
			if (!user) {
				// Create default admin user if none exists
				user = new User({
					name: 'Administrator',
					email: 'admin@example.com',
					role: 'admin',
				});
				await user.save();
			}
		} else {
			// For database users, use the ObjectId
			user = await User.findById(req.user.id);
		}

		if (!user || !user.companyId) {
			return res.status(404).json({
				success: false,
				error: 'User or company not found',
			});
		}

		const company = await Company.findById(user.companyId);
		if (!company) {
			return res.status(404).json({
				success: false,
				error: 'Company not found',
			});
		}

		company.isOnboardingCompleted = true;
		await company.save();

		res.json({
			success: true,
			message: 'Onboarding completed successfully',
			company: company,
		});
	} catch (error) {
		console.error('Error completing onboarding:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to complete onboarding',
		});
	}
});

module.exports = router;
