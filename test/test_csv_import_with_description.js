const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5050';

const api = axios.create({
	baseURL: BASE_URL,
});

async function run() {
	console.log('🧪 Testing CSV import with description (Markdown)');

	// 1) Login to get token
	const login = await api.post('/api/admin/login', {
		username: 'admin',
		password: 'password',
	});
	if (!login.data?.token) throw new Error('Login failed');
	const token = login.data.token;

	// 2) Create a question bank
	const qb = await api.post(
		'/api/admin/question-banks',
		{ name: 'CSV Desc Test', description: 'CSV description field test' },
		{ headers: { Authorization: `Bearer ${token}` } }
	);

	const bankId = qb.data._id;

	// 3) Prepare CSV content with description column
	const csv = `questionText,description,type,options,correctAnswers,tags,explanation,points,difficulty,descriptionImage\n` +
		`What is 2+2?,"**Context**: Basic math test.",single,2;3;4,2,"math,basic",Simple addition,1,easy,\n` +
		`Describe your experience with JavaScript,"You can use Markdown here.",text,,,,"dev,language",Optional explanation,1,medium,`;

	// 4) Upload via multipart/form-data
	const form = new FormData();
	form.append('csvFile', Buffer.from(csv), {
		filename: 'questions.csv',
		contentType: 'text/csv',
	});

	const resp = await api.post(`/api/admin/question-banks/${bankId}/import-csv`, form, {
		headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
		maxBodyLength: Infinity,
	});

	console.log('Import response:', resp.data);

	// 5) Fetch and verify that description is present
	const qbAfter = await api.get(`/api/admin/question-banks/${bankId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!Array.isArray(qbAfter.data.questions) || qbAfter.data.questions.length < 2) {
		throw new Error('Questions not imported as expected');
	}

	const [q1, q2] = qbAfter.data.questions;
	if (!q1.description || !q2.description) {
		throw new Error('Description field missing on imported questions');
	}

	console.log('✅ CSV import with description passed');
}

run().catch(err => {
	console.error('❌ Test failed:', err.response?.data || err.message);
	process.exit(1);
});
