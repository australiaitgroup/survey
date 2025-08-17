import { AuditLog, AuditFilters, AuditAction, AuditTargetType } from '../../types/audit';
import { PaginationParams } from '../../types';

class AuditComponent {
  // State
  public data: AuditLog[] = [];
  public filteredData: AuditLog[] = [];
  public selectedLog: AuditLog | null = null;
  public modalOpen = false;
  public loading = false;
  
  // Filters
  public filters: AuditFilters = {
    search: '',
    action: '',
    targetType: '',
    actorId: '',
    dateFrom: '',
    dateTo: ''
  };
  
  // Pagination
  public pagination: PaginationParams = {
    page: 1,
    limit: 100,
    total: 0,
    pages: 0
  };
  
  // Statistics
  public stats = {
    totalLogs: 0,
    todayLogs: 0,
    uniqueActors: 0,
    topActions: [] as Array<{ action: string; count: number }>
  };
  
  constructor() {
    this.init();
  }
  
  private init(): void {
    this.renderContent();
    this.setupEventListeners();
    console.log('Audit component initialized (TypeScript)');
  }
  
  private renderContent(): void {
    const content = document.getElementById('audit-content');
    if (!content) return;
    
    content.innerHTML = this.getTemplate();
  }
  
  private setupEventListeners(): void {
    (window as any).auditData = this.getAlpineData();
  }
  
  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const params = {
        ...this.filters,
        page: this.pagination.page,
        limit: this.pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      const response = await (window as any).API?.get('/sa/audit-logs', params);
      
      if (response?.success) {
        this.data = response.data.logs || [];
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
      console.error('Failed to load audit logs:', error);
      this.showError('Failed to load audit logs');
    } finally {
      this.loading = false;
    }
  }
  
  async loadStats(): Promise<void> {
    try {
      const response = await (window as any).API?.get('/sa/audit-logs/stats');
      
      if (response?.success) {
        this.stats = {
          totalLogs: response.data.totalLogs || 0,
          todayLogs: response.data.todayLogs || 0,
          uniqueActors: response.data.uniqueActors || 0,
          topActions: response.data.topActions || []
        };
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  }
  
  applyFilters(): void {
    let filtered = [...this.data];
    
    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.actor.name.toLowerCase().includes(searchLower) ||
        log.actor.email.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.targetName?.toLowerCase().includes(searchLower) ||
        log.targetType.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply action filter
    if (this.filters.action) {
      filtered = filtered.filter(log => log.action === this.filters.action);
    }
    
    // Apply target type filter
    if (this.filters.targetType) {
      filtered = filtered.filter(log => log.targetType === this.filters.targetType);
    }
    
    // Apply actor filter
    if (this.filters.actorId) {
      filtered = filtered.filter(log => log.actor.id === this.filters.actorId);
    }
    
    // Apply date range filter
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(log => new Date(log.createdAt) >= fromDate);
    }
    
    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.createdAt) <= toDate);
    }
    
    this.filteredData = filtered;
  }
  
  debounceSearch(): void {
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }
  
  viewLogDetails(log: AuditLog): void {
    this.selectedLog = log;
    this.modalOpen = true;
  }
  
  closeModal(): void {
    this.modalOpen = false;
    this.selectedLog = null;
  }
  
  async exportAuditLogs(): Promise<void> {
    try {
      const params = { ...this.filters };
      const response = await (window as any).API?.get('/sa/audit-logs/export', params);
      
      if (response?.success) {
        // Download CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Audit logs exported successfully');
      }
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      this.showError('Failed to export audit logs');
    }
  }
  
  clearFilters(): void {
    this.filters = {
      search: '',
      action: '',
      targetType: '',
      actorId: '',
      dateFrom: '',
      dateTo: ''
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
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  getActionColor(action: AuditAction): string {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'suspend':
        return 'bg-orange-100 text-orange-800';
      case 'activate':
        return 'bg-emerald-100 text-emerald-800';
      case 'login':
        return 'bg-indigo-100 text-indigo-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'pii_view':
        return 'bg-purple-100 text-purple-800';
      case 'impersonate':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getActionIcon(action: AuditAction): string {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'suspend':
        return '⏸️';
      case 'activate':
        return '▶️';
      case 'login':
        return '🔓';
      case 'logout':
        return '🔒';
      case 'pii_view':
        return '👁️';
      case 'impersonate':
        return '🎭';
      case 'export':
        return '📤';
      default:
        return '📝';
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
      selectedLog: this.selectedLog,
      modalOpen: this.modalOpen,
      loading: this.loading,
      filters: this.filters,
      pagination: this.pagination,
      stats: this.stats,
      
      // Methods
      loadData: () => this.loadData(),
      applyFilters: () => this.applyFilters(),
      debounceSearch: () => this.debounceSearch(),
      viewLogDetails: (log: AuditLog) => this.viewLogDetails(log),
      closeModal: () => this.closeModal(),
      exportAuditLogs: () => this.exportAuditLogs(),
      clearFilters: () => this.clearFilters(),
      refreshData: () => this.refreshData(),
      getVisiblePages: () => this.getVisiblePages(),
      goToPage: (page: number) => this.goToPage(page),
      formatDate: (date: string) => this.formatDate(date),
      getActionColor: (action: AuditAction) => this.getActionColor(action),
      getActionIcon: (action: AuditAction) => this.getActionIcon(action)
    };
  }
  
  private getTemplate(): string {
    return `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Audit Logs</h2>
        <p class="text-gray-600">Audit logs component loaded (TypeScript version)</p>
        <div class="mt-4 grid grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded">
            <p class="text-sm text-gray-600">Total Logs</p>
            <p class="text-2xl font-bold">0</p>
          </div>
          <div class="bg-green-50 p-4 rounded">
            <p class="text-sm text-gray-600">Today's Logs</p>
            <p class="text-2xl font-bold">0</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded">
            <p class="text-sm text-gray-600">Unique Actors</p>
            <p class="text-2xl font-bold">0</p>
          </div>
          <div class="bg-purple-50 p-4 rounded">
            <p class="text-sm text-gray-600">Security Events</p>
            <p class="text-2xl font-bold">0</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize and export component
export const auditComponent = new AuditComponent();

// Also add to window for legacy access
if (typeof window !== 'undefined') {
  (window as any).auditComponent = auditComponent;
}