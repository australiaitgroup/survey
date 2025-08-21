import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import Modal from '../Modal';

const QuestionBankModal: React.FC = () => {
	const {
		showQuestionBankModal,
		setShowQuestionBankModal,
		questionBankForm,
		setQuestionBankForm,
		loading,
		error,
	} = useAdmin();

	const { createQuestionBank } = useQuestionBanks();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await createQuestionBank(e);
	};

	const handleClose = () => {
		setShowQuestionBankModal(false);
		setQuestionBankForm({ name: '', description: '' });
	};

	return (
		<Modal show={showQuestionBankModal} title='Create Question Bank' onClose={handleClose}>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Question Bank Name *
					</label>
					<input
						className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						placeholder='Enter question bank name'
						value={questionBankForm.name}
						onChange={e =>
							setQuestionBankForm({ ...questionBankForm, name: e.target.value })
						}
						required
					/>
				</div>
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Description
					</label>
					<textarea
						className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						placeholder='Enter description'
						value={questionBankForm.description}
						onChange={e =>
							setQuestionBankForm({
								...questionBankForm,
								description: e.target.value,
							})
						}
						rows={3}
					/>
				</div>

				{error && <div className='text-red-500 text-sm'>{error}</div>}

				<button
					className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
					type='submit'
					disabled={loading}
				>
					{loading ? 'Creating...' : 'Create Question Bank'}
				</button>
			</form>
		</Modal>
	);
};

export default QuestionBankModal;
