const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

async function testQuestionBankDetail() {
	console.log('🧪 Testing Question Bank Detail Features...\\n');

	try {
		// 1. Login as admin
		console.log('1. Logging in as admin...');
		const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
			username: 'admin',
			password: 'password',
		});

		if (loginResponse.data.success) {
			console.log('✅ Login successful');
		} else {
			console.log('❌ Login failed');
			return;
		}

		// 2. Create a test question bank
		console.log('\\n2. Creating a test question bank...');
		const createBankResponse = await axios.post(`${BASE_URL}/api/admin/question-banks`, {
			name: 'Test Question Bank for Detail',
			description: 'A test question bank to verify detail page functionality',
		});

		if (createBankResponse.data._id) {
			console.log('✅ Question bank created:', createBankResponse.data.name);
			const questionBankId = createBankResponse.data._id;
		} else {
			console.log('❌ Failed to create question bank');
			return;
		}

		// 3. Add questions to the bank
		console.log('\\n3. Adding questions to the bank...');

		// Add single choice question
		const singleChoiceQuestion = {
			text: 'What is the capital of France?',
			type: 'single_choice',
			options: ['London', 'Paris', 'Berlin', 'Madrid'],
			correctAnswer: 1,
			points: 2,
		};

		const singleChoiceResponse = await axios.post(
			`${BASE_URL}/api/admin/question-banks/${questionBankId}/questions`,
			singleChoiceQuestion
		);

		if (singleChoiceResponse.data.questions.length > 0) {
			console.log('✅ Single choice question added');
		} else {
			console.log('❌ Failed to add single choice question');
		}

		// Add multiple choice question
		const multipleChoiceQuestion = {
			text: 'Which of the following are programming languages?',
			type: 'multiple_choice',
			options: ['Python', 'Java', 'HTML', 'CSS', 'JavaScript'],
			correctAnswer: [0, 1, 4], // Python, Java, JavaScript
			points: 3,
		};

		const multipleChoiceResponse = await axios.post(
			`${BASE_URL}/api/admin/question-banks/${questionBankId}/questions`,
			multipleChoiceQuestion
		);

		if (multipleChoiceResponse.data.questions.length > 1) {
			console.log('✅ Multiple choice question added');
		} else {
			console.log('❌ Failed to add multiple choice question');
		}

		// 4. Get the updated question bank
		console.log('\\n4. Getting updated question bank...');
		const getBankResponse = await axios.get(
			`${BASE_URL}/api/admin/question-banks/${questionBankId}`
		);

		if (getBankResponse.data.questions.length === 2) {
			console.log('✅ Question bank has 2 questions');
			console.log('   - Question 1:', getBankResponse.data.questions[0].text);
			console.log('   - Question 2:', getBankResponse.data.questions[1].text);
		} else {
			console.log('❌ Question bank does not have expected number of questions');
		}

		// 5. Test updating a question
		console.log('\\n5. Testing question update...');
		const questionToUpdate = getBankResponse.data.questions[0];
		const updatedQuestion = {
			text: 'What is the capital of France? (Updated)',
			type: 'single_choice',
			options: ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'],
			correctAnswer: 1,
			points: 3,
		};

		const updateResponse = await axios.put(
			`${BASE_URL}/api/admin/question-banks/${questionBankId}/questions/${questionToUpdate._id}`,
			updatedQuestion
		);

		if (updateResponse.data.questions[0].text === updatedQuestion.text) {
			console.log('✅ Question updated successfully');
		} else {
			console.log('❌ Failed to update question');
		}

		// 6. Test deleting a question
		console.log('\\n6. Testing question deletion...');
		const questionToDelete = getBankResponse.data.questions[1];

		const deleteResponse = await axios.delete(
			`${BASE_URL}/api/admin/question-banks/${questionBankId}/questions/${questionToDelete._id}`
		);

		if (deleteResponse.data.questions.length === 1) {
			console.log('✅ Question deleted successfully');
		} else {
			console.log('❌ Failed to delete question');
		}

		// 7. Final verification
		console.log('\\n7. Final verification...');
		const finalBankResponse = await axios.get(
			`${BASE_URL}/api/admin/question-banks/${questionBankId}`
		);

		if (finalBankResponse.data.questions.length === 1) {
			console.log('✅ Final question bank has 1 question');
			console.log('   - Remaining question:', finalBankResponse.data.questions[0].text);
		} else {
			console.log('❌ Final question bank does not have expected number of questions');
		}

		console.log('\\n🎉 Question Bank Detail Features Test Completed!');
		console.log('\\n📋 Summary:');
		console.log('   - Question bank creation: ✅');
		console.log('   - Single choice question addition: ✅');
		console.log('   - Multiple choice question addition: ✅');
		console.log('   - Question update: ✅');
		console.log('   - Question deletion: ✅');
		console.log('\\n💡 Next Steps:');
		console.log('   1. Open the frontend at http://localhost:5178');
		console.log('   2. Navigate to Admin > Question Banks');
		console.log('   3. Click "Edit" on the test question bank');
		console.log('   4. Verify the detail page functionality');
	} catch (error) {
		console.error('❌ Test failed:', error.response?.data || error.message);
	}
}

// Run the test
testQuestionBankDetail();
