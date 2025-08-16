// Transactions Component
class TransactionsComponent {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.resalePolicies = [];
        this.companies = [];
        this.banks = [];
        this.loading = false;
        this.activeTab = 'purchases';

        // Filters and search
        this.filters = {
            search: '',
            companyId: '',
            bankId: '',
            type: '',
            status: '',
            startDate: '',
            endDate: '',
            sortBy: 'purchasedAt',
            sortOrder: 'desc'
        };

        // Pagination
        this.pagination = {
            page: 1,
            limit: 25,
            total: 0,
            pages: 0
        };

        // Resale policies filters
        this.resaleFilters = {
            search: '',
            companyId: '',
            bankId: '',
            isEnabled: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        // Resale policies pagination
        this.resalePagination = {
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
        console.log('Transactions component initialized');
    }

    renderContent() {
        const content = document.getElementById('transactions-content');
        if (!content) return;

        content.innerHTML = `
            <div x-data="transactionsData" class="space-y-6">
                <!-- Header with tabs -->
                <div class="bg-white rounded-lg shadow">
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-8 px-6">
                            <button @click="setActiveTab('purchases')"
                                    :class="activeTab === 'purchases' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                                Purchases & Subscriptions
                            </button>
                            <button @click="setActiveTab('resale')"
                                    :class="activeTab === 'resale' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                                Resale Policies
                            </button>
                        </nav>
                    </div>

                    <div class="p-6">
                        <div x-show="activeTab === 'purchases'">
                            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                                <div>
                                    <h2 class="text-xl font-semibold text-gray-900">Purchases & Subscriptions</h2>
                                    <p class="text-sm text-gray-600 mt-1">Manage all transactions and subscriptions</p>
                                </div>

                                <!-- Export button -->
                                <button @click="exportCSV()"
                                        :disabled="loading"
                                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Export CSV
                                </button>
                            </div>

                            <!-- Filters -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                                <!-- Search -->
                                <div class="lg:col-span-2">
                                    <input type="text"
                                           x-model="filters.search"
                                           @input="debounceSearch()"
                                           placeholder="Search transactions..."
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>

                                <!-- Company filter -->
                                <div>
                                    <select x-model="filters.companyId"
                                            @change="applyFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Companies</option>
                                        <template x-for="company in companies" :key="company._id">
                                            <option :value="company._id" x-text="company.name"></option>
                                        </template>
                                    </select>
                                </div>

                                <!-- Bank filter -->
                                <div>
                                    <select x-model="filters.bankId"
                                            @change="applyFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Banks</option>
                                        <template x-for="bank in banks" :key="bank._id">
                                            <option :value="bank._id" x-text="bank?.title || 'Untitled'"></option>
                                        </template>
                                    </select>
                                </div>

                                <!-- Type filter -->
                                <div>
                                    <select x-model="filters.type"
                                            @change="applyFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Types</option>
                                        <option value="oneTime">One-time</option>
                                        <option value="subscription">Subscription</option>
                                    </select>
                                </div>

                                <!-- Status filter -->
                                <div>
                                    <select x-model="filters.status"
                                            @change="applyFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Date range -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date"
                                           x-model="filters.startDate"
                                           @change="applyFilters()"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input type="date"
                                           x-model="filters.endDate"
                                           @change="applyFilters()"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div class="flex items-end">
                                    <button @click="clearDateFilters()"
                                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        Clear Dates
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div x-show="activeTab === 'resale'">
                            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                                <div>
                                    <h2 class="text-xl font-semibold text-gray-900">Resale Policies</h2>
                                    <p class="text-sm text-gray-600 mt-1">Manage company-specific resale pricing</p>
                                </div>
                            </div>

                            <!-- Resale filters -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <!-- Search -->
                                <div>
                                    <input type="text"
                                           x-model="resaleFilters.search"
                                           @input="debounceResaleSearch()"
                                           placeholder="Search policies..."
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>

                                <!-- Company filter -->
                                <div>
                                    <select x-model="resaleFilters.companyId"
                                            @change="applyResaleFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Companies</option>
                                        <template x-for="company in companies" :key="company._id">
                                            <option :value="company._id" x-text="company.name"></option>
                                        </template>
                                    </select>
                                </div>

                                <!-- Bank filter -->
                                <div>
                                    <select x-model="resaleFilters.bankId"
                                            @change="applyResaleFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Banks</option>
                                        <template x-for="bank in banks" :key="bank._id">
                                            <option :value="bank._id" x-text="bank?.title || 'Untitled'"></option>
                                        </template>
                                    </select>
                                </div>

                                <!-- Enabled filter -->
                                <div>
                                    <select x-model="resaleFilters.isEnabled"
                                            @change="applyResaleFilters()"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">All Policies</option>
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Purchases Table -->
                <div x-show="activeTab === 'purchases'" class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th @click="sortBy('companyId')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Company
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th @click="sortBy('amount')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Amount
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purchased By
                                    </th>
                                    <th @click="sortBy('purchasedAt')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Date
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <template x-for="purchase in filteredData" :key="purchase._id">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900" x-text="purchase.companyId?.name || 'N/A'"></div>
                                            <div class="text-sm text-gray-500" x-text="purchase.companyId?.slug || ''"></div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900" x-text="purchase.bankId?.title || 'N/A'"></div>
                                            <div class="text-sm text-gray-500" x-show="purchase.isResale" class="text-orange-600">Resale</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="purchase.type === 'subscription' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
                                                  x-text="purchase.type === 'oneTime' ? 'One-time' : 'Subscription'"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="getStatusBadgeClass(purchase.status)"
                                                  x-text="purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900" x-text="formatCurrency(purchase.amount, purchase.currency)"></div>
                                            <div x-show="purchase.isResale && purchase.originalPrice" class="text-xs text-gray-500">
                                                Original: <span x-text="formatCurrency(purchase.originalPrice, purchase.currency)"></span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="purchase.purchasedBy?.email || 'N/A'"></td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="formatDate(purchase.purchasedAt)"></td>
                                    </tr>
                                </template>

                                <!-- Empty state -->
                                <tr x-show="filteredData.length === 0 && !loading">
                                    <td colspan="7" class="px-6 py-12 text-center">
                                        <div class="text-gray-500">
                                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                            <p class="mt-2">No transactions found</p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Loading state -->
                                <tr x-show="loading">
                                    <td colspan="7" class="px-6 py-12 text-center">
                                        <div class="flex items-center justify-center">
                                            <div class="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                                            <span class="text-gray-500">Loading transactions...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Purchases Pagination -->
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

                <!-- Resale Policies Table -->
                <div x-show="activeTab === 'resale'" class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Original Price
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Resale Price
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sales
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <template x-for="policy in resalePolicies" :key="policy._id">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900" x-text="policy.companyId?.name || 'N/A'"></div>
                                            <div class="text-sm text-gray-500" x-text="policy.companyId?.slug || ''"></div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900" x-text="policy.bankId?.title || 'N/A'"></div>
                                            <div class="text-sm text-gray-500" x-text="policy.bankId?.type || ''"></div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="formatCurrency(policy.bankId?.priceOneTime || 0, policy.currency)"></td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div x-show="!editingPolicy || editingPolicy._id !== policy._id" class="text-sm font-medium text-gray-900" x-text="formatCurrency(policy.resalePrice, policy.currency)"></div>
                                            <div x-show="editingPolicy && editingPolicy._id === policy._id" class="flex items-center gap-2">
                                                <input type="number"
                                                       x-model.number="editingPolicy.resalePrice"
                                                       min="0"
                                                       step="0.01"
                                                       class="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <button @click="saveResalePrice()" class="text-green-600 hover:text-green-800">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </button>
                                                <button @click="cancelEditPrice()" class="text-red-600 hover:text-red-800">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <button @click="togglePolicyStatus(policy)"
                                                    :class="policy.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                                                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80"
                                                    x-text="policy.isEnabled ? 'Enabled' : 'Disabled'"></button>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900" x-text="policy.salesCount || 0"></div>
                                            <div class="text-xs text-gray-500" x-text="formatCurrency(policy.totalRevenue || 0, policy.currency)"></div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button @click="editResalePrice(policy)"
                                                    x-show="!editingPolicy || editingPolicy._id !== policy._id"
                                                    class="text-indigo-600 hover:text-indigo-900 mr-3">
                                                Edit Price
                                            </button>
                                        </td>
                                    </tr>
                                </template>

                                <!-- Empty state -->
                                <tr x-show="resalePolicies.length === 0 && !loading">
                                    <td colspan="7" class="px-6 py-12 text-center">
                                        <div class="text-gray-500">
                                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <p class="mt-2">No resale policies found</p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Loading state -->
                                <tr x-show="loading">
                                    <td colspan="7" class="px-6 py-12 text-center">
                                        <div class="flex items-center justify-center">
                                            <div class="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                                            <span class="text-gray-500">Loading policies...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Resale Policies Pagination -->
                    <div x-show="resalePagination.pages > 1" class="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div class="text-sm text-gray-700">
                            Showing <span x-text="(resalePagination.page - 1) * resalePagination.limit + 1"></span> to
                            <span x-text="Math.min(resalePagination.page * resalePagination.limit, resalePagination.total)"></span> of
                            <span x-text="resalePagination.total"></span> results
                        </div>

                        <div class="flex items-center gap-2">
                            <button @click="changeResalePage(resalePagination.page - 1)"
                                    :disabled="resalePagination.page <= 1"
                                    class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                Previous
                            </button>

                            <template x-for="page in getVisibleResalePages()" :key="page">
                                <button @click="changeResalePage(page)"
                                        :class="page === resalePagination.page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
                                        class="px-3 py-1 border border-gray-300 rounded"
                                        x-text="page"></button>
                            </template>

                            <button @click="changeResalePage(resalePagination.page + 1)"
                                    :disabled="resalePagination.page >= resalePagination.pages"
                                    class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Set up Alpine.js data
        window.transactionsData = {
            // Data
            data: this.data,
            filteredData: this.filteredData,
            resalePolicies: this.resalePolicies,
            companies: this.companies,
            banks: this.banks,
            loading: this.loading,
            activeTab: this.activeTab,
            filters: this.filters,
            pagination: this.pagination,
            resaleFilters: this.resaleFilters,
            resalePagination: this.resalePagination,
            searchTimeout: null,
            resaleSearchTimeout: null,
            editingPolicy: null,

            // Methods
            async init() {
                await this.loadFilterData();
                await this.loadData();
            },

            async loadFilterData() {
                try {
                    // Load companies and banks for filters
                    const [companiesResponse, banksResponse] = await Promise.all([
                        API.getCompanies({ limit: 1000 }),
                        API.getPublicBanks({ limit: 1000 })
                    ]);

                    if (companiesResponse.success) {
                        this.companies = companiesResponse.data;
                    }

                    if (banksResponse.success) {
                        this.banks = banksResponse.data;
                    }
                } catch (error) {
                    console.error('Failed to load filter data:', error);
                }
            },

            async loadData() {
                this.loading = true;
                try {
                    if (this.activeTab === 'purchases') {
                        await this.loadPurchases();
                    } else {
                        await this.loadResalePolicies();
                    }
                } catch (error) {
                    console.error('Failed to load data:', error);
                } finally {
                    this.loading = false;
                }
            },

            async loadPurchases() {
                const params = {
                    page: this.pagination.page,
                    limit: this.pagination.limit,
                    sortBy: this.filters.sortBy,
                    sortOrder: this.filters.sortOrder,
                };

                if (this.filters.search) params.search = this.filters.search;
                if (this.filters.companyId) params.companyId = this.filters.companyId;
                if (this.filters.bankId) params.bankId = this.filters.bankId;
                if (this.filters.type) params.type = this.filters.type;
                if (this.filters.status) params.status = this.filters.status;
                if (this.filters.startDate) params.startDate = this.filters.startDate;
                if (this.filters.endDate) params.endDate = this.filters.endDate;

                const response = await API.getPurchases(params);

                if (response.success) {
                    this.data = response.data;
                    this.filteredData = response.data;
                    this.pagination = response.pagination;
                }
            },

            async loadResalePolicies() {
                const params = {
                    page: this.resalePagination.page,
                    limit: this.resalePagination.limit,
                    sortBy: this.resaleFilters.sortBy,
                    sortOrder: this.resaleFilters.sortOrder,
                };

                if (this.resaleFilters.search) params.search = this.resaleFilters.search;
                if (this.resaleFilters.companyId) params.companyId = this.resaleFilters.companyId;
                if (this.resaleFilters.bankId) params.bankId = this.resaleFilters.bankId;
                if (this.resaleFilters.isEnabled) params.isEnabled = this.resaleFilters.isEnabled;

                const response = await API.getResalePolicies(params);

                if (response.success) {
                    this.resalePolicies = response.data;
                    this.resalePagination = response.pagination;
                }
            },

            async setActiveTab(tab) {
                if (this.activeTab === tab) return;

                this.activeTab = tab;
                await this.loadData();
            },

            debounceSearch() {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            },

            debounceResaleSearch() {
                clearTimeout(this.resaleSearchTimeout);
                this.resaleSearchTimeout = setTimeout(() => {
                    this.applyResaleFilters();
                }, 300);
            },

            applyFilters() {
                this.pagination.page = 1;
                this.loadPurchases();
            },

            applyResaleFilters() {
                this.resalePagination.page = 1;
                this.loadResalePolicies();
            },

            clearDateFilters() {
                this.filters.startDate = '';
                this.filters.endDate = '';
                this.applyFilters();
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
                    this.loadPurchases();
                }
            },

            changeResalePage(page) {
                if (page >= 1 && page <= this.resalePagination.pages) {
                    this.resalePagination.page = page;
                    this.loadResalePolicies();
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

            getVisibleResalePages() {
                const current = this.resalePagination.page;
                const total = this.resalePagination.pages;
                const delta = 2;

                const range = [];
                for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
                    range.push(i);
                }

                return range;
            },

            // Export functionality
            async exportCSV() {
                try {
                    this.loading = true;

                    const params = {};
                    if (this.filters.companyId) params.companyId = this.filters.companyId;
                    if (this.filters.bankId) params.bankId = this.filters.bankId;
                    if (this.filters.type) params.type = this.filters.type;
                    if (this.filters.status) params.status = this.filters.status;
                    if (this.filters.startDate) params.startDate = this.filters.startDate;
                    if (this.filters.endDate) params.endDate = this.filters.endDate;

                    await API.downloadCSV('/sa/purchases/export?' + new URLSearchParams(params), 'purchases-export.csv');

                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: 'CSV export completed successfully',
                            type: 'success'
                        }
                    }));

                } catch (error) {
                    console.error('Failed to export CSV:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: 'Failed to export CSV',
                            type: 'error'
                        }
                    }));
                } finally {
                    this.loading = false;
                }
            },

            // Resale policy management
            editResalePrice(policy) {
                this.editingPolicy = {
                    _id: policy._id,
                    resalePrice: policy.resalePrice
                };
            },

            cancelEditPrice() {
                this.editingPolicy = null;
            },

            async saveResalePrice() {
                try {
                    const response = await API.updateResalePolicy(this.editingPolicy._id, {
                        resalePrice: this.editingPolicy.resalePrice
                    });

                    if (response.success) {
                        this.editingPolicy = null;
                        await this.loadResalePolicies();

                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: {
                                message: 'Resale price updated successfully',
                                type: 'success'
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to update resale price:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: 'Failed to update resale price',
                            type: 'error'
                        }
                    }));
                }
            },

            async togglePolicyStatus(policy) {
                try {
                    const response = await API.updateResalePolicy(policy._id, {
                        isEnabled: !policy.isEnabled
                    });

                    if (response.success) {
                        await this.loadResalePolicies();

                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: {
                                message: `Resale policy ${policy.isEnabled ? 'disabled' : 'enabled'} successfully`,
                                type: 'success'
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to toggle policy status:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: 'Failed to update policy status',
                            type: 'error'
                        }
                    }));
                }
            },

            refreshData() {
                this.loadData();
            },

            // Utility methods
            formatDate(dateString) {
                if (!dateString) return 'N/A';
                return new Date(dateString).toLocaleDateString();
            },

            formatCurrency(amount, currency = 'USD') {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency
                }).format(amount || 0);
            },

            getStatusBadgeClass(status) {
                const classes = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    completed: 'bg-green-100 text-green-800',
                    failed: 'bg-red-100 text-red-800',
                    refunded: 'bg-orange-100 text-orange-800',
                    cancelled: 'bg-gray-100 text-gray-800'
                };
                return classes[status] || classes.pending;
            }
        };

        // Initialize data
        window.transactionsData.init();
    }

    async loadData() {
        if (window.transactionsData) {
            await window.transactionsData.loadData();
        }
    }
}

// Create global instance
window.transactionsComponent = new TransactionsComponent();
