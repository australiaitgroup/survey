import { ApiResponse, User } from '../types';

export class SuperAdminAPI {
  private baseURL = '/api';
  private token: string | null = null;
  
  constructor() {
    this.token = localStorage.getItem('sa_token') || null;
  }
  
  // Set authentication token
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('sa_token', token);
    } else {
      localStorage.removeItem('sa_token');
    }
  }
  
  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  // Generic request method
  async request<T = any>(method: string, url: string, data?: any): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      method: method.toUpperCase(),
      headers: this.getHeaders(),
    };
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData: any;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType && contentType.includes('text/csv')) {
        responseData = await response.text();
        return responseData; // Return raw CSV data
      } else {
        responseData = await response.text();
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return responseData;
    } catch (error) {
      console.error(`API ${method.toUpperCase()} ${url} failed:`, error);
      throw error;
    }
  }
  
  // HTTP methods
  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let finalUrl = url;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      finalUrl += queryString ? '?' + queryString : '';
    }
    return this.request<T>('GET', finalUrl);
  }
  
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data);
  }
  
  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data);
  }
  
  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data);
  }
  
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url);
  }
  
  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.post<{ token: string; user: User }>('/admin/login', { username, password });
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }
  
  async logout(): Promise<void> {
    try {
      await this.get('/admin/logout');
    } finally {
      this.setToken(null);
    }
  }
  
  async checkAuth(): Promise<User> {
    const response = await this.get<{ user: User }>('/admin/check-auth');
    if (response.success && response.data?.user) {
      return response.data.user;
    }
    throw new Error('Authentication failed');
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Utility methods for file downloads
  async downloadCSV(url: string, filename = 'export.csv'): Promise<boolean> {
    try {
      const csvData = await this.get<string>(url);
      
      // Create blob and download
      const blob = new Blob([csvData.data || ''], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (error) {
      console.error('CSV download failed:', error);
      throw error;
    }
  }
  
  // Helper methods for common patterns
  
  // Paginated data fetching
  async getPaginatedData<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const defaultParams: Record<string, string> = {
      page: '1',
      limit: '50',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    // Convert all values to strings for URLSearchParams
    const stringParams: Record<string, string> = {};
    Object.entries({ ...defaultParams, ...params }).forEach(([key, value]) => {
      stringParams[key] = String(value);
    });
    
    return this.get<T>(`${endpoint}?${new URLSearchParams(stringParams).toString()}`);
  }
  
  // Search with debouncing
  private debounceTimers: Record<string, NodeJS.Timeout> = {};
  
  async debouncedSearch<T = any>(endpoint: string, searchTerm: string, delay = 300): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimers[endpoint]) {
        clearTimeout(this.debounceTimers[endpoint]);
      }
      
      // Set new timer
      this.debounceTimers[endpoint] = setTimeout(async () => {
        try {
          const result = await this.get<T>(`${endpoint}?search=${encodeURIComponent(searchTerm)}`);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }
  
  // Batch operations
  async batchRequest(requests: Array<{ method: string; url: string; data?: any }>): Promise<Array<ApiResponse<any> | { error: any }>> {
    const promises = requests.map(({ method, url, data }) =>
      this.request(method, url, data).catch(error => ({ error }))
    );
    
    return Promise.all(promises);
  }
}

// Create and export API instance
export const api = new SuperAdminAPI();

// Also create global instance for legacy access
if (typeof window !== 'undefined') {
  (window as any).API = api;
}