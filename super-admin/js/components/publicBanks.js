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

        // Detail view state
        this.currentView = 'list'; // 'list' or 'detail'
        this.selectedBankDetail = null;
        this.activeTab = 'overview'; // 'overview' or 'questions'

        // Questions management
        this.questions = [];
        this.questionsPagination = {
            page: 1,
            limit: 25,
            total: 0,
            pages: 0
        };
        this.questionsFilters = {
            search: '',
            difficulty: '',
            tags: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        // Question drawer state
        this.questionDrawerOpen = false;
        this.questionEditMode = false;
        this.editingQuestionIndex = null;
        this.questionForm = {
            text: '',
            description: '',
            type: 'single_choice',
            options: ['', ''],
            correctAnswer: null,
            explanation: '',
            points: 1,
            tags: [],
            difficulty: 'medium'
        };

        // CSV import state
        this.csvImportModalOpen = false;
        this.csvImportResults = null;

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
                <!-- List View -->
                <div x-show="currentView === 'list'" class="space-y-6">
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
                                                <div class="text-sm font-medium text-gray-900" x-text="bank?.title || 'Untitled'"></div>
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
                                                <button @click="openBankDetail(bank)"
                                                        class="text-green-600 hover:text-green-900">
                                                    Questions
                                                </button>
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
                                    <p class="text-sm text-gray-600 mt-1" x-text="selectedBank?.title || ''"></p>
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
                <!-- End List View -->

                <!-- Detail View -->
                <div x-show="currentView === 'detail'" class="space-y-6">
                    <!-- Detail Header -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <button @click="backToList()" class="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                    Back to Banks
                                </button>
                                <h2 class="text-xl font-semibold text-gray-900" x-text="selectedBankDetail?.title"></h2>
                            </div>
                            <div class="flex gap-2">
                                <button @click="openEditModal(selectedBankDetail)" class="btn-secondary">
                                    Edit Bank
                                </button>
                                <button @click="viewUsage(selectedBankDetail)" class="btn-primary">
                                    View Usage
                                </button>
                            </div>
                        </div>

                        <!-- Bank Info -->
                        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div class="text-sm text-gray-500">Type</div>
                                <div class="text-lg font-medium" x-text="selectedBankDetail?.type === 'paid' ? 'Paid' : 'Free'"></div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Questions</div>
                                <div class="text-lg font-medium" x-text="selectedBankDetail?.questionCount || 0"></div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Usage Count</div>
                                <div class="text-lg font-medium" x-text="selectedBankDetail?.usageCount || 0"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="bg-white rounded-lg shadow">
                        <div class="border-b border-gray-200">
                            <nav class="flex space-x-8" aria-label="Tabs">
                                <button @click="setActiveTab('overview')"
                                        :class="activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                        class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                                    Overview
                                </button>
                                <button @click="setActiveTab('questions')"
                                        :class="activeTab === 'questions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                                        class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                                    Questions (<span x-text="selectedBankDetail?.questionCount || 0"></span>)
                                </button>
                            </nav>
                        </div>

                        <!-- Overview Tab Content -->
                        <div x-show="activeTab === 'overview'" class="p-6">
                            <div class="space-y-6">
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">Description</h3>
                                    <p class="text-gray-600" x-text="selectedBankDetail?.description"></p>
                                </div>

                                <div x-show="selectedBankDetail?.tags && selectedBankDetail?.tags.length > 0">
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                                    <div class="flex flex-wrap gap-2">
                                        <template x-for="tag in selectedBankDetail?.tags || []" :key="tag">
                                            <span class="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full" x-text="tag"></span>
                                        </template>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="text-2xl font-bold text-gray-900" x-text="selectedBankDetail?.questionCount || 0"></div>
                                        <div class="text-sm text-gray-600">Total Questions</div>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="text-2xl font-bold text-gray-900" x-text="selectedBankDetail?.purchaseCount || 0"></div>
                                        <div class="text-sm text-gray-600">Total Purchases</div>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="text-2xl font-bold text-gray-900" x-text="selectedBankDetail?.usageCount || 0"></div>
                                        <div class="text-sm text-gray-600">Usage Count</div>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="text-2xl font-bold text-gray-900" x-text="formatDate(selectedBankDetail?.createdAt)"></div>
                                        <div class="text-sm text-gray-600">Created</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Questions Tab Content -->
                        <div x-show="activeTab === 'questions'" class="p-6">
                            <!-- Questions Header -->
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900">Questions Management</h3>
                                    <p class="text-sm text-gray-600">Manage questions for this public bank</p>
                                </div>

                                <!-- Questions Actions -->
                                <div class="flex flex-col sm:flex-row gap-2">
                                    <button @click="openCSVImportModal()" class="btn-secondary text-sm">
                                        Import CSV
                                    </button>
                                    <button @click="exportCSV()" class="btn-secondary text-sm" :disabled="!questions.length">
                                        Export CSV
                                    </button>
                                    <button @click="openAddQuestionDrawer()" class="btn-primary text-sm">
                                        + Add Question
                                    </button>
                                </div>
                            </div>

                            <!-- Questions Filters -->
                            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <input type="text"
                                               x-model="questionsFilters.search"
                                               @input="debounceQuestionsSearch()"
                                               placeholder="Search questions..."
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                    </div>
                                    <div>
                                        <select x-model="questionsFilters.difficulty"
                                                @change="loadQuestions()"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                            <option value="">All Difficulties</option>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <input type="text"
                                               x-model="questionsFilters.tags"
                                               @input="debounceQuestionsSearch()"
                                               placeholder="Filter by tags..."
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                    </div>
                                    <div>
                                        <select x-model="questionsFilters.sortBy"
                                                @change="loadQuestions()"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                            <option value="createdAt">Sort by Created</option>
                                            <option value="text">Sort by Text</option>
                                            <option value="difficulty">Sort by Difficulty</option>
                                            <option value="points">Sort by Points</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Questions List -->
                            <div class="space-y-4">
                                <template x-for="(question, index) in questions" :key="index">
                                    <div class="bg-gray-50 rounded-lg p-4">
                                        <div class="flex justify-between items-start">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="font-medium text-gray-900" x-text="(index + 1) + '. ' + question.text"></span>
                                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded" x-text="question.type.replace('_', ' ')"></span>
                                                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded" x-text="(question.points || 1) + ' pts'"></span>
                                                    <span class="text-xs px-2 py-1 rounded"
                                                          :class="question.difficulty === 'easy' ? 'bg-green-100 text-green-800' : question.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'"
                                                          x-text="question.difficulty"></span>
                                                </div>

                                                <div x-show="question.description" class="text-sm text-gray-600 mb-2" x-text="question.description"></div>

                                                <div x-show="question.tags && question.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
                                                    <template x-for="tag in question.tags" :key="tag">
                                                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded" x-text="tag"></span>
                                                    </template>
                                                </div>

                                                <div x-show="question.type !== 'short_text' && question.options" class="text-sm text-gray-600">
                                                    <div class="font-medium">Options:</div>
                                                    <template x-for="(option, optIndex) in question.options" :key="optIndex">
                                                        <div class="ml-4 flex items-center gap-2"
                                                             :class="((Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optIndex)) || question.correctAnswer === optIndex) ? 'text-green-600 font-semibold' : ''">
                                                            <span x-show="((Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optIndex)) || question.correctAnswer === optIndex)">✓</span>
                                                            <span x-text="option"></span>
                                                        </div>
                                                    </template>
                                                </div>

                                                <div x-show="question.explanation" class="mt-2 p-2 bg-blue-50 border-l-4 border-blue-200 rounded text-sm">
                                                    <div class="font-medium text-blue-800">Explanation:</div>
                                                    <div class="text-blue-700" x-text="question.explanation"></div>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-2 ml-4">
                                                <button @click="openEditQuestionDrawer(index)" class="text-blue-600 hover:text-blue-800 text-sm">
                                                    Edit
                                                </button>
                                                <button @click="duplicateQuestion(index)" class="text-green-600 hover:text-green-800 text-sm">
                                                    Duplicate
                                                </button>
                                                <button @click="deleteQuestion(index)" class="text-red-600 hover:text-red-800 text-sm">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </template>

                                <!-- Empty State -->
                                <div x-show="questions.length === 0 && !loading" class="text-center py-12">
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <h3 class="mt-2 text-sm font-medium text-gray-900">No questions</h3>
                                    <p class="mt-1 text-sm text-gray-500">Get started by adding your first question.</p>
                                    <div class="mt-6">
                                        <button @click="openAddQuestionDrawer()" class="btn-primary">
                                            + Add Question
                                        </button>
                                    </div>
                                </div>

                                <!-- Loading State -->
                                <div x-show="loading" class="text-center py-12">
                                    <div class="loading-spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <span class="text-gray-500">Loading questions...</span>
                                </div>
                            </div>

                            <!-- Questions Pagination -->
                            <div x-show="questionsPagination.pages > 1" class="mt-6 flex items-center justify-between">
                                <div class="text-sm text-gray-700">
                                    Showing <span x-text="(questionsPagination.page - 1) * questionsPagination.limit + 1"></span> to
                                    <span x-text="Math.min(questionsPagination.page * questionsPagination.limit, questionsPagination.total)"></span> of
                                    <span x-text="questionsPagination.total"></span> questions
                                </div>

                                <div class="flex items-center gap-2">
                                    <button @click="changeQuestionsPage(questionsPagination.page - 1)"
                                            :disabled="questionsPagination.page <= 1"
                                            class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                        Previous
                                    </button>

                                    <template x-for="page in getQuestionsVisiblePages()" :key="page">
                                        <button @click="changeQuestionsPage(page)"
                                                :class="page === questionsPagination.page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
                                                class="px-3 py-1 border border-gray-300 rounded"
                                                x-text="page"></button>
                                    </template>

                                    <button @click="changeQuestionsPage(questionsPagination.page + 1)"
                                            :disabled="questionsPagination.page >= questionsPagination.pages"
                                            class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- End Detail View -->

                <!-- Bottom Drawer for Question Add/Edit -->
                <div x-show="questionDrawerOpen"
                     class="fixed inset-0 z-50"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0"
                     x-transition:enter-end="opacity-100"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100"
                     x-transition:leave-end="opacity-0">

                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeQuestionDrawer()"></div>

                    <!-- Drawer -->
                    <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out"
                         x-transition:enter="transform translate-y-full"
                         x-transition:enter-start="transform translate-y-full"
                         x-transition:enter-end="transform translate-y-0"
                         x-transition:leave="transform translate-y-0"
                         x-transition:leave-start="transform translate-y-0"
                         x-transition:leave-end="transform translate-y-full">

                        <div class="h-[90vh] flex flex-col">
                            <!-- Drawer Header -->
                            <div class="flex-shrink-0 px-6 py-4 border-b border-gray-200 relative">
                                <!-- Drag Handle -->
                                <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 transform -translate-x-1/2 -top-3"></div>

                                <div class="flex items-center justify-between">
                                    <h2 class="text-xl font-semibold text-gray-900" x-text="questionEditMode ? 'Edit Question' : 'Add New Question'"></h2>
                                    <button @click="closeQuestionDrawer()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Drawer Content -->
                            <div class="flex-1 overflow-y-auto p-6">
                                <form @submit.prevent="saveQuestion()" class="space-y-6">
                                    <!-- Question Text -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                        <textarea x-model="questionForm.text"
                                                  required
                                                  rows="3"
                                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  placeholder="Enter your question..."></textarea>
                                    </div>

                                    <!-- Description -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                                        <textarea x-model="questionForm.description"
                                                  rows="2"
                                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  placeholder="Additional context or scenario..."></textarea>
                                    </div>

                                    <!-- Type and Settings -->
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                                            <select x-model="questionForm.type"
                                                    @change="onQuestionTypeChange()"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="single_choice">Single Choice</option>
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="short_text">Short Text</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Points</label>
                                            <input type="number"
                                                   x-model.number="questionForm.points"
                                                   min="1"
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                            <select x-model="questionForm.difficulty"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- Options (for choice questions) -->
                                    <div x-show="questionForm.type !== 'short_text'">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                        <div class="space-y-2">
                                            <template x-for="(option, index) in questionForm.options" :key="index">
                                                <div class="flex items-center gap-2">
                                                    <input type="checkbox"
                                                           :checked="isCorrectAnswer(index)"
                                                           @change="toggleCorrectAnswer(index)"
                                                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                                    <input type="text"
                                                           x-model="questionForm.options[index]"
                                                           :placeholder="'Option ' + (index + 1)"
                                                           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                    <button type="button"
                                                            @click="removeOption(index)"
                                                            :disabled="questionForm.options.length <= 2"
                                                            class="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </template>

                                            <button type="button"
                                                    @click="addOption()"
                                                    class="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800">
                                                + Add Option
                                            </button>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-2">Check the boxes to mark correct answers</p>
                                    </div>

                                    <!-- Correct Answer (for short text) -->
                                    <div x-show="questionForm.type === 'short_text'">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Expected Answer (Optional)</label>
                                        <input type="text"
                                               x-model="questionForm.correctAnswer"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                               placeholder="Expected answer for auto-grading">
                                    </div>

                                    <!-- Explanation -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                                        <textarea x-model="questionForm.explanation"
                                                  rows="2"
                                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  placeholder="Explain the correct answer..."></textarea>
                                    </div>

                                    <!-- Tags -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            <template x-for="(tag, index) in questionForm.tags" :key="index">
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
                                                   x-model="newQuestionTag"
                                                   @keydown.enter.prevent="addQuestionTag()"
                                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   placeholder="Add tag and press Enter">
                                            <button type="button" @click="addQuestionTag()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <!-- Drawer Actions -->
                            <div class="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                                <div class="flex justify-end gap-3">
                                    <button @click="closeQuestionDrawer()" type="button" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button @click="saveQuestion()" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        <span x-show="!loading" x-text="questionEditMode ? 'Update Question' : 'Add Question'"></span>
                                        <span x-show="loading">Saving...</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- End Question Drawer -->

                <!-- CSV Import Modal -->
                <div x-show="csvImportModalOpen"
                     class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0"
                     x-transition:enter-end="opacity-100"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100"
                     x-transition:leave-end="opacity-0">
                    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto"
                         @click.outside="closeCSVImportModal()">
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-medium text-gray-900">Import Questions from CSV</h3>
                                <button @click="closeCSVImportModal()" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                                    <input type="file"
                                           accept=".csv"
                                           @change="handleCSVFile($event)"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>

                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 class="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                                    <ul class="text-sm text-blue-800 space-y-1">
                                        <li>• <strong>question</strong>: Question text (required)</li>
                                        <li>• <strong>description</strong>: Additional context (optional)</li>
                                        <li>• <strong>type</strong>: single_choice, multiple_choice, or short_text</li>
                                        <li>• <strong>options</strong>: Comma-separated for choice questions</li>
                                        <li>• <strong>correct_answer</strong>: Answer index (1-based) or text</li>
                                        <li>• <strong>explanation</strong>: Answer explanation (optional)</li>
                                        <li>• <strong>points</strong>: Points value (default: 1)</li>
                                        <li>• <strong>tags</strong>: Comma-separated tags (optional)</li>
                                        <li>• <strong>difficulty</strong>: easy, medium, or hard (default: medium)</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="flex justify-end gap-3 mt-6">
                                <button @click="closeCSVImportModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button @click="importCSV()" :disabled="!csvFile || loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    <span x-show="!loading">Import Questions</span>
                                    <span x-show="loading">Importing...</span>
                                </button>
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
            // View state
            currentView: this.currentView,
            selectedBankDetail: this.selectedBankDetail,
            activeTab: this.activeTab,

            // Questions state
            questions: this.questions,
            questionsPagination: this.questionsPagination,
            questionsFilters: this.questionsFilters,
            questionDrawerOpen: this.questionDrawerOpen,
            questionEditMode: this.questionEditMode,
            editingQuestionIndex: this.editingQuestionIndex,
            questionForm: this.questionForm,

            // CSV state
            csvImportModalOpen: this.csvImportModalOpen,
            csvImportResults: this.csvImportResults,
            csvFile: null,

            // Form helpers
            newQuestionTag: '',
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

            // View Management
            openBankDetail(bank) {
                this.selectedBankDetail = bank;
                this.currentView = 'detail';
                this.activeTab = 'overview';
                // Load questions when entering detail view
                if (bank) {
                    this.loadQuestions();
                }
            },

            backToList() {
                this.currentView = 'list';
                this.selectedBankDetail = null;
                this.activeTab = 'overview';
                this.questions = [];
                this.questionsPagination = {
                    page: 1, limit: 25, total: 0, pages: 0
                };
            },

            setActiveTab(tab) {
                this.activeTab = tab;
                if (tab === 'questions' && this.selectedBankDetail) {
                    this.loadQuestions();
                }
            },

            // Questions Management
            async loadQuestions() {
                if (!this.selectedBankDetail) return;

                this.loading = true;
                try {
                    const params = {
                        page: this.questionsPagination.page,
                        limit: this.questionsPagination.limit,
                        sortBy: this.questionsFilters.sortBy,
                        sortOrder: this.questionsFilters.sortOrder,
                    };

                    if (this.questionsFilters.search) params.search = this.questionsFilters.search;
                    if (this.questionsFilters.difficulty) params.difficulty = this.questionsFilters.difficulty;
                    if (this.questionsFilters.tags) params.tags = this.questionsFilters.tags;

                    const response = await API.getPublicBankQuestions(this.selectedBankDetail._id, params);

                    if (response.success) {
                        this.questions = response.data;
                        this.questionsPagination = response.pagination;
                        // Update question count in bank detail
                        this.selectedBankDetail.questionCount = this.questionsPagination.total;
                    }
                } catch (error) {
                    console.error('Failed to load questions:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'Failed to load questions', type: 'error' }
                    }));
                } finally {
                    this.loading = false;
                }
            },

            debounceQuestionsSearch() {
                clearTimeout(this.questionsSearchTimeout);
                this.questionsSearchTimeout = setTimeout(() => {
                    this.questionsPagination.page = 1;
                    this.loadQuestions();
                }, 300);
            },

            changeQuestionsPage(page) {
                if (page >= 1 && page <= this.questionsPagination.pages) {
                    this.questionsPagination.page = page;
                    this.loadQuestions();
                }
            },

            getQuestionsVisiblePages() {
                const current = this.questionsPagination.page;
                const total = this.questionsPagination.pages;
                const delta = 2;

                const range = [];
                for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
                    range.push(i);
                }

                return range;
            },

            // Question Drawer Management
            openAddQuestionDrawer() {
                this.questionEditMode = false;
                this.editingQuestionIndex = null;
                this.questionForm = {
                    text: '',
                    description: '',
                    type: 'single_choice',
                    options: ['', ''],
                    correctAnswer: null,
                    explanation: '',
                    points: 1,
                    tags: [],
                    difficulty: 'medium'
                };
                this.questionDrawerOpen = true;
            },

            openEditQuestionDrawer(index) {
                const question = this.questions[index];
                this.questionEditMode = true;
                this.editingQuestionIndex = index;
                this.questionForm = {
                    text: question.text,
                    description: question.description || '',
                    type: question.type,
                    options: question.options ? [...question.options] : ['', ''],
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || '',
                    points: question.points || 1,
                    tags: question.tags ? [...question.tags] : [],
                    difficulty: question.difficulty || 'medium'
                };
                this.questionDrawerOpen = true;
            },

            closeQuestionDrawer() {
                this.questionDrawerOpen = false;
                this.questionEditMode = false;
                this.editingQuestionIndex = null;
                this.newQuestionTag = '';
            },

            onQuestionTypeChange() {
                if (this.questionForm.type === 'short_text') {
                    this.questionForm.options = [];
                    this.questionForm.correctAnswer = null;
                } else if (this.questionForm.options.length === 0) {
                    this.questionForm.options = ['', ''];
                    this.questionForm.correctAnswer = null;
                }
            },

            addOption() {
                this.questionForm.options.push('');
            },

            removeOption(index) {
                if (this.questionForm.options.length > 2) {
                    this.questionForm.options.splice(index, 1);
                    // Adjust correct answer if needed
                    if (Array.isArray(this.questionForm.correctAnswer)) {
                        this.questionForm.correctAnswer = this.questionForm.correctAnswer
                            .filter(idx => idx !== index)
                            .map(idx => idx > index ? idx - 1 : idx);
                    } else if (this.questionForm.correctAnswer === index) {
                        this.questionForm.correctAnswer = null;
                    } else if (this.questionForm.correctAnswer > index) {
                        this.questionForm.correctAnswer--;
                    }
                }
            },

            isCorrectAnswer(index) {
                if (Array.isArray(this.questionForm.correctAnswer)) {
                    return this.questionForm.correctAnswer.includes(index);
                }
                return this.questionForm.correctAnswer === index;
            },

            toggleCorrectAnswer(index) {
                if (this.questionForm.type === 'single_choice') {
                    this.questionForm.correctAnswer = this.isCorrectAnswer(index) ? null : index;
                } else if (this.questionForm.type === 'multiple_choice') {
                    if (!Array.isArray(this.questionForm.correctAnswer)) {
                        this.questionForm.correctAnswer = [];
                    }
                    const idx = this.questionForm.correctAnswer.indexOf(index);
                    if (idx > -1) {
                        this.questionForm.correctAnswer.splice(idx, 1);
                    } else {
                        this.questionForm.correctAnswer.push(index);
                    }
                }
            },

            addQuestionTag() {
                if (this.newQuestionTag && !this.questionForm.tags.includes(this.newQuestionTag)) {
                    this.questionForm.tags.push(this.newQuestionTag.toLowerCase());
                    this.newQuestionTag = '';
                }
            },

            removeTag(index) {
                this.questionForm.tags.splice(index, 1);
            },

            async saveQuestion() {
                try {
                    this.loading = true;

                    let response;
                    if (this.questionEditMode) {
                        response = await API.updatePublicBankQuestion(
                            this.selectedBankDetail._id,
                            this.editingQuestionIndex,
                            this.questionForm
                        );
                    } else {
                        response = await API.addPublicBankQuestion(
                            this.selectedBankDetail._id,
                            this.questionForm
                        );
                    }

                    if (response.success) {
                        this.closeQuestionDrawer();
                        await this.loadQuestions();

                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: {
                                message: `Question ${this.questionEditMode ? 'updated' : 'added'} successfully`,
                                type: 'success'
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to save question:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'Failed to save question', type: 'error' }
                    }));
                } finally {
                    this.loading = false;
                }
            },

            async duplicateQuestion(index) {
                try {
                    const response = await API.duplicatePublicBankQuestion(
                        this.selectedBankDetail._id,
                        index
                    );

                    if (response.success) {
                        await this.loadQuestions();
                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: { message: 'Question duplicated successfully', type: 'success' }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to duplicate question:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'Failed to duplicate question', type: 'error' }
                    }));
                }
            },

            async deleteQuestion(index) {
                if (!confirm('Are you sure you want to delete this question?')) return;

                try {
                    const response = await API.deletePublicBankQuestion(
                        this.selectedBankDetail._id,
                        index
                    );

                    if (response.success) {
                        await this.loadQuestions();
                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: { message: 'Question deleted successfully', type: 'success' }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to delete question:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'Failed to delete question', type: 'error' }
                    }));
                }
            },

            // CSV Import/Export
            openCSVImportModal() {
                this.csvImportModalOpen = true;
                this.csvFile = null;
            },

            closeCSVImportModal() {
                this.csvImportModalOpen = false;
                this.csvFile = null;
                this.csvImportResults = null;
            },

            handleCSVFile(event) {
                this.csvFile = event.target.files[0];
            },

            async importCSV() {
                if (!this.csvFile || !this.selectedBankDetail) return;

                try {
                    this.loading = true;

                    const formData = new FormData();
                    formData.append('csvFile', this.csvFile);

                    const response = await API.importPublicBankCSV(this.selectedBankDetail._id, formData);

                    if (response.success) {
                        this.closeCSVImportModal();
                        await this.loadQuestions();

                        let message = `Successfully imported ${response.imported} questions`;
                        if (response.warnings?.length > 0) {
                            message += ` (${response.warnings.length} warnings)`;
                        }
                        if (response.errors?.length > 0) {
                            message += ` (${response.errors.length} errors)`;
                        }

                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: { message, type: 'success' }
                        }));
                    }
                } catch (error) {
                    console.error('Failed to import CSV:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'Failed to import CSV', type: 'error' }
                    }));
                } finally {
                    this.loading = false;
                }
            },

            async exportCSV() {
                if (!this.selectedBankDetail) return;

                try {
                    await API.exportPublicBankCSV(this.selectedBankDetail._id);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'CSV export started', type: 'success' }
                    }));
                } catch (error) {
                    console.error('Failed to export CSV:', error);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: 'Failed to export CSV', type: 'error' }
                    }));
                }
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
