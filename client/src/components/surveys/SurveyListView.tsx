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

	console.log('SurveyListView - surveys:', surveys, 'loading:', loading, 'error:', error);

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
			<div className='text-center py-8 text-gray-500'>
				<p>No surveys created yet.</p>
				<p className='text-sm mt-2'>Create your first survey to get started.</p>
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
						<option value={SURVEY_TYPE.QUIZ}>Quiz</option>
						<option value={SURVEY_TYPE.IQ}>IQ</option>
					</select>
					<select
						className='input-field w-auto min-w-[140px] md:min-w-[180px] px-2 py-1 text-sm h-8 shrink-0'
						value={sortBy}
						onChange={e => setSortBy(e.target.value as any)}
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
