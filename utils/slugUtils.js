const crypto = require('crypto');

/**
 * Generate a unique slug with length limit and collision handling
 * @param {string} title - The title to generate slug from
 * @param {Object} Model - The mongoose model to check for uniqueness
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @param {number} maxLength - Maximum length for the slug (default: 16)
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(title, Model, excludeId = null, maxLength = 16) {
	// Generate base slug from title
	let baseSlug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

	// If the slug is empty (e.g., Chinese title), generate a unique ID
	if (!baseSlug) {
		const timestamp = Date.now().toString(36);
		const randomStr = crypto.randomBytes(3).toString('hex');
		baseSlug = `item-${timestamp}-${randomStr}`;
	}

	// Truncate to max length if needed
	if (baseSlug.length > maxLength) {
		baseSlug = baseSlug.substring(0, maxLength);
	}

	// Ensure slug is unique
	let slug = baseSlug;
	let attempt = 0;

	// Check if slug already exists (excluding current document)
	const query = { slug };
	if (excludeId) {
		query._id = { $ne: excludeId };
	}

	while (await Model.findOne(query)) {
		attempt++;
		
		// Generate a short random suffix (2-3 characters)
		const suffix = crypto.randomBytes(2).toString('hex').substring(0, 2);
		
		// Calculate available space for base slug after suffix
		const suffixLength = suffix.length + 1; // +1 for the dash
		const availableLength = maxLength - suffixLength;
		
		// Truncate base slug if needed to make room for suffix
		const truncatedBase = baseSlug.substring(0, Math.max(1, availableLength));
		slug = `${truncatedBase}-${suffix}`;
		
		// Update query for next iteration
		query.slug = slug;
		
		// Safety check to prevent infinite loops
		if (attempt > 100) {
			// Generate completely random slug as fallback
			const randomSlug = crypto.randomBytes(8).toString('hex').substring(0, maxLength);
			slug = randomSlug;
			query.slug = slug;
		}
	}

	return slug;
}

/**
 * Validate slug length and format
 * @param {string} slug - The slug to validate
 * @param {number} maxLength - Maximum allowed length (default: 16)
 * @returns {boolean} - Whether the slug is valid
 */
function validateSlug(slug, maxLength = 16) {
	if (!slug || typeof slug !== 'string') {
		return false;
	}
	
	if (slug.length > maxLength) {
		return false;
	}
	
	// Check if slug contains only valid characters (alphanumeric and hyphens)
	const validSlugPattern = /^[a-z0-9-]+$/;
	return validSlugPattern.test(slug);
}

/**
 * Sanitize and truncate slug
 * @param {string} slug - The slug to sanitize
 * @param {number} maxLength - Maximum length (default: 16)
 * @returns {string} - Sanitized and truncated slug
 */
function sanitizeSlug(slug, maxLength = 16) {
	if (!slug || typeof slug !== 'string') {
		return '';
	}
	
	const sanitized = slug
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
		.replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
		.substring(0, maxLength);
		
	return sanitized;
}

module.exports = {
	generateUniqueSlug,
	validateSlug,
	sanitizeSlug,
};