import React from 'react';
import { useTranslation } from 'react-i18next';
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
        status,
        sortBy,
        page,
        pageSize,
        total,
        totalPages,
        setQuery,
        setStatus,
        setSortBy,
        setPage,
        setPageSize,
        createCollection,
        deleteCollection,
        duplicateCollection,
    } = useCollections();
    const navigate = useNavigate();
    const [showModal, setShowModal] = React.useState(false);
    const [editing, setEditing] = React.useState(null as any);

    React.useEffect(() => {
        i18n.loadNamespaces(['admin']);
    }, [i18n]);

    return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
                <h2 className='text-xl font-semibold text-gray-800'>{t('collections.title')}</h2>
                <button className='btn-primary' onClick={() => { setEditing(null); setShowModal(true); }}>
                    {t('collections.createButton')}
                </button>
			</div>

            {/* Intro */}
            <div className='bg-gray-50 rounded-md p-3 text-sm text-gray-600'>
                {t('collections.intro')}
            </div>

            {/* Controls */}
            <div className='bg-gray-50 rounded-lg p-3'>
                <div className='flex flex-wrap items-center gap-2'>
                    <input className='input-field flex-1 min-w-[160px] md:min-w-[240px] px-2 py-1 text-sm h-8' placeholder={t('collections.searchPlaceholder')} defaultValue={query} onChange={e => setQuery(e.target.value)} />
                    <select className='input-field w-auto min-w-[140px] md:min-w-[160px] px-2 py-1 text-sm h-8 shrink-0' value={status} onChange={e => setStatus(e.target.value as any)}>
                        <option value=''>{t('collections.filters.all')}</option>
                        <option value='active'>{t('collections.filters.active')}</option>
                        <option value='draft'>{t('collections.filters.draft')}</option>
                        <option value='archived'>{t('collections.filters.archived')}</option>
                    </select>
                    <select className='input-field w-auto min-w-[140px] md:min-w-[180px] px-2 py-1 text-sm h-8 shrink-0' value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                        <option value='createdAt_desc'>{t('collections.sort.newest')}</option>
                        <option value='lastActivity_desc'>{t('collections.sort.lastActivity')}</option>
                        <option value='name_asc'>{t('collections.sort.az')}</option>
                    </select>
                </div>
            </div>

            {loading && <div className='text-center py-8 text-gray-500'>{i18n.t('common.loading', { ns: 'translation' })}</div>}
            {error && <div className='text-center py-8 text-red-500'>{error}</div>}

            {/* List or Empty */}
            {!loading && collections.length === 0 ? (
                <div className='bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm'>
                    <div className='mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4'>
                        <svg className='w-6 h-6 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7h18M3 12h18M3 17h18' />
                        </svg>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900'>{t('collections.empty.title')}</h3>
                    <p className='text-sm text-gray-500 mt-2'>{t('collections.empty.description')}</p>
                    <div className='mt-6'>
                        <button className='btn-primary' onClick={() => { setEditing(null); setShowModal(true); }}>
                            {t('collections.createButton')}
                        </button>
                    </div>
                </div>
            ) : items.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                    {t('collections.noMatch', 'No collections match current filters.')}
                </div>
            ) : (
                <div className='space-y-4'>
                    {items.map(c => (
                        <div key={c._id} className='card hover:shadow-lg transition-shadow'>
                            <div className='flex justify-between items-start gap-4'>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex flex-wrap items-center gap-2 mb-2'>
                                        <h3 className='text-base sm:text-lg font-bold text-gray-800 cursor-pointer hover:text-[#FF5A5F]' onClick={() => navigate(`/admin/collections/${c._id}`)}>{c.name}</h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-800' : c.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>
                                            {c.status === 'active' ? t('collections.status.active') : c.status === 'draft' ? t('collections.status.draft') : t('collections.status.archived')}
                                        </span>
                                    </div>
                                    <p className='text-gray-600 mb-2 text-sm'>{c.description || t('collections.noDescription')}</p>
                                    <div className='flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500'>
                                        <span>{c.surveyIds?.length || 0} {t('collections.meta.surveys')}</span>
                                        <span className='hidden sm:inline'>{t('collections.meta.created')}: {new Date(c.createdAt).toLocaleDateString()}</span>
                                        <span className='hidden md:inline'>{t('collections.meta.updated')}: {new Date(c.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className='flex flex-col sm:flex-row gap-2 flex-shrink-0'>
                                    <button className='btn-primary btn-small' onClick={() => { setEditing(c); setShowModal(true); }}>{t('collections.actions.manage', 'Manage')}</button>
                                    <button className='btn-outline btn-small' onClick={() => duplicateCollection(c._id)}>{i18n.t('buttons.duplicate', { ns: 'translation', defaultValue: 'Duplicate' })}</button>
                                    <button className='btn-outline btn-small text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500' onClick={() => deleteCollection(c._id)}>{i18n.t('buttons.delete', { ns: 'translation', defaultValue: 'Delete' })}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <CollectionModal open={showModal} onClose={() => setShowModal(false)} collection={editing} onSaved={() => setShowModal(false)} />
            )}
		</div>
	);
};

export default CollectionsListView;
