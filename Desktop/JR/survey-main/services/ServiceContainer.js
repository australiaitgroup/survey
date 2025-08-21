/**
 * Service Container
 * Manages dependency injection and service lifecycle
 */
class ServiceContainer {
	constructor() {
		this.services = new Map();
		this.singletons = new Map();
	}

	/**
	 * Register a service
	 * @param {string} name - Service name
	 * @param {Function} factory - Service factory function
	 * @param {boolean} singleton - Whether service is singleton
	 */
	register(name, factory, singleton = true) {
		this.services.set(name, { factory, singleton });
	}

	/**
	 * Resolve a service
	 * @param {string} name - Service name
	 * @returns {Object} Service instance
	 */
	resolve(name) {
		const service = this.services.get(name);
		if (!service) {
			throw new Error(`Service '${name}' not registered`);
		}

		if (service.singleton) {
			if (!this.singletons.has(name)) {
				this.singletons.set(name, service.factory(this));
			}
			return this.singletons.get(name);
		}

		return service.factory(this);
	}

	/**
	 * Check if service is registered
	 * @param {string} name - Service name
	 * @returns {boolean} Is registered
	 */
	has(name) {
		return this.services.has(name);
	}

	/**
	 * Clear all services
	 */
	clear() {
		this.services.clear();
		this.singletons.clear();
	}
}

// Create global service container
const serviceContainer = new ServiceContainer();

// Register services
serviceContainer.register('paymentService', container => {
	const StripePaymentService = require('./StripePaymentService');
	return new StripePaymentService();
});

serviceContainer.register('subscriptionService', container => {
	const SubscriptionService = require('./SubscriptionService');
	const paymentService = container.resolve('paymentService');
	return new SubscriptionService(paymentService);
});

serviceContainer.register('subscriptionController', container => {
	const SubscriptionController = require('../controllers/SubscriptionController');
	const subscriptionService = container.resolve('subscriptionService');
	const paymentService = container.resolve('paymentService');
	return new SubscriptionController(subscriptionService, paymentService);
});

serviceContainer.register('subscriptionConfig', container => {
	const SubscriptionConfig = require('../config/SubscriptionConfig');
	return new SubscriptionConfig();
});

module.exports = serviceContainer;
