// Types for Companies feature

export interface Company {
	_id: string;
	name: string;
	email: string;
	domain?: string;
	industry?: string;
	size?: string;
	status: 'active' | 'suspended' | 'inactive';
	subscriptionStatus?: string;
	planType?: string;
	userCount: number;
	surveyCount: number;
	responseCount: number;
	createdAt: string;
	updatedAt: string;
	lastActivityAt?: string;
	metadata?: Record<string, any>;
}

export interface CompanyFormData {
	name: string;
	email: string;
	domain?: string;
	industry?: string;
	size?: string;
	status: 'active' | 'suspended' | 'inactive';
}

export interface CompanyStats {
	totalUsers: number;
	activeUsers: number;
	totalSurveys: number;
	activeSurveys: number;
	totalResponses: number;
	averageResponseRate: number;
	lastActivity?: string;
}

export interface CompanyUser {
	_id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	lastLoginAt?: string;
	createdAt: string;
}
