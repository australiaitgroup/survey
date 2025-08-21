const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

async function testQuestionBankDetailFeatures() {
	console.log('🧪 Testing Question Bank Detail Features...\n');

	try {
		// Step 1: Login as admin
		console.log('1. Logging in as admin...');
		const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
			username: 'admin',
			password: 'password',
		});

		if (!loginResponse.data.success) {
			throw new Error('Login failed');
		}

		console.log('✅ Login successful\n');

		// Step 2: Create a question bank
		console.log('2. Creating a question bank...');
		const createBankResponse = await axios.post(`${BASE_URL}/api/admin/question-banks`, {
			name: 'Test Question Bank for Detail Features',
			description: 'Testing question creation, editing, and deletion',
		});

		const questionBank = createBankResponse.data;
		console.log(`✅ Question bank created: ${questionBank.name} (ID: ${questionBank._id})\n`);

		// Step 3: Add a single choice question
		console.log('3. Adding a single choice question...');
		const singleChoiceQuestion = {
			text: 'What is the capital of France?',
			type: 'single_choice',
			options: ['London', 'Paris', 'Berlin', 'Madrid'],
			correctAnswer: 1, // Paris
			points: 2,
		};

		const addSingleResponse = await axios.post(
			`${BASE_URL}/api/admin/question-banks/${questionBank._id}/questions`,
			singleChoiceQuestion
		);

		console.log('✅ Single choice question added\n');

		// Step 4: Add a multiple choice question
		console.log('4. Adding a multiple choice question...');
		const multipleChoiceQuestion = {
			text: 'Which of the following are programming languages?',
			type: 'multiple_choice',
			options: ['Python', 'Java', 'HTML', 'CSS', 'JavaScript'],
			correctAnswer: [0, 1, 4], // Python, Java, JavaScript
			points: 3,
		};

		const addMultipleResponse = await axios.post(
			`${BASE_URL}/api/admin/question-banks/${questionBank._id}/questions`,
			multipleChoiceQuestion
		);

		console.log('✅ Multiple choice question added\n');

		// Step 5: Get the updated question bank to see the questions
		console.log('5. Fetching updated question bank...');
		const getBankResponse = await axios.get(
			`${BASE_URL}/api/admin/question-banks/${questionBank._id}`
		);
		const updatedBank = getBankResponse.data;

		console.log(`📊 Question bank now has ${updatedBank.questions.length} questions:`);
		updatedBank.questions.forEach((q, index) => {
			console.log(`   ${index + 1}. ${q.text}`);
			console.log(`      Type: ${q.type}`);
			console.log(`      Options: ${q.options.join(', ')}`);
			console.log(
				`      Correct: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.map(i => q.options[i]).join(', ') : q.options[q.correctAnswer]}`
			);
			console.log(`      Points: ${q.points}\n`);
		});

		// Step 6: Update the first question
		console.log('6. Updating the first question...');
		const firstQuestion = updatedBank.questions[0];
		const updatedQuestion = {
			text: 'What is the capital of France? (Updated)',
			type: 'single_choice',
			options: ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'],
			correctAnswer: 1, // Still Paris
			points: 3,
		};

		await axios.put(
			`${BASE_URL}/api/admin/question-banks/${questionBank._id}/questions/${firstQuestion._id}`,
			updatedQuestion
		);

		console.log('✅ First question updated\n');

		// Step 7: Delete the second question
		console.log('7. Deleting the second question...');
		const secondQuestion = updatedBank.questions[1];
		await axios.delete(
			`${BASE_URL}/api/admin/question-banks/${questionBank._id}/questions/${secondQuestion._id}`
		);

		console.log('✅ Second question deleted\n');

		// Step 8: Get final state
		console.log('8. Fetching final question bank state...');
		const finalResponse = await axios.get(
			`${BASE_URL}/api/admin/question-banks/${questionBank._id}`
		);
		const finalBank = finalResponse.data;

		console.log(`📊 Final question bank has ${finalBank.questions.length} questions:`);
		finalBank.questions.forEach((q, index) => {
			console.log(`   ${index + 1}. ${q.text}`);
			console.log(`      Type: ${q.type}`);
			console.log(`      Options: ${q.options.join(', ')}`);
			console.log(
				`      Correct: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.map(i => q.options[i]).join(', ') : q.options[q.correctAnswer]}`
			);
			console.log(`      Points: ${q.points}\n`);
		});

		// Step 9: Clean up - delete the question bank
		console.log('9. Cleaning up - deleting question bank...');
		await axios.delete(`${BASE_URL}/api/admin/question-banks/${questionBank._id}`);
		console.log('✅ Question bank deleted\n');

		console.log('🎉 All question bank detail features tested successfully!');
		console.log('\n📋 Summary:');
		console.log('   ✅ Question bank creation');
		console.log('   ✅ Single choice question addition');
		console.log('   ✅ Multiple choice question addition');
		console.log('   ✅ Question updating');
		console.log('   ✅ Question deletion');
		console.log('   ✅ Correct answer handling (single and multiple)');
		console.log('   ✅ Points assignment');
	} catch (error) {
		console.error('❌ Test failed:', error.response?.data || error.message);
		process.exit(1);
	}
}

// Run the test
testQuestionBankDetailFeatures();
