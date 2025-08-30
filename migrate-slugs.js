const mongoose = require('mongoose');
const Survey = require('./models/Survey');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function migrateSlugs() {
	try {
		await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
		console.log('Connected to MongoDB');

		// Find all surveys without slug
		const surveysWithoutSlug = await Survey.find({
			$or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
		});

		console.log(`Found ${surveysWithoutSlug.length} surveys without slug`);

		for (const survey of surveysWithoutSlug) {
			if (survey.title) {
				// Use the Survey model's generateSlug method for consistency
				const uniqueSlug = await Survey.generateSlug(survey.title, survey._id);
				survey.slug = uniqueSlug;
				await survey.save();
				console.log(`Updated survey "${survey.title}" with slug: ${uniqueSlug}`);
			} else {
				console.log(`Skipping survey ${survey._id} - no title`);
			}
		}

		console.log('Migration completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

migrateSlugs();
