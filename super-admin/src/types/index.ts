// Common types used across super admin
export interface User {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'superAdmin';
	company?: string;
}

export interface PaginationParams {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface FilterParams {
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	[key: string]: any;
}
