// Public Banks Component
class PublicBanksComponent {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.selectedBank = null;
        this.modalOpen = false;
        this.usageModalOpen = false;
        this.usageData = null;
        this.loading = false;
        this.editMode = false;
        
        // Filters and search
        this.filters = {
            search: '',
            type: '',
            isActive: '',
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
        
        // Form data
        this.formData = {
            title: '',
            description: '',
            type: 'free',
            priceOneTime: 0,
            tags: [],
            locales: ['en'],
            isActive: true
        };
        
        this.init();
    }
    
    init() {
        this.renderContent();
        this.setupEventListeners();
        console.log('Public Banks component initialized');
    }
    
    renderContent() {
        const content = document.getElementById('public-banks-content');
        if (!content) return;
        
        content.innerHTML = `
            <div x-data="publicBanksData" class="space-y-6">
                <!-- Header with filters -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">Public Banks Management</h2>
                            <p class="text-sm text-gray-600 mt-1">Manage question banks available to all companies</p>
                        </div>
                        
                        <!-- Search and filters -->
                        <div class="flex flex-col sm:flex-row gap-3">
                            <!-- Search -->
                            <div class="relative">
                                <input type="text" 
                                       x-model="filters.search"
                                       @input="debounceSearch()"
                                       placeholder="Search banks..."
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64">
                                <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            
                            <!-- Type filter -->
                            <select x-model="filters.type" 
                                    @change="applyFilters()"
                                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Types</option>
                                <option value="free">Free</option>
                                <option value="paid">Paid</option>
                            </select>
                            
                            <!-- Status filter -->
                            <select x-model="filters.isActive" 
                                    @change="applyFilters()"
                                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                            
                            <!-- Create button -->
                            <button @click="openCreateModal()" 
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Create Bank
                            </button>
                            
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
                
                <!-- Public Banks table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th @click="sortBy('title')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Title
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th @click="sortBy('questionCount')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Questions
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th @click="sortBy('usageCount')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                        <div class="flex items-center gap-1">
                                            Usage Count
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
                                <template x-for="bank in filteredData" :key="bank._id">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div class="text-sm font-medium text-gray-900" x-text="bank.title"></div>
                                                <div class="text-sm text-gray-500 truncate max-w-xs" x-text="bank.description"></div>
                                                <div class="flex flex-wrap gap-1 mt-1">
                                                    <template x-for="tag in (bank.tags || []).slice(0, 3)" :key="tag">
                                                        <span class="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded" x-text="tag"></span>
                                                    </template>
                                                    <span x-show="(bank.tags || []).length > 3" class="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                        +<span x-text="(bank.tags || []).length - 3"></span> more
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="bank.type === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'"
                                                  x-text="bank.type.charAt(0).toUpperCase() + bank.type.slice(1)"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span x-show="bank.type === 'free'" class="text-green-600 font-medium">Free</span>
                                            <span x-show="bank.type === 'paid'" x-text="formatCurrency(bank.priceOneTime, bank.currency)"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                                  :class="bank.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                                                  x-text="bank.isActive ? 'Active' : 'Inactive'"></span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="bank.questionCount || 0"></td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="bank.usageCount || 0"></td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="formatDate(bank.createdAt)"></td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex items-center justify-end gap-2">
                                                <button @click="viewUsage(bank)" 
                                                        class="text-blue-600 hover:text-blue-900">
                                                    Usage
                                                </button>
                                                <button @click="openEditModal(bank)" 
                                                        class="text-indigo-600 hover:text-indigo-900">
                                                    Edit
                                                </button>
                                                <button @click="toggleBankStatus(bank)" 
                                                        :class="bank.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                                                        x-text="bank.isActive ? 'Deactivate' : 'Activate'">
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                                
                                <!-- Empty state -->
                                <tr x-show="filteredData.length === 0 && !loading">
                                    <td colspan="8" class="px-6 py-12 text-center">
                                        <div class="text-gray-500">
                                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                            </svg>
                                            <p class="mt-2">No public banks found</p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Loading state -->
                                <tr x-show="loading">
                                    <td colspan="8" class="px-6 py-12 text-center">
                                        <div class="flex items-center justify-center">
                                            <div class="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                                            <span class="text-gray-500">Loading banks...</span>
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
                
                <!-- Create/Edit Modal -->
                <div x-show="modalOpen" 
                     class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0"
                     x-transition:enter-end="opacity-100"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100"
                     x-transition:leave-end="opacity-0">
                    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto"
                         @click.outside="closeModal()">
                        <div class="p-6">
                            <!-- Modal header -->
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-medium text-gray-900" x-text="editMode ? 'Edit Public Bank' : 'Create New Public Bank'"></h3>
                                <button @click="closeModal()" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Form -->
                            <form @submit.prevent="saveBank()">
                                <div class="space-y-6">
                                    <!-- Title -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                        <input type="text" 
                                               x-model="formData.title"
                                               required
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                               placeholder="Enter bank title">
                                    </div>
                                    
                                    <!-- Description -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                        <textarea x-model="formData.description"
                                                  required
                                                  rows="3"
                                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  placeholder="Enter bank description"></textarea>
                                    </div>
                                    
                                    <!-- Type and Price -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                                            <select x-model="formData.type" 
                                                    @change="if (formData.type === 'free') formData.priceOneTime = 0"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="free">Free</option>
                                                <option value="paid">Paid</option>
                                            </select>
                                        </div>
                                        
                                        <div x-show="formData.type === 'paid'">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">One-time Price (USD)</label>
                                            <input type="number" 
                                                   x-model.number="formData.priceOneTime"
                                                   min="0"
                                                   step="0.01"
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   placeholder="0.00">
                                        </div>
                                    </div>
                                    
                                    <!-- Tags -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            <template x-for="(tag, index) in formData.tags" :key="index">
                                                <div class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                    <span x-text="tag"></span>
                                                    <button type="button" @click="removeTag(index)" class="text-blue-600 hover:text-blue-800">
                                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </template>
                                        </div>
                                        <div class="flex gap-2">
                                            <input type="text" 
                                                   x-model="newTag"
                                                   @keydown.enter.prevent="addTag()"
                                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   placeholder="Add tag and press Enter">
                                            <button type="button" @click="addTag()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Locales -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Supported Languages</label>
                                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <template x-for="locale in availableLocales" :key="locale.code">
                                                <label class="flex items-center">
                                                    <input type="checkbox" 
                                                           :value="locale.code"
                                                           x-model="formData.locales"
                                                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                                    <span class="ml-2 text-sm text-gray-700" x-text="locale.name"></span>
                                                </label>
                                            </template>
                                        </div>
                                    </div>
                                    
                                    <!-- Active Status -->
                                    <div>
                                        <label class="flex items-center">
                                            <input type="checkbox" 
                                                   x-model="formData.isActive"
                                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                            <span class="ml-2 text-sm text-gray-700">Active (available for purchase)</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <!-- Form actions -->
                                <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                    <button type="button" @click="closeModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        <span x-show="!loading" x-text="editMode ? 'Update Bank' : 'Create Bank'"></span>
                                        <span x-show="loading">Saving...</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <!-- Usage Modal -->
                <div x-show="usageModalOpen" 
                     class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0"
                     x-transition:enter-end="opacity-100"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100"
                     x-transition:leave-end="opacity-0">
                    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto"
                         @click.outside="closeUsageModal()">
                        <div class="p-6">
                            <!-- Usage header -->
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900">Bank Usage Statistics</h3>
                                    <p class="text-sm text-gray-600 mt-1" x-show="selectedBank" x-text="selectedBank.title"></p>
                                </div>
                                <button @click="closeUsageModal()" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Usage stats -->
                            <div x-show="usageData" class="space-y-6">
                                <!-- Overview cards -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div class="bg-blue-50 rounded-lg p-6">
                                        <div class="text-2xl font-bold text-blue-900" x-text="usageData?.companiesCount || 0"></div>
                                        <div class="text-sm text-blue-600">Companies Using</div>
                                    </div>
                                    <div class="bg-green-50 rounded-lg p-6">
                                        <div class="text-2xl font-bold text-green-900" x-text="usageData?.linkedSurveysCount || 0"></div>
                                        <div class="text-sm text-green-600">Linked Surveys</div>
                                    </div>
                                    <div class="bg-purple-50 rounded-lg p-6">
                                        <div class="text-2xl font-bold text-purple-900" x-text="formatCurrency(usageData?.totalRevenue || 0)"></div>
                                        <div class="text-sm text-purple-600">Total Revenue</div>
                                    </div>
                                </div>
                                
                                <!-- Recent purchases -->
                                <div>
                                    <h4 class="text-md font-medium text-gray-900 mb-4">Recent Purchases</h4>
                                    <div class="bg-gray-50 rounded-lg overflow-hidden">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-100">
                                                <tr>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased By</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                <template x-for="purchase in (usageData?.recentPurchases || [])" :key="purchase._id">
                                                    <tr>
                                                        <td class="px-4 py-3 text-sm text-gray-900" x-text="purchase.companyId?.name || 'N/A'"></td>
                                                        <td class="px-4 py-3 text-sm text-gray-900" x-text="purchase.purchasedBy?.email || 'N/A'"></td>
                                                        <td class="px-4 py-3 text-sm text-gray-900" x-text="formatCurrency(purchase.amount, purchase.currency)"></td>
                                                        <td class="px-4 py-3 text-sm text-gray-500" x-text="formatDate(purchase.purchasedAt)"></td>
                                                    </tr>
                                                </template>
                                                <tr x-show="!usageData?.recentPurchases?.length">
                                                    <td colspan="4" class="px-4 py-8 text-center text-gray-500">No purchases found</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Loading state -->
                            <div x-show="!usageData && loading" class="flex items-center justify-center py-12">
                                <div class="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                                <span class="text-gray-500">Loading usage data...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Set up Alpine.js data
        window.publicBanksData = {
            // Data
            data: this.data,
            filteredData: this.filteredData,
            selectedBank: this.selectedBank,
            modalOpen: this.modalOpen,
            usageModalOpen: this.usageModalOpen,
            usageData: this.usageData,
            loading: this.loading,
            editMode: this.editMode,
            filters: this.filters,
            pagination: this.pagination,
            formData: this.formData,
            searchTimeout: null,
            newTag: '',
            
            // Available locales
            availableLocales: [
                { code: 'en', name: 'English' },
                { code: 'es', name: 'Spanish' },
                { code: 'fr', name: 'French' },
                { code: 'de', name: 'German' },
                { code: 'it', name: 'Italian' },
                { code: 'pt', name: 'Portuguese' },
                { code: 'zh', name: 'Chinese' },
                { code: 'ja', name: 'Japanese' },
                { code: 'ko', name: 'Korean' },
                { code: 'ar', name: 'Arabic' },
            ],
            
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
                    if (this.filters.type) params.type = this.filters.type;
                    if (this.filters.isActive) params.isActive = this.filters.isActive;
                    
                    const response = await API.getPublicBanks(params);
                    
                    if (response.success) {
                        this.data = response.data;
                        this.filteredData = response.data;
                        this.pagination = response.pagination;
                    }
                } catch (error) {
                    console.error('Failed to load public banks:', error);
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
            
            // Modal methods
            openCreateModal() {
                this.editMode = false;
                this.selectedBank = null;
                this.formData = {
                    title: '',
                    description: '',
                    type: 'free',
                    priceOneTime: 0,
                    tags: [],
                    locales: ['en'],
                    isActive: true
                };
                this.modalOpen = true;
            },
            
            openEditModal(bank) {
                this.editMode = true;
                this.selectedBank = bank;
                this.formData = {
                    title: bank.title,
                    description: bank.description,
                    type: bank.type,
                    priceOneTime: bank.priceOneTime || 0,
                    tags: [...(bank.tags || [])],
                    locales: [...(bank.locales || ['en'])],
                    isActive: bank.isActive
                };
                this.modalOpen = true;
            },
            
            closeModal() {
                this.modalOpen = false;
                this.editMode = false;
                this.selectedBank = null;
                this.newTag = '';
            },
            
            // Form methods
            addTag() {
                if (this.newTag && !this.formData.tags.includes(this.newTag)) {
                    this.formData.tags.push(this.newTag.toLowerCase());
                    this.newTag = '';
                }
            },
            
            removeTag(index) {
                this.formData.tags.splice(index, 1);
            },
            
            async saveBank() {
                try {
                    this.loading = true;
                    
                    const data = { ...this.formData };
                    
                    let response;
                    if (this.editMode) {
                        response = await API.updatePublicBank(this.selectedBank._id, data);
                    } else {
                        response = await API.createPublicBank(data);
                    }
                    
                    if (response.success) {
                        this.closeModal();
                        await this.loadData();
                        
                        // Show success message
                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: {
                                message: `Bank ${this.editMode ? 'updated' : 'created'} successfully`,
                                type: 'success'
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to save bank:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: 'Failed to save bank',
                            type: 'error'
                        }
                    }));
                } finally {
                    this.loading = false;
                }
            },
            
            // Usage methods
            async viewUsage(bank) {
                try {
                    this.selectedBank = bank;
                    this.usageModalOpen = true;
                    this.loading = true;
                    this.usageData = null;
                    
                    const response = await API.getPublicBankUsage(bank._id);
                    
                    if (response.success) {
                        this.usageData = response.data;
                    }
                } catch (error) {
                    console.error('Failed to load usage data:', error);
                } finally {
                    this.loading = false;
                }
            },
            
            closeUsageModal() {
                this.usageModalOpen = false;
                this.selectedBank = null;
                this.usageData = null;
            },
            
            // Bank actions
            async toggleBankStatus(bank) {
                try {
                    const action = bank.isActive ? 'deactivate' : 'activate';
                    const confirmed = confirm(`Are you sure you want to ${action} this bank?`);
                    
                    if (!confirmed) return;
                    
                    await API.updatePublicBank(bank._id, {
                        isActive: !bank.isActive
                    });
                    
                    // Refresh data
                    await this.loadData();
                    
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: `Bank ${action}d successfully`,
                            type: 'success'
                        }
                    }));
                    
                } catch (error) {
                    console.error('Failed to toggle bank status:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            message: 'Failed to update bank status',
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
            }
        };
        
        // Load initial data
        window.publicBanksData.loadData();
    }
    
    async loadData() {
        if (window.publicBanksData) {
            await window.publicBanksData.loadData();
        }
    }
}

// Create global instance
window.publicBanksComponent = new PublicBanksComponent();