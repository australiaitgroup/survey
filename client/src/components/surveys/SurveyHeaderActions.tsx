import React from 'react';
import type { Survey } from '../../types/admin';
import { SURVEY_STATUS } from '../../constants';

interface Props {
  survey: Survey;
  onEdit: (survey: Survey) => void;
  onToggleStatus: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  showInlinePreview: boolean;
  setShowInlinePreview: (next: boolean) => void;
  t: (k: string) => string;
}

const SurveyHeaderActions: React.FC<Props> = ({
  survey,
  onEdit,
  onToggleStatus,
  onDuplicate,
  onDelete,
  showInlinePreview,
  setShowInlinePreview,
  t,
}) => {
  const s = survey;
  return (
    <div className='flex items-center gap-2 flex-wrap mt-4 sm:mt-3 md:mt-2 xl:mt-0 w-full xl:w-auto justify-start xl:justify-end'>
      <button className='btn-secondary text-sm px-3 py-1' onClick={() => onEdit(s)}>Edit</button>
      <button className='btn-secondary text-sm px-3 py-1' onClick={() => onToggleStatus(s._id)}>
        {s.status === SURVEY_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
      </button>
      <button className='px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors' onClick={() => onDuplicate(s._id)}>
        {t('buttons.duplicate')}
      </button>
      <button className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors' onClick={() => onDelete(s._id)}>
        Delete
      </button>
      <button className='btn-outline text-sm px-3 py-1 shrink-0' onClick={() => setShowInlinePreview(!showInlinePreview)}>
        {showInlinePreview ? 'Hide Preview' : 'Show Preview'}
      </button>
    </div>
  );
};

export default SurveyHeaderActions;
