import { User } from './types';

interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  badge?: number;
}

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalSurveys: number;
  totalResponses: number;
  activeSessions: number;
}

interface Activity {
  id: string;
  action: string;
  actor?: { email: string };
  createdAt: string;
}

interface Notification {
  id: string | number;
  message: string;
  time: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Authentication utilities
export class AuthUtils {
  static getToken(): string | null {
    return localStorage.getItem('sa_token');
  }
  
  static getUser(): User | null {
    const userData = localStorage.getItem('sa_user');
    return userData ? JSON.parse(userData) : null;
  }
  
  static setAuth(token: string, user: User): void {
    localStorage.setItem('sa_token', token);
    localStorage.setItem('sa_user', JSON.stringify(user));
  }
  
  static clearAuth(): void {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
  }
  
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user && (user.role === 'admin' || user.role === 'superAdmin'));
  }
}

// Navigation utilities
export class NavigationUtils {
  static getNavigationItems(): NavigationItem[] {
    return [
      {
        id: 'overview',
        name: 'Overview',
        icon: 'chart-bar',
      },
      {
        id: 'companies',
        name: 'Companies',
        icon: 'building',
      },
      {
        id: 'public-banks',
        name: 'Public Banks',
        icon: 'database',
      },
      {
        id: 'transactions',
        name: 'Transactions',
        icon: 'credit-card',
      },
      {
        id: 'audit',
        name: 'Audit Logs',
        icon: 'document-text',
      },
    ];
  }
}

// Format utilities
export class FormatUtils {
  static formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }
  
  static formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString();
  }
  
  static formatNumber(num: number): string {
    return num.toLocaleString();
  }
  
  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

// Notification utilities
export class NotificationUtils {
  static show(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    // This would integrate with your notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
  
  static success(message: string): void {
    this.show(message, 'success');
  }
  
  static error(message: string): void {
    this.show(message, 'error');
  }
  
  static warning(message: string): void {
    this.show(message, 'warning');
  }
  
  static info(message: string): void {
    this.show(message, 'info');
  }
}

// Export types
export type { NavigationItem, Stats, Activity, Notification, ApiResponse };