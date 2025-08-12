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
  // Controls which buttons to render
  variant?: 'full' | 'preview-only' | 'no-preview';
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
  variant = 'full',
}) => {
	const s = survey;
  const showPreviewToggle = variant === 'full' || variant === 'preview-only';
  const showNonPreview = variant === 'full' || variant === 'no-preview';

  return (
    <div className='flex items-center gap-2 flex-wrap mt-4 sm:mt-3 md:mt-2 xl:mt-0 w-full xl:w-auto justify-start'>
      {showNonPreview && (
        <>
          <button className='btn-secondary text-sm px-3 py-1' onClick={() => onEdit(s)}>
            Edit
          </button>
          <button
            className='btn-secondary text-sm px-3 py-1'
            onClick={() => onToggleStatus(s._id)}
          >
            {s.status === SURVEY_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
          </button>
          <button
            className='btn-outline text-sm px-3 py-1'
            onClick={() => onDuplicate(s._id)}
          >
            {t('buttons.duplicate')}
          </button>
          <button
            className='btn-outline text-sm px-3 py-1 text-red-600 border-red-300 hover:bg-red-50'
            onClick={() => onDelete(s._id)}
          >
            Delete
          </button>
        </>
      )}
      {showPreviewToggle && (
        <button
          className='btn-outline text-sm px-3 py-1 shrink-0'
          onClick={() => setShowInlinePreview(!showInlinePreview)}
        >
          {showInlinePreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      )}
    </div>
  );
};

export default SurveyHeaderActions;
