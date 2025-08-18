import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import {
	FolderIcon as FolderSolidIcon,
	FolderOpenIcon as FolderOpenSolidIcon,
} from '@heroicons/react/24/solid';
import { useCollections } from '../../hooks/useCollections';
import CollectionModal from './CollectionModal';
import { useNavigate } from 'react-router-dom';

const CollectionsListView: React.FC = () => {
	const { t, i18n } = useTranslation('admin');
	const {
		items,
		collections,
		loading,
		error,
		query,
		sortBy,
		setQuery,
		setSortBy,
		createCollection,
		updateCollection,
		deleteCollection,
		duplicateCollection,
	} = useCollections();
	const navigate = useNavigate();
	const [showModal, setShowModal] = React.useState(false);
	const [editing, setEditing] = React.useState(null as any);
	const [hoveredId, setHoveredId] = React.useState<string | null>(null);

	React.useEffect(() => {
		const loadNamespace = async () => {
			try {
				await i18n.loadNamespaces(['admin']);
				i18n.reloadResources(['admin']);
				// Debug logs disabled in production
			} catch (error) {
				console.error('Failed to load admin namespace:', error);
			}
		};
		loadNamespace();
	}, [i18n, t]);

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<h2 className='text-xl font-semibold text-gray-800'>
					{t('collections.title', 'Collections')}
				</h2>
				<button
					className='btn-primary'
					onClick={() => {
						setEditing(null);
						setShowModal(true);
					}}
				>
					{t('collections.createButton', 'Create Collection')}
				</button>
			</div>

			{/* Intro */}
			<div className='bg-gray-50 rounded-md p-3 text-sm text-gray-600'>
				{t(
					'collections.intro',
					'Organize related surveys into reusable groups for better management and quick access.'
				)}
			</div>

			{/* Controls */}
			<div className='bg-gray-50 rounded-lg p-3'>
				<div className='flex flex-wrap items-center gap-2'>
					<input
						className='input-field flex-1 min-w-[160px] md:min-w-[240px] px-2 py-1 text-sm h-8'
						placeholder={t(
							'collections.searchPlaceholder',
							'Search by name or description...'
						)}
						defaultValue={query}
						onChange={e => setQuery(e.target.value)}
					/>
					<select
						className='input-field w-auto min-w-[140px] md:min-w-[180px] px-2 py-1 text-sm h-8 shrink-0'
						value={sortBy}
						onChange={e => setSortBy(e.target.value as any)}
					>
						<option value='createdAt_desc'>
							{t('collections.sort.newest', 'Newest')}
						</option>
						<option value='lastActivity_desc'>
							{t('collections.sort.lastActivity', 'Last activity')}
						</option>
						<option value='name_asc'>{t('collections.sort.az', 'A–Z')}</option>
					</select>
				</div>
			</div>

			{loading && (
				<div className='text-center py-8 text-gray-500'>
					{i18n.t('common.loading', { ns: 'translation' })}
				</div>
			)}
			{error && <div className='text-center py-8 text-red-500'>{error}</div>}

			{/* List or Empty */}
			{!loading && collections.length === 0 ? (
				<motion.div
					className='bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
				>
					<motion.div
						className='mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4'
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.15, delay: 0.1 }}
					>
						<FolderIcon className='w-8 h-8 text-gray-400' />
					</motion.div>
					<h3 className='text-lg font-medium text-gray-900'>
						{t('collections.empty.title', 'No project folders yet')}
					</h3>
					<p className='text-sm text-gray-500 mt-2'>
						{t(
							'collections.empty.description',
							'Create project folders to organize your surveys and assessments into manageable collections.'
						)}
					</p>
					<div className='mt-6'>
						<button
							className='btn-primary'
							onClick={() => {
								setEditing(null);
								setShowModal(true);
							}}
						>
							{t('collections.createButton', 'Create Collection')}
						</button>
					</div>
				</motion.div>
			) : items.length === 0 ? (
				<div className='text-center py-8 text-gray-500'>
					{t('collections.noMatch', 'No collections match current filters.')}
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
					{items.map((c, index) => (
						<motion.div
							key={c._id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.15, delay: index * 0.03 }}
							whileHover={{ y: -2 }}
							className='group'
						>
							<div
								className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-150 cursor-pointer relative overflow-hidden'
								onMouseEnter={() => setHoveredId(c._id)}
								onMouseLeave={() => setHoveredId(null)}
								onClick={() => navigate(`/admin/collections/${c._id}`)}
							>
								{/* Folder Icon */}
								<div className='flex items-center justify-center mb-4'>
									<motion.div
										initial={false}
										animate={{
											scale: hoveredId === c._id ? 1.1 : 1,
										}}
										transition={{ duration: 0.1 }}
									>
										{(() => {
											const hasItems = (c.surveyIds?.length || 0) > 0;
											const isHovered = hoveredId === c._id;

											if (hasItems) {
												// Has files - use solid icons with richer colors
												return isHovered ? (
													<FolderOpenSolidIcon className='w-16 h-16 text-amber-500' />
												) : (
													<FolderSolidIcon className='w-16 h-16 text-amber-400' />
												);
											} else {
												// Empty - use outline icons with muted colors
												return isHovered ? (
													<FolderOpenIcon className='w-16 h-16 text-gray-400' />
												) : (
													<FolderIcon className='w-16 h-16 text-gray-300' />
												);
											}
										})()}
									</motion.div>
								</div>

								{/* Collection Info */}
								<div className='text-center'>
									<h3 className='font-semibold text-gray-800 text-sm mb-2 line-clamp-1'>
										{c.name}
									</h3>
									<p className='text-xs text-gray-500 mb-3 line-clamp-2 h-8'>
										{c.description ||
											t('collections.noDescription', 'No description')}
									</p>
									<div
										className={`text-xs mb-4 flex items-center justify-center gap-1 ${
											(c.surveyIds?.length || 0) > 0
												? 'text-amber-600'
												: 'text-gray-400'
										}`}
									>
										{(c.surveyIds?.length || 0) > 0 ? (
											<>
												<svg
													className='w-3 h-3'
													fill='currentColor'
													viewBox='0 0 20 20'
												>
													<path
														fillRule='evenodd'
														d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z'
														clipRule='evenodd'
													/>
												</svg>
												<span>
													{c.surveyIds?.length}{' '}
													{c.surveyIds?.length === 1
														? 'survey'
														: 'surveys'}
												</span>
											</>
										) : (
											<span>Empty folder</span>
										)}
									</div>
								</div>

								{/* Action Buttons */}
								<div
									className='opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white via-white to-transparent'
									onClick={e => e.stopPropagation()}
								>
									<div className='flex gap-1 justify-center'>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className='btn-primary btn-small text-xs px-2 py-1'
											onClick={() => {
												setEditing(c);
												setShowModal(true);
											}}
										>
											{t('collections.actions.manage', 'Manage')}
										</motion.button>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className='btn-outline btn-small text-xs px-2 py-1'
											onClick={() => duplicateCollection(c._id)}
										>
											{i18n.t('buttons.duplicate', {
												ns: 'translation',
												defaultValue: 'Duplicate',
											})}
										</motion.button>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className='btn-outline btn-small text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500'
											onClick={() => deleteCollection(c._id)}
										>
											{i18n.t('buttons.delete', {
												ns: 'translation',
												defaultValue: 'Delete',
											})}
										</motion.button>
									</div>
								</div>

								{/* Hover Effect Background */}
								<motion.div
									className={`absolute inset-0 pointer-events-none ${
										(c.surveyIds?.length || 0) > 0
											? 'bg-gradient-to-br from-amber-50/30 to-orange-50/30'
											: 'bg-gradient-to-br from-gray-50/30 to-gray-100/30'
									}`}
									initial={{ opacity: 0 }}
									animate={{ opacity: hoveredId === c._id ? 1 : 0 }}
									transition={{ duration: 0.1 }}
								/>
							</div>
						</motion.div>
					))}
				</div>
			)}

			{/* Modal */}
			{showModal && (
				<CollectionModal
					open={showModal}
					onClose={() => setShowModal(false)}
					collection={editing}
					onSaved={() => setShowModal(false)}
					collectionsApi={{
						createCollection,
						updateCollection,
					}}
				/>
			)}
		</div>
	);
};

export default CollectionsListView;
