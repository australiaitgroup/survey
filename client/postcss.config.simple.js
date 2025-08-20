// Alpine Linux compatible PostCSS config for Jenkins CI/CD
// Uses Tailwind CSS v4 compatible syntax but avoids lightningcss issues
export default {
	plugins: {
		// Use @tailwindcss/postcss but with compatibility mode
		'@tailwindcss/postcss': {
			// Disable lightningcss for Alpine Linux compatibility
			lightningcss: false,
		},
		autoprefixer: {},
	},
};
