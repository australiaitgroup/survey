const express = require('express');
const bcrypt = require('bcrypt');
const { asyncHandler, jwtAuth } = require('./shared/middleware');
const { User, Company } = require('./shared/models');
const { HTTP_STATUS, ERROR_MESSAGES, AppError } = require('./shared/constants');

const router = express.Router();

/**
 * @route   GET /admin/profile
 * @desc    Get current admin profile and company information
 * @access  Private (Admin)
 */
router.get(
	'/profile',
	jwtAuth,
	asyncHandler(async (req, res) => {
		let user = null;
		let company = null;

		// Handle both legacy admin and database users
		if (req.user.id === 'admin') {
			// Legacy admin user
			user = {
				id: 'admin',
				username: req.user.username || 'admin',
				role: 'admin',
				isLegacyAdmin: true,
			};
		} else {
			// Database user
			user = await User.findById(req.user.id)
				.select('-password')
				.populate('companyId')
				.lean();

			if (!user) {
				throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
			}

			// Get company if associated
			if (user.companyId) {
				// Ensure slug exists for legacy companies
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

				company = await Company.findById(user.companyId).lean();
				delete user.companyId; // Remove the populated field
				user.company = company;
			}
		}

		res.json({
			user,
			company,
		});
	})
);

/**
 * @route   PUT /admin/profile
 * @desc    Update admin profile (name, email, avatar)
 * @access  Private (Admin)
 */
router.put(
	'/profile',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { name, email, avatar } = req.body;

		// Legacy admin users cannot update profile
		if (req.user.id === 'admin') {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Legacy admin profile cannot be updated',
			});
		}

		const user = await User.findById(req.user.id);
		if (!user) {
			throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
		}

		// Update fields if provided
		if (name !== undefined) {
			user.name = name;
		}
		if (email !== undefined) {
			// Check if email is already taken by another user
			const existingUser = await User.findOne({
				email: email.toLowerCase(),
				_id: { $ne: user._id },
			});
			if (existingUser) {
				return res.status(HTTP_STATUS.BAD_REQUEST).json({
					error: 'Email is already taken by another user',
				});
			}
			user.email = email.toLowerCase();
		}
		if (avatar !== undefined) {
			user.avatar = avatar;
		}

		await user.save();

		// Return updated user without password
		const updatedUser = await User.findById(user._id).select('-password').lean();

		res.json({
			success: true,
			message: 'Profile updated successfully',
			user: updatedUser,
		});
	})
);

/**
 * @route   PUT /admin/profile/password
 * @desc    Update admin password
 * @access  Private (Admin)
 */
router.put(
	'/profile/password',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { currentPassword, newPassword } = req.body;

		// Legacy admin users cannot update password
		if (req.user.id === 'admin') {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Legacy admin password cannot be updated',
			});
		}

		// Validate input
		if (!currentPassword || !newPassword) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Current password and new password are required',
			});
		}

		if (newPassword.length < 8) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'New password must be at least 8 characters long',
			});
		}

		const user = await User.findById(req.user.id).select('+password');
		if (!user) {
			throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isCurrentPasswordValid) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Current password is incorrect',
			});
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 12);
		user.password = hashedNewPassword;
		await user.save();

		res.json({
			success: true,
			message: 'Password updated successfully',
		});
	})
);

/**
 * @route   PUT /admin/company
 * @desc    Update company information
 * @access  Private (Admin)
 */
router.put(
	'/company',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { name, description, website, logoUrl } = req.body;

		// Legacy admin users cannot update company
		if (req.user.id === 'admin') {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Legacy admin cannot manage company information',
			});
		}

		const user = await User.findById(req.user.id);
		if (!user) {
			throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
		}

		let company;

		if (user.companyId) {
			// Update existing company
			company = await Company.findById(user.companyId);
			if (!company) {
				throw new AppError('Company not found', HTTP_STATUS.NOT_FOUND);
			}
		} else {
			// Create new company if none exists
			company = new Company({
				name: name || 'Unnamed Company',
			});
		}

		// Update company fields if provided
		if (name !== undefined) company.name = name;
		if (description !== undefined) company.description = description;
		if (website !== undefined) company.website = website;
		if (logoUrl !== undefined) company.logoUrl = logoUrl;

		await company.save();

		// Associate company with user if not already associated
		if (!user.companyId) {
			user.companyId = company._id;
			await user.save();
		}

		res.json({
			success: true,
			message: 'Company information updated successfully',
			company,
		});
	})
);

module.exports = router;
