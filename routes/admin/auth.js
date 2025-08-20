const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { asyncHandler } = require('./shared/middleware');
const { JWT_SECRET } = require('../../middlewares/jwtAuth');
const { User, Company } = require('./shared/models');
const { HTTP_STATUS, ADMIN_USERNAME, ADMIN_PASSWORD } = require('./shared/constants');

const router = express.Router();

// Removed duplicate check-auth endpoint - using the one below that returns full user data including role

// POST version removed - using GET version below that returns full user payload including role

/**
 * @route   GET /admin/check-auth
 * @desc    Verify JWT token authentication
 * @access  Public (but requires Bearer token)
 */
router.get('/check-auth', (req, res) => {
	// This endpoint is now handled by JWT middleware
	// For backward compatibility, we'll keep it but it should be called with JWT
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({
			success: false,
			authenticated: false,
		});
	}

	const token = authHeader.split(' ')[1];

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		res.json({
			success: true,
			authenticated: true,
			user: payload,
		});
	} catch (error) {
		res.status(HTTP_STATUS.UNAUTHORIZED).json({
			success: false,
			authenticated: false,
		});
	}
});

/**
 * @route   POST /admin/login
 * @desc    Admin login (supports both legacy admin and database users)
 * @access  Public
 */
router.post(
	'/login',
	asyncHandler(async (req, res) => {
		const { username, password } = req.body;

		// First try legacy admin login
		if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
			const token = jwt.sign(
				{
					id: 'admin',
					username: username,
					role: 'admin',
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);
			return res.json({
				success: true,
				token,
				user: {
					id: 'admin',
					username: username,
					role: 'admin',
				},
			});
		}

		// Try database user login (using email as username)
		try {
			const user = await User.findOne({
				email: username.toLowerCase(),
				role: 'superAdmin',
			}).select('+password');

			if (!user) {
				// Check if user exists but with different role
				const userWithDifferentRole = await User.findOne({
					email: username.toLowerCase(),
				});

				if (userWithDifferentRole) {
					return res.status(HTTP_STATUS.UNAUTHORIZED).json({
						success: false,
						error: 'Account found but not authorized for super admin access',
						errorType: 'unauthorized_role',
					});
				}

				return res.status(HTTP_STATUS.UNAUTHORIZED).json({
					success: false,
					error: 'No account found with this email address',
					errorType: 'user_not_found',
				});
			}

			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return res.status(HTTP_STATUS.UNAUTHORIZED).json({
					success: false,
					error: 'Incorrect password',
					errorType: 'wrong_password',
				});
			}

			// Update last login time
			user.lastLoginAt = new Date();
			await user.save();

			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					role: user.role,
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			res.json({
				success: true,
				token,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			console.error('Login error:', error);
			res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				error: 'Login failed. Please try again.',
			});
		}
	})
);

/**
 * @route   POST /admin/register
 * @desc    Register a new admin user
 * @access  Public
 */
router.post(
	'/register',
	asyncHandler(async (req, res) => {
		const { name, email, password, companyName } = req.body;

		console.log('Registration request received:', {
			name,
			email: email ? email.toLowerCase() : 'undefined',
			companyName,
			hasPassword: !!password,
			passwordLength: password ? password.length : 0,
		});

		// Validation
		if (!name || !email || !password) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'Name, email, and password are required',
			});
		}

		if (password.length < 8) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'Password must be at least 8 characters long',
			});
		}

		// Check if user already exists
		console.log('Checking for existing user with email:', email.toLowerCase());
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			console.log('User already exists with this email');
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'An account with this email already exists',
				errorType: 'user_exists',
			});
		}
		console.log('No existing user found, proceeding with registration');

		try {
			// Hash password
			console.log('Hashing password...');
			const hashedPassword = await bcrypt.hash(password, 12);
			console.log('Password hashing successful');

			// Create company if provided
			let company = null;
			if (companyName) {
				console.log('Creating company:', companyName);
				// Generate a slug from the company name
				const baseSlug = companyName
					.toLowerCase()
					.trim()
					.replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
					.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

				// Check if slug already exists and make it unique if needed
				let slug = baseSlug;
				let counter = 1;
				while (await Company.findOne({ slug })) {
					slug = `${baseSlug}-${counter}`;
					counter++;
				}

				console.log('Generated slug:', slug);
				company = new Company({
					name: companyName,
					slug: slug,
				});
				await company.save();
				console.log(
					'Company created successfully with ID:',
					company._id,
					'and slug:',
					slug
				);
			}

			// Create user
			console.log('Creating user with data:', {
				name,
				email: email.toLowerCase(),
				role: 'admin',
				companyId: company ? company._id : undefined,
				hasHashedPassword: !!hashedPassword,
			});

			const user = new User({
				name,
				email: email.toLowerCase(),
				password: hashedPassword,
				role: 'admin',
				companyId: company ? company._id : undefined,
			});

			console.log('Saving user to database...');
			await user.save();
			console.log('User saved successfully with ID:', user._id);

			// Generate JWT token
			console.log('Generating JWT token for user:', user._id);
			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					role: user.role,
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);
			console.log('JWT token generated successfully');

			console.log('Registration completed successfully, sending response');
			res.status(HTTP_STATUS.CREATED).json({
				success: true,
				token,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			console.error('Registration error:', error);
			console.error('Error details:', {
				message: error.message,
				name: error.name,
				code: error.code,
				stack: error.stack,
			});

			// More specific error messages
			let errorMessage = 'Registration failed. Please try again.';
			let errorType = 'registration_failed';

			if (error.code === 11000) {
				// Handle different types of duplicate key errors
				if (error.message.includes('users') && error.message.includes('email')) {
					errorMessage = 'This email is already registered.';
					errorType = 'duplicate_email';
				} else if (error.message.includes('companies') && error.message.includes('slug')) {
					errorMessage = 'Database configuration issue. Please contact support.';
					errorType = 'database_index_error';
					console.error(
						'Company slug index error detected. Run: node scripts/fix_production_company_slug.js'
					);
				} else {
					errorMessage = 'Duplicate data detected. Please check your input.';
					errorType = 'duplicate_key_error';
				}
			} else if (error.name === 'ValidationError') {
				errorMessage = 'Invalid data provided. Please check your input.';
				errorType = 'validation_error';
				// Add validation details
				if (error.errors) {
					const validationErrors = Object.keys(error.errors).map(
						field => `${field}: ${error.errors[field].message}`
					);
					console.error('Validation errors:', validationErrors);
					errorMessage += ' (' + validationErrors.join(', ') + ')';
				}
			} else if (error.message && error.message.includes('bcrypt')) {
				errorMessage = 'Password encryption failed. Please try again.';
				errorType = 'bcrypt_error';
			} else if (error.name === 'MongooseError' || error.name === 'MongoError') {
				errorMessage = 'Database error. Please try again later.';
				errorType = 'database_error';
			}

			res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				error: errorMessage,
				errorType: errorType,
				debug:
					process.env.NODE_ENV === 'development'
						? {
							originalError: error.message,
							errorName: error.name,
							errorCode: error.code,
						}
						: undefined,
			});
		}
	})
);

/**
 * @route   GET /admin/logout
 * @desc    Admin logout (destroy session)
 * @access  Public
 */
router.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.json({ success: true });
	});
});

module.exports = router;
