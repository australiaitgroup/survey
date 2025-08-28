const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Company = require('../models/Company');
const { generateUniqueSlug } = require('../utils/slugUtils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function migrateLongSlugs() {
	try {
		await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
		console.log('✓ Connected to MongoDB');

		// Find all surveys with slugs longer than 16 characters
		const surveysWithLongSlugs = await Survey.find({
			slug: { $exists: true, $ne: null },
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		});

		console.log(`Found ${surveysWithLongSlugs.length} surveys with slugs longer than 16 characters`);

		for (const survey of surveysWithLongSlugs) {
			const oldSlug = survey.slug;
			
			// Generate new slug from title (or use existing slug if title is not available)
			const baseTitle = survey.title || survey.slug;
			const newSlug = await generateUniqueSlug(baseTitle, Survey, survey._id, 16);
			
			survey.slug = newSlug;
			await survey.save();
			
			console.log(`Updated survey "${survey.title || 'Untitled'}" slug: ${oldSlug} -> ${newSlug}`);
		}

		// Find all companies with slugs longer than 16 characters
		const companiesWithLongSlugs = await Company.find({
			slug: { $exists: true, $ne: null },
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		});

		console.log(`Found ${companiesWithLongSlugs.length} companies with slugs longer than 16 characters`);

		for (const company of companiesWithLongSlugs) {
			const oldSlug = company.slug;
			
			// Generate new slug from name (or use existing slug if name is not available)
			const baseName = company.name || company.slug;
			const newSlug = await generateUniqueSlug(baseName, Company, company._id, 16);
			
			company.slug = newSlug;
			await company.save();
			
			console.log(`Updated company "${company.name || 'Unnamed'}" slug: ${oldSlug} -> ${newSlug}`);
		}

		console.log('✓ Migration completed successfully');
		
		// Summary
		const totalUpdated = surveysWithLongSlugs.length + companiesWithLongSlugs.length;
		console.log(`✓ Total entities updated: ${totalUpdated}`);
		
		// Verify no slugs exceed 16 characters
		const remainingLongSurveysSlugs = await Survey.countDocuments({
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		});
		const remainingLongCompanySlugs = await Company.countDocuments({
			$expr: { $gt: [{ $strLenCP: '$slug' }, 16] }
		});
		
		if (remainingLongSurveysSlugs === 0 && remainingLongCompanySlugs === 0) {
			console.log('✓ Verification passed: No slugs exceed 16 characters');
		} else {
			console.warn(`⚠ Verification failed: ${remainingLongSurveysSlugs} surveys and ${remainingLongCompanySlugs} companies still have long slugs`);
		}
		
		process.exit(0);
	} catch (error) {
		console.error('✗ Migration failed:', error);
		process.exit(1);
	}
}

// Run the script
if (require.main === module) {
	migrateLongSlugs();
}

module.exports = { migrateLongSlugs };