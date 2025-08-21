const express = require('express');
const path = require('path');

const app = express();
const PORT = 5050;

// Basic middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
	res.json({ message: 'Server is running', timestamp: new Date() });
});

// Super Admin routes for development
if (process.env.NODE_ENV === 'production') {
	// Production routes here
} else {
	// In development, redirect to the dev server
	app.get('/super-admin*', (req, res) => {
		res.redirect('http://localhost:3000');
	});
}

app.listen(PORT, () => {
	console.log(`Test server running on http://localhost:${PORT}`);
});
