const mongoose = require('mongoose');
const Company = require('../models/Company');

// Import centralized slug utility
const { generateUniqueSlug } = require('../utils/slugUtils');

const addSlugsToCompanies = async () => {
	try {
		const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';
		await mongoose.connect(MONGODB_URI);
		console.log('✓ Connected to MongoDB');

		// Find all companies without slug
		const companiesWithoutSlug = await Company.find({
			$or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
		});

		console.log(`Found ${companiesWithoutSlug.length} companies without slug`);

		for (const company of companiesWithoutSlug) {
			const slug = await generateUniqueSlug(company.name || 'company', Company, company._id, 16);

			// Update the company with the slug
			await Company.findByIdAndUpdate(company._id, { slug });
			console.log(`Updated company "${company.name}" with slug: ${slug}`);
		}

		console.log('✓ All companies updated with slugs');
	} catch (error) {
		console.error('✗ Error updating companies:', error);
	} finally {
		await mongoose.connection.close();
		console.log('✓ Database connection closed');
	}
};

// Run the script
if (require.main === module) {
	addSlugsToCompanies();
}

module.exports = { addSlugsToCompanies };
