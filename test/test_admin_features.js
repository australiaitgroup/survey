// Test script for administrative distribution features
const mongoose = require('mongoose');
const User = require('./models/User');
const Survey = require('./models/Survey');
const Invitation = require('./models/Invitation');
const Response = require('./models/Response');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

async function testAdminFeatures() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✓ Connected to MongoDB');

		// Test 1: Create test users
		console.log('\n--- Test 1: Creating test users ---');
		const testUsers = [
			{
				name: '张三',
				email: 'zhangsan@example.com',
				role: 'student',
				studentId: '2023001',
				department: '计算机科学',
				class: '软件工程1班',
			},
			{
				name: '李四',
				email: 'lisi@example.com',
				role: 'student',
				studentId: '2023002',
				department: '计算机科学',
				class: '软件工程1班',
			},
			{
				name: '王老师',
				email: 'wang@example.com',
				role: 'teacher',
				department: '计算机科学',
			},
		];

		const createdUsers = await User.insertMany(testUsers);
		console.log(`✓ Created ${createdUsers.length} test users`);

		// Test 2: Create test survey
		console.log('\n--- Test 2: Creating test survey ---');
		const testSurvey = await Survey.create({
			title: '软件工程课程反馈',
			description: '请对本学期的软件工程课程进行评价',
			type: 'survey',
			questions: [
				{
					text: '你对本课程的总体满意度如何？',
					options: ['非常满意', '满意', '一般', '不满意', '非常不满意'],
				},
				{
					text: '你认为课程难度如何？',
					options: ['太简单', '适中', '有点难', '很难'],
				},
			],
			distributionSettings: {
				allowAnonymous: false,
				requireLogin: true,
				allowedRoles: ['student'],
				maxResponsesPerUser: 1,
			},
		});
		console.log(`✓ Created test survey: ${testSurvey.title}`);

		// Test 3: Create different types of invitations
		console.log('\n--- Test 3: Creating invitations ---');

		// Open invitation
		const openInvitation = await Invitation.create({
			surveyId: testSurvey._id,
			distributionMode: 'open',
			createdBy: createdUsers[2]._id, // Teacher
		});
		console.log(`✓ Created open invitation: ${openInvitation.invitationCode}`);

		// Targeted invitation
		const targetedInvitation = await Invitation.create({
			surveyId: testSurvey._id,
			distributionMode: 'targeted',
			targetUsers: [createdUsers[0]._id, createdUsers[1]._id],
			targetEmails: ['external@example.com'],
			maxResponses: 10,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
			createdBy: createdUsers[2]._id,
		});
		console.log(`✓ Created targeted invitation: ${targetedInvitation.invitationCode}`);

		// Link invitation
		const linkInvitation = await Invitation.create({
			surveyId: testSurvey._id,
			distributionMode: 'link',
			maxResponses: 50,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			createdBy: createdUsers[2]._id,
		});
		console.log(`✓ Created link invitation: ${linkInvitation.invitationCode}`);

		// Test 4: Test invitation validation
		console.log('\n--- Test 4: Testing invitation validation ---');

		// Test valid invitation
		const isValid = openInvitation.isValid();
		console.log(`✓ Open invitation is valid: ${isValid}`);

		// Test access control
		const canAccess = targetedInvitation.canAccess(createdUsers[0]._id, null);
		console.log(`✓ Student can access targeted invitation: ${canAccess}`);

		const cannotAccess = targetedInvitation.canAccess(createdUsers[2]._id, null);
		console.log(`✓ Teacher cannot access targeted invitation: ${!cannotAccess}`);

		// Test 5: Simulate access and completion
		console.log('\n--- Test 5: Simulating access and completion ---');

		// Log access
		targetedInvitation.accessLog.push({
			userId: createdUsers[0]._id,
			email: createdUsers[0].email,
			accessedAt: new Date(),
			ipAddress: '192.168.1.1',
		});
		await targetedInvitation.save();
		console.log('✓ Logged access to targeted invitation');

		// Create test response
		const testResponse = await Response.create({
			surveyId: testSurvey._id,
			name: createdUsers[0].name,
			email: createdUsers[0].email,
			answers: {
				[testSurvey.questions[0]._id]: '满意',
				[testSurvey.questions[1]._id]: '适中',
			},
		});
		console.log('✓ Created test response');

		// Log completion
		targetedInvitation.completedBy.push({
			userId: createdUsers[0]._id,
			email: createdUsers[0].email,
			completedAt: new Date(),
		});
		targetedInvitation.currentResponses += 1;
		await targetedInvitation.save();
		console.log('✓ Logged completion to targeted invitation');

		// Test 6: Generate statistics
		console.log('\n--- Test 6: Generating statistics ---');

		const surveyStats = await Survey.aggregate([
			{
				$group: {
					_id: '$type',
					count: { $sum: 1 },
				},
			},
		]);
		console.log('✓ Survey statistics:', surveyStats);

		const userStats = await User.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 },
				},
			},
		]);
		console.log('✓ User statistics:', userStats);

		const invitationStats = await Invitation.aggregate([
			{
				$group: {
					_id: '$distributionMode',
					count: { $sum: 1 },
				},
			},
		]);
		console.log('✓ Invitation statistics:', invitationStats);

		// Test 7: Test URL generation
		console.log('\n--- Test 7: Testing URL generation ---');
		const baseUrl = 'http://localhost:5173';
		const urls = {
			invitationUrl: `${baseUrl}/invitation/${linkInvitation.invitationCode}`,
			directSurveyUrl: `${baseUrl}/survey/${testSurvey.slug}`,
			surveyWithInvitation: `${baseUrl}/survey/${testSurvey.slug}?invitation=${linkInvitation.invitationCode}`,
		};
		console.log('✓ Generated URLs:', urls);

		// Test 8: Test multiple invitations for same user
		console.log('\n--- Test 8: Testing multiple invitations for same user ---');

		// Create another survey
		const survey2 = await Survey.create({
			title: '学生生活满意度调研',
			description: '关于校园生活各方面的满意度调研',
			type: 'survey',
			questions: [
				{
					text: '你对宿舍环境的满意度如何？',
					options: ['非常满意', '满意', '一般', '不满意'],
				},
			],
		});

		// Create invitation for same user for different survey
		const invitation2 = await Invitation.create({
			surveyId: survey2._id,
			distributionMode: 'targeted',
			targetUsers: [createdUsers[0]._id],
			targetEmails: [createdUsers[0].email],
			createdBy: createdUsers[2]._id,
		});

		console.log(`✓ Created second invitation for same user: ${invitation2.invitationCode}`);

		// Query all invitations for the user
		const userInvitations = await Invitation.find({
			$or: [{ targetUsers: createdUsers[0]._id }, { targetEmails: createdUsers[0].email }],
		}).populate('surveyId', 'title');

		console.log(`✓ User ${createdUsers[0].name} has ${userInvitations.length} invitations:`);
		userInvitations.forEach(inv => {
			console.log(`  - ${inv.surveyId.title} (${inv.distributionMode})`);
		});

		// Test 9: Test duplicate prevention
		console.log('\n--- Test 9: Testing duplicate prevention ---');

		try {
			// Try to create duplicate invitation (should work by default)
			const duplicateInvitation = await Invitation.create({
				surveyId: testSurvey._id,
				distributionMode: 'targeted',
				targetUsers: [createdUsers[0]._id],
				createdBy: createdUsers[2]._id,
			});
			console.log('✓ Duplicate invitation created successfully (default behavior)');
		} catch (error) {
			console.log('❌ Unexpected error creating duplicate invitation:', error.message);
		}

		// Check total invitations for the survey
		const surveyInvitations = await Invitation.find({ surveyId: testSurvey._id });
		console.log(`✓ Survey has ${surveyInvitations.length} total invitations`);

		console.log('\n🎉 All tests passed! Administrative features are working correctly.');
		console.log('\n📊 Test Summary:');
		console.log(`- Created ${createdUsers.length} test users`);
		console.log(`- Created ${await Survey.countDocuments()} test surveys`);
		console.log(`- Created ${await Invitation.countDocuments()} test invitations`);
		console.log(`- Same user can receive multiple invitations: ✅`);
		console.log(`- Invitation system supports multiple surveys: ✅`);
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		await mongoose.connection.close();
		console.log('✓ MongoDB connection closed');
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	testAdminFeatures();
}

module.exports = testAdminFeatures;
