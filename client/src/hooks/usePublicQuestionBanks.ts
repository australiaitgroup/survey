import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/axiosConfig';

export interface PublicQuestionBank {
	_id: string;
	title: string;
	description: string;
	tags: string[];
	questionCount: number;
	lastUpdated: string;
	type: 'FREE' | 'PAID';
	price?: number;
	entitlement: 'Owned' | 'Included' | 'Locked';
}

export interface PublicBanksParams {
	query?: string;
	type?: 'all' | 'free' | 'paid';
	tags?: string[];
	page?: number;
	pageSize?: number;
}

export interface PublicBanksResponse {
	banks: PublicQuestionBank[];
	totalCount: number;
	totalPages: number;
	currentPage: number;
	availableTags: string[];
}

export const usePublicQuestionBanks = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<PublicBanksResponse>({
		banks: [],
		totalCount: 0,
		totalPages: 0,
		currentPage: 1,
		availableTags: [],
	});

	// Debounce timer ref
	const debounceTimer = useRef<NodeJS.Timeout>();

	const fetchPublicBanks = useCallback(async (params: PublicBanksParams = {}) => {
		setLoading(true);
		setError(null);

		try {
			// Build query string
			const queryParams = new URLSearchParams();

			if (params.query) {
				queryParams.append('query', params.query);
			}

			if (params.type && params.type !== 'all') {
				queryParams.append('type', params.type);
			}

			if (params.tags && params.tags.length > 0) {
				params.tags.forEach(tag => queryParams.append('tag', tag));
			}

			queryParams.append('page', String(params.page || 1));
			queryParams.append('pageSize', String(params.pageSize || 12));

			const response = await api.get(`/public-banks?${queryParams.toString()}`);

			// Use the API response directly as it matches our expected format
			if (response.data && response.data.banks) {
				setData(response.data);
			} else {
				// Mock data for development
				const mockData: PublicBanksResponse = {
					banks: [
						{
							_id: '1',
							title: 'JavaScript Fundamentals',
							description:
								'Comprehensive question bank covering JavaScript basics including variables, functions, arrays, objects, and ES6+ features. Perfect for beginners and intermediate developers.',
							tags: ['JavaScript', 'Web Development', 'Programming'],
							questionCount: 150,
							lastUpdated: new Date().toISOString(),
							type: 'FREE',
							entitlement: 'Included',
						},
						{
							_id: '2',
							title: 'React Advanced Patterns',
							description:
								'Advanced React patterns including hooks, context, performance optimization, and architectural best practices for scalable applications.',
							tags: ['React', 'JavaScript', 'Frontend'],
							questionCount: 200,
							lastUpdated: new Date().toISOString(),
							type: 'PAID',
							price: 29.99,
							entitlement: 'Locked',
						},
						{
							_id: '3',
							title: 'Data Structures & Algorithms',
							description:
								'Essential computer science concepts covering arrays, linked lists, trees, graphs, sorting algorithms, and complexity analysis.',
							tags: ['Algorithms', 'Data Structures', 'Computer Science'],
							questionCount: 300,
							lastUpdated: new Date().toISOString(),
							type: 'PAID',
							price: 49.99,
							entitlement: 'Owned',
						},
						{
							_id: '4',
							title: 'Python Basics',
							description:
								'Introduction to Python programming language covering syntax, data types, control structures, and basic libraries.',
							tags: ['Python', 'Programming', 'Beginner'],
							questionCount: 120,
							lastUpdated: new Date().toISOString(),
							type: 'FREE',
							entitlement: 'Included',
						},
						{
							_id: '5',
							title: 'System Design Interview',
							description:
								'Prepare for system design interviews with questions on scalability, distributed systems, microservices, and architectural patterns.',
							tags: ['System Design', 'Architecture', 'Interview'],
							questionCount: 180,
							lastUpdated: new Date().toISOString(),
							type: 'PAID',
							price: 79.99,
							entitlement: 'Locked',
						},
						{
							_id: '6',
							title: 'SQL Mastery',
							description:
								'Master SQL with questions covering queries, joins, indexes, transactions, and database optimization techniques.',
							tags: ['SQL', 'Database', 'Backend'],
							questionCount: 250,
							lastUpdated: new Date().toISOString(),
							type: 'FREE',
							entitlement: 'Included',
						},
					],
					totalCount: 6,
					totalPages: 1,
					currentPage: 1,
					availableTags: [
						'JavaScript',
						'React',
						'Python',
						'SQL',
						'System Design',
						'Algorithms',
						'Data Structures',
						'Web Development',
						'Frontend',
						'Backend',
						'Database',
						'Programming',
						'Architecture',
						'Interview',
						'Computer Science',
						'Beginner',
					],
				};

				// Apply client-side filtering for mock data
				let filteredBanks = [...mockData.banks];

				if (params.query) {
					const searchTerm = params.query.toLowerCase();
					filteredBanks = filteredBanks.filter(
						bank =>
							bank.title.toLowerCase().includes(searchTerm) ||
							bank.description.toLowerCase().includes(searchTerm)
					);
				}

				if (params.type && params.type !== 'all') {
					filteredBanks = filteredBanks.filter(
						bank => bank.type.toLowerCase() === params.type
					);
				}

				if (params.tags && params.tags.length > 0) {
					filteredBanks = filteredBanks.filter(bank =>
						params.tags!.some(tag => bank.tags.includes(tag))
					);
				}

				// Apply pagination
				const page = params.page || 1;
				const pageSize = params.pageSize || 12;
				const startIndex = (page - 1) * pageSize;
				const endIndex = startIndex + pageSize;
				const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

				setData({
					banks: paginatedBanks,
					totalCount: filteredBanks.length,
					totalPages: Math.ceil(filteredBanks.length / pageSize),
					currentPage: page,
					availableTags: mockData.availableTags,
				});
			}
		} catch (err: any) {
			console.error('Error fetching public banks:', err);
			// Don't show error message if it's just an auth issue - gracefully fallback to mock data
			const isAuthError = err.response?.status === 401;
			if (!isAuthError) {
				setError(err.response?.data?.error || 'Failed to fetch marketplace data');
			}

			// Use mock data when API fails for development
			const mockData: PublicBanksResponse = {
				banks: [
					{
						_id: '1',
						title: 'JavaScript Fundamentals',
						description:
							'Comprehensive question bank covering JavaScript basics including variables, functions, arrays, objects, and ES6+ features. Perfect for beginners and intermediate developers.',
						tags: ['JavaScript', 'Web Development', 'Programming'],
						questionCount: 150,
						lastUpdated: new Date().toISOString(),
						type: 'FREE',
						entitlement: 'Included',
					},
					{
						_id: '2',
						title: 'React Advanced Patterns',
						description:
							'Advanced React patterns including hooks, context, performance optimization, and architectural best practices for scalable applications.',
						tags: ['React', 'JavaScript', 'Frontend'],
						questionCount: 200,
						lastUpdated: new Date().toISOString(),
						type: 'PAID',
						price: 29.99,
						entitlement: 'Locked',
					},
					{
						_id: '3',
						title: 'Data Structures & Algorithms',
						description:
							'Essential computer science concepts covering arrays, linked lists, trees, graphs, sorting algorithms, and complexity analysis.',
						tags: ['Algorithms', 'Data Structures', 'Computer Science'],
						questionCount: 300,
						lastUpdated: new Date().toISOString(),
						type: 'PAID',
						price: 49.99,
						entitlement: 'Owned',
					},
					{
						_id: '4',
						title: 'Python Basics',
						description:
							'Introduction to Python programming language covering syntax, data types, control structures, and basic libraries.',
						tags: ['Python', 'Programming', 'Beginner'],
						questionCount: 120,
						lastUpdated: new Date().toISOString(),
						type: 'FREE',
						entitlement: 'Included',
					},
					{
						_id: '5',
						title: 'System Design Interview',
						description:
							'Prepare for system design interviews with questions on scalability, distributed systems, microservices, and architectural patterns.',
						tags: ['System Design', 'Architecture', 'Interview'],
						questionCount: 180,
						lastUpdated: new Date().toISOString(),
						type: 'PAID',
						price: 79.99,
						entitlement: 'Locked',
					},
					{
						_id: '6',
						title: 'SQL Mastery',
						description:
							'Master SQL with questions covering queries, joins, indexes, transactions, and database optimization techniques.',
						tags: ['SQL', 'Database', 'Backend'],
						questionCount: 250,
						lastUpdated: new Date().toISOString(),
						type: 'FREE',
						entitlement: 'Included',
					},
				],
				totalCount: 6,
				totalPages: 1,
				currentPage: 1,
				availableTags: [
					'JavaScript',
					'React',
					'Python',
					'SQL',
					'System Design',
					'Algorithms',
					'Data Structures',
					'Web Development',
					'Frontend',
					'Backend',
					'Database',
					'Programming',
					'Architecture',
					'Interview',
					'Computer Science',
					'Beginner',
				],
			};

			// Apply client-side filtering for mock data
			let filteredBanks = [...mockData.banks];

			if (params.query) {
				const searchTerm = params.query.toLowerCase();
				filteredBanks = filteredBanks.filter(
					bank =>
						bank.title.toLowerCase().includes(searchTerm) ||
						bank.description.toLowerCase().includes(searchTerm)
				);
			}

			if (params.type && params.type !== 'all') {
				filteredBanks = filteredBanks.filter(
					bank => bank.type.toLowerCase() === params.type
				);
			}

			if (params.tags && params.tags.length > 0) {
				filteredBanks = filteredBanks.filter(bank =>
					params.tags!.some(tag => bank.tags.includes(tag))
				);
			}

			// Apply pagination
			const page = params.page || 1;
			const pageSize = params.pageSize || 12;
			const startIndex = (page - 1) * pageSize;
			const endIndex = startIndex + pageSize;
			const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

			setData({
				banks: paginatedBanks,
				totalCount: filteredBanks.length,
				totalPages: Math.ceil(filteredBanks.length / pageSize),
				currentPage: page,
				availableTags: mockData.availableTags,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	// Debounced search function
	const searchPublicBanks = useCallback(
		(params: PublicBanksParams) => {
			// Clear existing timer
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}

			// Set new timer for debounced search
			debounceTimer.current = setTimeout(() => {
				fetchPublicBanks(params);
			}, 300);
		},
		[fetchPublicBanks]
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}
		};
	}, []);

	return {
		data,
		loading,
		error,
		fetchPublicBanks,
		searchPublicBanks,
	};
};
