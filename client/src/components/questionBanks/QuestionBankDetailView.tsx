import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { QuestionBank, QuestionForm } from '../../types/admin';
import AddQuestionModal from '../modals/AddQuestionModal';
import EditQuestionBankModal from '../modals/EditQuestionBankModal';
import EditQuestionModal from '../modals/EditQuestionModal';
import ImportCSVModal from '../modals/ImportCSVModal';
import ImportResultModal from '../modals/ImportResultModal';

interface QuestionBankDetailViewProps {
	questionBank: QuestionBank;
}

const QuestionBankDetailView: React.FC<QuestionBankDetailViewProps> = ({ questionBank }) => {
	const {
		setSelectedQuestionBankDetail,
		setQuestionBankDetailTab,
		navigate,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		loading,
		setLoading,
		error,
		setError,
		// Use context-driven modal + form state for editing question bank
		showEditQuestionBankModal,
		setShowEditQuestionBankModal,
		editQuestionBankForm,
		setEditQuestionBankForm,
	} = useAdmin();

	const { addQuestionBankQuestion, deleteQuestionBankQuestion, updateQuestionBankQuestion } =
		useQuestionBanks();

	// Local state for add question modal
	const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
	// Local state for edit question modal
	const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
	const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
	const [editQuestionForm, setEditQuestionForm] = useState<QuestionForm>({
		text: '',
		description: '',
		options: ['', ''],
		type: 'single_choice' as const,
		correctAnswer: undefined,
		points: 1,
	});
	// Removed local edit question bank state; rely on context state instead
	// Local state for CSV import
	const [showImportCSVModal, setShowImportCSVModal] = useState(false);
	const [showImportResultModal, setShowImportResultModal] = useState(false);
	const [importResult, setImportResult] = useState<{
		success: boolean;
		message: string;
		imported: number;
		warnings?: string[];
		errors?: string[];
	} | null>(null);

	const qb = questionBank;
	const currentForm = questionBankQuestionForms[qb._id] || {
		text: '',
		description: '',
		options: ['', ''],
		type: 'single_choice' as const,
		correctAnswer: undefined,
		points: 1,
	};

	const handleQuestionBankBackToList = () => {
		setSelectedQuestionBankDetail(null);
		setQuestionBankDetailTab('list');
		navigate('/admin/question-banks');
	};

	// Question management functions
	const handleQuestionBankQuestionChange = (
		questionBankId: string,
		field: string,
		value: unknown
	) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice' as const,
				correctAnswer: undefined,
				points: 1,
			};

			const updatedForm = { ...currentForm, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === 'short_text') {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === 'single_choice' || value === 'multiple_choice')
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return {
				...prev,
				[questionBankId]: updatedForm,
			};
		});
	};

	const addQuestionBankOption = (questionBankId: string) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice',
			};
			return {
				...prev,
				[questionBankId]: {
					...currentForm,
					options: [...(currentForm.options || []), ''],
				},
			};
		});
	};

	const removeQuestionBankOption = (questionBankId: string, index: number) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice',
			};
			return {
				...prev,
				[questionBankId]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== index),
				},
			};
		});
	};

	const handleQuestionBankOptionChange = (
		questionBankId: string,
		index: number,
		value: string | { text?: string; imageUrl?: string }
	) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice',
			};
			const newOptions = [...(currentForm.options || [])];
			newOptions[index] = value;
			return {
				...prev,
				[questionBankId]: {
					...currentForm,
					options: newOptions,
				},
			};
		});
	};

	// Question editing functions
	const startEditQuestionBankQuestion = (questionBankId: string, questionIndex: number) => {
		const question = qb.questions[questionIndex];

		setEditQuestionForm({
			text: question.text,
			description: question.description || '',
			descriptionImage: question.descriptionImage,
			options: question.options ? ([...question.options] as string[]) : ['', ''],
			type: question.type || 'single_choice',
			correctAnswer: question.correctAnswer,
			points: question.points || 1,
		});

		setEditingQuestionIndex(questionIndex);
		setShowEditQuestionModal(true);
	};

	const cancelEditQuestionBankQuestion = () => {
		setShowEditQuestionModal(false);
		setEditingQuestionIndex(null);
		setEditQuestionForm({
			text: '',
			options: ['', ''],
			type: 'single_choice' as const,
			correctAnswer: undefined,
			points: 1,
		});
	};

	// Edit modal handlers
	const handleEditQuestionChange = (field: string, value: unknown) => {
		setEditQuestionForm(prev => {
			const updatedForm = { ...prev, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === 'short_text') {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === 'single_choice' || value === 'multiple_choice')
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return updatedForm;
		});
	};

	const handleEditQuestionOptionChange = (
		index: number,
		value: string | { text?: string; imageUrl?: string }
	) => {
		setEditQuestionForm(prev => {
			const newOptions = [...(prev.options || [])];
			newOptions[index] = value;
			return {
				...prev,
				options: newOptions,
			};
		});
	};

	const addEditQuestionOption = () => {
		setEditQuestionForm(prev => ({
			...prev,
			options: [...(prev.options || []), ''],
		}));
	};

	const removeEditQuestionOption = (index: number) => {
		setEditQuestionForm(prev => ({
			...prev,
			options: (prev.options || []).filter((_, i) => i !== index),
		}));
	};

	const saveEditQuestion = async (form: QuestionForm) => {
		if (editingQuestionIndex === null) return;

		try {
			setLoading(true);
			await updateQuestionBankQuestion(qb._id, editingQuestionIndex, form);
			cancelEditQuestionBankQuestion();
			setLoading(false);
		} catch {
			setError('Failed to save question. Please try again.');
			setLoading(false);
		}
	};

	const addQuestionBankQuestionHandler = async (form: QuestionForm) => {
		try {
			setLoading(true);
			setError(''); // Clear any previous errors
			await addQuestionBankQuestion(qb._id, form);

			// Reset form and close modal
			setQuestionBankQuestionForms(prev => ({
				...prev,
				[qb._id]: {
					text: '',
					description: '',
					options: ['', ''],
					type: 'single_choice',
					correctAnswer: undefined,
					points: 1,
				},
			}));
			setShowAddQuestionModal(false);

			setLoading(false);
		} catch (err: any) {
			console.error('Error adding question:', err);
			const errorMessage =
				err?.response?.data?.error ||
				err?.message ||
				'Failed to add question. Please try again.';
			setError(errorMessage);
			setLoading(false);
		}
	};

	// CSV import functions
	const handleCSVImport = async (file: File) => {
		try {
			setLoading(true);

			const formData = new FormData();
			formData.append('csvFile', file);

			const response = await fetch(`/api/admin/question-banks/${qb._id}/import-csv`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
				},
				body: formData,
			});

			const data = await response.json();

			if (response.ok) {
				// Update the question bank data
				if (data.questionBank) {
					// Trigger a refresh of the question bank data
					window.location.reload();
				}

				setImportResult({
					success: true,
					message: data.message,
					imported: data.imported,
					warnings: data.warnings,
				});
			} else {
				setImportResult({
					success: false,
					message: data.error || 'Import failed',
					imported: 0,
					errors: data.errors,
				});
			}

			setShowImportResultModal(true);
			setLoading(false);
		} catch (error) {
			console.error('CSV import error:', error);
			setImportResult({
				success: false,
				message: 'Network error occurred during import',
				imported: 0,
			});
			setShowImportResultModal(true);
			setLoading(false);
		}
	};

	return (
		<>
			<div className='space-y-4'>
				<div className='flex items-center gap-4'>
					<button onClick={handleQuestionBankBackToList} className='btn-secondary'>
						← Back to List
					</button>
					<h2 className='text-xl font-semibold text-gray-800'>
						Question Bank Detail: {qb.name}
					</h2>
				</div>

				<div className='card'>
					<div className='flex justify-between items-start mb-4'>
						<div className='flex-1'>
							<h3 className='text-xl font-bold text-gray-800 mb-2'>{qb.name}</h3>
							{qb.description && (
								<p className='text-gray-600 mb-3'>{qb.description}</p>
							)}
							<div className='flex items-center gap-4 text-sm text-gray-500'>
								<span>Questions: {qb.questions?.length || 0}</span>
								<span>Created: {new Date(qb.createdAt).toLocaleDateString()}</span>
							</div>
							{/* Error Display */}
							{error && (
								<div className='mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
									{error}
								</div>
							)}
						</div>
						<div className='flex items-center gap-2'>
							<button
								className='btn-primary btn-small'
								onClick={() => {
										// Ensure context has the current QB selected before opening modal
										setSelectedQuestionBankDetail(qb);
										setEditQuestionBankForm({
										name: qb.name,
										description: qb.description || '',
									});
									setShowEditQuestionBankModal(true);
								}}
							>
								Edit Question Bank
							</button>
						</div>
					</div>

					{/* Add New Question Button */}
					<div className='border-t border-gray-200 pt-4'>
						<div className='flex justify-between items-center'>
							<h4 className='font-semibold text-gray-800'>
								Questions ({qb.questions?.length || 0})
							</h4>
							<div className='flex gap-2'>
								<button
									className='btn-secondary text-sm'
									onClick={() => setShowImportCSVModal(true)}
									type='button'
									disabled={loading}
								>
									📄 导入 CSV
								</button>
								<button
									className='btn-primary text-sm'
									onClick={() => {
										setError(''); // Clear any previous errors
										setShowAddQuestionModal(true);
									}}
									type='button'
								>
									+ Add New Question
								</button>
							</div>
						</div>
					</div>

					{/* Questions List */}
					<div className='pt-4 mt-4'>
						{qb.questions && qb.questions.length > 0 ? (
							<div className='space-y-4'>
								{qb.questions.map((q, idx) => (
									<div key={idx} className='bg-gray-50 rounded-lg p-4'>
										<div className='flex justify-between items-start mb-2'>
											<div className='flex-1'>
												<div className='flex items-center gap-2 mb-1'>
													<span className='font-medium text-gray-800'>
														{idx + 1}. {q.text}
													</span>
													<span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
														{q.type === 'multiple_choice'
															? 'Multiple Choice'
															: q.type === 'single_choice'
																? 'Single Choice'
																: 'Short Text'}
													</span>
													<span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
														{q.points || 1} pts
													</span>
												</div>
												{q.descriptionImage && (
													<div className='mb-2'>
														<img
															src={q.descriptionImage}
															alt='Question illustration'
															className='w-32 h-32 object-cover rounded border border-gray-300'
														/>
													</div>
												)}
											</div>
											<div className='flex items-center gap-2'>
												<button
													className='btn-secondary text-sm px-3 py-1'
													onClick={() =>
														startEditQuestionBankQuestion(qb._id, idx)
													}
												>
													Edit
												</button>
												<button
													className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
													onClick={() =>
														deleteQuestionBankQuestion(qb._id, idx)
													}
												>
													Delete
												</button>
											</div>
										</div>
										<div className='text-sm text-gray-600 space-y-1'>
											{q.type === 'short_text' ? (
												<div>
													<div className='font-medium'>
														Type: Text Response
													</div>
													{q.correctAnswer &&
														typeof q.correctAnswer === 'string' && (
														<div className='pl-4 text-green-600 font-semibold'>
																Expected Answer: {q.correctAnswer}
														</div>
													)}
												</div>
											) : (
												<div>
													<div className='font-medium'>Options:</div>
													{q.options &&
														q.options.map((opt, optIdx) => {
															const optionText =
																typeof opt === 'string'
																	? opt
																	: opt.text || '';
															const optionImageUrl =
																typeof opt === 'object'
																	? opt.imageUrl
																	: undefined;
															const isCorrect = Array.isArray(
																q.correctAnswer
															)
																? q.correctAnswer.includes(optIdx)
																: q.correctAnswer === optIdx;
															return (
																<div
																	key={optIdx}
																	className={`flex items-start gap-2 pl-4 ${
																		isCorrect
																			? 'text-green-600 font-semibold'
																			: ''
																	}`}
																>
																	{isCorrect && (
																		<svg
																			className='w-4 h-4 mt-0.5'
																			fill='currentColor'
																			viewBox='0 0 20 20'
																		>
																			<path
																				fillRule='evenodd'
																				d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
																				clipRule='evenodd'
																			/>
																		</svg>
																	)}
																	<div className='flex-1'>
																		<span>{optionText}</span>
																		{optionImageUrl && (
																			<div className='mt-1'>
																				<img
																					src={
																						optionImageUrl
																					}
																					alt={`Option ${optIdx + 1}`}
																					className='w-16 h-16 object-cover rounded border border-gray-300'
																				/>
																			</div>
																		)}
																	</div>
																</div>
															);
														})}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className='text-gray-500 text-sm'>No questions added yet.</p>
						)}
					</div>
				</div>
			</div>

			{/* Add Question Modal */}
			<AddQuestionModal
				isOpen={showAddQuestionModal}
				onClose={() => setShowAddQuestionModal(false)}
				onSubmit={addQuestionBankQuestionHandler}
				form={currentForm}
				onChange={(field, value) => handleQuestionBankQuestionChange(qb._id, field, value)}
				onOptionChange={(index, value) =>
					handleQuestionBankOptionChange(qb._id, index, value)
				}
				onAddOption={() => addQuestionBankOption(qb._id)}
				onRemoveOption={index => removeQuestionBankOption(qb._id, index)}
				loading={loading}
			/>

			{/* Edit Question Modal */}
			<EditQuestionModal
				isOpen={showEditQuestionModal}
				onClose={cancelEditQuestionBankQuestion}
				onSubmit={saveEditQuestion}
				form={editQuestionForm}
				onChange={handleEditQuestionChange}
				onOptionChange={handleEditQuestionOptionChange}
				onAddOption={addEditQuestionOption}
				onRemoveOption={removeEditQuestionOption}
				loading={loading}
				questionIndex={editingQuestionIndex ?? undefined}
			/>

			{/* Import CSV Modal */}
			<ImportCSVModal
				isOpen={showImportCSVModal}
				onClose={() => setShowImportCSVModal(false)}
				onImport={handleCSVImport}
				loading={loading}
			/>

			{/* Import Result Modal */}
			<ImportResultModal
				isOpen={showImportResultModal}
				onClose={() => setShowImportResultModal(false)}
				result={importResult}
			/>

			{/* Edit Question Bank Modal */}
			<EditQuestionBankModal />
		</>
	);
};

export default QuestionBankDetailView;
