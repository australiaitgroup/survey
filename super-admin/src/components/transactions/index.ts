import { Transaction, TransactionFilters, TransactionStatus, TransactionType } from '../../types/transactions';
import { PaginationParams } from '../../types';

class TransactionsComponent {
  // State
  public data: Transaction[] = [];
  public filteredData: Transaction[] = [];
  public selectedTransaction: Transaction | null = null;
  public modalOpen = false;
  public loading = false;
  
  // Filters
  public filters: TransactionFilters = {
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: undefined,
    maxAmount: undefined
  };
  
  // Pagination
  public pagination: PaginationParams = {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  };
  
  // Statistics
  public stats = {
    totalRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
    averageAmount: 0,
    revenueByMonth: [] as Array<{ month: string; amount: number }>
  };
  
  constructor() {
    this.init();
  }
  
  private init(): void {
    this.renderContent();
    this.setupEventListeners();
    console.log('Transactions component initialized (TypeScript)');
  }
  
  private renderContent(): void {
    const content = document.getElementById('transactions-content');
    if (!content) return;
    
    content.innerHTML = this.getTemplate();
  }
  
  private setupEventListeners(): void {
    (window as any).transactionsData = this.getAlpineData();
  }
  
  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const params = {
        ...this.filters,
        page: this.pagination.page,
        limit: this.pagination.limit
      };
      
      const response = await (window as any).API?.get('/sa/purchases', params);
      
      if (response?.success) {
        this.data = response.data.transactions || [];
        this.pagination = {
          ...this.pagination,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        };
        
        // Load stats
        await this.loadStats();
        
        this.applyFilters();
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      this.showError('Failed to load transactions');
    } finally {
      this.loading = false;
    }
  }
  
  async loadStats(): Promise<void> {
    try {
      const response = await (window as any).API?.get('/sa/purchases/stats');
      
      if (response?.success) {
        this.stats = {
          totalRevenue: response.data.totalRevenue || 0,
          totalTransactions: response.data.totalTransactions || 0,
          successRate: response.data.successRate || 0,
          averageAmount: response.data.averageAmount || 0,
          revenueByMonth: response.data.revenueByMonth || []
        };
      }
    } catch (error) {
      console.error('Failed to load transaction stats:', error);
    }
  }
  
  applyFilters(): void {
    let filtered = [...this.data];
    
    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.companyName.toLowerCase().includes(searchLower) ||
        transaction.userName.toLowerCase().includes(searchLower) ||
        transaction.userEmail.toLowerCase().includes(searchLower) ||
        transaction.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply type filter
    if (this.filters.type) {
      filtered = filtered.filter(t => t.type === this.filters.type);
    }
    
    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(t => t.status === this.filters.status);
    }
    
    // Apply date range filter
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(t => new Date(t.createdAt) >= fromDate);
    }
    
    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.createdAt) <= toDate);
    }
    
    // Apply amount range filter
    if (this.filters.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= this.filters.minAmount!);
    }
    
    if (this.filters.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= this.filters.maxAmount!);
    }
    
    this.filteredData = filtered;
  }
  
  debounceSearch(): void {
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }
  
  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.modalOpen = true;
  }
  
  closeModal(): void {
    this.modalOpen = false;
    this.selectedTransaction = null;
  }
  
  async refundTransaction(transaction: Transaction): Promise<void> {
    if (!confirm(`Are you sure you want to refund $${transaction.amount} to ${transaction.userName}?`)) {
      return;
    }
    
    try {
      const response = await (window as any).API?.post(`/sa/purchases/${transaction._id}/refund`);
      
      if (response?.success) {
        this.showSuccess('Transaction refunded successfully');
        await this.loadData();
      } else {
        this.showError(response?.error || 'Failed to refund transaction');
      }
    } catch (error) {
      console.error('Failed to refund transaction:', error);
      this.showError('Failed to refund transaction');
    }
  }
  
  async exportTransactions(): Promise<void> {
    try {
      const params = { ...this.filters };
      const response = await (window as any).API?.get('/sa/purchases/export', params);
      
      if (response?.success) {
        // Download CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Transactions exported successfully');
      }
    } catch (error) {
      console.error('Failed to export transactions:', error);
      this.showError('Failed to export transactions');
    }
  }
  
  clearFilters(): void {
    this.filters = {
      search: '',
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: undefined,
      maxAmount: undefined
    };
    this.applyFilters();
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
  
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusColor(status: TransactionStatus): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getTypeIcon(type: TransactionType): string {
    switch (type) {
      case 'purchase':
        return '💳';
      case 'subscription':
        return '🔄';
      case 'refund':
        return '↩️';
      case 'credit':
        return '➕';
      default:
        return '💰';
    }
  }
  
  private showSuccess(message: string): void {
    console.log('Success:', message);
  }
  
  private showError(message: string): void {
    console.error('Error:', message);
  }
  
  private getAlpineData(): any {
    return {
      // State
      data: this.data,
      filteredData: this.filteredData,
      selectedTransaction: this.selectedTransaction,
      modalOpen: this.modalOpen,
      loading: this.loading,
      filters: this.filters,
      pagination: this.pagination,
      stats: this.stats,
      
      // Methods
      loadData: () => this.loadData(),
      applyFilters: () => this.applyFilters(),
      debounceSearch: () => this.debounceSearch(),
      viewTransactionDetails: (t: Transaction) => this.viewTransactionDetails(t),
      closeModal: () => this.closeModal(),
      refundTransaction: (t: Transaction) => this.refundTransaction(t),
      exportTransactions: () => this.exportTransactions(),
      clearFilters: () => this.clearFilters(),
      refreshData: () => this.refreshData(),
      getVisiblePages: () => this.getVisiblePages(),
      goToPage: (page: number) => this.goToPage(page),
      formatCurrency: (amount: number, currency?: string) => this.formatCurrency(amount, currency),
      formatDate: (date: string) => this.formatDate(date),
      getStatusColor: (status: TransactionStatus) => this.getStatusColor(status),
      getTypeIcon: (type: TransactionType) => this.getTypeIcon(type)
    };
  }
  
  private getTemplate(): string {
    return `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Transactions</h2>
        <p class="text-gray-600">Transactions component loaded (TypeScript version)</p>
        <div class="mt-4 grid grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded">
            <p class="text-sm text-gray-600">Total Revenue</p>
            <p class="text-2xl font-bold">$0</p>
          </div>
          <div class="bg-green-50 p-4 rounded">
            <p class="text-sm text-gray-600">Total Transactions</p>
            <p class="text-2xl font-bold">0</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded">
            <p class="text-sm text-gray-600">Success Rate</p>
            <p class="text-2xl font-bold">0%</p>
          </div>
          <div class="bg-purple-50 p-4 rounded">
            <p class="text-sm text-gray-600">Average Amount</p>
            <p class="text-2xl font-bold">$0</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize and export component
export const transactionsComponent = new TransactionsComponent();

// Also add to window for legacy access
if (typeof window !== 'undefined') {
  (window as any).transactionsComponent = transactionsComponent;
}