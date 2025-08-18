const mongoose = require('mongoose');

// Import models
const PublicBank = require('../models/PublicBank');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

const sampleBanks = [
	{
		title: 'JavaScript Fundamentals',
		description:
			'Comprehensive question bank covering JavaScript basics including variables, functions, arrays, objects, and ES6+ features. Perfect for beginners and intermediate developers looking to solidify their understanding of core JavaScript concepts.',
		type: 'free',
		tags: ['javascript', 'web development', 'programming', 'beginner'],
		category: 'Programming Languages',
		difficulty: 'beginner',
		isActive: true,
		isPublished: true,
		questions: [
			{
				text: 'What is the correct way to declare a variable in JavaScript?',
				type: 'single_choice',
				options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
				correctAnswer: 0,
				points: 1,
				difficulty: 'easy',
				tags: ['variables', 'syntax'],
			},
			{
				text: 'Which method is used to add an element to the end of an array?',
				type: 'single_choice',
				options: ['push()', 'append()', 'add()', 'insert()'],
				correctAnswer: 0,
				points: 1,
				difficulty: 'easy',
				tags: ['arrays', 'methods'],
			},
			{
				text: 'What does the "typeof" operator return for an array?',
				type: 'single_choice',
				options: ['array', 'object', 'list', 'collection'],
				correctAnswer: 1,
				points: 1,
				difficulty: 'medium',
				tags: ['arrays', 'operators'],
			},
		],
	},
	{
		title: 'React Advanced Patterns',
		description:
			'Advanced React patterns including hooks, context, performance optimization, and architectural best practices for building scalable applications. Covers modern React development techniques and common interview topics.',
		type: 'paid',
		priceOneTime: 29.99,
		currency: 'USD',
		tags: ['react', 'javascript', 'frontend', 'hooks', 'performance'],
		category: 'Frontend Development',
		difficulty: 'advanced',
		isActive: true,
		isPublished: true,
		questions: [
			{
				text: 'Which hook should you use to perform side effects in function components?',
				type: 'single_choice',
				options: ['useState', 'useEffect', 'useContext', 'useReducer'],
				correctAnswer: 1,
				points: 1,
				difficulty: 'medium',
				tags: ['hooks', 'side-effects'],
			},
			{
				text: 'What is the purpose of the dependency array in useEffect?',
				type: 'single_choice',
				options: [
					'To specify which state variables to watch',
					'To prevent infinite re-renders',
					'To optimize performance by controlling when the effect runs',
					'All of the above',
				],
				correctAnswer: 3,
				points: 1,
				difficulty: 'medium',
				tags: ['hooks', 'useEffect', 'performance'],
			},
		],
	},
	{
		title: 'Python Basics',
		description:
			'Introduction to Python programming language covering syntax, data types, control structures, and basic libraries. Ideal for programming beginners and those transitioning from other languages.',
		type: 'free',
		tags: ['python', 'programming', 'beginner', 'syntax'],
		category: 'Programming Languages',
		difficulty: 'beginner',
		isActive: true,
		isPublished: true,
		questions: [
			{
				text: 'Which of the following is the correct way to create a list in Python?',
				type: 'single_choice',
				options: [
					'list = [1, 2, 3]',
					'list = {1, 2, 3}',
					'list = (1, 2, 3)',
					'list = <1, 2, 3>',
				],
				correctAnswer: 0,
				points: 1,
				difficulty: 'easy',
				tags: ['lists', 'syntax'],
			},
			{
				text: 'What is the output of print(type([]))?',
				type: 'single_choice',
				options: [
					"<class 'array'>",
					"<class 'list'>",
					"<class 'collection'>",
					"<class 'sequence'>",
				],
				correctAnswer: 1,
				points: 1,
				difficulty: 'easy',
				tags: ['data-types', 'lists'],
			},
		],
	},
	{
		title: 'System Design Interview Prep',
		description:
			'Comprehensive preparation for system design interviews covering scalability, distributed systems, microservices, database design, and architectural patterns. Based on real interview questions from top tech companies.',
		type: 'paid',
		priceOneTime: 79.99,
		currency: 'USD',
		tags: ['system design', 'architecture', 'interview', 'scalability', 'distributed systems'],
		category: 'System Architecture',
		difficulty: 'expert',
		isActive: true,
		isPublished: true,
		questions: [
			{
				text: 'What is the primary benefit of using a Content Delivery Network (CDN)?',
				type: 'single_choice',
				options: [
					'Reduced server load',
					'Faster content delivery to users',
					'Better security',
					'All of the above',
				],
				correctAnswer: 3,
				points: 2,
				difficulty: 'medium',
				tags: ['cdn', 'performance', 'scalability'],
			},
			{
				text: 'In a microservices architecture, what pattern helps handle failures gracefully?',
				type: 'single_choice',
				options: ['Circuit Breaker', 'Load Balancer', 'API Gateway', 'Service Mesh'],
				correctAnswer: 0,
				points: 2,
				difficulty: 'hard',
				tags: ['microservices', 'resilience', 'patterns'],
			},
		],
	},
	{
		title: 'SQL Mastery',
		description:
			'Master SQL with comprehensive coverage of queries, joins, indexes, transactions, stored procedures, and database optimization techniques. Suitable for both beginners and experienced developers.',
		type: 'free',
		tags: ['sql', 'database', 'backend', 'queries', 'optimization'],
		category: 'Database',
		difficulty: 'intermediate',
		isActive: true,
		isPublished: true,
		questions: [
			{
				text: 'Which SQL clause is used to filter rows returned by a query?',
				type: 'single_choice',
				options: ['WHERE', 'FILTER', 'HAVING', 'SELECT'],
				correctAnswer: 0,
				points: 1,
				difficulty: 'easy',
				tags: ['queries', 'filtering'],
			},
			{
				text: 'What type of join returns all records from the left table and matched records from the right table?',
				type: 'single_choice',
				options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'],
				correctAnswer: 1,
				points: 1,
				difficulty: 'medium',
				tags: ['joins', 'relationships'],
			},
		],
	},
	{
		title: 'Data Structures & Algorithms',
		description:
			'Essential computer science concepts covering arrays, linked lists, trees, graphs, sorting algorithms, searching algorithms, and complexity analysis. Perfect for technical interviews and competitive programming.',
		type: 'paid',
		priceOneTime: 49.99,
		currency: 'USD',
		tags: ['algorithms', 'data structures', 'computer science', 'interview', 'complexity'],
		category: 'Computer Science',
		difficulty: 'advanced',
		isActive: true,
		isPublished: true,
		questions: [
			{
				text: 'What is the time complexity of binary search?',
				type: 'single_choice',
				options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
				correctAnswer: 1,
				points: 1,
				difficulty: 'medium',
				tags: ['searching', 'complexity', 'binary-search'],
			},
			{
				text: 'Which data structure uses LIFO (Last In, First Out) principle?',
				type: 'single_choice',
				options: ['Queue', 'Stack', 'Array', 'Linked List'],
				correctAnswer: 1,
				points: 1,
				difficulty: 'easy',
				tags: ['stack', 'data-structures'],
			},
		],
	},
];

async function seedPublicBanks() {
	try {
		// Connect to MongoDB
		await mongoose.connect(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('✓ Connected to MongoDB');

		// Find a super admin user to use as creator
		let creator = await User.findOne({ role: 'super_admin' });
		if (!creator) {
			// If no super admin, find any admin user
			creator = await User.findOne({ role: 'admin' });
		}
		if (!creator) {
			// Create a system user for seeding
			creator = new User({
				email: 'system@marketplace.com',
				username: 'marketplace-system',
				password: 'placeholder', // This won't be used for login
				role: 'super_admin',
				isVerified: true,
			});
			await creator.save();
			console.log('✓ Created system user for seeding');
		}

		// Clear existing public banks
		await PublicBank.deleteMany({});
		console.log('✓ Cleared existing public banks');

		// Create public banks
		const banksToCreate = sampleBanks.map(bank => ({
			...bank,
			createdBy: creator._id,
			updatedBy: creator._id,
			createdAt: new Date(),
			updatedAt: new Date(),
		}));

		const createdBanks = await PublicBank.insertMany(banksToCreate);
		console.log(`✓ Created ${createdBanks.length} public question banks`);

		// Display summary
		console.log('\nCreated Public Banks:');
		createdBanks.forEach((bank, index) => {
			console.log(
				`${index + 1}. ${bank.title} (${bank.type.toUpperCase()}) - ${bank.questions.length} questions`
			);
		});

		console.log('\n✅ Public banks seeding completed successfully!');
	} catch (error) {
		console.error('❌ Error seeding public banks:', error);
	} finally {
		await mongoose.disconnect();
		console.log('✓ Disconnected from MongoDB');
	}
}

// Run the seeding if this file is executed directly
if (require.main === module) {
	seedPublicBanks();
}

module.exports = { seedPublicBanks, sampleBanks };
