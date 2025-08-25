// Minimal PostCSS config for Jenkins CI/CD
// Uses simple require() syntax for better compatibility
module.exports = {
	plugins: {
		'@tailwindcss/postcss': {},
		autoprefixer: {},
	},
};
