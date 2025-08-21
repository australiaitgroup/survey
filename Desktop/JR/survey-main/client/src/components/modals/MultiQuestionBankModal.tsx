import React, { useState, useEffect } from 'react';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { usePublicBanksForSurvey } from '../../hooks/usePublicBanksForSurvey';
import { useAdmin } from '../../contexts/AdminContext';
import Modal from '../Modal';
import { QUESTION_TYPE, type QuestionType } from '../../constants';

interface MultiQuestionBankConfig {
	questionBankId: string;
	questionCount: number;
	isPublic?: boolean;
	filters?: {
		tags?: string[];
		difficulty?: 'easy' | 'medium' | 'hard';
		questionTypes?: QuestionType[];
	};
}

interface MultiQuestionBankModalProps {
	show: boolean;
	onClose: () => void;
	onSave: (config: MultiQuestionBankConfig[]) => void;
	initialConfig?: MultiQuestionBankConfig[];
}

const MultiQuestionBankModal: React.FC<MultiQuestionBankModalProps> = ({
	show,
	onClose,
	onSave,
	initialConfig = [],
}) => {
	const { questionBanks } = useQuestionBanks();
	const { authorized: publicBanks, locked: lockedPublicBanks } = usePublicBanksForSurvey();
	const { navigate } = useAdmin();
	const [configurations, setConfigurations] = useState<MultiQuestionBankConfig[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);

	useEffect(() => {
		if (show) {
			setConfigurations(initialConfig.length > 0 ? initialConfig : [createEmptyConfig()]);

			// Extract all unique tags from question banks
			const allTags = new Set<string>();
			questionBanks.forEach(bank => {
				bank.questions.forEach(question => {
					question.tags?.forEach(tag => allTags.add(tag));
				});
			});
			setAvailableTags(Array.from(allTags));
		}
	}, [show, initialConfig, questionBanks]);

	const createEmptyConfig = (): MultiQuestionBankConfig => ({
		questionBankId: '',
		questionCount: 1,
		isPublic: false,
		filters: {
			tags: [],
			questionTypes: [],
		},
	});

	// Handle marketplace navigation for locked banks
	const handleGoToMarketplace = (bankId: string) => {
		localStorage.setItem('returnToSurveyCreation', 'true');
		localStorage.setItem('lockedBankId', bankId);
		navigate('/admin/question-banks?tab=marketplace');
	};

	const addConfiguration = () => {
		setConfigurations([...configurations, createEmptyConfig()]);
	};

	const removeConfiguration = (index: number) => {
		if (configurations.length > 1) {
			setConfigurations(configurations.filter((_, i) => i !== index));
		}
	};

	const updateConfiguration = (
		index: number,
		field: keyof MultiQuestionBankConfig,
		value: unknown
	) => {
		const updated = [...configurations];
		updated[index] = { ...updated[index], [field]: value };
		setConfigurations(updated);
	};

	const updateFilter = (configIndex: number, filterField: string, value: unknown) => {
		const updated = [...configurations];
		updated[configIndex] = {
			...updated[configIndex],
			filters: {
				...updated[configIndex].filters,
				[filterField]: value,
			},
		};
		setConfigurations(updated);
	};

	const getSelectedBank = (config: MultiQuestionBankConfig) => {
		if (config.isPublic) {
			return publicBanks.find(bank => bank._id === config.questionBankId);
		} else {
			return questionBanks.find(bank => bank._id === config.questionBankId);
		}
	};

	const getAvailableQuestionCount = (config: MultiQuestionBankConfig) => {
		const bank = getSelectedBank(config);
		if (!bank) return 0;

		if (config.isPublic) {
			// For public banks, use questionCount (since questions array might be placeholder)
			// TODO: Implement filtering for public banks via API
			return bank.questionCount;
		} else {
			// For local banks, filter the questions array
			let questions = bank.questions;

			if (config.filters?.tags && config.filters.tags.length > 0) {
				questions = questions.filter(q =>
					config.filters!.tags!.some(tag => q.tags?.includes(tag))
				);
			}

			if (config.filters?.difficulty) {
				questions = questions.filter(q => q.difficulty === config.filters!.difficulty);
			}

			if (config.filters?.questionTypes && config.filters.questionTypes.length > 0) {
				questions = questions.filter(q =>
					config.filters!.questionTypes!.includes(q.type as QuestionType)
				);
			}

			return questions.length;
		}
	};

	const handleSave = () => {
		// Validate configurations
		const validConfigs = configurations.filter(
			config =>
				config.questionBankId &&
				config.questionCount > 0 &&
				getAvailableQuestionCount(config) >= config.questionCount
		);

		if (validConfigs.length === 0) {
			alert('Please add at least one valid configuration');
			return;
		}

		onSave(validConfigs);
		onClose();
	};

	const toggleTag = (configIndex: number, tag: string) => {
		const currentTags = configurations[configIndex].filters?.tags || [];
		const newTags = currentTags.includes(tag)
			? currentTags.filter(t => t !== tag)
			: [...currentTags, tag];
		updateFilter(configIndex, 'tags', newTags);
	};

	const toggleQuestionType = (configIndex: number, type: QuestionType) => {
		const currentTypes = configurations[configIndex].filters?.questionTypes || [];
		const newTypes = currentTypes.includes(type)
			? currentTypes.filter(t => t !== type)
			: [...currentTypes, type];
		updateFilter(configIndex, 'questionTypes', newTypes);
	};

	if (!show) return null;

	return (
		<Modal show={show} onClose={onClose} title='Configure Multi-Question Bank Selection'>
			<div className='space-y-6 max-h-96 overflow-y-auto'>
				{configurations.map((config, index) => (
					<div key={index} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
						<div className='flex justify-between items-center mb-4'>
							<h4 className='text-sm font-medium text-gray-900'>
								Configuration {index + 1}
							</h4>
							{configurations.length > 1 && (
								<button
									type='button'
									onClick={() => removeConfiguration(index)}
									className='text-red-600 hover:text-red-800 text-sm'
								>
									Remove
								</button>
							)}
						</div>

						<div className='space-y-4'>
							{/* Question Bank Selection */}
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Question Bank *
								</label>
								<select
									value={
										config.questionBankId
											? `${config.isPublic ? 'public' : 'local'}:${config.questionBankId}`
											: ''
									}
									onChange={e => {
										const value = e.target.value;
										if (value) {
											const [type, bankId] = value.split(':');
											updateConfiguration(index, 'questionBankId', bankId);
											updateConfiguration(
												index,
												'isPublic',
												type === 'public'
											);
										} else {
											updateConfiguration(index, 'questionBankId', '');
											updateConfiguration(index, 'isPublic', false);
										}
									}}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value=''>Select a question bank</option>

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
													🔒 {bank.title} ({bank.questionCount} questions)
													- Purchase Required
												</option>
											))}
										</optgroup>
									)}
								</select>

								{/* Show locked banks info */}
								{lockedPublicBanks.length > 0 && (
									<div className='mt-2 p-2 bg-blue-50 rounded text-xs'>
										<p className='text-blue-700 mb-1'>💡 Need more banks?</p>
										<button
											type='button'
											onClick={() => handleGoToMarketplace('')}
											className='text-blue-600 hover:text-blue-800 underline'
										>
											Browse {lockedPublicBanks.length} additional banks in
											Marketplace
										</button>
									</div>
								)}
							</div>

							{/* Question Count */}
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Number of Questions *
								</label>
								<input
									type='number'
									min='1'
									max={getAvailableQuestionCount(config)}
									value={config.questionCount}
									onChange={e =>
										updateConfiguration(
											index,
											'questionCount',
											parseInt(e.target.value) || 1
										)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
								<p className='text-xs text-gray-500 mt-1'>
									Available questions with filters:{' '}
									{getAvailableQuestionCount(config)}
								</p>
							</div>

							{/* Filters */}
							{config.questionBankId && (
								<div className='border-t pt-4'>
									<h5 className='text-sm font-medium text-gray-700 mb-3'>
										Optional Filters
									</h5>

									{/* Difficulty Filter */}
									<div className='mb-3'>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Difficulty
										</label>
										<select
											value={config.filters?.difficulty || ''}
											onChange={e =>
												updateFilter(
													index,
													'difficulty',
													e.target.value || undefined
												)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										>
											<option value=''>Any difficulty</option>
											<option value='easy'>Easy</option>
											<option value='medium'>Medium</option>
											<option value='hard'>Hard</option>
										</select>
									</div>

									{/* Question Types Filter */}
									<div className='mb-3'>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Question Types
										</label>
										<div className='flex flex-wrap gap-2'>
											{Object.values(QUESTION_TYPE).map(type => (
												<label key={type} className='flex items-center'>
													<input
														type='checkbox'
														checked={
															config.filters?.questionTypes?.includes(
																type as QuestionType
															) || false
														}
														onChange={() =>
															toggleQuestionType(
																index,
																type as QuestionType
															)
														}
														className='mr-1'
													/>
													<span className='text-sm text-gray-700'>
														{type
															.replace('_', ' ')
															.replace(/\b\w/g, l => l.toUpperCase())}
													</span>
												</label>
											))}
										</div>
									</div>

									{/* Tags Filter */}
									{availableTags.length > 0 && (
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Tags
											</label>
											<div className='flex flex-wrap gap-1 max-h-20 overflow-y-auto'>
												{availableTags.map(tag => (
													<button
														key={tag}
														type='button'
														onClick={() => toggleTag(index, tag)}
														className={`px-2 py-1 text-xs rounded-full border ${
															config.filters?.tags?.includes(tag)
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
							)}
						</div>
					</div>
				))}

				<button
					type='button'
					onClick={addConfiguration}
					className='w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors'
				>
					+ Add Another Question Bank
				</button>
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
					className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
				>
					Save Configuration
				</button>
			</div>
		</Modal>
	);
};

export default MultiQuestionBankModal;
