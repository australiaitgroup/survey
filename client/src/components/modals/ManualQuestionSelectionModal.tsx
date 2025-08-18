import React, { useState, useEffect } from 'react';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { usePublicBanksForSurvey } from '../../hooks/usePublicBanksForSurvey';
import { useAdmin } from '../../contexts/AdminContext';
import Modal from '../Modal';
import axios from 'axios';
import { QUESTION_TYPE, type QuestionType } from '../../constants';
import type { SelectedQuestion } from '../../types/api';

interface Question {
	_id: string;
	text: string;
	type: string;
	options?: string[];
	correctAnswer?: unknown;
	explanation?: string;
	points?: number;
	tags?: string[];
	difficulty?: string;
}

interface QuestionBankInfo {
	_id: string;
	name: string;
	description?: string;
}

interface ManualQuestionSelectionModalProps {
	show: boolean;
	onClose: () => void;
	onSave: (selectedQuestions: SelectedQuestion[]) => void;
	initialSelection?: SelectedQuestion[];
}

const ManualQuestionSelectionModal: React.FC<ManualQuestionSelectionModalProps> = ({
	show,
	onClose,
	onSave,
	initialSelection = [],
}) => {
	const { questionBanks } = useQuestionBanks();
	const { authorized: publicBanks, locked: lockedPublicBanks } = usePublicBanksForSurvey();
	const { navigate } = useAdmin();
	const [selectedBankId, setSelectedBankId] = useState<string>('');
	const [selectedBankType, setSelectedBankType] = useState<'local' | 'public'>('local');
	const [questions, setQuestions] = useState<Question[]>([]);
	const [questionBankInfo, setQuestionBankInfo] = useState<QuestionBankInfo | null>(null);
	const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
	const [selectedQuestionsList, setSelectedQuestionsList] = useState<SelectedQuestion[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>('');

	// Filter states
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
	const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalQuestions, setTotalQuestions] = useState(0);
	const questionsPerPage = 20;

	useEffect(() => {
		if (show) {
			// Initialize with existing selection
			const existingSelection = new Set(initialSelection.map(s => s.questionId));
			setSelectedQuestions(existingSelection);
			setSelectedQuestionsList(initialSelection);
		}
	}, [show, initialSelection]);

	useEffect(() => {
		if (selectedBankId) {
			fetchQuestions();
		} else {
			setQuestions([]);
			setQuestionBankInfo(null);
			setAvailableTags([]);
		}
	}, [
		selectedBankId,
		currentPage,
		searchTerm,
		selectedDifficulty,
		selectedQuestionTypes,
		selectedTags,
	]);

	const fetchQuestions = async () => {
		setLoading(true);
		setError('');

		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: questionsPerPage.toString(),
			});

			if (searchTerm) params.append('search', searchTerm);
			if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
			if (selectedQuestionTypes.length > 0) {
				params.append('questionTypes', selectedQuestionTypes.join(','));
			}
			if (selectedTags.length > 0) {
				params.append('tags', selectedTags.join(','));
			}

			let response;
			let data;

			if (selectedBankType === 'local') {
				// Fetch from local question banks
				response = await axios.get(
					`/api/question-banks/${selectedBankId}/questions?${params}`
				);
				data = response.data;

				setQuestions(data.questions);
				setQuestionBankInfo(data.questionBank);
				setTotalPages(data.pagination.totalPages);
				setTotalQuestions(data.pagination.totalQuestions);

				// Extract available tags from the selected bank
				const bank = questionBanks.find(b => b._id === selectedBankId);
				if (bank) {
					const tags = new Set<string>();
					bank.questions.forEach(q => {
						q.tags?.forEach(tag => tags.add(tag));
					});
					setAvailableTags(Array.from(tags));
				}
			} else {
				// Fetch from public banks
				response = await axios.get(`/api/public-banks/${selectedBankId}/sample-questions`);
				data = response.data;

				setQuestions(data.questions);
				setQuestionBankInfo({
					_id: data.bankId,
					name: data.bankTitle,
					description: `Public Bank - ${data.totalQuestions} questions total`,
				});

				// Simple pagination for public banks
				const startIndex = (currentPage - 1) * questionsPerPage;
				const endIndex = currentPage * questionsPerPage;
				const paginatedQuestions = data.questions.slice(startIndex, endIndex);

				setQuestions(paginatedQuestions);
				setTotalPages(Math.ceil(data.questions.length / questionsPerPage));
				setTotalQuestions(data.questions.length);

				// Extract available tags from the public bank
				const tags = new Set<string>();
				data.questions.forEach((q: Question) => {
					q.tags?.forEach(tag => tags.add(tag));
				});
				setAvailableTags(Array.from(tags));
			}
		} catch (err) {
			console.error('Error fetching questions:', err);
			setError('Failed to load questions. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const toggleQuestionSelection = (question: Question) => {
		const newSelection = new Set(selectedQuestions);
		const newSelectionList = [...selectedQuestionsList];

		if (newSelection.has(question._id)) {
			// Remove from selection
			newSelection.delete(question._id);
			const listIndex = newSelectionList.findIndex(s => s.questionId === question._id);
			if (listIndex > -1) {
				newSelectionList.splice(listIndex, 1);
			}
		} else {
			// Add to selection
			newSelection.add(question._id);
			newSelectionList.push({
				questionBankId: selectedBankId,
				questionId: question._id,
				questionSnapshot: question,
				isPublic: selectedBankType === 'public', // Track if this is from a public bank
			});
		}

		setSelectedQuestions(newSelection);
		setSelectedQuestionsList(newSelectionList);
	};

	// Handle marketplace navigation for locked banks
	const handleGoToMarketplace = (bankId: string) => {
		// Save current anchor point for return navigation
		localStorage.setItem('returnToSurveyCreation', 'true');
		localStorage.setItem('lockedBankId', bankId);

		// Navigate to marketplace tab
		navigate('/admin/question-banks?tab=marketplace');
	};

	const clearAllSelections = () => {
		setSelectedQuestions(new Set());
		setSelectedQuestionsList([]);
	};

	const selectAllOnPage = () => {
		const newSelection = new Set(selectedQuestions);
		const newSelectionList = [...selectedQuestionsList];

		questions.forEach(question => {
			if (!newSelection.has(question._id)) {
				newSelection.add(question._id);
				newSelectionList.push({
					questionBankId: selectedBankId,
					questionId: question._id,
					questionSnapshot: question,
				});
			}
		});

		setSelectedQuestions(newSelection);
		setSelectedQuestionsList(newSelectionList);
	};

	const handleSave = () => {
		if (selectedQuestionsList.length === 0) {
			alert('Please select at least one question');
			return;
		}

		onSave(selectedQuestionsList);
		onClose();
	};

	const toggleQuestionType = (type: QuestionType) => {
		setSelectedQuestionTypes(prev =>
			prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
		);
		setCurrentPage(1);
	};

	const toggleTag = (tag: string) => {
		setSelectedTags(prev =>
			prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
		);
		setCurrentPage(1);
	};

	const formatQuestionType = (type: string) => {
		return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
	};

	if (!show) return null;

	return (
		<Modal show={show} onClose={onClose} title='Select Questions Manually' size='large'>
			<div className='space-y-6'>
				{/* Question Bank Selection */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-1'>
						Select Question Bank *
					</label>
					<select
						value={selectedBankId ? `${selectedBankType}:${selectedBankId}` : ''}
						onChange={e => {
							const value = e.target.value;
							if (value) {
								const [type, bankId] = value.split(':');
								setSelectedBankType(type as 'local' | 'public');
								setSelectedBankId(bankId);
								setCurrentPage(1);
							} else {
								setSelectedBankId('');
								setSelectedBankType('local');
							}
						}}
						className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					>
						<option value=''>Choose a question bank</option>

						{/* Local Question Banks */}
						{questionBanks.length > 0 && (
							<optgroup label='📁 My Banks'>
								{questionBanks.map(bank => (
									<option key={bank._id} value={`local:${bank._id}`}>
										{bank.name} ({bank.questions.length} questions)
									</option>
								))}
							</optgroup>
						)}

						{/* Authorized Public Banks */}
						{publicBanks.length > 0 && (
							<optgroup label='🌐 Public Banks (Authorized)'>
								{publicBanks.map(bank => (
									<option key={bank._id} value={`public:${bank._id}`}>
										{bank.title} ({bank.questionCount} questions) -{' '}
										{bank.accessType}
									</option>
								))}
							</optgroup>
						)}

						{/* Locked Public Banks */}
						{lockedPublicBanks.length > 0 && (
							<optgroup label='🔒 Public Banks (Locked)'>
								{lockedPublicBanks.map(bank => (
									<option key={bank._id} value='' disabled>
										🔒 {bank.title} ({bank.questionCount} questions) - Purchase
										Required
									</option>
								))}
							</optgroup>
						)}
					</select>

					{/* Show locked banks with purchase options */}
					{lockedPublicBanks.length > 0 && (
						<div className='mt-2'>
							<p className='text-xs text-gray-500 mb-2'>
								To use locked public banks, visit the Marketplace:
							</p>
							<div className='space-y-1'>
								{lockedPublicBanks.slice(0, 3).map(bank => (
									<div
										key={bank._id}
										className='flex items-center justify-between text-xs bg-gray-50 p-2 rounded'
									>
										<span className='text-gray-600'>
											🔒 {bank.title} ({bank.questionCount} questions)
										</span>
										<button
											type='button'
											onClick={() => handleGoToMarketplace(bank._id)}
											className='text-blue-600 hover:text-blue-800 underline'
											title='Go to Marketplace to purchase'
										>
											Purchase
										</button>
									</div>
								))}
								{lockedPublicBanks.length > 3 && (
									<div className='text-center'>
										<button
											type='button'
											onClick={() => handleGoToMarketplace('')}
											className='text-blue-600 hover:text-blue-800 text-xs underline'
										>
											View all {lockedPublicBanks.length} locked banks in
											Marketplace
										</button>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{selectedBankId && (
					<>
						{/* Filters */}
						<div className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
							<h4 className='text-sm font-medium text-gray-900 mb-3'>Filters</h4>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{/* Search */}
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Search Questions
									</label>
									<input
										type='text'
										value={searchTerm}
										onChange={e => {
											setSearchTerm(e.target.value);
											setCurrentPage(1);
										}}
										placeholder='Search question text or tags...'
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									/>
								</div>

								{/* Difficulty */}
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Difficulty
									</label>
									<select
										value={selectedDifficulty}
										onChange={e => {
											setSelectedDifficulty(e.target.value);
											setCurrentPage(1);
										}}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									>
										<option value=''>Any difficulty</option>
										<option value='easy'>Easy</option>
										<option value='medium'>Medium</option>
										<option value='hard'>Hard</option>
									</select>
								</div>
							</div>

							{/* Question Types */}
							<div className='mt-3'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Question Types
								</label>
								<div className='flex flex-wrap gap-2'>
									{Object.values(QUESTION_TYPE).map(type => (
										<label key={type} className='flex items-center'>
											<input
												type='checkbox'
												checked={selectedQuestionTypes.includes(
													type as QuestionType
												)}
												onChange={() =>
													toggleQuestionType(type as QuestionType)
												}
												className='mr-1'
											/>
											<span className='text-sm text-gray-700'>
												{formatQuestionType(type)}
											</span>
										</label>
									))}
								</div>
							</div>

							{/* Tags */}
							{availableTags.length > 0 && (
								<div className='mt-3'>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Tags
									</label>
									<div className='flex flex-wrap gap-1 max-h-20 overflow-y-auto'>
										{availableTags.map(tag => (
											<button
												key={tag}
												type='button'
												onClick={() => toggleTag(tag)}
												className={`px-2 py-1 text-xs rounded-full border ${
													selectedTags.includes(tag)
														? 'bg-blue-100 border-blue-300 text-blue-800'
														: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
												}`}
											>
												{tag}
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Selection Actions */}
						<div className='flex justify-between items-center'>
							<div className='text-sm text-gray-600'>
								{selectedQuestionsList.length} questions selected
								{totalQuestions > 0 &&
									` • Showing ${questions.length} of ${totalQuestions} questions`}
							</div>
							<div className='space-x-2'>
								<button
									type='button'
									onClick={selectAllOnPage}
									className='text-blue-600 hover:text-blue-800 text-sm'
								>
									Select All on Page
								</button>
								<button
									type='button'
									onClick={clearAllSelections}
									className='text-red-600 hover:text-red-800 text-sm'
								>
									Clear All
								</button>
							</div>
						</div>

						{/* Questions List */}
						{loading ? (
							<div className='text-center py-8'>
								<div className='text-gray-600'>Loading questions...</div>
							</div>
						) : error ? (
							<div className='text-center py-8'>
								<div className='text-red-600'>{error}</div>
							</div>
						) : questions.length === 0 ? (
							<div className='text-center py-8'>
								<div className='text-gray-600'>
									No questions found with current filters
								</div>
							</div>
						) : (
							<div className='space-y-3 max-h-96 overflow-y-auto'>
								{questions.map(question => (
									<div
										key={question._id}
										className={`border rounded-lg p-4 cursor-pointer transition-colors ${
											selectedQuestions.has(question._id)
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'
										}`}
										onClick={() => toggleQuestionSelection(question)}
									>
										<div className='flex items-start justify-between'>
											<div className='flex-1'>
												<div className='flex items-center mb-2'>
													<input
														type='checkbox'
														checked={selectedQuestions.has(
															question._id
														)}
														onChange={() =>
															toggleQuestionSelection(question)
														}
														className='mr-3'
														onClick={e => e.stopPropagation()}
													/>
													<span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'>
														{formatQuestionType(question.type)}
													</span>
													{question.difficulty && (
														<span
															className={`text-xs px-2 py-1 rounded ml-2 ${
																question.difficulty === 'easy'
																	? 'bg-green-100 text-green-600'
																	: question.difficulty ===
																		  'medium'
																		? 'bg-yellow-100 text-yellow-600'
																		: 'bg-red-100 text-red-600'
															}`}
														>
															{question.difficulty}
														</span>
													)}
													{question.points && (
														<span className='text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded ml-2'>
															{question.points} pts
														</span>
													)}
												</div>

												<p className='text-sm text-gray-900 mb-2 font-medium'>
													{question.text}
												</p>

												{question.options &&
													question.options.length > 0 && (
													<ul className='text-xs text-gray-600 mb-2'>
														{question.options.map(
															(option, index) => (
																<li
																	key={index}
																	className='ml-4'
																>
																	{index + 1}. {option}
																</li>
															)
														)}
													</ul>
												)}

												{question.tags && question.tags.length > 0 && (
													<div className='flex flex-wrap gap-1'>
														{question.tags.map(tag => (
															<span
																key={tag}
																className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'
															>
																{tag}
															</span>
														))}
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Pagination */}
						{totalPages > 1 && (
							<div className='flex justify-center items-center space-x-2'>
								<button
									type='button'
									onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
									disabled={currentPage === 1}
									className='px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
								>
									Previous
								</button>

								<span className='text-sm text-gray-600'>
									Page {currentPage} of {totalPages}
								</span>

								<button
									type='button'
									onClick={() =>
										setCurrentPage(prev => Math.min(totalPages, prev + 1))
									}
									disabled={currentPage === totalPages}
									className='px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
								>
									Next
								</button>
							</div>
						)}
					</>
				)}
			</div>

			{/* Form Actions */}
			<div className='flex justify-end space-x-3 pt-6 border-t mt-6'>
				<button
					type='button'
					onClick={onClose}
					className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
				>
					Cancel
				</button>
				<button
					type='button'
					onClick={handleSave}
					disabled={selectedQuestionsList.length === 0}
					className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
				>
					Save Selection ({selectedQuestionsList.length} questions)
				</button>
			</div>
		</Modal>
	);
};

export default ManualQuestionSelectionModal;
