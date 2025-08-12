import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import api from '../../utils/axiosConfig';

interface ModalProps {
	show: boolean;
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, title, onClose, children }) => {
	if (!show) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
				<div className='flex justify-between items-center p-6 border-b border-gray-200'>
					<h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
					<button
						onClick={onClose}
						className='text-gray-400 hover:text-gray-600 transition-colors'
					>
						<svg
							className='w-6 h-6'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				</div>
				<div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>{children}</div>
			</div>
		</div>
	);
};

interface ScoringSettings {
	scoringMode: 'percentage' | 'accumulated';
	passingThreshold: number;
	showScore: boolean;
	showCorrectAnswers: boolean;
	showScoreBreakdown: boolean;
	customScoringRules: {
		useCustomPoints: boolean;
		defaultQuestionPoints: number;
	};
}

const ScoringModal: React.FC = () => {
	const { t } = useTranslation('admin');
	const { showScoringModal, setShowScoringModal, selectedSurvey, loading, setLoading, setError } =
		useAdmin();

	const [localScoring, setLocalScoring] = useState<ScoringSettings>({
		scoringMode: 'percentage',
		passingThreshold: 70,
		showScore: true,
		showCorrectAnswers: true,
		showScoreBreakdown: true,
		customScoringRules: {
			useCustomPoints: false,
			defaultQuestionPoints: 1,
		},
	});

	// Initialize local scoring state when survey changes
	useEffect(() => {
		if (selectedSurvey?.scoringSettings) {
			setLocalScoring({
				scoringMode: selectedSurvey.scoringSettings.scoringMode || 'percentage',
				passingThreshold: selectedSurvey.scoringSettings.passingThreshold || 70,
				showScore:
					selectedSurvey.scoringSettings.showScore !== undefined
						? selectedSurvey.scoringSettings.showScore
						: true,
				showCorrectAnswers:
					selectedSurvey.scoringSettings.showCorrectAnswers !== undefined
						? selectedSurvey.scoringSettings.showCorrectAnswers
						: true,
				showScoreBreakdown:
					selectedSurvey.scoringSettings.showScoreBreakdown !== undefined
						? selectedSurvey.scoringSettings.showScoreBreakdown
						: true,
				customScoringRules: {
					useCustomPoints:
						selectedSurvey.scoringSettings.customScoringRules?.useCustomPoints || false,
					defaultQuestionPoints:
						selectedSurvey.scoringSettings.customScoringRules?.defaultQuestionPoints ||
						1,
				},
			});
		}
	}, [selectedSurvey]);

	if (!selectedSurvey || !showScoringModal) return null;

	const updateScoringSettings = async () => {
		if (!selectedSurvey) return;

		setLoading(true);
    try {
            await api.put(`/admin/surveys/${selectedSurvey._id}/scoring`, localScoring);

			// Update the survey in context - this would need to be handled by the parent component
			// For now, we'll just close the modal
			setShowScoringModal(false);

			// Refresh the page data - this could be improved with proper state management
			window.location.reload();
		} catch (err) {
			console.error('Error updating scoring settings:', err);
			setError('Failed to update scoring settings. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			show={showScoringModal}
			title='Edit Scoring Rules'
			onClose={() => setShowScoringModal(false)}
		>
			<div className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Scoring Mode
					</label>
					<select
						className='input-field'
						value={localScoring.scoringMode}
						onChange={e =>
							setLocalScoring({
								...localScoring,
								scoringMode: e.target.value as 'percentage' | 'accumulated',
							})
						}
					>
						<option value='percentage'>Percentage (0-100 points)</option>
						<option value='accumulated'>Accumulated (sum by question points)</option>
					</select>
					<div className='text-xs text-gray-500 mt-1'>
						{localScoring.scoringMode === 'percentage'
							? 'Percentage: Final score converted to 0-100 scale regardless of question points'
							: 'Accumulated: Total score calculated by summing actual question points'}
					</div>
				</div>

				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Passing Threshold
					</label>
					<input
						type='number'
						className='input-field'
						value={localScoring.passingThreshold}
						onChange={e =>
							setLocalScoring({
								...localScoring,
								passingThreshold: parseInt(e.target.value) || 70,
							})
						}
						min='1'
						max={localScoring.scoringMode === 'percentage' ? 100 : 1000}
					/>
					<div className='text-xs text-gray-500 mt-1'>
						{localScoring.scoringMode === 'percentage'
							? 'Percentage passing threshold (1-100)'
							: 'Accumulated scoring passing threshold (by actual points)'}
					</div>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<div>
						<label className='flex items-center'>
							<input
								type='checkbox'
								className='mr-2'
								checked={localScoring.customScoringRules.useCustomPoints}
								onChange={e =>
									setLocalScoring({
										...localScoring,
										customScoringRules: {
											...localScoring.customScoringRules,
											useCustomPoints: e.target.checked,
										},
									})
								}
							/>
							<span className='text-sm text-gray-700'>Use Custom Points</span>
						</label>
					</div>
					{localScoring.customScoringRules.useCustomPoints && (
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Default Question Points
							</label>
							<input
								type='number'
								className='input-field'
								value={localScoring.customScoringRules.defaultQuestionPoints}
								onChange={e =>
									setLocalScoring({
										...localScoring,
										customScoringRules: {
											...localScoring.customScoringRules,
											defaultQuestionPoints: parseInt(e.target.value) || 1,
										},
									})
								}
								min='1'
								max='100'
							/>
						</div>
					)}
				</div>

				<div className='space-y-2'>
					<div className='space-y-1'>
						<label className='flex items-center'>
							<input
								type='checkbox'
								className='mr-2'
								checked={localScoring.showScore}
								onChange={e =>
									setLocalScoring({
										...localScoring,
										showScore: e.target.checked,
									})
								}
							/>
							<span className='text-sm text-gray-700'>
								{t('scoringSettings.showScore', 'Show Score to Students')}
							</span>
						</label>
						<p className='text-xs text-gray-500 ml-6'>
							{t(
								'scoringSettings.showScoreHelp',
								'When enabled, students will see their final score after completing the assessment. When disabled, they will only see a completion message.'
							)}
						</p>
					</div>
					<label className='flex items-center'>
						<input
							type='checkbox'
							className='mr-2'
							checked={localScoring.showCorrectAnswers}
							onChange={e =>
								setLocalScoring({
									...localScoring,
									showCorrectAnswers: e.target.checked,
								})
							}
						/>
						<span className='text-sm text-gray-700'>
							{t('scoringSettings.showCorrectAnswers', 'Show Correct Answers')}
						</span>
					</label>
					<label className='flex items-center'>
						<input
							type='checkbox'
							className='mr-2'
							checked={localScoring.showScoreBreakdown}
							onChange={e =>
								setLocalScoring({
									...localScoring,
									showScoreBreakdown: e.target.checked,
								})
							}
						/>
						<span className='text-sm text-gray-700'>
							{t('scoringSettings.showScoreBreakdown', 'Show Score Breakdown')}
						</span>
					</label>
				</div>

				<div className='flex justify-end space-x-3 pt-4 border-t'>
					<button className='btn-secondary' onClick={() => setShowScoringModal(false)}>
						Cancel
					</button>
					<button
						className='btn-primary'
						onClick={updateScoringSettings}
						disabled={loading}
					>
						{loading ? 'Saving...' : 'Save Settings'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default ScoringModal;
