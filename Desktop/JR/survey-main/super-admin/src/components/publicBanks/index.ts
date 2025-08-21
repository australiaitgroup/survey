import { PublicBanksList } from './PublicBanksList';
import { QuestionsManager } from './QuestionsManager';
import { CSVManager } from './CSVManager';
import { BankUsageModal } from './BankUsageModal';
import { PublicBanksAPI } from '../../api/publicBanks';
import { PublicBank, Question } from '../../types/publicBanks';

class PublicBanksComponent {
	private api: PublicBanksAPI;
	private banksList: PublicBanksList;
	private questionsManager: QuestionsManager;
	private csvManager: CSVManager;
	private usageModal: BankUsageModal;

	// View state
	public currentView: 'list' | 'detail' = 'list';
	public activeTab: 'overview' | 'questions' = 'overview';
	public selectedBankDetail: PublicBank | null = null;

	constructor() {
		this.api = new PublicBanksAPI();
		this.banksList = new PublicBanksList(this.api);
		this.questionsManager = new QuestionsManager(this.api);
		this.csvManager = new CSVManager(this.api);
		this.usageModal = new BankUsageModal(this.api);

		// Set up callbacks
		this.csvManager.onQuestionsReload = () => {
			this.questionsManager.loadQuestions();
		};

		this.init();
	}

	private init(): void {
		this.renderContent();
		this.setupEventListeners();
		console.log('Public Banks component initialized');
	}

	private renderContent(): void {
		const content = document.getElementById('public-banks-content');
		if (!content) return;

		// Render the HTML template
		// This would be replaced with your templating solution
		content.innerHTML = this.getTemplate();
	}

	private setupEventListeners(): void {
		// Set up Alpine.js data binding
		window.publicBanksData = this.getAlpineData();
	}

	async loadData(): Promise<void> {
		await this.banksList.loadData();
	}

	async viewBankDetail(bank: PublicBank): Promise<void> {
		this.selectedBankDetail = bank;
		this.currentView = 'detail';
		this.activeTab = 'overview';

		// Load questions for this bank
		this.questionsManager.setBankId(bank._id);
		this.csvManager.setBankId(bank._id);
		await this.questionsManager.loadQuestions();
	}

	backToList(): void {
		this.currentView = 'list';
		this.selectedBankDetail = null;
		this.activeTab = 'overview';
	}

	async refreshData(): Promise<void> {
		if (this.currentView === 'list') {
			await this.banksList.loadData();
		} else if (this.currentView === 'detail' && this.activeTab === 'questions') {
			await this.questionsManager.loadQuestions();
		}
	}

	private getAlpineData(): any {
		return {
			// Expose all component instances to Alpine
			banksList: this.banksList,
			questionsManager: this.questionsManager,
			csvManager: this.csvManager,
			usageModal: this.usageModal,

			// View state
			currentView: this.currentView,
			activeTab: this.activeTab,
			selectedBankDetail: this.selectedBankDetail,

			// Methods
			loadData: () => this.loadData(),
			viewBankDetail: (bank: PublicBank) => this.viewBankDetail(bank),
			backToList: () => this.backToList(),
			refreshData: () => this.refreshData(),

			// Delegate to sub-components
			// Banks list
			get data() {
				return this.banksList.data;
			},
			get filteredData() {
				return this.banksList.filteredData;
			},
			get loading() {
				return this.banksList.loading || this.questionsManager.loading;
			},
			get filters() {
				return this.banksList.filters;
			},
			get pagination() {
				return this.banksList.pagination;
			},
			get modalOpen() {
				return this.banksList.modalOpen;
			},
			get editMode() {
				return this.banksList.editMode;
			},
			get formData() {
				return this.banksList.formData;
			},

			// Questions
			get questions() {
				return this.questionsManager.questions;
			},
			get questionsPagination() {
				return this.questionsManager.pagination;
			},
			get questionsFilters() {
				return this.questionsManager.filters;
			},
			get questionDrawerOpen() {
				return this.questionsManager.questionDrawerOpen;
			},
			get questionEditMode() {
				return this.questionsManager.questionEditMode;
			},
			get questionForm() {
				return this.questionsManager.questionForm;
			},

			// CSV
			get csvImportModalOpen() {
				return this.csvManager.csvImportModalOpen;
			},
			get csvImportResults() {
				return this.csvManager.csvImportResults;
			},

			// Usage modal
			get usageModalOpen() {
				return this.usageModal.modalOpen;
			},
			get usageData() {
				return this.usageModal.usageData;
			},

			// Bind all methods
			debounceSearch: () => this.banksList.debounceSearch(),
			applyFilters: () => this.banksList.applyFilters(),
			openCreateModal: () => this.banksList.openCreateModal(),
			openEditModal: (bank: PublicBank) => this.banksList.openEditModal(bank),
			closeModal: () => this.banksList.closeModal(),
			saveBank: () => this.banksList.saveBank(),
			deleteBank: (bank: PublicBank) => this.banksList.deleteBank(bank),
			addTag: () => this.banksList.addTag(),
			removeTag: (index: number) => this.banksList.removeTag(index),
			getVisiblePages: () => this.banksList.getVisiblePages(),
			goToPage: (page: number) => this.banksList.goToPage(page),

			// Questions methods
			loadQuestions: () => this.questionsManager.loadQuestions(),
			openAddQuestionDrawer: () => this.questionsManager.openAddQuestionDrawer(),
			openEditQuestionDrawer: (q: Question, i: number) =>
				this.questionsManager.openEditQuestionDrawer(q, i),
			closeQuestionDrawer: () => this.questionsManager.closeQuestionDrawer(),
			saveQuestion: () => this.questionsManager.saveQuestion(),
			deleteQuestion: (index: number) => this.questionsManager.deleteQuestion(index),
			duplicateQuestion: (index: number) => this.questionsManager.duplicateQuestion(index),
			onQuestionTypeChange: () => this.questionsManager.onQuestionTypeChange(),
			addOption: () => this.questionsManager.addOption(),
			removeOption: (index: number) => this.questionsManager.removeOption(index),
			addQuestionTag: () => this.questionsManager.addQuestionTag(),
			removeQuestionTag: (index: number) => this.questionsManager.removeQuestionTag(index),
			debounceQuestionsSearch: () => this.questionsManager.debounceQuestionsSearch(),
			getQuestionsVisiblePages: () => this.questionsManager.getQuestionsVisiblePages(),
			goToQuestionsPage: (page: number) => this.questionsManager.goToPage(page),

			// CSV methods
			openCSVImportModal: () => this.csvManager.openCSVImportModal(),
			closeCSVImportModal: () => this.csvManager.closeCSVImportModal(),
			importCSV: async () => {
				const input = document.getElementById('csv-file-input') as HTMLInputElement;
				if (input?.files?.[0]) {
					return await this.csvManager.importCSV(input.files[0]);
				}
				return Promise.resolve();
			},
			exportCSV: () =>
				this.csvManager.exportCSV(this.selectedBankDetail?.title || 'questions'),
			downloadCSVTemplate: () => this.csvManager.downloadCSVTemplate(),

			// Usage modal methods
			openUsageModal: (bank: PublicBank) => this.usageModal.openModal(bank),
			closeUsageModal: () => this.usageModal.closeModal(),
		};
	}

	private getTemplate(): string {
		// Public Banks UI with list view and a drawer for create/edit
		return `
      <div x-data="publicBanksData" class="space-y-6" x-init="loadData()">
        <!-- Header / Actions -->
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold text-gray-900">Public Question Banks</h2>
          <div class="flex items-center gap-2">
            <button @click="openCreateModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              + Create Bank
            </button>
          </div>
        </div>

        <!-- Filters (basic search) -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex flex-col md:flex-row gap-3 md:items-center">
            <div class="flex-1">
              <input type="text" placeholder="Search by title, description or tag" x-model="filters.search" @input="debounceSearch()"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex items-center gap-2">
              <select x-model="filters.type" @change="applyFilters()" class="border border-gray-300 rounded-lg px-3 py-2">
                <option value="">All Types</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
              <select x-model="filters.isActive" @change="applyFilters()" class="border border-gray-300 rounded-lg px-3 py-2">
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <!-- List -->
        <div class="bg-white rounded-lg shadow">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" x-show="!loading">
                <template x-for="bank in filteredData" :key="bank._id">
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900" x-text="bank.title"></td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                      <span :title="bank.description" x-text="(bank.description && bank.description.length > 30) ? (bank.description.slice(0, 30) + '…') : (bank.description || '')"></span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <span class="px-2 py-1 rounded text-xs" :class="bank.type === 'paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'" x-text="bank.type === 'paid' ? 'Paid' : 'Free'"></span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                      <div class="flex flex-wrap gap-1">
                        <template x-for="(tag, idx) in bank.tags" :key="idx">
                          <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded" x-text="tag"></span>
                        </template>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="bank.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'" x-text="bank.isActive ? 'Active' : 'Inactive'"></span>
                    </td>
                    <td class="px-4 py-3 text-sm text-right">
                      <div class="inline-flex items-center gap-2">
                        <button class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded" @click="openEditModal(bank)">Edit</button>
                        <button class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded" @click="deleteBank(bank)">Delete</button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div class="p-6 text-center text-gray-500" x-show="!loading && filteredData.length === 0">
              No public banks found.
            </div>
            <div class="p-6 text-center" x-show="loading">
              <div class="inline-flex items-center gap-2 text-gray-600">
                <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full loading-spinner"></div>
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer (Create/Edit Bank) -->
        <div x-show="modalOpen" class="fixed inset-0 z-50" aria-modal="true" role="dialog">
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-50" @click="closeModal()"></div>
          <!-- Panel -->
          <div class="absolute right-0 top-0 h-full w-full sm:w-[32rem] bg-white shadow-xl flex flex-col">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900" x-text="editMode ? 'Edit Public Bank' : 'Create Public Bank'"></h3>
              <button class="text-gray-500 hover:text-gray-700" @click="closeModal()">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Title</label>
                  <input type="text" x-model="formData.title" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter bank title" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Description</label>
                  <textarea x-model="formData.description" rows="3" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter short description"></textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Type</label>
                    <select x-model="formData.type" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <div x-show="formData.type === 'paid'">
                    <label class="block text-sm font-medium text-gray-700">Price (one-time)</label>
                    <input type="number" min="0" step="0.01" x-model.number="formData.priceOneTime" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tags</label>
                  <div class="mt-1 flex items-center gap-2">
                    <input id="tag-input" type="text" class="flex-1 border border-gray-300 rounded-lg px-3 py-2" placeholder="Add a tag" />
                    <button type="button" @click="addTag()" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded">Add</button>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <template x-for="(tag, idx) in formData.tags" :key="idx">
                      <span class="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        <span x-text="tag"></span>
                        <button type="button" class="text-gray-500 hover:text-gray-700" @click="removeTag(idx)">&times;</button>
                      </span>
                    </template>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Locales</label>
                  <div class="mt-2 flex items-center gap-4">
                    <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" :checked="formData.locales.includes('en')" @change="formData.locales = $event.target.checked ? Array.from(new Set([...(formData.locales||[]),'en'])) : (formData.locales||[]).filter(l => l !== 'en')" />
                      <span>English</span>
                    </label>
                    <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" :checked="formData.locales.includes('zh')" @change="formData.locales = $event.target.checked ? Array.from(new Set([...(formData.locales||[]),'zh'])) : (formData.locales||[]).filter(l => l !== 'zh')" />
                      <span>中文</span>
                    </label>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" x-model="formData.isActive" />
                    <span>Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg" @click="closeModal()">Cancel</button>
              <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" @click="saveBank()" :disabled="loading">
                <span x-show="!editMode">Create</span>
                <span x-show="editMode">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
	}
}

// Extend the existing Window interface
declare global {
	interface Window {
		publicBanksData?: any;
	}
}

// Initialize when loaded
if (typeof window !== 'undefined') {
	(window as any).publicBanksComponent = new PublicBanksComponent();
}
