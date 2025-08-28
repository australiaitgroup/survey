const mongoose = require('mongoose');
const { generateUniqueSlug, validateSlug, sanitizeSlug } = require('../utils/slugUtils');
const Survey = require('../models/Survey');

// Simple test runner
function describe(name, fn) {
	console.log(`\n=== ${name} ===`);
	fn();
}

function test(name, fn) {
	try {
		fn();
		console.log(`✓ ${name}`);
	} catch (error) {
		console.log(`✗ ${name}: ${error.message}`);
	}
}

function expect(actual) {
	return {
		toBe: (expected) => {
			if (actual !== expected) {
				throw new Error(`Expected ${expected}, but got ${actual}`);
			}
		},
		toMatch: (regex) => {
			if (!regex.test(actual)) {
				throw new Error(`Expected ${actual} to match ${regex}`);
			}
		},
		toHaveLength: (length) => {
			if (actual.length !== length) {
				throw new Error(`Expected length ${length}, but got ${actual.length}`);
			}
		},
		toBeLessThanOrEqual: (max) => {
			if (actual > max) {
				throw new Error(`Expected ${actual} to be less than or equal to ${max}`);
			}
		}
	};
}

// Mock Survey model for testing
const MockModel = {
	findOne: null, // Will be set in tests
};

describe('Slug Utils', () => {
	describe('validateSlug', () => {
		test('should validate correct slugs', () => {
			expect(validateSlug('valid-slug')).toBe(true);
			expect(validateSlug('test123')).toBe(true);
			expect(validateSlug('a-b-c-d-e-f-g-h')).toBe(true);
			expect(validateSlug('short')).toBe(true);
		});

		test('should reject invalid slugs', () => {
			expect(validateSlug('')).toBe(false);
			expect(validateSlug(null)).toBe(false);
			expect(validateSlug(undefined)).toBe(false);
			expect(validateSlug('invalid_slug')).toBe(false);
			expect(validateSlug('invalid slug')).toBe(false);
			expect(validateSlug('Invalid-Slug')).toBe(false);
			expect(validateSlug('slug!')).toBe(false);
		});

		test('should respect max length', () => {
			expect(validateSlug('very-long-slug-name', 10)).toBe(false);
			expect(validateSlug('short', 10)).toBe(true);
			expect(validateSlug('exactly-16-chars', 16)).toBe(true);
			expect(validateSlug('more-than-16-chars', 16)).toBe(false);
		});
	});

	describe('sanitizeSlug', () => {
		test('should sanitize and truncate slugs', () => {
			expect(sanitizeSlug('Valid Title')).toBe('valid-title');
			expect(sanitizeSlug('Title with Special! Characters@', 30)).toBe('title-with-special-characters');
			expect(sanitizeSlug('Multiple   Spaces')).toBe('multiple-spaces');
			expect(sanitizeSlug('--Leading-and-trailing--', 30)).toBe('leading-and-trailing');
		});

		test('should respect max length', () => {
			const longTitle = 'This is a very long title that exceeds the maximum length';
			expect(sanitizeSlug(longTitle, 16)).toHaveLength(16);
			expect(sanitizeSlug(longTitle, 10)).toHaveLength(10);
		});

		test('should handle edge cases', () => {
			expect(sanitizeSlug('')).toBe('');
			expect(sanitizeSlug(null)).toBe('');
			expect(sanitizeSlug(undefined)).toBe('');
			expect(sanitizeSlug('中文标题')).toBe('');
		});
	});

	describe('generateUniqueSlug', () => {
		test('should generate slug from title within 16 character limit', async () => {
			MockModel.findOne = async () => null; // No collision
			
			const slug = await generateUniqueSlug('My Test Survey', MockModel);
			
			expect(slug).toBe('my-test-survey');
			expect(slug.length).toBeLessThanOrEqual(16);
		});

		test('should truncate long titles to 16 characters', async () => {
			MockModel.findOne = async () => null; // No collision
			
			const longTitle = 'This is a very long survey title that exceeds sixteen characters';
			const slug = await generateUniqueSlug(longTitle, MockModel);
			
			expect(slug.length).toBeLessThanOrEqual(16);
			expect(slug).toBe('this-is-a-very-l');
		});

		test('should handle collisions with random suffixes', async () => {
			let callCount = 0;
			MockModel.findOne = async (query) => {
				callCount++;
				if (callCount === 1 && query.slug === 'my-test-survey') {
					return { slug: 'my-test-survey' }; // Collision
				}
				return null; // No collision with suffix
			};
			
			const slug = await generateUniqueSlug('My Test Survey', MockModel);
			
			expect(slug.length).toBeLessThanOrEqual(16);
			// When there's a collision, the base slug gets truncated to make room for suffix
			// Pattern: truncated-base + '-' + 2-hex-chars
			expect(slug).toMatch(/^my-test-surve-[a-f0-9]{2}$/);
		});

		test('should handle empty or non-ASCII titles', async () => {
			MockModel.findOne = async () => null;
			
			const slug = await generateUniqueSlug('中文标题', MockModel);
			
			expect(slug.length).toBeLessThanOrEqual(16);
			// Should start with 'item-' and contain only valid slug characters
			if (!slug.startsWith('item-')) {
				throw new Error(`Expected slug to start with 'item-', got: ${slug}`);
			}
			// Check that it only contains valid characters
			if (!/^[a-z0-9-]+$/.test(slug)) {
				throw new Error(`Expected slug to contain only lowercase letters, numbers, and hyphens, got: ${slug}`);
			}
		});

		test('should respect custom max length', async () => {
			MockModel.findOne = async () => null;
			
			const slug = await generateUniqueSlug('My Test Survey', MockModel, null, 8);
			
			expect(slug.length).toBeLessThanOrEqual(8);
			expect(slug).toBe('my-test-');
		});
	});

});

// Run all tests
console.log('Running Slug Utils Tests...');

// Export for use in other test files
module.exports = {
	MockModel,
};