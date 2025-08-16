import { Company, CompanyFormData, CompanyStats, CompanyUser } from '../../types/companies';
import { PaginationParams, FilterParams, ApiResponse } from '../../types';

class CompaniesComponent {
  // State
  public data: Company[] = [];
  public filteredData: Company[] = [];
  public selectedCompany: Company | null = null;
  public drawerOpen = false;
  public loading = false;
  
  // Filters
  public filters: FilterParams & {
    plan?: string;
    status?: string;
  } = {
    search: '',
    plan: '',
    status: '',
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
  
  // Company details
  public companyStats: CompanyStats | null = null;
  public companyUsers: CompanyUser[] = [];
  
  constructor() {
    this.init();
  }
  
  private init(): void {
    this.renderContent();
    this.setupEventListeners();
    console.log('Companies component initialized (TypeScript)');
  }
  
  private renderContent(): void {
    const content = document.getElementById('companies-content');
    if (!content) return;
    
    // For now, show a placeholder
    content.innerHTML = this.getTemplate();
  }
  
  private setupEventListeners(): void {
    // Set up Alpine.js data binding
    (window as any).companiesData = this.getAlpineData();
  }
  
  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const params = {
        ...this.filters,
        page: this.pagination.page,
        limit: this.pagination.limit
      };
      
      const response = await (window as any).API?.get('/sa/companies', params);
      
      if (response?.success) {
        this.data = response.data.companies || [];
        this.pagination = {
          ...this.pagination,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        };
        this.applyFilters();
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      this.showError('Failed to load companies');
    } finally {
      this.loading = false;
    }
  }
  
  applyFilters(): void {
    let filtered = [...this.data];
    
    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchLower) ||
        company.email.toLowerCase().includes(searchLower) ||
        company.domain?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply plan filter
    if (this.filters.plan) {
      filtered = filtered.filter(company => company.planType === this.filters.plan);
    }
    
    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(company => company.status === this.filters.status);
    }
    
    // Apply sorting
    if (this.filters.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.filters.sortBy!];
        const bVal = (b as any)[this.filters.sortBy!];
        
        if (this.filters.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    this.filteredData = filtered;
  }
  
  debounceSearch(): void {
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }
  
  async viewCompanyDetails(company: Company): Promise<void> {
    this.selectedCompany = company;
    this.drawerOpen = true;
    
    // Load company details
    await this.loadCompanyDetails(company._id);
  }
  
  async loadCompanyDetails(companyId: string): Promise<void> {
    try {
      // Load company stats
      const statsResponse = await (window as any).API?.get(`/sa/companies/${companyId}/stats`);
      if (statsResponse?.success) {
        this.companyStats = statsResponse.data;
      }
      
      // Load company users
      const usersResponse = await (window as any).API?.get(`/sa/companies/${companyId}/users`);
      if (usersResponse?.success) {
        this.companyUsers = usersResponse.data.users || [];
      }
    } catch (error) {
      console.error('Failed to load company details:', error);
    }
  }
  
  closeDrawer(): void {
    this.drawerOpen = false;
    this.selectedCompany = null;
    this.companyStats = null;
    this.companyUsers = [];
  }
  
  async suspendCompany(company: Company): Promise<void> {
    if (!confirm(`Are you sure you want to suspend ${company.name}?`)) {
      return;
    }
    
    try {
      const response = await (window as any).API?.put(`/sa/companies/${company._id}/suspend`, {
        reason: 'Suspended by super admin'
      });
      
      if (response?.success) {
        this.showSuccess('Company suspended successfully');
        await this.loadData();
      } else {
        this.showError('Failed to suspend company');
      }
    } catch (error) {
      console.error('Failed to suspend company:', error);
      this.showError('Failed to suspend company');
    }
  }
  
  async activateCompany(company: Company): Promise<void> {
    try {
      const response = await (window as any).API?.put(`/sa/companies/${company._id}/activate`);
      
      if (response?.success) {
        this.showSuccess('Company activated successfully');
        await this.loadData();
      } else {
        this.showError('Failed to activate company');
      }
    } catch (error) {
      console.error('Failed to activate company:', error);
      this.showError('Failed to activate company');
    }
  }
  
  async impersonateUser(userId: string): Promise<void> {
    if (!confirm('Are you sure you want to impersonate this user?')) {
      return;
    }
    
    try {
      const response = await (window as any).API?.post(`/sa/users/${userId}/impersonate`);
      
      if (response?.success && response.data?.token) {
        // Store impersonation token
        localStorage.setItem('impersonation_token', response.data.token);
        localStorage.setItem('original_token', localStorage.getItem('sa_token') || '');
        
        // Redirect to main app
        window.location.href = '/admin';
      } else {
        this.showError('Failed to impersonate user');
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      this.showError('Failed to impersonate user');
    }
  }
  
  async refreshData(): Promise<void> {
    await this.loadData();
    this.showSuccess('Data refreshed successfully');
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
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }
  
  private showSuccess(message: string): void {
    console.log('Success:', message);
    // Implement notification
  }
  
  private showError(message: string): void {
    console.error('Error:', message);
    // Implement notification
  }
  
  private getAlpineData(): any {
    return {
      // State
      data: this.data,
      filteredData: this.filteredData,
      selectedCompany: this.selectedCompany,
      drawerOpen: this.drawerOpen,
      loading: this.loading,
      filters: this.filters,
      pagination: this.pagination,
      companyStats: this.companyStats,
      companyUsers: this.companyUsers,
      
      // Methods
      loadData: () => this.loadData(),
      applyFilters: () => this.applyFilters(),
      debounceSearch: () => this.debounceSearch(),
      viewCompanyDetails: (company: Company) => this.viewCompanyDetails(company),
      closeDrawer: () => this.closeDrawer(),
      suspendCompany: (company: Company) => this.suspendCompany(company),
      activateCompany: (company: Company) => this.activateCompany(company),
      impersonateUser: (userId: string) => this.impersonateUser(userId),
      refreshData: () => this.refreshData(),
      getVisiblePages: () => this.getVisiblePages(),
      goToPage: (page: number) => this.goToPage(page),
      formatDate: (date: string) => this.formatDate(date),
      formatNumber: (num: number) => this.formatNumber(num)
    };
  }
  
  private getTemplate(): string {
    // Return a placeholder template
    return `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Companies Management</h2>
        <p class="text-gray-600">Companies component loaded (TypeScript version)</p>
      </div>
    `;
  }
}

// Initialize and export component
export const companiesComponent = new CompaniesComponent();

// Also add to window for legacy access
if (typeof window !== 'undefined') {
  (window as any).companiesComponent = companiesComponent;
}