import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

export interface RecommendedBank {
	_id: string;
	title: string;
	description: string;
	tags: string[];
	questionCount: number;
	lastUpdated: string;
	type: 'FREE' | 'PAID';
	price?: number;
	entitlement: string;
}

export interface RecommendationsData {
	recommendations: RecommendedBank[];
	total: number;
}

export const usePublicBankRecommendations = (limit: number = 3) => {
	const [data, setData] = useState<RecommendationsData>({
		recommendations: [],
		total: 0,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchRecommendations = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await api.get(`/public-banks/recommendations?limit=${limit}`);
			setData(response.data);
		} catch (err: any) {
			console.error('Error fetching recommendations:', err);
			setError(err.response?.data?.error || 'Failed to fetch recommendations');

			// Set empty data on error
			setData({
				recommendations: [],
				total: 0,
			});
		} finally {
			setLoading(false);
		}
	}, [limit]);

	useEffect(() => {
		fetchRecommendations();
	}, [fetchRecommendations]);

	return {
		...data,
		loading,
		error,
		refresh: fetchRecommendations,
	};
};
