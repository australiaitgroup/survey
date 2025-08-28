const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Company = require('../models/Company');
const { generateUniqueSlug } = require('../utils/slugUtils');
const { jwtAuth } = require('../middlewares/jwtAuth');
const { HTTP_STATUS } = require('../shared/constants');

/**
 * @route   GET /api/slug-management/check-long-slugs
 * @desc    Check for surveys and companies with slugs longer than 16 characters
 * @access  Private (Admin)
 */
router.get('/check-long-slugs', jwtAuth, async (req, res) => {
	try {
		// Find surveys with long slugs
		const longSlugSurveys = await Survey.find({
			slug: { $exists: true, $ne: null },
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		}).select('_id title slug type createdAt').lean();

		// Find companies with long slugs
		const longSlugCompanies = await Company.find({
			slug: { $exists: true, $ne: null },
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		}).select('_id name slug createdAt').lean();

		// Format response
		const surveys = longSlugSurveys.map(survey => ({
			id: survey._id,
			title: survey.title,
			slug: survey.slug,
			slugLength: survey.slug.length,
			type: survey.type,
			createdAt: survey.createdAt
		}));

		const companies = longSlugCompanies.map(company => ({
			id: company._id,
			name: company.name,
			slug: company.slug,
			slugLength: company.slug.length,
			createdAt: company.createdAt
		}));

		res.json({
			success: true,
			data: {
				surveys: {
					count: surveys.length,
					items: surveys
				},
				companies: {
					count: companies.length,
					items: companies
				},
				total: surveys.length + companies.length
			}
		});
	} catch (error) {
		console.error('Error checking long slugs:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			error: 'Failed to check long slugs'
		});
	}
});

/**
 * @route   POST /api/slug-management/surveys/:id/shorten-slug
 * @desc    Automatically shorten a survey's slug to 16 characters
 * @access  Private (Admin)
 */
router.post('/surveys/:id/shorten-slug', jwtAuth, async (req, res) => {
	try {
		const surveyId = req.params.id;
		
		// Find the survey
		const survey = await Survey.findById(surveyId);
		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				error: 'Survey not found'
			});
		}

		// Check if slug actually needs shortening
		if (survey.slug && survey.slug.length <= 16) {
			return res.json({
				success: true,
				message: 'Slug is already within 16 character limit',
				data: {
					oldSlug: survey.slug,
					newSlug: survey.slug,
					changed: false
				}
			});
		}

		const oldSlug = survey.slug;
		
		// Generate new shortened slug
		const newSlug = await generateUniqueSlug(
			survey.title || survey.slug, // Use title first, fallback to existing slug
			Survey,
			surveyId,
			16
		);

		// Update the survey
		survey.slug = newSlug;
		await survey.save();

		res.json({
			success: true,
			message: 'Slug successfully shortened',
			data: {
				oldSlug,
				newSlug,
				changed: true,
				savedCharacters: oldSlug ? oldSlug.length - newSlug.length : 0
			}
		});
	} catch (error) {
		console.error('Error shortening survey slug:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			error: 'Failed to shorten slug'
		});
	}
});

/**
 * @route   POST /api/slug-management/companies/:id/shorten-slug
 * @desc    Automatically shorten a company's slug to 16 characters
 * @access  Private (Admin)
 */
router.post('/companies/:id/shorten-slug', jwtAuth, async (req, res) => {
	try {
		const companyId = req.params.id;
		
		// Find the company
		const company = await Company.findById(companyId);
		if (!company) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				error: 'Company not found'
			});
		}

		// Check if slug actually needs shortening
		if (company.slug && company.slug.length <= 16) {
			return res.json({
				success: true,
				message: 'Slug is already within 16 character limit',
				data: {
					oldSlug: company.slug,
					newSlug: company.slug,
					changed: false
				}
			});
		}

		const oldSlug = company.slug;
		
		// Generate new shortened slug
		const newSlug = await generateUniqueSlug(
			company.name || company.slug, // Use name first, fallback to existing slug
			Company,
			companyId,
			16
		);

		// Update the company
		company.slug = newSlug;
		await company.save();

		res.json({
			success: true,
			message: 'Slug successfully shortened',
			data: {
				oldSlug,
				newSlug,
				changed: true,
				savedCharacters: oldSlug ? oldSlug.length - newSlug.length : 0
			}
		});
	} catch (error) {
		console.error('Error shortening company slug:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			error: 'Failed to shorten slug'
		});
	}
});

/**
 * @route   POST /api/slug-management/bulk-shorten
 * @desc    Bulk shorten all slugs longer than 16 characters
 * @access  Private (Admin)
 */
router.post('/bulk-shorten', jwtAuth, async (req, res) => {
	try {
		const results = {
			surveys: { processed: 0, updated: 0, errors: [] },
			companies: { processed: 0, updated: 0, errors: [] }
		};

		// Process surveys
		const longSlugSurveys = await Survey.find({
			slug: { $exists: true, $ne: null },
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		});

		for (const survey of longSlugSurveys) {
			results.surveys.processed++;
			try {
				const oldSlug = survey.slug;
				const newSlug = await generateUniqueSlug(
					survey.title || survey.slug,
					Survey,
					survey._id,
					16
				);
				
				survey.slug = newSlug;
				await survey.save();
				results.surveys.updated++;
			} catch (error) {
				results.surveys.errors.push({
					id: survey._id,
					title: survey.title,
					error: error.message
				});
			}
		}

		// Process companies
		const longSlugCompanies = await Company.find({
			slug: { $exists: true, $ne: null },
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		});

		for (const company of longSlugCompanies) {
			results.companies.processed++;
			try {
				const oldSlug = company.slug;
				const newSlug = await generateUniqueSlug(
					company.name || company.slug,
					Company,
					company._id,
					16
				);
				
				company.slug = newSlug;
				await company.save();
				results.companies.updated++;
			} catch (error) {
				results.companies.errors.push({
					id: company._id,
					name: company.name,
					error: error.message
				});
			}
		}

		res.json({
			success: true,
			message: 'Bulk slug shortening completed',
			data: results
		});
	} catch (error) {
		console.error('Error in bulk slug shortening:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			error: 'Failed to perform bulk slug shortening'
		});
	}
});

/**
 * @route   POST /api/slug-management/validate-slug
 * @desc    Validate a custom slug
 * @access  Private
 */
router.post('/validate-slug', jwtAuth, async (req, res) => {
	try {
		const { slug, type, excludeId } = req.body;
		
		if (!slug) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'Slug is required'
			});
		}

		const { validateSlug } = require('../utils/slugUtils');
		
		// Check format
		const isValidFormat = validateSlug(slug, 16);
		if (!isValidFormat) {
			return res.json({
				success: true,
				data: {
					isValid: false,
					reason: 'Invalid format or exceeds 16 characters',
					suggestions: []
				}
			});
		}

		// Check uniqueness
		const Model = type === 'company' ? Company : Survey;
		const query = { slug };
		if (excludeId) {
			query._id = { $ne: excludeId };
		}

		const existing = await Model.findOne(query);
		const isUnique = !existing;

		let suggestions = [];
		if (!isUnique) {
			// Generate alternative suggestions
			const baseSlug = slug.length > 13 ? slug.substring(0, 13) : slug;
			for (let i = 1; i <= 3; i++) {
				const suggestion = `${baseSlug}-${i}`;
				const suggestionExists = await Model.findOne({ slug: suggestion, _id: { $ne: excludeId } });
				if (!suggestionExists) {
					suggestions.push(suggestion);
				}
			}
		}

		res.json({
			success: true,
			data: {
				isValid: isValidFormat && isUnique,
				isValidFormat,
				isUnique,
				reason: !isUnique ? 'Slug already exists' : null,
				suggestions
			}
		});
	} catch (error) {
		console.error('Error validating slug:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			error: 'Failed to validate slug'
		});
	}
});

module.exports = router;