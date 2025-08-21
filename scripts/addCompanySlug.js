const mongoose = require('mongoose');
const Company = require('../models/Company');

// Function to generate slug from company name
const generateSlug = name => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.trim('-'); // Remove leading/trailing hyphens
};

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
			let slug = generateSlug(company.name || 'company');

			// Ensure slug is unique
			let counter = 1;
			let originalSlug = slug;
			while (await Company.findOne({ slug, _id: { $ne: company._id } })) {
				slug = `${originalSlug}-${counter}`;
				counter++;
			}

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
