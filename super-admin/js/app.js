// Auth check - verify user has valid super admin session
// This runs immediately when the dashboard loads
(function() {
    // Only check auth on dashboard pages
    const currentPath = window.location.pathname;
    
    // Skip if we're on login or other non-dashboard pages
    if (currentPath.includes('/login') || 
        currentPath.includes('/test') || 
        currentPath.includes('.html') && !currentPath.includes('index.html')) {
        console.log('Skipping auth check for:', currentPath);
        return;
    }
    
    // Check if we're on a protected page (dashboard)
    if (currentPath.includes('/super-admin')) {
        const token = localStorage.getItem('sa_token');
        const user = JSON.parse(localStorage.getItem('sa_user') || '{}');
        
        console.log('Auth check - Token exists:', !!token, 'User role:', user.role);
        
        // If no token or user is not super admin, redirect to login
        if (!token || user.role !== 'superAdmin') {
            console.log('Auth failed - redirecting to login');
            localStorage.removeItem('sa_token');
            localStorage.removeItem('sa_user');
            window.location.href = '/super-admin/login';
        } else {
            console.log('Auth successful - user is super admin');
        }
    }
})();

// Super Admin Dashboard Main Application
function superAdminApp() {
    return {
        // State
        activeTab: 'overview',
        sidebarOpen: true, // Default to open on desktop
        loading: false,
        user: JSON.parse(localStorage.getItem('sa_user') || '{}'),

        // Data
        stats: {
            totalCompanies: 0,
            activeCompanies: 0,
            totalUsers: 0,
            activeUsers: 0,
            totalSurveys: 0,
            totalResponses: 0,
            activeSessions: 0
        },
        recentActivity: [],
        notifications: [],

        // Navigation configuration
        navigation: [
            {
                id: 'overview',
                name: 'Overview',
                icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'
            },
            {
                id: 'companies',
                name: 'Companies',
                icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>'
            },
            {
                id: 'public-banks',
                name: 'Public Banks',
                icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>'
            },
            {
                id: 'transactions',
                name: 'Transactions',
                icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>'
            },
            {
                id: 'audit',
                name: 'Audit Logs',
                icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
            }
        ],

        // Computed
        get currentTabName() {
            const tab = this.navigation.find(nav => nav.id === this.activeTab);
            return tab ? tab.name : 'Dashboard';
        },

        // Initialization
        async init() {
            console.log('Initializing Super Admin Dashboard...');
            console.log('Navigation items:', this.navigation);
            console.log('Current user:', this.user);

            // Check authentication
            await this.checkAuth();

            // Load initial data
            await this.loadInitialData();

            // Setup periodic data refresh
            // this.setupPeriodicRefresh(); // Disabled for debugging

            console.log('Super Admin Dashboard initialized');
        },

        // Authentication
        async checkAuth() {
            try {
                const token = localStorage.getItem('sa_token');
                const storedUser = JSON.parse(localStorage.getItem('sa_user') || '{}');
                
                // If we have a token and stored user with superAdmin role, trust it for now
                if (token && storedUser.role === 'superAdmin') {
                    this.user = storedUser;
                    console.log('Using stored user data:', storedUser);
                    
                    // Try to validate with server in background (non-blocking)
                    API.checkAuth().then(serverUser => {
                        if (serverUser && serverUser.role === 'superAdmin') {
                            this.user = serverUser;
                            localStorage.setItem('sa_user', JSON.stringify(serverUser));
                            console.log('Server validation successful');
                        }
                    }).catch(error => {
                        console.warn('Server validation failed, using stored data:', error);
                        // Don't redirect immediately - the stored token might still be valid
                    });
                    
                    return;
                }
                
                // No valid stored auth - redirect to login
                console.log('No valid stored auth found');
                this.redirectToLogin();
                
            } catch (error) {
                console.error('Auth check error:', error);
                this.redirectToLogin();
            }
        },

        redirectToLogin() {
            // Clear any existing auth data
            localStorage.removeItem('sa_token');
            localStorage.removeItem('sa_user');
            // Redirect to login page
            window.location.href = '/super-admin/login';
        },

        async logout() {
            try {
                // Call logout API to invalidate server session
                await API.logout();
            } catch (error) {
                console.error('Server logout failed:', error);
                // Continue with client logout anyway
            } finally {
                // Clear super admin session data
                localStorage.removeItem('sa_token');
                localStorage.removeItem('sa_user');
                // Redirect to login page
                window.location.href = '/super-admin/login';
            }
        },

        // Data loading
        async loadInitialData() {
            this.loading = true;
            console.log('Loading initial data');

            try {
                // Load data for the current tab on initial load
                await this.loadTabData(this.activeTab);
                await this.loadNotifications();

            } catch (error) {
                console.error('Failed to load initial data:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadOverviewData() {
            try {
                const response = await API.get('/sa/stats');

                if (response.success) {
                    this.stats = {
                        ...this.stats,
                        ...response.data.overview
                    };

                    this.recentActivity = response.data.recentActivity || [];
                }
            } catch (error) {
                console.error('Failed to load overview data:', error);
            }
        },

        async loadNotifications() {
            try {
                // For now, create mock notifications based on recent activity
                this.notifications = this.recentActivity.slice(0, 3).map((activity, index) => ({
                    id: `notif-${index}`,
                    message: `${activity.action} by ${activity.actor?.email || 'System'}`,
                    time: this.formatDate(activity.createdAt),
                    type: 'info'
                }));
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        },

        // Tab management
        async setActiveTab(tabId) {
            if (this.activeTab === tabId) return;

            this.activeTab = tabId;

            // Close sidebar only on mobile (screen width < 1024px)
            if (window.innerWidth < 1024) {
                this.sidebarOpen = false;
            }

            // Load tab-specific data
            await this.loadTabData(tabId);
        },

        async loadTabData(tabId) {
            this.loading = true;

            try {
                switch (tabId) {
                    case 'overview':
                        await this.loadOverviewData();
                        break;
                    case 'companies':
                        await this.loadCompaniesData();
                        break;
                    case 'public-banks':
                        await this.loadPublicBanksData();
                        break;
                    case 'transactions':
                        await this.loadTransactionsData();
                        break;
                    case 'audit':
                        await this.loadAuditData();
                        break;
                }
            } catch (error) {
                console.error(`Failed to load ${tabId} data:`, error);
                this.showNotification(`Failed to load ${tabId} data`, 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadCompaniesData() {
            if (window.companiesComponent) {
                await window.companiesComponent.loadData();
            }
        },

        async loadPublicBanksData() {
            if (window.publicBanksComponent) {
                await window.publicBanksComponent.loadData();
            }
        },

        async loadTransactionsData() {
            if (window.transactionsComponent) {
                await window.transactionsComponent.loadData();
            }
        },

        async loadAuditData() {
            if (window.auditComponent) {
                await window.auditComponent.loadData();
            }
        },

        // Data refresh
        async refreshData() {
            await this.loadTabData(this.activeTab);
            this.showNotification('Data refreshed successfully', 'success');
        },

        setupPeriodicRefresh() {
            // Refresh data every 5 minutes
            setInterval(() => {
                if (this.activeTab === 'overview') {
                    this.loadOverviewData();
                }
            }, 5 * 60 * 1000);
        },

        // Utility functions
        formatDate(dateString) {
            if (!dateString) return 'N/A';

            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;

            // Less than 1 minute
            if (diff < 60000) {
                return 'Just now';
            }

            // Less than 1 hour
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            }

            // Less than 24 hours
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            }

            // More than 24 hours
            return date.toLocaleDateString();
        },

        formatCurrency(amount, currency = 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        },

        // Notifications
        showNotification(message, type = 'info') {
            const notification = {
                id: Date.now(),
                message,
                type,
                time: 'Just now'
            };

            this.notifications.unshift(notification);

            // Remove after 5 seconds
            setTimeout(() => {
                const index = this.notifications.findIndex(n => n.id === notification.id);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 5000);
        },

        // PII masking utilities
        maskEmail(email) {
            if (!email) return 'N/A';
            const [local, domain] = email.split('@');
            const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.slice(-1);
            return `${maskedLocal}@${domain}`;
        },

        async revealPII(element, originalValue, auditAction = 'pii_view') {
            try {
                // Log the PII access
                await API.post('/sa/audit-logs', {
                    action: auditAction,
                    targetType: 'pii',
                    targetId: 'email',
                    payload: {
                        originalValue: originalValue,
                        timestamp: new Date().toISOString()
                    }
                });

                // Reveal the PII
                element.textContent = originalValue;
                element.classList.add('revealed');

                // Hide again after 10 seconds
                setTimeout(() => {
                    element.textContent = this.maskEmail(originalValue);
                    element.classList.remove('revealed');
                }, 10000);

            } catch (error) {
                console.error('Failed to log PII access:', error);
            }
        },

        // Modal utilities
        openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        },

        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        },

        // Error handling
        handleError(error, context = 'Operation') {
            console.error(`${context} failed:`, error);

            let message = `${context} failed`;

            if (error.response && error.response.data && error.response.data.error) {
                message = error.response.data.error;
            } else if (error.message) {
                message = error.message;
            }

            this.showNotification(message, 'error');
        }
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Super Admin Dashboard DOM loaded');
});

// Export for use in components
window.superAdminApp = superAdminApp;
