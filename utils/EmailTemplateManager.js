const fs = require('fs').promises;
const path = require('path');

class EmailTemplateManager {
	constructor() {
		this.templatesPath = path.join(__dirname, '..', 'templates', 'email');
		this.templateCache = new Map();
	}

	/**
	 * Render email template with data
	 * @param {string} templateName Template file name (without .html extension)
	 * @param {object} data Data to replace placeholders
	 * @returns {Promise<string>} Rendered HTML
	 */
	async renderTemplate(templateName, data) {
		try {
			// Check cache first
			let template = this.templateCache.get(templateName);
			
			if (!template) {
				const templatePath = path.join(this.templatesPath, `${templateName}.html`);
				template = await fs.readFile(templatePath, 'utf8');
				
				// Cache template for better performance
				this.templateCache.set(templateName, template);
			}

			return this.processTemplate(template, data);
		} catch (error) {
			console.error(`Error rendering email template ${templateName}:`, error);
			throw new Error(`Failed to render template: ${templateName}`);
		}
	}

	/**
	 * Process template with simple template engine
	 * @param {string} template Template HTML string
	 * @param {object} data Data to replace placeholders
	 * @returns {string} Processed HTML
	 */
	processTemplate(template, data) {
		let processed = template;

		// Replace HTML variables {{{variable}}} (unescaped)
		Object.keys(data).forEach(key => {
			const htmlPlaceholder = new RegExp(`{{{${key}}}}`, 'g');
			processed = processed.replace(htmlPlaceholder, data[key] || '');
		});

		// Replace simple variables {{variable}} (escaped)
		Object.keys(data).forEach(key => {
			const placeholder = new RegExp(`{{${key}}}`, 'g');
			processed = processed.replace(placeholder, data[key] || '');
		});

		// Handle conditional blocks {{#if condition}}...{{/if}}
		processed = processed.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
			return data[condition] ? content : '';
		});

		// Handle array iteration {{#each array}}...{{/each}}
		processed = processed.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
			const array = data[arrayName];
			if (!Array.isArray(array)) return '';
			
			return array.map(item => {
				if (typeof item === 'string') {
					let itemHtml = itemTemplate;
					// Support HTML in array items
					itemHtml = itemHtml.replace(/{{{this}}}/g, item);
					itemHtml = itemHtml.replace(/{{this}}/g, item);
					return itemHtml;
				} else if (typeof item === 'object') {
					let itemHtml = itemTemplate;
					Object.keys(item).forEach(key => {
						const htmlItemPlaceholder = new RegExp(`{{{${key}}}}`, 'g');
						const itemPlaceholder = new RegExp(`{{${key}}}`, 'g');
						itemHtml = itemHtml.replace(htmlItemPlaceholder, item[key] || '');
						itemHtml = itemHtml.replace(itemPlaceholder, item[key] || '');
					});
					return itemHtml;
				}
				return '';
			}).join('');
		});

		return processed;
	}

	/**
	 * Clear template cache
	 */
	clearCache() {
		this.templateCache.clear();
	}

	/**
	 * Get available template names
	 */
	async getAvailableTemplates() {
		try {
			const files = await fs.readdir(this.templatesPath);
			return files
				.filter(file => file.endsWith('.html'))
				.map(file => file.replace('.html', ''));
		} catch (error) {
			console.error('Error reading templates directory:', error);
			return [];
		}
	}
}

// Export singleton instance
const templateManager = new EmailTemplateManager();
module.exports = templateManager;