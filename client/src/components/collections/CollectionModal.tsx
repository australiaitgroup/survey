import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Collection, CollectionCreateRequest, CollectionStatus } from '../../types/api';
import { useCollections } from '../../hooks/useCollections';

interface CollectionModalProps {
  open: boolean;
  onClose: () => void;
  collection?: Collection | null;
  onSaved?: (c: Collection) => void;
  collectionsApi?: {
    createCollection: (payload: CollectionCreateRequest) => Promise<Collection>;
    updateCollection: (id: string, payload: Partial<Collection>) => Promise<Collection>;
  };
}

const statusOptions: CollectionStatus[] = ['draft', 'active', 'archived'];

const CollectionModal: React.FC<CollectionModalProps> = ({ open, onClose, collection, onSaved, collectionsApi }) => {
  const { t } = useTranslation(['admin', 'translation']);
  const hookApi = useCollections();
  const createCollection = (payload: CollectionCreateRequest) => (collectionsApi?.createCollection || hookApi.createCollection)(payload);
  const updateCollection = (id: string, payload: Partial<Collection>) => (collectionsApi?.updateCollection || hookApi.updateCollection)(id, payload as any);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<CollectionStatus>('draft');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(collection?.name || '');
      setDescription(collection?.description || '');
      setTags(collection?.tags || []);
      setStatus(collection?.status || 'draft');
    }
  }, [open, collection]);

  const addTag = () => {
    const v = tagsInput.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagsInput('');
  };
  const removeTag = (tag: string) => setTags(tags.filter(tg => tg !== tag));

  const onSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let id = collection?._id;
      if (!id) {
        const payload: CollectionCreateRequest = { name: name.trim(), description: description.trim() || undefined, tags, status };
        const created = await createCollection(payload);
        id = created._id;
        onSaved && onSaved(created);
      } else {
        await updateCollection(id, { name: name.trim(), description: description.trim() || undefined, tags, status });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='bg-white rounded-lg shadow-lg w-full max-w-3xl p-4 sm:p-6'>
        <div className='flex items-start justify-between gap-4'>
          <h3 className='text-lg font-semibold'>
            {collection ? t('admin:collections.editTitle', 'Edit Collection') : t('admin:collections.createTitle', 'Create Collection')}
          </h3>
          <button className='btn-outline btn-small' onClick={onClose}>{t('buttons.close')}</button>
        </div>

        <div className='grid grid-cols-1 gap-4 mt-4'>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium mb-1'>{t('translation:common.name')}</label>
              <input className='input-field w-full' value={name} onChange={e => setName(e.target.value)} placeholder={t('admin:collections.namePlaceholder', 'Collection name')} />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>{t('translation:common.description')}</label>
              <textarea className='input-field w-full' rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('admin:collections.descriptionPlaceholder', 'Optional description')} />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>{t('admin:collections.tags', 'Tags')}</label>
              <div className='flex gap-2'>
                <input className='input-field flex-1' value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={t('admin:collections.tagPlaceholder', 'Add a tag and press +')} />
                <button className='btn-outline' onClick={addTag}>+</button>
              </div>
              {tags.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-2'>
                  {tags.map(tag => (
                    <span key={tag} className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center gap-1'>
                      {tag}
                      <button className='text-gray-400 hover:text-gray-600' onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>{t('translation:common.status')}</label>
              <select className='input-field w-full' value={status} onChange={e => setStatus(e.target.value as CollectionStatus)}>
                {statusOptions.map(s => (
                  <option key={s} value={s}>{ s === 'active' ? t('admin:collections.status.active') : s === 'draft' ? t('admin:collections.status.draft') : t('admin:collections.status.archived') }</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-2 mt-6'>
          <button className='btn-outline' onClick={onClose}>{t('translation:buttons.cancel')}</button>
          <button className='btn-primary' onClick={onSubmit} disabled={saving}>
            {collection ? t('translation:buttons.save') : t('translation:buttons.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionModal;
