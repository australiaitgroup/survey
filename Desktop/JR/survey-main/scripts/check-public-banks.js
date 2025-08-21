const mongoose = require('mongoose');
const PublicBank = require('../models/PublicBank');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function checkPublicBanks() {
	try {
		await mongoose.connect(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('✓ Connected to MongoDB');

		const banks = await PublicBank.find({});
		console.log(`\n📊 Found ${banks.length} public banks in database:`);

		banks.forEach((bank, index) => {
			console.log(`${index + 1}. ${bank.title}`);
			console.log(`   Type: ${bank.type}`);
			console.log(`   Active: ${bank.isActive}`);
			console.log(`   Published: ${bank.isPublished}`);
			console.log(`   Questions: ${bank.questions.length}`);
			console.log(`   Created: ${bank.createdAt}`);
			console.log('');
		});

		// Test the specific query used by the API
		const apiQuery = {
			isActive: true,
			isPublished: true,
		};

		const apiResults = await PublicBank.find(apiQuery)
			.select('title description tags questionCount type priceOneTime currency updatedAt')
			.sort({ updatedAt: -1 })
			.lean();

		console.log(`🔍 API Query Results (isActive: true, isPublished: true):`);
		console.log(`Found ${apiResults.length} banks that match API criteria:`);

		apiResults.forEach((bank, index) => {
			console.log(`${index + 1}. ${bank.title} (${bank.type})`);
		});
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await mongoose.disconnect();
		console.log('\n✓ Disconnected from MongoDB');
	}
}

checkPublicBanks();
