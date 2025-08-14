import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { Collection, Survey } from '../../types/api';
import CollectionModal from './CollectionModal';
import SelectSurveysModal from './SelectSurveysModal';

interface Stats {
  totalSurveys: number;
  totalQuestions: number;
  totalResponses: number;
  lastActivity?: string | null;
}

const CollectionDetailView: React.FC = () => {
  const { t, i18n } = useTranslation('admin');

  useEffect(() => {
    const loadNamespace = async () => {
      try {
        await i18n.loadNamespaces(['admin']);
        i18n.reloadResources(['admin']);
      } catch (error) {
        console.error('Failed to load admin namespace:', error);
      }
    };
    loadNamespace();
  }, [i18n]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const [colRes, statsRes, allRes] = await Promise.all([
        api.get(`/collections/${id}`),
        api.get(`/collections/${id}/stats`),
        api.get('/admin/surveys'),
      ]);
      const col: Collection = colRes.data.data || colRes.data;
      setCollection(col);
      setStats(statsRes.data.data);
      const all: Survey[] = allRes.data || [];
      setAllSurveys(all);
      const byId = new Map<string, Survey>(all.map(s => [s._id, s]));
      setSurveys((col.surveyIds || []).map(sid => byId.get(sid)).filter(Boolean) as Survey[]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading && !collection) {
    return (
      <div className='p-8 text-center text-gray-500'>Loading...</div>
    );
  }
  if (error && !collection) {
    return (
      <div className='p-8 text-center text-red-500'>{error}</div>
    );
  }

  if (!collection) {
    return (
      <div className='p-8 text-center text-gray-500'>
        {t('collections.collectionMissing', 'Collection data is unavailable')}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='bg-white rounded-lg p-4 shadow-sm mb-4'>
        <div className='mb-2 text-xs sm:text-sm text-gray-500'>
          <button className='text-blue-600 hover:underline' onClick={() => navigate('/admin/collections')}>{t('collections.title', 'Collections')}</button>
          <span className='mx-2 text-gray-400'>/</span>
          <span className='text-gray-700'>{collection?.name || t('collections.title', 'Collections')}</span>
        </div>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <h2 className='text-xl font-semibold text-gray-900'>{collection?.name ?? ''}</h2>
            </div>
            {collection.description && <p className='text-gray-600 mt-1'>{collection.description}</p>}
          </div>
          <div className='flex flex-wrap gap-2'>
            <button className='btn-outline' onClick={() => setShowModal(true)}>{i18n.t('buttons.edit', { ns: 'translation', defaultValue: 'Edit' })}</button>
            <button className='btn-outline' onClick={() => setShowSelectModal(true)}>{t('collections.addSurveys', 'Add Surveys')}</button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg p-4 shadow-sm mb-4'>
        <h3 className='text-sm font-semibold text-gray-700 mb-3'>{t('collections.linkedSurveys', 'Linked Surveys')}</h3>
        {surveys.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>{t('collections.noSurveys', 'No surveys found')}</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>{t('common.title', 'Title')}</th>
                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>{t('common.type', 'Type')}</th>
                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>{t('common.status', 'Status')}</th>
                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>{t('survey.questions.title', 'Questions')}</th>
                  <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-100'>
                {surveys.map(s => (
                  <tr key={s._id} className='hover:bg-gray-50'>
                    <td className='px-4 py-2 whitespace-nowrap'>
                      <a href={`/admin/survey/${s._id}`} className='text-sm font-medium text-gray-900 hover:text-blue-600'>{s.title}</a>
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap'>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${s.type === 'survey' ? 'bg-blue-100 text-blue-800' : s.type === 'assessment' ? 'bg-green-100 text-green-800' : s.type === 'quiz' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>{s.type}</span>
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap'>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : s.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span>
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-sm text-gray-700'>
                      {(() => {
                        if ((s as any).sourceType === 'question_bank') {
                          return (s as any).questionCount || 0;
                        }
                        if ((s as any).sourceType === 'multi_question_bank') {
                          const list = (s as any).multiQuestionBankConfig || [];
                          return list.reduce((sum: number, cfg: any) => sum + (cfg?.questionCount || 0), 0);
                        }
                        if ((s as any).sourceType === 'manual_selection') {
                          return ((s as any).selectedQuestions || []).length;
                        }
                        return (s as any).questions?.length ?? 0;
                      })()}
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-right'>
                      <div className='flex items-center gap-2 justify-end'>
                        <a className='btn-outline btn-small' href={`/admin/survey/${s._id}`}>{t('collections.open', 'Open')}</a>
                        <button className='btn-outline btn-small text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500' onClick={async () => {
                          const nextIds = (collection.surveyIds || []).filter(x => x !== s._id);
                          await api.patch(`/collections/${collection._id}/surveys`, { surveyIds: nextIds });
                          await load();
                        }}>{i18n.t('buttons.delete', { ns: 'translation', defaultValue: 'Delete' })}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CollectionModal open={showModal} onClose={() => { setShowModal(false); load(); }} collection={collection} />
      )}
      {showSelectModal && (
        <SelectSurveysModal
          open={showSelectModal}
          onClose={() => setShowSelectModal(false)}
          surveys={allSurveys}
           selectedIds={collection?.surveyIds || []}
          onSave={async ids => {
             await api.patch(`/collections/${collection._id}/surveys`, { surveyIds: ids });
            setShowSelectModal(false);
            await load();
          }}
        />
      )}
    </div>
  );
};

export default CollectionDetailView;
