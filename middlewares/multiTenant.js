const Company = require('../models/Company');

/**
 * Multi-tenant middleware that extracts company information from URL
 * Expected URL format: /:companySlug/assessment/:slug or /:companySlug/survey/:slug
 */
const multiTenant = async (req, res, next) => {
	try {
		const { companySlug } = req.params;
		console.log('MultiTenant middleware - companySlug:', companySlug);

		// Skip if no company slug (for backward compatibility with non-tenant URLs)
		if (!companySlug) {
			console.log('No company slug, skipping');
			return next();
		}

		// Find company by slug
		const company = await Company.findOne({
			slug: companySlug,
			isActive: true,
		});
		console.log('Company found:', company ? company.name : 'null');

		if (!company) {
			console.log('Company not found for slug:', companySlug);
			return res.status(404).json({
				error: 'Company not found',
				code: 'COMPANY_NOT_FOUND',
			});
		}

		// Attach company to request object for use in subsequent middleware/routes
		req.company = company;

		next();
	} catch (error) {
		console.error('Multi-tenant middleware error:', error);
		res.status(500).json({
			error: 'Internal server error',
			code: 'MULTI_TENANT_ERROR',
		});
	}
};

/**
 * Middleware to extract company slug from various URL patterns
 * and normalize it for multi-tenant processing
 */
const extractTenantFromUrl = (req, res, next) => {
	const path = req.path;

	// Check for tenant-based URLs: /company-slug/assessment/* or /company-slug/survey/*
	// Exclude API paths that start with /api/
	const tenantMatch =
		!path.startsWith('/api/') && path.match(/^\/([a-z0-9-]+)\/(assessment|survey)\/(.+)$/);

	if (tenantMatch) {
		const [, companySlug, routeType, resourcePath] = tenantMatch;
		console.log('Extracted:', { companySlug, routeType, resourcePath });

		// Set the company slug in params for the multiTenant middleware
		req.params.companySlug = companySlug;

		// Store original route info
		req.tenantInfo = {
			companySlug,
			routeType, // 'assessment' or 'survey'
			resourcePath,
		};

		// Rewrite the URL to match existing route patterns
		req.url = `/${routeType}/${resourcePath}`;
		req.path = `/${routeType}/${resourcePath}`;
		console.log('URL rewritten to:', req.url);
	}

	next();
};

module.exports = {
	multiTenant,
	extractTenantFromUrl,
};
