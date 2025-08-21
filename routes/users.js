const express = require('express');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, HTTP_STATUS } = require('../shared/constants');

const router = express.Router();

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	next();
};

// Get all users (admin only)
router.get(
	'/',
	requireAdmin,
	asyncHandler(async (req, res) => {
		const { role, department, class: className, search } = req.query;

		let query = { isActive: true };

		// Apply filters
		if (role) query.role = role;
		if (department) query.department = department;
		if (className) query.class = className;
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ studentId: { $regex: search, $options: 'i' } },
			];
		}

		const users = await User.find(query).sort({ createdAt: -1 });
		res.json(users);
	})
);

// Create a new user (admin only)
router.post(
	'/',
	requireAdmin,
	asyncHandler(async (req, res) => {
		const { name, email, role, studentId, department, class: className } = req.body;

		// Validate required fields
		if (!name || !email) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Name and email are required',
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'User with this email already exists',
			});
		}

		// Check if studentId is unique (if provided)
		if (studentId) {
			const existingStudent = await User.findOne({ studentId });
			if (existingStudent) {
				return res.status(HTTP_STATUS.BAD_REQUEST).json({
					error: 'Student ID already exists',
				});
			}
		}

		const user = await User.create({
			name,
			email,
			role: role || 'user',
			studentId,
			department,
			class: className,
		});

		res.status(HTTP_STATUS.CREATED).json(user);
	})
);

// Bulk create users (admin only)
router.post(
	'/bulk',
	requireAdmin,
	asyncHandler(async (req, res) => {
		const { users } = req.body;

		if (!Array.isArray(users) || users.length === 0) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Users array is required and must not be empty',
			});
		}

		const results = {
			created: [],
			errors: [],
		};

		for (const userData of users) {
			try {
				const { name, email, role, studentId, department, class: className } = userData;

				// Validate required fields
				if (!name || !email) {
					results.errors.push({ userData, error: 'Name and email are required' });
					continue;
				}

				// Check if user already exists
				const existingUser = await User.findOne({ email });
				if (existingUser) {
					results.errors.push({ userData, error: 'User with this email already exists' });
					continue;
				}

				// Check if studentId is unique (if provided)
				if (studentId) {
					const existingStudent = await User.findOne({ studentId });
					if (existingStudent) {
						results.errors.push({ userData, error: 'Student ID already exists' });
						continue;
					}
				}

				const user = await User.create({
					name,
					email,
					role: role || 'user',
					studentId,
					department,
					class: className,
				});

				results.created.push(user);
			} catch (error) {
				results.errors.push({ userData, error: error.message });
			}
		}

		res.json(results);
	})
);

// Update a user (admin only)
router.put(
	'/:id',
	requireAdmin,
	asyncHandler(async (req, res) => {
		const { name, email, role, studentId, department, class: className, isActive } = req.body;

		const user = await User.findById(req.params.id);
		if (!user) {
			throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
		}

		// Check if email is unique (if changing)
		if (email && email !== user.email) {
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				return res.status(HTTP_STATUS.BAD_REQUEST).json({
					error: 'User with this email already exists',
				});
			}
		}

		// Check if studentId is unique (if changing)
		if (studentId && studentId !== user.studentId) {
			const existingStudent = await User.findOne({ studentId });
			if (existingStudent) {
				return res.status(HTTP_STATUS.BAD_REQUEST).json({
					error: 'Student ID already exists',
				});
			}
		}

		// Update user fields
		if (name !== undefined) user.name = name;
		if (email !== undefined) user.email = email;
		if (role !== undefined) user.role = role;
		if (studentId !== undefined) user.studentId = studentId;
		if (department !== undefined) user.department = department;
		if (className !== undefined) user.class = className;
		if (isActive !== undefined) user.isActive = isActive;

		await user.save();
		res.json(user);
	})
);

// Delete a user (admin only)
router.delete(
	'/:id',
	requireAdmin,
	asyncHandler(async (req, res) => {
		const user = await User.findById(req.params.id);
		if (!user) {
			throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
		}

		// Soft delete by setting isActive to false
		user.isActive = false;
		await user.save();

		res.json({ message: 'User deleted successfully' });
	})
);

// Get user statistics (admin only)
router.get(
	'/statistics',
	requireAdmin,
	asyncHandler(async (req, res) => {
		const stats = await User.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: null,
					totalUsers: { $sum: 1 },
					usersByRole: {
						$push: {
							role: '$role',
							count: 1,
						},
					},
					usersByDepartment: {
						$push: {
							department: '$department',
							count: 1,
						},
					},
				},
			},
		]);

		// Get role statistics
		const roleStats = await User.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 },
				},
			},
		]);

		// Get department statistics
		const departmentStats = await User.aggregate([
			{ $match: { isActive: true, department: { $ne: null } } },
			{
				$group: {
					_id: '$department',
					count: { $sum: 1 },
				},
			},
		]);

		res.json({
			totalUsers: stats[0]?.totalUsers || 0,
			roleStats,
			departmentStats,
		});
	})
);

module.exports = router;
