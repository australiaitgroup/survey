import { ApiResponse } from '../types';
import { PublicBank, Question, BankUsageData, PublicBankFormData } from '../types/publicBanks';

export class PublicBanksAPI {
	private baseURL = '/api';

	private getHeaders(): HeadersInit {
		const token = localStorage.getItem('superAdminToken') || localStorage.getItem('sa_token');
		return {
			'Content-Type': 'application/json',
			Authorization: token ? `Bearer ${token}` : '',
		};
	}

	async getPublicBanks(
		params: any
	): Promise<ApiResponse<{ banks: PublicBank[]; total: number; pages: number }>> {
		const queryString = new URLSearchParams(params).toString();
		const response = await fetch(
			`${this.baseURL}/sa/public-banks${queryString ? '?' + queryString : ''}`,
			{
				headers: this.getHeaders(),
			}
		);
		return response.json();
	}

	async getPublicBank(id: string): Promise<ApiResponse<PublicBank>> {
		const response = await fetch(`${this.baseURL}/sa/public-banks/${id}`, {
			headers: this.getHeaders(),
		});
		return response.json();
	}

	async createPublicBank(data: PublicBankFormData): Promise<ApiResponse<PublicBank>> {
		const response = await fetch(`${this.baseURL}/sa/public-banks`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async updatePublicBank(
		id: string,
		data: Partial<PublicBankFormData>
	): Promise<ApiResponse<PublicBank>> {
		const response = await fetch(`${this.baseURL}/sa/public-banks/${id}`, {
			method: 'PUT',
			headers: this.getHeaders(),
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async deletePublicBank(id: string): Promise<ApiResponse<void>> {
		const response = await fetch(`${this.baseURL}/sa/public-banks/${id}`, {
			method: 'DELETE',
			headers: this.getHeaders(),
		});
		return response.json();
	}

	async getPublicBankUsage(id: string): Promise<ApiResponse<BankUsageData>> {
		const response = await fetch(`${this.baseURL}/sa/public-banks/${id}/usage`, {
			headers: this.getHeaders(),
		});
		return response.json();
	}

	async getPublicBankQuestions(
		bankId: string,
		params: any
	): Promise<ApiResponse<{ questions: Question[]; total: number; pages: number }>> {
		const queryString = new URLSearchParams(params).toString();
		const response = await fetch(
			`${this.baseURL}/sa/public-banks/${bankId}/questions${queryString ? '?' + queryString : ''}`,
			{
				headers: this.getHeaders(),
			}
		);
		return response.json();
	}

	async addPublicBankQuestion(
		bankId: string,
		question: Question
	): Promise<ApiResponse<Question>> {
		const response = await fetch(`${this.baseURL}/sa/public-banks/${bankId}/questions`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify(question),
		});
		return response.json();
	}

	async updatePublicBankQuestion(
		bankId: string,
		questionIndex: number,
		question: Partial<Question>
	): Promise<ApiResponse<Question>> {
		const response = await fetch(
			`${this.baseURL}/sa/public-banks/${bankId}/questions/${questionIndex}`,
			{
				method: 'PUT',
				headers: this.getHeaders(),
				body: JSON.stringify(question),
			}
		);
		return response.json();
	}

	async deletePublicBankQuestion(
		bankId: string,
		questionIndex: number
	): Promise<ApiResponse<void>> {
		const response = await fetch(
			`${this.baseURL}/sa/public-banks/${bankId}/questions/${questionIndex}`,
			{
				method: 'DELETE',
				headers: this.getHeaders(),
			}
		);
		return response.json();
	}

	async duplicatePublicBankQuestion(
		bankId: string,
		questionIndex: number
	): Promise<ApiResponse<Question>> {
		const response = await fetch(
			`${this.baseURL}/sa/public-banks/${bankId}/questions/${questionIndex}/duplicate`,
			{
				method: 'POST',
				headers: this.getHeaders(),
			}
		);
		return response.json();
	}

	async importPublicBankCSV(
		bankId: string,
		formData: FormData
	): Promise<ApiResponse<{ imported: number; failed: number; errors?: string[] }>> {
		const token = localStorage.getItem('sa_token');
		const response = await fetch(`${this.baseURL}/sa/public-banks/${bankId}/import-csv`, {
			method: 'POST',
			headers: {
				Authorization: token ? `Bearer ${token}` : '',
			},
			body: formData,
		});
		return response.json();
	}

	async exportPublicBankCSV(
		bankId: string
	): Promise<{ success: boolean; filename?: string; error?: string }> {
		try {
			const response = await fetch(`${this.baseURL}/sa/public-banks/${bankId}/export-csv`, {
				headers: this.getHeaders(),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { success: false, error: errorData.error || 'Export failed' };
			}

			const csvData = await response.text();
			const contentDisposition = response.headers.get('Content-Disposition');
			let filename = 'questions.csv';

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="(.+)"/);
				if (match) {
					filename = match[1];
				}
			}

			// Create blob and download
			const blob = new Blob([csvData], { type: 'text/csv' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			return { success: true, filename };
		} catch (error) {
			console.error('CSV export error:', error);
			return { success: false, error: 'Export failed' };
		}
	}
}
