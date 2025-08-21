import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Survey } from '../../types/api';

interface SelectSurveysModalProps {
	open: boolean;
	onClose: () => void;
	surveys: Survey[];
	selectedIds: string[];
	onSave: (ids: string[]) => void;
}

const SelectSurveysModal: React.FC<SelectSurveysModalProps> = ({
	open,
	onClose,
	surveys,
	selectedIds,
	onSave,
}) => {
	const { t } = useTranslation(['admin', 'translation']);
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [localSelected, setLocalSelected] = useState<string[]>(selectedIds || []);

	if (!open) return null;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		let list = [...(surveys || [])];
		if (q)
			list = list.filter(s =>
				[s.title, (s as any).description]
					.filter(Boolean)
					.some(v => String(v).toLowerCase().includes(q))
			);
		return list;
	}, [surveys, search]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const currentPage = Math.min(page, totalPages);
	const pageItems = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filtered.slice(start, start + pageSize);
	}, [filtered, currentPage, pageSize]);

	const toggle = (id: string) => {
		setLocalSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
	};

	const handleSave = () => onSave(localSelected);

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
			<div className='bg-white rounded-xl shadow-xl w-full max-w-4xl p-4 sm:p-6'>
				<div className='flex items-start justify-between gap-4'>
					<div>
						<h3 className='text-lg font-semibold'>
							{t('admin:collections.addSurveys', 'Add Surveys')}
						</h3>
						<p className='text-xs text-gray-500 mt-1'>
							{t(
								'admin:collections.addSurveysHint',
								'Select multiple surveys to add to this collection. Your surveys will not be affected.'
							)}
						</p>
					</div>
					<button className='btn-outline btn-small' onClick={onClose}>
						{t('translation:buttons.close', 'Close')}
					</button>
				</div>

				<div className='space-y-3 mt-4'>
					<div className='flex flex-wrap items-center gap-2 justify-between'>
						<input
							className='input-field flex-1 min-w-[200px] h-9'
							placeholder={t(
								'admin:collections.searchSurveys',
								'Search surveys/assessments'
							)}
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						<div className='flex items-center gap-2 text-xs text-gray-500'>
							<span>
								{t('admin:collections.selectedCount', {
									count: localSelected.length,
									defaultValue: 'Selected ({{count}})',
								})}
							</span>
							<button
								className='underline text-gray-500 hover:text-gray-700'
								onClick={() => setLocalSelected([])}
							>
								{t('translation:buttons.clear', 'Clear')}
							</button>
							<select
								className='input-field h-9 text-sm'
								value={pageSize}
								onChange={e => {
									setPageSize(parseInt(e.target.value, 10));
									setPage(1);
								}}
							>
								<option value={10}>10</option>
								<option value={20}>20</option>
								<option value={50}>50</option>
							</select>
							<div className='flex items-center gap-1'>
								<button
									className='btn-outline btn-small'
									disabled={currentPage <= 1}
									onClick={() => setPage(currentPage - 1)}
								>
									{t('translation:buttons.previous', 'Previous')}
								</button>
								<button
									className='btn-outline btn-small'
									disabled={currentPage >= totalPages}
									onClick={() => setPage(currentPage + 1)}
								>
									{t('translation:buttons.next', 'Next')}
								</button>
							</div>
						</div>
					</div>

					<div className='max-h-[480px] overflow-auto pr-1'>
						<div className='space-y-2'>
							{pageItems.map(s => (
								<label
									key={s._id}
									className='flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:shadow-sm cursor-pointer transition'
								>
									<div className='min-w-0'>
										<div className='flex items-center gap-3'>
											<input
												type='checkbox'
												className='mt-0.5'
												checked={localSelected.includes(s._id)}
												onChange={() => toggle(s._id)}
											/>
											<span className='font-medium text-sm text-gray-900 truncate'>
												{s.title}
											</span>
											<span
												className={`px-2 py-0.5 text-[10px] rounded-full ${s.type === 'survey' ? 'bg-blue-100 text-blue-800' : s.type === 'assessment' ? 'bg-green-100 text-green-800' : s.type === 'quiz' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}
											>
												{s.type}
											</span>
											<span
												className={`px-2 py-0.5 text-[10px] rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : s.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
											>
												{s.status}
											</span>
										</div>
										<p className='text-xs text-gray-500 mt-1 line-clamp-1'>
											{(s as any).description}
										</p>
									</div>
								</label>
							))}
							{pageItems.length === 0 && (
								<div className='p-6 text-center text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg'>
									{t('admin:collections.noSurveys', 'No surveys found')}
								</div>
							)}
						</div>
					</div>

					<div className='flex justify-end gap-2 pt-2'>
						<button className='btn-outline' onClick={onClose}>
							{t('translation:buttons.cancel', 'Cancel')}
						</button>
						<button className='btn-primary' onClick={handleSave}>
							{t('translation:buttons.save', 'Save')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SelectSurveysModal;
