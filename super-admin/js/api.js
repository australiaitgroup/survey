// Super Admin API Client
class SuperAdminAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('sa_token') || null;
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('sa_token', token);
        } else {
            localStorage.removeItem('sa_token');
        }
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method
    async request(method, url, data = null) {
        const config = {
            method: method.toUpperCase(),
            headers: this.getHeaders(),
        };

        if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else if (contentType && contentType.includes('text/csv')) {
                responseData = await response.text();
                return responseData; // Return raw CSV data
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return responseData;
        } catch (error) {
            console.error(`API ${method.toUpperCase()} ${url} failed:`, error);
            throw error;
        }
    }

    // HTTP methods
    async get(url) {
        return this.request('GET', url);
    }

    async post(url, data) {
        return this.request('POST', url, data);
    }

    async put(url, data) {
        return this.request('PUT', url, data);
    }

    async patch(url, data) {
        return this.request('PATCH', url, data);
    }

    async delete(url) {
        return this.request('DELETE', url);
    }

    // Authentication
    async login(username, password) {
        const response = await this.post('/admin/login', { username, password });
        if (response.success && response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    async logout() {
        try {
            await this.get('/admin/logout');
        } finally {
            this.setToken(null);
        }
    }

    async checkAuth() {
        const response = await this.get('/admin/check-auth');
        if (response.success && response.user) {
            return response.user;
        }
        throw new Error('Authentication failed');
    }

    // Super Admin APIs

    // Overview & Stats
    async getStats() {
        return this.get('/sa/stats');
    }

    // Companies
    async getCompanies(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/companies${queryString ? '?' + queryString : ''}`);
    }

    async getCompany(id) {
        return this.get(`/sa/companies/${id}`);
    }

    async suspendCompany(id, reason) {
        return this.put(`/sa/companies/${id}/suspend`, { reason });
    }

    async activateCompany(id) {
        return this.put(`/sa/companies/${id}/activate`);
    }

    // Users
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/users${queryString ? '?' + queryString : ''}`);
    }

    async impersonateUser(userId) {
        return this.post(`/sa/users/${userId}/impersonate`);
    }

    // Public Banks
    async getPublicBanks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/public-banks${queryString ? '?' + queryString : ''}`);
    }

    async createPublicBank(data) {
        return this.post('/sa/public-banks', data);
    }

    async updatePublicBank(id, data) {
        return this.put(`/sa/public-banks/${id}`, data);
    }

    async getPublicBankUsage(id) {
        return this.get(`/sa/public-banks/${id}/usage`);
    }

    // Public Bank Questions
    async getPublicBankQuestions(bankId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/public-banks/${bankId}/questions${queryString ? '?' + queryString : ''}`);
    }

    async addPublicBankQuestion(bankId, questionData) {
        return this.post(`/sa/public-banks/${bankId}/questions`, questionData);
    }

    async updatePublicBankQuestion(bankId, questionIndex, questionData) {
        return this.put(`/sa/public-banks/${bankId}/questions/${questionIndex}`, questionData);
    }

    async deletePublicBankQuestion(bankId, questionIndex) {
        return this.delete(`/sa/public-banks/${bankId}/questions/${questionIndex}`);
    }

    async duplicatePublicBankQuestion(bankId, questionIndex) {
        return this.post(`/sa/public-banks/${bankId}/questions/${questionIndex}/duplicate`);
    }

    async importPublicBankCSV(bankId, formData) {
        const config = {
            method: 'POST',
            headers: this.getHeaders(),
            body: formData,
        };

        // Remove Content-Type to let browser set it with boundary for FormData
        delete config.headers['Content-Type'];

        try {
            const response = await fetch(`${this.baseURL}/sa/public-banks/${bankId}/import-csv`, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return responseData;
        } catch (error) {
            console.error(`API POST /sa/public-banks/${bankId}/import-csv failed:`, error);
            throw error;
        }
    }

    async exportPublicBankCSV(bankId) {
        try {
            const response = await fetch(`${this.baseURL}/sa/public-banks/${bankId}/export-csv`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const csvData = await response.text();

            // Extract filename from headers
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'questions.csv';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) {
                    filename = match[1];
                }
            }

            // Create blob and download
            const blob = new Blob([csvData], { type: 'text/csv' });
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);

            return { success: true, filename };
        } catch (error) {
            console.error('CSV export failed:', error);
            throw error;
        }
    }

    // Purchases & Transactions
    async getPurchases(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/purchases${queryString ? '?' + queryString : ''}`);
    }

    async exportPurchases(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/purchases/export${queryString ? '?' + queryString : ''}`);
    }

    // Resale Policies
    async getResalePolicies(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/resale-policies${queryString ? '?' + queryString : ''}`);
    }

    async updateResalePolicy(id, data) {
        return this.patch(`/sa/resale-policies/${id}`, data);
    }

    // Audit Logs
    async getAuditLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/sa/audit-logs${queryString ? '?' + queryString : ''}`);
    }

    // Utility methods for file downloads
    async downloadCSV(url, filename = 'export.csv') {
        try {
            const csvData = await this.get(url);

            // Create blob and download
            const blob = new Blob([csvData], { type: 'text/csv' });
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('CSV download failed:', error);
            throw error;
        }
    }

    // Helper methods for common patterns

    // Paginated data fetching
    async getPaginatedData(endpoint, params = {}) {
        const defaultParams = {
            page: 1,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        const finalParams = { ...defaultParams, ...params };
        return this.get(`${endpoint}?${new URLSearchParams(finalParams).toString()}`);
    }

    // Search with debouncing
    debounceTimers = {};

    async debouncedSearch(endpoint, searchTerm, delay = 300) {
        return new Promise((resolve, reject) => {
            // Clear existing timer
            if (this.debounceTimers[endpoint]) {
                clearTimeout(this.debounceTimers[endpoint]);
            }

            // Set new timer
            this.debounceTimers[endpoint] = setTimeout(async () => {
                try {
                    const result = await this.get(`${endpoint}?search=${encodeURIComponent(searchTerm)}`);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    }

    // Batch operations
    async batchRequest(requests) {
        const promises = requests.map(({ method, url, data }) =>
            this.request(method, url, data).catch(error => ({ error }))
        );

        return Promise.all(promises);
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch('/api/health');
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Create global API instance
window.API = new SuperAdminAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuperAdminAPI;
}
