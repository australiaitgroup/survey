import React from 'react';
import { useSurveys } from '../../hooks/useSurveys';
import SurveyCard from './SurveyCard';
import { SURVEY_STATUS, SURVEY_TYPE } from '../../constants';

const SurveyListView: React.FC = () => {
	const { surveys, error, loading } = useSurveys();
	// Filtering and sorting hooks must be declared unconditionally
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState<string>('');
	const [type, setType] = React.useState<string>('');
	const [sortBy, setSortBy] = React.useState<
		'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'title_desc'
	>('createdAt_desc');

	const filtered = React.useMemo(() => {
		const q = query.trim().toLowerCase();
		let list = [...(surveys || [])];
		if (q) {
			list = list.filter(s =>
				[s.title, s.description, s.slug]
					.filter(Boolean)
					.some(v => String(v).toLowerCase().includes(q))
			);
		}
		if (status) list = list.filter(s => s.status === status);
		if (type) list = list.filter(s => s.type === type);

		switch (sortBy) {
			case 'createdAt_asc':
				list.sort(
					(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
				break;
			case 'title_asc':
				list.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case 'title_desc':
				list.sort((a, b) => b.title.localeCompare(a.title));
				break;
			default:
				list.sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
		return list;
	}, [surveys, query, status, type, sortBy]);

	if (loading) {
		return (
			<div className='text-center py-8 text-gray-500'>
				<p>Loading surveys...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='text-center py-8 text-red-500'>
				<p>Error: {error}</p>
			</div>
		);
	}

	if (!surveys || surveys.length === 0) {
		return (
			<div className='space-y-8'>
				{/* Hero Card */}
				<div className='bg-white rounded-xl shadow-lg p-8 text-center'>
					<div className='mb-6'>
						<h2 className='text-3xl font-bold text-gray-900 mb-2'>Welcome to SigmaQ</h2>
						<p className='text-lg text-gray-600'>Create your first assessment in 3 steps.</p>
					</div>
					<div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
						<button
							className='btn-primary px-6 py-3 text-lg font-medium'
							onClick={() => {
								// TODO: Open lightweight create wizard
								console.log('TODO: Open create survey wizard');
							}}
						>
							Create your first survey
						</button>
						<button
							className='btn-secondary px-6 py-3 text-lg font-medium'
							onClick={() => {
								// TODO: Navigate to Question Banks > Marketplace with return URL
								console.log('TODO: Navigate to marketplace');
							}}
						>
							Use a public bank
						</button>
					</div>
				</div>

				{/* Quick Start Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					<div className='bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer'
						onClick={() => {
							// TODO: Navigate to create survey
							console.log('TODO: Navigate to create survey');
						}}
					>
						<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
							<svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
							</svg>
						</div>
						<h3 className='text-lg font-semibold text-gray-900 text-center mb-2'>Create Survey</h3>
						<p className='text-sm text-gray-600 text-center'>Build custom assessments with our intuitive editor</p>
					</div>

					<div className='bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer'
						onClick={() => {
							// TODO: Navigate to public banks
							console.log('TODO: Navigate to public banks');
						}}
					>
						<div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
							<svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
							</svg>
						</div>
						<h3 className='text-lg font-semibold text-gray-900 text-center mb-2'>Connect Public Banks</h3>
						<p className='text-sm text-gray-600 text-center'>Access pre-built question libraries from our marketplace</p>
					</div>

					<div className='bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer'
						onClick={() => {
							// TODO: Navigate to import CSV
							console.log('TODO: Navigate to import CSV');
						}}
					>
						<div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
							<svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' />
							</svg>
						</div>
						<h3 className='text-lg font-semibold text-gray-900 text-center mb-2'>Import CSV</h3>
						<p className='text-sm text-gray-600 text-center'>Upload existing questions from spreadsheets</p>
					</div>

					<div className='bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer'
						onClick={() => {
							// TODO: Navigate to samples
							console.log('TODO: Navigate to explore samples');
						}}
					>
						<div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
							<svg className='w-6 h-6 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
							</svg>
						</div>
						<h3 className='text-lg font-semibold text-gray-900 text-center mb-2'>Explore Samples</h3>
						<p className='text-sm text-gray-600 text-center'>Browse example assessments to get inspired</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Filters */}
			<div className='bg-gray-50 rounded-lg p-3'>
				<div className='flex flex-wrap items-center gap-2'>
					<input
						className='input-field flex-1 min-w-[160px] md:min-w-[240px] px-2 py-1 text-sm h-8'
						placeholder='Search by title/description/slug'
						value={query}
						onChange={e => setQuery(e.target.value)}
					/>
					<select
						className='input-field w-auto min-w-[120px] sm:min-w-[140px] md:min-w-[160px] px-2 py-1 text-sm h-8 shrink-0'
						value={status}
						onChange={e => setStatus(e.target.value)}
					>
						<option value=''>All statuses</option>
						<option value={SURVEY_STATUS.DRAFT}>Draft</option>
						<option value={SURVEY_STATUS.ACTIVE}>Active</option>
						<option value={SURVEY_STATUS.CLOSED}>Closed</option>
					</select>
					<select
						className='input-field w-auto min-w-[120px] sm:min-w-[140px] md:min-w-[160px] px-2 py-1 text-sm h-8 shrink-0'
						value={type}
						onChange={e => setType(e.target.value)}
					>
						<option value=''>All types</option>
						<option value={SURVEY_TYPE.SURVEY}>Survey</option>
						<option value={SURVEY_TYPE.ASSESSMENT}>Assessment</option>
						<option value={SURVEY_TYPE.ONBOARDING}>Onboarding</option>
						<option value={SURVEY_TYPE.LIVE_QUIZ}>Kahoot (Live Quiz)</option>
					</select>
					<select
						className='input-field w-auto min-w-[140px] md:min-w-[180px] px-2 py-1 text-sm h-8 shrink-0'
						value={sortBy}
						onChange={e => setSortBy(e.target.value as 'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'title_desc')}
					>
						<option value='createdAt_desc'>Newest first</option>
						<option value='createdAt_asc'>Oldest first</option>
						<option value='title_asc'>Title A→Z</option>
						<option value='title_desc'>Title Z→A</option>
					</select>
				</div>
			</div>

			{/* List */}
			{filtered.length === 0 ? (
				<div className='text-center py-8 text-gray-500'>
					No surveys match current filters.
				</div>
			) : (
				filtered.map((survey, index) => (
					<SurveyCard key={survey?._id || `survey-${index}`} survey={survey} />
				))
			)}
		</div>
	);
};

export default SurveyListView;
