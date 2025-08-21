import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

export interface PublicBankForSurvey {
	_id: string;
	name: string;
	title: string;
	description: string;
	tags: string[];
	questionCount: number;
	questions: { _id: string }[]; // Placeholder for compatibility
	lastUpdated: string;
	type: 'FREE' | 'PAID';
	price?: number;
	accessType: 'Free' | 'Owned' | 'Subscription' | 'Locked';
	isPublic: true;
	lockReason?: 'purchase_required' | 'access_required';
}

export interface PublicBanksForSurveyData {
	authorized: PublicBankForSurvey[];
	locked: PublicBankForSurvey[];
	totalAuthorized: number;
	totalLocked: number;
}

export const usePublicBanksForSurvey = () => {
	const [data, setData] = useState<PublicBanksForSurveyData>({
		authorized: [],
		locked: [],
		totalAuthorized: 0,
		totalLocked: 0,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPublicBanks = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await api.get('/public-banks/for-survey');
			setData(response.data);
		} catch (err: any) {
			console.error('Error fetching public banks for survey:', err);
			setError(err.response?.data?.error || 'Failed to fetch public banks');

			// Set empty data on error
			setData({
				authorized: [],
				locked: [],
				totalAuthorized: 0,
				totalLocked: 0,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPublicBanks();
	}, [fetchPublicBanks]);

	return {
		...data,
		loading,
		error,
		refresh: fetchPublicBanks,
	};
};
