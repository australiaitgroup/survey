// Debug script to test login behavior and identify refresh issue
const puppeteer = require('puppeteer');

async function debugLoginRefresh() {
	console.log('🔍 Debugging Login Page Refresh Issue...'.cyan);
	console.log('=========================================='.cyan);

	const browser = await puppeteer.launch({
		headless: false, // Keep browser open to see what happens
		slowMo: 1000, // Slow down for observation
		devtools: true, // Open devtools
	});

	try {
		const page = await browser.newPage();

		// Listen for console logs from the page
		page.on('console', msg => {
			console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
		});

		// Listen for page reloads
		page.on('load', () => {
			console.log('🔄 Page loaded/reloaded!'.yellow);
		});

		// Listen for navigation
		page.on('framenavigated', frame => {
			if (frame === page.mainFrame()) {
				console.log(`🧭 Navigation to: ${frame.url()}`.blue);
			}
		});

		console.log('1. Navigating to login page...');
		await page.goto('http://localhost:8080/admin/login', { waitUntil: 'networkidle0' });

		console.log('2. Waiting for form to load...');
		await page.waitForSelector('input[name="username"]');
		await page.waitForSelector('input[name="password"]');

		console.log('3. Filling form with wrong credentials...');
		await page.type('input[name="username"]', 'wrong@example.com');
		await page.type('input[name="password"]', 'wrongpassword');

		console.log('4. Taking screenshot before submit...');
		await page.screenshot({ path: 'before_login.png' });

		console.log('5. Clicking submit button...');
		await page.click('button[type="submit"]');

		console.log('6. Waiting for response...');
		await page.waitForTimeout(3000); // Wait 3 seconds

		console.log('7. Taking screenshot after submit...');
		await page.screenshot({ path: 'after_login.png' });

		// Check if form fields are still populated
		const usernameValue = await page.$eval('input[name="username"]', el => el.value);
		const passwordValue = await page.$eval('input[name="password"]', el => el.value);

		console.log(`Username field value: "${usernameValue}"`);
		console.log(`Password field value: "${passwordValue}"`);

		// Check if error message is displayed
		const errorElement = await page.$('.bg-red-50');
		if (errorElement) {
			const errorText = await page.$eval('.bg-red-50', el => el.textContent);
			console.log(`Error message displayed: "${errorText}"`);
		} else {
			console.log('❌ No error message found!'.red);
		}

		// Check browser console for errors
		console.log('\n📋 Analysis:');
		console.log(`- Username preserved: ${usernameValue === 'wrong@example.com' ? '✅' : '❌'}`);
		console.log(`- Password preserved: ${passwordValue === 'wrongpassword' ? '✅' : '❌'}`);
		console.log(`- Error message shown: ${errorElement ? '✅' : '❌'}`);

		console.log('\n⏸️  Browser kept open for manual inspection. Press Ctrl+C to close.');

		// Keep the browser open for manual inspection
		await new Promise(() => {}); // Wait indefinitely
	} catch (error) {
		console.error('Error during debugging:', error);
	} finally {
		await browser.close();
	}
}

// Run only if puppeteer is available
try {
	debugLoginRefresh().catch(console.error);
} catch (error) {
	console.log('❌ Puppeteer not available. Install with: npm install puppeteer'.red);
	console.log('📝 Manual testing steps:'.cyan);
	console.log('1. Open http://localhost:8080/admin/login');
	console.log('2. Open browser DevTools (F12)');
	console.log('3. Go to Network tab');
	console.log('4. Enter wrong credentials: wrong@example.com / wrongpassword');
	console.log('5. Click Submit');
	console.log('6. Check if:');
	console.log('   - Page reloads (check Network tab for page request)');
	console.log('   - Form fields get cleared');
	console.log('   - Error message appears');
	console.log('   - Console shows any errors');
}
