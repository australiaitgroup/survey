// Companies Component
class CompaniesComponent {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.selectedCompany = null;
        this.drawerOpen = false;
        this.loading = false;

        // Filters and search
        this.filters = {
            search: '',
            plan: '',
            status: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        // Pagination
        this.pagination = {
            page: 1,
            limit: 25,
            total: 0,
            pages: 0
        };

        this.init();
    }

    init() {
        this.renderContent();
        this.setupEventListeners();
        console.log('Companies component initialized');
    }

    renderContent() {
        const content = document.getElementById('companies-content');
        if (!content) return;

        content.innerHTML = `
            <div x-data="companiesData" class="space-y-6">
                <!-- Header with filters -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">Companies Management</h2>
                            <p class="text-sm text-gray-600 mt-1">Manage all companies and their subscriptions</p>
                        </div>

                        <!-- Search and filters -->
                        <div class="flex flex-col sm:flex-row gap-3">
                            <!-- Search -->
                            <div class="relative">
                                <input type="text"
                                       x-model="filters.search"
                                       @input="debounceSearch()"
                                       placeholder="Search companies..."
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64">
                                <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>

                            <!-- Plan filter -->
                            <select x-model="filters.plan"
                                    @change="applyFilters()"
                                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Plans</option>
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>

                            <!-- Status filter -->
                            <select x-model="filters.status"
                                    @change="applyFilters()"
                                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                            </select>

                            <!-- Refresh button -->
                            <button @click="refreshData()"
                                    :disabled="loading"
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Companies table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th @click="sortBy('name')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Company
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th @click="sortBy('userCount')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Users
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th @click="sortBy('createdAt')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Created
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <template x-for="company in filteredData" :key="company._id">
                                    <tr @click="openCompanyDrawer(company)" class="hover:bg-gray-50 cursor-pointer">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span class="text-sm font-medium text-gray-700" x-text="company.name.charAt(0).toUpperCase()"></span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900" x-text="company.name"></div>
                                                    <div class="text-sm text-gray-500" x-text="company.slug"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="getPlanBadgeClass(company.subscriptionTier)"
                                                  x-text="company.subscriptionTier || 'Free'"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                                                  x-text="company.isActive ? 'Active' : 'Suspended'"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="company.userCount || 0"></td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="formatDate(company.createdAt)"></td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button @click.stop="toggleCompanyStatus(company)"
                                                    class="text-blue-600 hover:text-blue-900 mr-3"
                                                    x-text="company.isActive ? 'Suspend' : 'Activate'"></button>
                                            <button @click.stop="openCompanyDrawer(company)"
                                                    class="text-gray-600 hover:text-gray-900">View</button>
                                        </td>
                                    </tr>
                                </template>

                                <!-- Empty state -->
                                <tr x-show="filteredData.length === 0 && !loading">
                                    <td colspan="6" class="px-6 py-12 text-center">
                                        <div class="text-gray-500">
                                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                            </svg>
                                            <p class="mt-2">No companies found</p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Loading state -->
                                <tr x-show="loading">
                                    <td colspan="6" class="px-6 py-12 text-center">
                                        <div class="flex items-center justify-center">
                                            <div class="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                                            <span class="text-gray-500">Loading companies...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div x-show="pagination.pages > 1" class="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div class="text-sm text-gray-700">
                            Showing <span x-text="(pagination.page - 1) * pagination.limit + 1"></span> to
                            <span x-text="Math.min(pagination.page * pagination.limit, pagination.total)"></span> of
                            <span x-text="pagination.total"></span> results
                        </div>

                        <div class="flex items-center gap-2">
                            <button @click="changePage(pagination.page - 1)"
                                    :disabled="pagination.page <= 1"
                                    class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                Previous
                            </button>

                            <template x-for="page in getVisiblePages()" :key="page">
                                <button @click="changePage(page)"
                                        :class="page === pagination.page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
                                        class="px-3 py-1 border border-gray-300 rounded"
                                        x-text="page"></button>
                            </template>

                            <button @click="changePage(pagination.page + 1)"
                                    :disabled="pagination.page >= pagination.pages"
                                    class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Company drawer -->
                <div x-show="drawerOpen"
                     x-transition:enter="transform transition ease-in-out duration-500"
                     x-transition:enter-start="translate-x-full"
                     x-transition:enter-end="translate-x-0"
                     x-transition:leave="transform transition ease-in-out duration-500"
                     x-transition:leave-start="translate-x-0"
                     x-transition:leave-end="translate-x-full"
                     class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">

                    <!-- Drawer content -->
                    <div class="p-6">
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-medium text-gray-900">Company Details</h3>
                            <button @click="closeCompanyDrawer()" class="text-gray-400 hover:text-gray-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Company info -->
                        <div x-show="selectedCompany" class="space-y-6">
                            <!-- Basic info -->
                            <div>
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                                <dl class="space-y-2">
                                    <div>
                                        <dt class="text-xs text-gray-500">Company Name</dt>
                                        <dd class="text-sm text-gray-900" x-text="selectedCompany?.name"></dd>
                                    </div>
                                    <div>
                                        <dt class="text-xs text-gray-500">Slug</dt>
                                        <dd class="text-sm text-gray-900" x-text="selectedCompany?.slug"></dd>
                                    </div>
                                    <div>
                                        <dt class="text-xs text-gray-500">Contact Email</dt>
                                        <dd class="text-sm text-gray-900 pii-masked cursor-pointer"
                                            @click="revealPII($el, selectedCompany?.contactEmail)"
                                            x-text="maskEmail(selectedCompany?.contactEmail)"></dd>
                                    </div>
                                    <div>
                                        <dt class="text-xs text-gray-500">Status</dt>
                                        <dd>
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="selectedCompany?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                                                  x-text="selectedCompany?.isActive ? 'Active' : 'Suspended'"></span>
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <!-- Current plan -->
                            <div>
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Current Plan</h4>
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">Subscription Tier</span>
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                              :class="getPlanBadgeClass(selectedCompany?.subscriptionTier)"
                                              x-text="selectedCompany?.subscriptionTier || 'Free'"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats -->
                            <div>
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="bg-blue-50 rounded-lg p-3">
                                        <div class="text-lg font-semibold text-blue-900" x-text="selectedCompany?.stats?.userCount || 0"></div>
                                        <div class="text-xs text-blue-600">Users</div>
                                    </div>
                                    <div class="bg-green-50 rounded-lg p-3">
                                        <div class="text-lg font-semibold text-green-900" x-text="selectedCompany?.stats?.surveyCount || 0"></div>
                                        <div class="text-xs text-green-600">Surveys</div>
                                    </div>
                                    <div class="bg-purple-50 rounded-lg p-3">
                                        <div class="text-lg font-semibold text-purple-900" x-text="selectedCompany?.stats?.responseCount || 0"></div>
                                        <div class="text-xs text-purple-600">Responses</div>
                                    </div>
                                    <div class="bg-orange-50 rounded-lg p-3">
                                        <div class="text-lg font-semibold text-orange-900" x-text="selectedCompany?.stats?.questionBankCount || 0"></div>
                                        <div class="text-xs text-orange-600">Question Banks</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="space-y-3">
                                <button @click="toggleCompanyStatus(selectedCompany)"
                                        :class="selectedCompany?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
                                        class="w-full px-4 py-2 text-white rounded-lg transition-colors"
                                        x-text="selectedCompany?.isActive ? 'Suspend Company' : 'Activate Company'"></button>

                                <button @click="viewCompanyTransactions()"
                                        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    View Transactions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Drawer overlay -->
                <div x-show="drawerOpen"
                     @click="closeCompanyDrawer()"
                     x-transition:enter="transition-opacity ease-linear duration-300"
                     x-transition:enter-start="opacity-0"
                     x-transition:enter-end="opacity-100"
                     x-transition:leave="transition-opacity ease-linear duration-300"
                     x-transition:leave-start="opacity-100"
                     x-transition:leave-end="opacity-0"
                     class="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
            </div>
        `;
    }

    setupEventListeners() {
        // Set up Alpine.js data
        window.companiesData = {
            // Data
            data: this.data,
            filteredData: this.filteredData,
            selectedCompany: this.selectedCompany,
            drawerOpen: this.drawerOpen,
            loading: this.loading,
            filters: this.filters,
            pagination: this.pagination,
            searchTimeout: null,

            // Methods
            async loadData() {
                this.loading = true;
                try {
                    const params = {
                        page: this.pagination.page,
                        limit: this.pagination.limit,
                        sortBy: this.filters.sortBy,
                        sortOrder: this.filters.sortOrder,
                    };

                    if (this.filters.search) params.search = this.filters.search;
                    if (this.filters.plan) params.subscriptionTier = this.filters.plan;
                    if (this.filters.status) params.status = this.filters.status;

                    const response = await API.getCompanies(params);

                    if (response.success) {
                        this.data = response.data;
                        this.filteredData = response.data;
                        this.pagination = response.pagination;
                    }
                } catch (error) {
                    console.error('Failed to load companies:', error);
                } finally {
                    this.loading = false;
                }
            },

            debounceSearch() {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            },

            applyFilters() {
                this.pagination.page = 1;
                this.loadData();
            },

            sortBy(field) {
                if (this.filters.sortBy === field) {
                    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.filters.sortBy = field;
                    this.filters.sortOrder = 'asc';
                }
                this.applyFilters();
            },

            changePage(page) {
                if (page >= 1 && page <= this.pagination.pages) {
                    this.pagination.page = page;
                    this.loadData();
                }
            },

            getVisiblePages() {
                const current = this.pagination.page;
                const total = this.pagination.pages;
                const delta = 2;

                const range = [];
                for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
                    range.push(i);
                }

                return range;
            },

            async openCompanyDrawer(company) {
                try {
                    this.loading = true;
                    const response = await API.getCompany(company._id);

                    if (response.success) {
                        this.selectedCompany = response.data;
                        this.drawerOpen = true;
                    }
                } catch (error) {
                    console.error('Failed to load company details:', error);
                } finally {
                    this.loading = false;
                }
            },

            closeCompanyDrawer() {
                this.drawerOpen = false;
                this.selectedCompany = null;
            },

            async toggleCompanyStatus(company) {
                try {
                    if (company.isActive) {
                        const reason = prompt('Please provide a reason for suspending this company:');
                        if (!reason) return;

                        await API.suspendCompany(company._id, reason);
                    } else {
                        await API.activateCompany(company._id);
                    }

                    // Refresh data
                    await this.loadData();

                    // Update drawer if open
                    if (this.selectedCompany && this.selectedCompany._id === company._id) {
                        this.selectedCompany.isActive = !company.isActive;
                    }

                } catch (error) {
                    console.error('Failed to toggle company status:', error);
                    alert('Failed to update company status');
                }
            },

            viewCompanyTransactions() {
                // Switch to transactions tab with company filter
                window.dispatchEvent(new CustomEvent('switchTab', {
                    detail: { tab: 'transactions', companyId: this.selectedCompany._id }
                }));
                this.closeCompanyDrawer();
            },

            refreshData() {
                this.loadData();
            },

            // Utility methods
            formatDate(dateString) {
                if (!dateString) return 'N/A';
                return new Date(dateString).toLocaleDateString();
            },

            getPlanBadgeClass(plan) {
                const classes = {
                    free: 'bg-gray-100 text-gray-800',
                    basic: 'bg-blue-100 text-blue-800',
                    pro: 'bg-purple-100 text-purple-800',
                    enterprise: 'bg-yellow-100 text-yellow-800'
                };
                return classes[plan] || classes.free;
            },

            maskEmail(email) {
                if (!email) return 'N/A';
                const [local, domain] = email.split('@');
                if (!local || !domain) return email;
                const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.slice(-1);
                return `${maskedLocal}@${domain}`;
            },

            async revealPII(element, originalValue) {
                try {
                    // Log the PII access
                    await API.post('/sa/audit-logs', {
                        action: 'pii_view',
                        targetType: 'company',
                        targetId: this.selectedCompany._id,
                        payload: {
                            field: 'email',
                            originalValue: originalValue,
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
            }
        };

        // Load initial data
        window.companiesData.loadData();
    }

    async loadData() {
        if (window.companiesData) {
            await window.companiesData.loadData();
        }
    }
}

// Create global instance
window.companiesComponent = new CompaniesComponent();
