import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useAdmin } from '../../contexts/AdminContext';
import Modal from '../Modal';
import api from '../../utils/axiosConfig';

interface CopyQuestionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	sourceBankId: string;
	sourceBankTitle: string;
	questionIds: string[];
	onSuccess?: (targetBankName: string, copiedCount: number) => void;
}

const CopyQuestionsModal: React.FC<CopyQuestionsModalProps> = ({
	isOpen,
	onClose,
	sourceBankId,
	sourceBankTitle,
	questionIds,
	onSuccess,
}) => {
	const { t } = useTranslation('admin');
	const { questionBanks } = useQuestionBanks();
	const { navigate } = useAdmin();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedTargetBankId, setSelectedTargetBankId] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState('');
	const [showCreateNew, setShowCreateNew] = useState(false);
	const [newBankName, setNewBankName] = useState('');

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setSelectedTargetBankId('');
			setSearchTerm('');
			setShowCreateNew(false);
			setNewBankName('');
			setError(null);
		}
	}, [isOpen]);

	// Filter question banks based on search
	const filteredBanks = questionBanks.filter(bank =>
		bank.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleCopyQuestions = async () => {
		if (!selectedTargetBankId) {
			setError('Please select a target question bank');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await api.post(
				`/admin/question-banks/${selectedTargetBankId}/questions/copy`,
				{
					sourceBankId,
					questionIds,
				}
			);

			if (response.data.success) {
				const targetBank = questionBanks.find(bank => bank._id === selectedTargetBankId);
				const targetBankName = targetBank?.name || 'Unknown Bank';

				onSuccess?.(targetBankName, response.data.copiedCount);
				onClose();
			}
		} catch (err: any) {
			console.error('Error copying questions:', err);
			setError(err.response?.data?.error || 'Failed to copy questions');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateNewBank = async () => {
		if (!newBankName.trim()) {
			setError('Please enter a name for the new question bank');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Create new question bank
			const createResponse = await api.post('/admin/question-banks', {
				name: newBankName.trim(),
				description: `Created for copying questions from ${sourceBankTitle}`,
			});

			const newBankId = createResponse.data._id;

			// Copy questions to the new bank
			const copyResponse = await api.post(
				`/admin/question-banks/${newBankId}/questions/copy`,
				{
					sourceBankId,
					questionIds,
				}
			);

			if (copyResponse.data.success) {
				onSuccess?.(newBankName.trim(), copyResponse.data.copiedCount);
				onClose();
			}
		} catch (err: any) {
			console.error('Error creating bank and copying questions:', err);
			setError(err.response?.data?.error || 'Failed to create bank and copy questions');
		} finally {
			setLoading(false);
		}
	};

	const handleGoToTargetBank = () => {
		if (selectedTargetBankId) {
			const targetBank = questionBanks.find(bank => bank._id === selectedTargetBankId);
			if (targetBank) {
				navigate(`/admin/question-bank/${selectedTargetBankId}`);
				onClose();
			}
		}
	};

	if (!isOpen) return null;

	return (
		<Modal
			show={isOpen}
			onClose={onClose}
			title={`Copy ${questionIds.length} Question${questionIds.length !== 1 ? 's' : ''}`}
		>
			<div className='space-y-4'>
				{/* Source Info */}
				<div className='p-3 bg-gray-50 rounded-lg'>
					<p className='text-sm text-gray-600'>
						Copying from:{' '}
						<span className='font-medium text-gray-800'>{sourceBankTitle}</span>
					</p>
					<p className='text-sm text-gray-600'>
						Questions to copy:{' '}
						<span className='font-medium text-gray-800'>{questionIds.length}</span>
					</p>
				</div>

				{/* Error Display */}
				{error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
						{error}
					</div>
				)}

				{/* Target Selection */}
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<h3 className='text-lg font-medium text-gray-800'>
							Select Target Question Bank
						</h3>
						<button
							onClick={() => setShowCreateNew(!showCreateNew)}
							className='text-sm text-blue-600 hover:text-blue-800'
						>
							{showCreateNew ? 'Select Existing' : 'Create New Bank'}
						</button>
					</div>

					{showCreateNew ? (
						/* Create New Bank */
						<div className='space-y-3'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									New Question Bank Name
								</label>
								<input
									type='text'
									value={newBankName}
									onChange={e => setNewBankName(e.target.value)}
									placeholder='Enter name for new question bank'
									className='input-field'
								/>
							</div>
							<button
								onClick={handleCreateNewBank}
								disabled={loading || !newBankName.trim()}
								className='w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{loading
									? 'Creating and Copying...'
									: 'Create Bank and Copy Questions'}
							</button>
						</div>
					) : (
						/* Select Existing Bank */
						<div className='space-y-3'>
							{/* Search */}
							<div>
								<input
									type='text'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									placeholder='Search question banks...'
									className='input-field'
								/>
							</div>

							{/* Bank List */}
							<div className='max-h-60 overflow-y-auto border border-gray-200 rounded-lg'>
								{filteredBanks.length === 0 ? (
									<div className='p-4 text-center text-gray-500'>
										{searchTerm
											? 'No banks match your search'
											: 'No question banks found'}
									</div>
								) : (
									<div className='divide-y divide-gray-200'>
										{filteredBanks.map(bank => (
											<label
												key={bank._id}
												className='flex items-center p-3 hover:bg-gray-50 cursor-pointer'
											>
												<input
													type='radio'
													name='targetBank'
													value={bank._id}
													checked={selectedTargetBankId === bank._id}
													onChange={e =>
														setSelectedTargetBankId(e.target.value)
													}
													className='mr-3 text-blue-600 focus:ring-blue-500'
												/>
												<div className='flex-1'>
													<div className='font-medium text-gray-800'>
														{bank.name}
													</div>
													<div className='text-sm text-gray-500'>
														{bank.questions.length} question
														{bank.questions.length !== 1 ? 's' : ''}
														{bank.description && (
															<span> • {bank.description}</span>
														)}
													</div>
												</div>
											</label>
										))}
									</div>
								)}
							</div>

							{/* Copy Button */}
							<div className='flex gap-2'>
								<button
									onClick={handleCopyQuestions}
									disabled={loading || !selectedTargetBankId}
									className='flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
								>
									{loading
										? 'Copying...'
										: `Copy ${questionIds.length} Question${questionIds.length !== 1 ? 's' : ''}`}
								</button>

								{selectedTargetBankId && (
									<button
										onClick={handleGoToTargetBank}
										className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50'
									>
										Go to Bank
									</button>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='flex justify-end pt-4 border-t'>
					<button
						onClick={onClose}
						disabled={loading}
						className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
					>
						Cancel
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default CopyQuestionsModal;
