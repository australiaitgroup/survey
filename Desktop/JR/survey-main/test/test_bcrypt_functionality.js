const bcrypt = require('bcrypt');

async function testBcrypt() {
	console.log('Testing bcrypt functionality...\n');

	const testPassword = 'Admin@1234';
	const saltRounds = 12;

	try {
		console.log('Original password:', testPassword);
		console.log('Salt rounds:', saltRounds);

		// Test hashing
		console.log('\nHashing password...');
		const startTime = Date.now();
		const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
		const hashTime = Date.now() - startTime;

		console.log('Hashed password:', hashedPassword);
		console.log('Hash length:', hashedPassword.length);
		console.log('Time taken:', hashTime + 'ms');

		// Test comparison
		console.log('\nTesting password comparison...');
		const compareStart = Date.now();
		const isValid = await bcrypt.compare(testPassword, hashedPassword);
		const compareTime = Date.now() - compareStart;

		console.log('Password comparison result:', isValid);
		console.log('Compare time:', compareTime + 'ms');

		// Test wrong password
		console.log('\nTesting wrong password...');
		const wrongPassword = 'WrongPassword123';
		const isWrongValid = await bcrypt.compare(wrongPassword, hashedPassword);
		console.log('Wrong password comparison result:', isWrongValid);

		console.log('\n✅ Bcrypt is working correctly!');
		return true;
	} catch (error) {
		console.error('\n❌ Bcrypt error:', error);
		console.error('Error details:', {
			message: error.message,
			name: error.name,
			stack: error.stack,
		});
		return false;
	}
}

// Test bcrypt synchronous functions too
function testBcryptSync() {
	console.log('\n--- Testing bcrypt synchronous functions ---');

	try {
		const testPassword = 'Admin@1234';
		const saltRounds = 12;

		console.log('Testing bcrypt.hashSync...');
		const hashedSync = bcrypt.hashSync(testPassword, saltRounds);
		console.log('Sync hash successful, length:', hashedSync.length);

		console.log('Testing bcrypt.compareSync...');
		const compareSync = bcrypt.compareSync(testPassword, hashedSync);
		console.log('Sync compare result:', compareSync);

		console.log('✅ Bcrypt sync functions working correctly!');
		return true;
	} catch (error) {
		console.error('❌ Bcrypt sync error:', error);
		return false;
	}
}

async function runBcryptTests() {
	console.log('=== Bcrypt Functionality Test ===\n');

	const asyncTest = await testBcrypt();
	const syncTest = testBcryptSync();

	console.log('\n=== Test Results ===');
	console.log('Async bcrypt functions:', asyncTest ? '✅ PASS' : '❌ FAIL');
	console.log('Sync bcrypt functions:', syncTest ? '✅ PASS' : '❌ FAIL');

	if (asyncTest && syncTest) {
		console.log('\n🎉 All bcrypt tests passed! Bcrypt is working correctly.');
	} else {
		console.log(
			'\n⚠️  Some bcrypt tests failed. There may be an issue with the bcrypt installation.'
		);
	}
}

if (require.main === module) {
	runBcryptTests();
}

module.exports = { testBcrypt, testBcryptSync };
