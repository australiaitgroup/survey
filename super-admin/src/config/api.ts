// API配置文件
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
    // 认证相关
    LOGIN: `${API_BASE_URL}/api/sa/login`,

    // Super Admin API
    SA_STATS: `${API_BASE_URL}/api/sa/stats`,
    SA_COMPANIES: `${API_BASE_URL}/api/sa/companies`,
    SA_USERS: `${API_BASE_URL}/api/sa/users`,
    SA_PUBLIC_BANKS: `${API_BASE_URL}/api/sa/public-banks`,
    SA_TRANSACTIONS: `${API_BASE_URL}/api/sa/transactions`,
    SA_AUDIT_LOGS: `${API_BASE_URL}/api/sa/audit-logs`,
};

export default API_ENDPOINTS;
