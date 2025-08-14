import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import Modal from '../Modal';

const EditQuestionBankModal: React.FC = () => {
    const { t, i18n } = useTranslation('admin');
    React.useEffect(() => {
        i18n.loadNamespaces(['admin', 'translation']).catch(() => {});
    }, [i18n]);
	const {
		showEditQuestionBankModal,
		setShowEditQuestionBankModal,
		editQuestionBankForm,
		setEditQuestionBankForm,
		selectedQuestionBankDetail,
		loading,
		error,
	} = useAdmin();

	const { updateQuestionBank } = useQuestionBanks();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedQuestionBankDetail) return;

		try {
			await updateQuestionBank(selectedQuestionBankDetail._id, editQuestionBankForm);
			handleClose();
		} catch (err) {
			// Error is handled in the hook
		}
	};

	const handleClose = () => {
		setShowEditQuestionBankModal(false);
		setEditQuestionBankForm({ name: '', description: '' });
	};

	if (!selectedQuestionBankDetail || !showEditQuestionBankModal) return null;

	return (
        <Modal
			show={showEditQuestionBankModal}
            title={t('questionBanks.editTitleWithName', 'Edit Question Bank: {{name}}', { name: selectedQuestionBankDetail.name })}
			onClose={handleClose}
		>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('questionBanks.nameRequired', 'Question Bank Name *')}
                    </label>
					<input
                        className='input-field'
                        placeholder={t('questionBanks.namePlaceholder', 'Enter question bank name')}
						value={editQuestionBankForm.name}
						onChange={e =>
							setEditQuestionBankForm({
								...editQuestionBankForm,
								name: e.target.value,
							})
						}
						required
					/>
				</div>

				<div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('questionBanks.description', 'Description')}
                    </label>
					<textarea
                        className='input-field'
                        placeholder={t('questionBanks.descriptionPlaceholder', 'Enter description')}
						value={editQuestionBankForm.description}
						onChange={e =>
							setEditQuestionBankForm({
								...editQuestionBankForm,
								description: e.target.value,
							})
						}
						rows={3}
					/>
				</div>

				{error && <div className='text-red-500 text-sm'>{error}</div>}

                <div className='flex gap-2 pt-4'>
					<button
						type='submit'
						className='btn-primary flex-1'
						disabled={loading || !editQuestionBankForm.name.trim()}
					>
                        {loading ? t('questionBanks.updating', 'Updating...') : t('questionBanks.update', 'Update Question Bank')}
					</button>
					<button type='button' className='btn-secondary flex-1' onClick={handleClose}>
                        {i18n.t('buttons.cancel', { ns: 'translation', defaultValue: 'Cancel' })}
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default EditQuestionBankModal;
