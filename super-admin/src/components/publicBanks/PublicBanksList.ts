import { PublicBank, PublicBankFormData } from '../../types/publicBanks';
import { PaginationParams, FilterParams } from '../../types';
import { PublicBanksAPI } from '../../api/publicBanks';

export class PublicBanksList {
  private api: PublicBanksAPI;
  
  // State
  public data: PublicBank[] = [];
  public filteredData: PublicBank[] = [];
  public loading = false;
  public modalOpen = false;
  public editMode = false;
  public selectedBank: PublicBank | null = null;
  
  // Filters
  public filters: FilterParams = {
    search: '',
    type: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  // Pagination
  public pagination: PaginationParams = {
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  };
  
  // Form data
  public formData: PublicBankFormData = {
    title: '',
    description: '',
    type: 'free',
    priceOneTime: 0,
    tags: [],
    locales: ['en'],
    isActive: true
  };
  
  constructor(api: PublicBanksAPI) {
    this.api = api;
  }
  
  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const params = {
        ...this.filters,
        ...this.pagination
      };
      
      const response = await this.api.getPublicBanks(params);
      
      if (response.success && response.data) {
        this.data = response.data.banks || [];
        this.pagination = {
          ...this.pagination,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        };
        this.applyFilters();
      }
    } catch (error) {
      console.error('Failed to load public banks:', error);
      this.showError('Failed to load public banks');
    } finally {
      this.loading = false;
    }
  }
  
  applyFilters(): void {
    let filtered = [...this.data];
    
    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(bank => 
        bank.title.toLowerCase().includes(searchLower) ||
        bank.description.toLowerCase().includes(searchLower) ||
        bank.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply type filter
    if (this.filters.type) {
      filtered = filtered.filter(bank => bank.type === this.filters.type);
    }
    
    // Apply active filter
    if (this.filters.isActive !== '') {
      const isActive = this.filters.isActive === 'true';
      filtered = filtered.filter(bank => bank.isActive === isActive);
    }
    
    this.filteredData = filtered;
  }
  
  debounceSearch(): void {
    // Implement debounce logic
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }
  
  openCreateModal(): void {
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
  }
  
  openEditModal(bank: PublicBank): void {
    this.editMode = true;
    this.selectedBank = bank;
    this.formData = {
      title: bank.title,
      description: bank.description,
      type: bank.type,
      priceOneTime: bank.priceOneTime || 0,
      tags: [...bank.tags],
      locales: [...bank.locales],
      isActive: bank.isActive
    };
    this.modalOpen = true;
  }
  
  closeModal(): void {
    this.modalOpen = false;
    this.selectedBank = null;
    this.editMode = false;
  }
  
  async saveBank(): Promise<void> {
    try {
      if (!this.validateForm()) {
        return;
      }
      
      let response;
      if (this.editMode && this.selectedBank) {
        response = await this.api.updatePublicBank(this.selectedBank._id, this.formData);
      } else {
        response = await this.api.createPublicBank(this.formData);
      }
      
      if (response.success) {
        this.showSuccess(this.editMode ? 'Bank updated successfully' : 'Bank created successfully');
        this.closeModal();
        await this.loadData();
      } else {
        this.showError(response.error || 'Failed to save bank');
      }
    } catch (error) {
      console.error('Failed to save bank:', error);
      this.showError('Failed to save bank');
    }
  }
  
  async deleteBank(bank: PublicBank): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${bank.title}"?`)) {
      return;
    }
    
    try {
      const response = await this.api.deletePublicBank(bank._id);
      if (response.success) {
        this.showSuccess('Bank deleted successfully');
        await this.loadData();
      } else {
        this.showError(response.error || 'Failed to delete bank');
      }
    } catch (error) {
      console.error('Failed to delete bank:', error);
      this.showError('Failed to delete bank');
    }
  }
  
  addTag(): void {
    const input = document.getElementById('tag-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      if (!this.formData.tags.includes(input.value.trim())) {
        this.formData.tags.push(input.value.trim());
        input.value = '';
      }
    }
  }
  
  removeTag(index: number): void {
    this.formData.tags.splice(index, 1);
  }
  
  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.pagination.page - halfVisible);
    let end = Math.min(this.pagination.pages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  async goToPage(page: number): Promise<void> {
    this.pagination.page = page;
    await this.loadData();
  }
  
  private validateForm(): boolean {
    if (!this.formData.title.trim()) {
      this.showError('Title is required');
      return false;
    }
    
    if (!this.formData.description.trim()) {
      this.showError('Description is required');
      return false;
    }
    
    if (this.formData.type === 'paid' && this.formData.priceOneTime <= 0) {
      this.showError('Price must be greater than 0 for paid banks');
      return false;
    }
    
    return true;
  }
  
  private showSuccess(message: string): void {
    // Implement notification logic
    console.log('Success:', message);
  }
  
  private showError(message: string): void {
    // Implement notification logic
    console.error('Error:', message);
  }
}