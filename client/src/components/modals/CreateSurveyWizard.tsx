import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { usePublicBanksForSurvey } from '../../hooks/usePublicBanksForSurvey';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import Drawer from '../Drawer';
import { SOURCE_TYPE, SURVEY_TYPE, NAVIGATION_MODE, SURVEY_STATUS } from '../../constants';
import {
	ClipboardDocumentListIcon,
	AcademicCapIcon,
	CheckBadgeIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CheckIcon,
	BanknotesIcon,
	SparklesIcon,
	GlobeAltIcon,
	ListBulletIcon,
	RectangleStackIcon,
	ViewColumnsIcon,
} from '@heroicons/react/24/outline';

interface CreateSurveyWizardProps {
	show: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const CreateSurveyWizard: React.FC<CreateSurveyWizardProps> = ({ show, onClose, onSuccess }) => {
	const { t } = useTranslation('admin');
	const navigate = useNavigate();
	const { company, setSurveys, surveys } = useAdmin();
	const { questionBanks } = useQuestionBanks();
	const { authorized: authorizedPublicBanks } = usePublicBanksForSurvey();

	// Wizard state
	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Form data
	const [formData, setFormData] = useState({
		// Step 1: Basics
		title: '',
		language: company?.defaultLanguage || company?.settings?.language || 'en',
		type: SURVEY_TYPE.SURVEY,
		
		// Step 2: Content source
		contentSource: 'manual' as 'manual' | 'myBanks' | 'publicBanks' | 'quickSample',
		selectedBanks: [] as string[],
		
		// Step 3: Display settings
		navigationMode: NAVIGATION_MODE.STEP_BY_STEP,
	});

	// Combine question banks for selection
	const allAvailableBanks = [
		...questionBanks.map(bank => ({
			_id: bank._id,
			name: bank.name,
			questionCount: bank.questions?.length || 0,
			isPublic: false,
		})),
		...authorizedPublicBanks.map(publicBank => ({
			_id: publicBank._id,
			name: publicBank.title,
			questionCount: publicBank.questionCount,
			isPublic: true,
		})),
	];

	// Reset form when modal opens
	useEffect(() => {
		if (show) {
			setCurrentStep(1);
			setError('');
			setFormData({
				title: '',
				language: company?.defaultLanguage || company?.settings?.language || 'en',
				type: SURVEY_TYPE.SURVEY,
				contentSource: 'manual',
				selectedBanks: [],
				navigationMode: NAVIGATION_MODE.STEP_BY_STEP,
			});
		}
	}, [show, company]);

	const handleNext = () => {
		// Validate current step
		if (currentStep === 1) {
			if (!formData.title.trim()) {
				setError(t('wizard.errors.titleRequired', 'Title is required'));
				return;
			}
		}
		
		if (currentStep === 2) {
			if (formData.contentSource === 'myBanks' && formData.selectedBanks.length === 0) {
				setError(t('wizard.errors.selectBank', 'Please select at least one question bank'));
				return;
			}
			if (formData.contentSource === 'publicBanks' && formData.selectedBanks.length === 0) {
				if (authorizedPublicBanks.length === 0) {
					// Redirect to marketplace
					window.open('/admin/marketplace', '_blank');
					return;
				}
				setError(t('wizard.errors.selectPublicBank', 'Please select at least one public bank'));
				return;
			}
		}
		
		setError('');
		setCurrentStep(prev => Math.min(prev + 1, 3));
	};

	const handleBack = () => {
		setError('');
		setCurrentStep(prev => Math.max(prev - 1, 1));
	};

	const handleCreate = async () => {
		setLoading(true);
		setError('');
		
		try {
			// Build survey payload
			const surveyData: any = {
				title: formData.title.trim(),
				description: '',
				type: formData.type,
				status: SURVEY_STATUS.DRAFT,
				navigationMode: formData.navigationMode,
				language: formData.language,
			};

			// Set source type based on content selection
			if (formData.contentSource === 'manual') {
				surveyData.sourceType = SOURCE_TYPE.MANUAL;
				surveyData.questions = [];
			} else if (formData.contentSource === 'quickSample') {
				// Quick sample: auto-generate 10 demo questions
				surveyData.sourceType = SOURCE_TYPE.MANUAL;
				surveyData.questions = generateSampleQuestions();
			} else if (formData.contentSource === 'myBanks' || formData.contentSource === 'publicBanks') {
				// Multi-bank selection
				if (formData.selectedBanks.length === 1) {
					// Single bank
					surveyData.sourceType = SOURCE_TYPE.QUESTION_BANK;
					surveyData.questionBankId = formData.selectedBanks[0];
					const bank = allAvailableBanks.find(b => b._id === formData.selectedBanks[0]);
					surveyData.questionCount = Math.min(10, bank?.questionCount || 10);
				} else {
					// Multiple banks
					surveyData.sourceType = SOURCE_TYPE.MULTI_QUESTION_BANK;
					surveyData.multiQuestionBankConfig = formData.selectedBanks.map(bankId => {
						const bank = allAvailableBanks.find(b => b._id === bankId);
						return {
							questionBankId: bankId,
							questionCount: Math.min(5, bank?.questionCount || 5),
						};
					});
				}
			}

			// Create the survey
			const response = await api.post('/admin/surveys', surveyData);
			const newSurvey = response.data;
			
			// Update surveys list
			setSurveys([...surveys, newSurvey]);
			
			// Show success and navigate
			showSuccessMessage();
			onClose();
			
			// Navigate to survey detail with preview hint
			setTimeout(() => {
				navigate(`/admin/survey/${newSurvey._id}?action=preview`);
			}, 500);
			
			if (onSuccess) {
				onSuccess();
			}
		} catch (err: any) {
			setError(err.response?.data?.error || t('wizard.errors.createFailed', 'Failed to create survey'));
		} finally {
			setLoading(false);
		}
	};

	const generateSampleQuestions = () => {
		return [
			{
				text: 'How satisfied are you with our service?',
				type: 'single_choice',
				options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
			},
			{
				text: 'Which features do you use most? (Select all that apply)',
				type: 'multiple_choice',
				options: ['Dashboard', 'Reports', 'Analytics', 'Collaboration', 'Mobile App'],
			},
			{
				text: 'How likely are you to recommend us to a friend?',
				type: 'single_choice',
				options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
			},
			{
				text: 'What is your primary use case?',
				type: 'single_choice',
				options: ['Personal', 'Business', 'Education', 'Research', 'Other'],
			},
			{
				text: 'How often do you use our platform?',
				type: 'single_choice',
				options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'First time'],
			},
			{
				text: 'What improvements would you like to see?',
				type: 'short_text',
				options: [],
			},
			{
				text: 'Rate the ease of use',
				type: 'single_choice',
				options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
			},
			{
				text: 'Which department are you from?',
				type: 'single_choice',
				options: ['Sales', 'Marketing', 'Engineering', 'Support', 'Management', 'Other'],
			},
			{
				text: 'Do you have any additional feedback?',
				type: 'short_text',
				options: [],
			},
			{
				text: 'Would you like to be contacted for follow-up?',
				type: 'single_choice',
				options: ['Yes', 'No'],
			},
		];
	};

	const showSuccessMessage = () => {
		// Simple success feedback
		const message = document.createElement('div');
		message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
		message.innerHTML = `
			<div class="flex items-center space-x-2">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
				<span>${t('wizard.success', 'Survey created successfully!')}</span>
			</div>
		`;
		document.body.appendChild(message);
		setTimeout(() => {
			message.classList.add('animate-fade-out');
			setTimeout(() => document.body.removeChild(message), 300);
		}, 3000);
	};

	const renderStep1 = () => (
		<div className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					{t('wizard.basics.title', 'Survey Title')} *
				</label>
				<input
					type="text"
					value={formData.title}
					onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder={t('wizard.basics.titlePlaceholder', 'Enter your survey title')}
					autoFocus
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					{t('wizard.basics.language', 'Language')}
				</label>
				<select
					value={formData.language}
					onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="en">English</option>
					<option value="zh">中文</option>
					<option value="es">Español</option>
					<option value="fr">Français</option>
					<option value="de">Deutsch</option>
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-3">
					{t('wizard.basics.type', 'Survey Type')}
				</label>
				<div className="grid grid-cols-1 gap-3">
					{[
						{ value: SURVEY_TYPE.SURVEY, label: 'Survey', icon: ClipboardDocumentListIcon, desc: 'Collect feedback and opinions' },
						{ value: SURVEY_TYPE.ASSESSMENT, label: 'Assessment', icon: CheckBadgeIcon, desc: 'Test knowledge with scoring' },
						{ value: SURVEY_TYPE.ONBOARDING, label: 'Onboarding', icon: AcademicCapIcon, desc: 'Employee training and orientation' },
					].map(type => (
						<label
							key={type.value}
							className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
								formData.type === type.value
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 hover:border-gray-300'
							}`}
						>
							<input
								type="radio"
								name="surveyType"
								value={type.value}
								checked={formData.type === type.value}
								onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
								className="sr-only"
							/>
							<type.icon className="w-6 h-6 text-gray-600 mr-3" />
							<div className="flex-1">
								<div className="font-medium text-gray-900">{type.label}</div>
								<div className="text-sm text-gray-500">{type.desc}</div>
							</div>
							{formData.type === type.value && (
								<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4" />
							)}
						</label>
					))}
				</div>
			</div>
		</div>
	);

	const renderStep2 = () => (
		<div className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-3">
					{t('wizard.content.source', 'Choose Question Source')}
				</label>
				<div className="grid grid-cols-1 gap-3">
					{/* My Question Banks */}
					<label
						className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
							formData.contentSource === 'myBanks'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type="radio"
							name="contentSource"
							value="myBanks"
							checked={formData.contentSource === 'myBanks'}
							onChange={() => setFormData(prev => ({ ...prev, contentSource: 'myBanks', selectedBanks: [] }))}
							className="sr-only"
						/>
						<BanknotesIcon className="w-6 h-6 text-gray-600 mr-3 mt-0.5" />
						<div className="flex-1">
							<div className="font-medium text-gray-900">Pick from my banks</div>
							<div className="text-sm text-gray-500">
								{questionBanks.length > 0
									? `${questionBanks.length} banks available`
									: 'No banks created yet'}
							</div>
						</div>
						{formData.contentSource === 'myBanks' && (
							<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4 top-4" />
						)}
					</label>

					{/* Public Banks */}
					<label
						className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
							formData.contentSource === 'publicBanks'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type="radio"
							name="contentSource"
							value="publicBanks"
							checked={formData.contentSource === 'publicBanks'}
							onChange={() => setFormData(prev => ({ ...prev, contentSource: 'publicBanks', selectedBanks: [] }))}
							className="sr-only"
						/>
						<GlobeAltIcon className="w-6 h-6 text-gray-600 mr-3 mt-0.5" />
						<div className="flex-1">
							<div className="font-medium text-gray-900">Pick from public banks</div>
							<div className="text-sm text-gray-500">
								{authorizedPublicBanks.length > 0
									? `${authorizedPublicBanks.length} banks entitled`
									: 'Visit Marketplace to get banks'}
							</div>
						</div>
						{formData.contentSource === 'publicBanks' && (
							<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4 top-4" />
						)}
					</label>

					{/* Quick Sample */}
					<label
						className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
							formData.contentSource === 'quickSample'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type="radio"
							name="contentSource"
							value="quickSample"
							checked={formData.contentSource === 'quickSample'}
							onChange={() => setFormData(prev => ({ ...prev, contentSource: 'quickSample', selectedBanks: [] }))}
							className="sr-only"
						/>
						<SparklesIcon className="w-6 h-6 text-gray-600 mr-3 mt-0.5" />
						<div className="flex-1">
							<div className="font-medium text-gray-900">Quick sample (10 questions)</div>
							<div className="text-sm text-gray-500">Auto-generate demo questions to get started</div>
						</div>
						{formData.contentSource === 'quickSample' && (
							<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4 top-4" />
						)}
					</label>

					{/* Manual Creation */}
					<label
						className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
							formData.contentSource === 'manual'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type="radio"
							name="contentSource"
							value="manual"
							checked={formData.contentSource === 'manual'}
							onChange={() => setFormData(prev => ({ ...prev, contentSource: 'manual', selectedBanks: [] }))}
							className="sr-only"
						/>
						<ClipboardDocumentListIcon className="w-6 h-6 text-gray-600 mr-3 mt-0.5" />
						<div className="flex-1">
							<div className="font-medium text-gray-900">Create manually</div>
							<div className="text-sm text-gray-500">Add questions one by one after creation</div>
						</div>
						{formData.contentSource === 'manual' && (
							<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4 top-4" />
						)}
					</label>
				</div>
			</div>

			{/* Bank Selection */}
			{(formData.contentSource === 'myBanks' || formData.contentSource === 'publicBanks') && (
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Select Banks (multi-select allowed)
					</label>
					<div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
						{formData.contentSource === 'myBanks' ? (
							questionBanks.length > 0 ? (
								<div className="divide-y divide-gray-200">
									{questionBanks.map(bank => (
										<label
											key={bank._id}
											className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
										>
											<input
												type="checkbox"
												value={bank._id}
												checked={formData.selectedBanks.includes(bank._id)}
												onChange={(e) => {
													if (e.target.checked) {
														setFormData(prev => ({
															...prev,
															selectedBanks: [...prev.selectedBanks, bank._id]
														}));
													} else {
														setFormData(prev => ({
															...prev,
															selectedBanks: prev.selectedBanks.filter(id => id !== bank._id)
														}));
													}
												}}
												className="mr-3"
											/>
											<div className="flex-1">
												<div className="font-medium text-sm">{bank.name}</div>
												<div className="text-xs text-gray-500">
													{bank.questions?.length || 0} questions
												</div>
											</div>
										</label>
									))}
								</div>
							) : (
								<div className="p-4 text-center text-gray-500">
									No question banks available
								</div>
							)
						) : (
							authorizedPublicBanks.length > 0 ? (
								<div className="divide-y divide-gray-200">
									{authorizedPublicBanks.map(bank => (
										<label
											key={bank._id}
											className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
										>
											<input
												type="checkbox"
												value={bank._id}
												checked={formData.selectedBanks.includes(bank._id)}
												onChange={(e) => {
													if (e.target.checked) {
														setFormData(prev => ({
															...prev,
															selectedBanks: [...prev.selectedBanks, bank._id]
														}));
													} else {
														setFormData(prev => ({
															...prev,
															selectedBanks: prev.selectedBanks.filter(id => id !== bank._id)
														}));
													}
												}}
												className="mr-3"
											/>
											<div className="flex-1">
												<div className="font-medium text-sm">{bank.title}</div>
												<div className="text-xs text-gray-500">
													{bank.questionCount} questions
												</div>
											</div>
										</label>
									))}
								</div>
							) : (
								<div className="p-4 text-center">
									<p className="text-gray-500 mb-3">No public banks entitled yet</p>
									<button
										type="button"
										onClick={() => window.open('/admin/marketplace', '_blank')}
										className="text-blue-600 hover:text-blue-700 text-sm font-medium"
									>
										Visit Marketplace →
									</button>
								</div>
							)
						)}
					</div>
				</div>
			)}
		</div>
	);

	const renderStep3 = () => (
		<div className="space-y-6">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-3">
					{t('wizard.display.navigation', 'Navigation Mode')}
				</label>
				<div className="grid grid-cols-1 gap-3">
					<label
						className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
							formData.navigationMode === NAVIGATION_MODE.STEP_BY_STEP
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type="radio"
							name="navigationMode"
							value={NAVIGATION_MODE.STEP_BY_STEP}
							checked={formData.navigationMode === NAVIGATION_MODE.STEP_BY_STEP}
							onChange={(e) => setFormData(prev => ({ ...prev, navigationMode: e.target.value as any }))}
							className="sr-only"
						/>
						<ListBulletIcon className="w-6 h-6 text-gray-600 mr-3" />
						<div className="flex-1">
							<div className="font-medium text-gray-900">List View</div>
							<div className="text-sm text-gray-500">All questions on one scrollable page</div>
						</div>
						{formData.navigationMode === NAVIGATION_MODE.STEP_BY_STEP && (
							<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4" />
						)}
					</label>

					<label
						className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
							formData.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type="radio"
							name="navigationMode"
							value={NAVIGATION_MODE.ONE_QUESTION_PER_PAGE}
							checked={formData.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE}
							onChange={(e) => setFormData(prev => ({ ...prev, navigationMode: e.target.value as any }))}
							className="sr-only"
						/>
						<RectangleStackIcon className="w-6 h-6 text-gray-600 mr-3" />
						<div className="flex-1">
							<div className="font-medium text-gray-900">One per Page</div>
							<div className="text-sm text-gray-500">Focus on one question at a time</div>
						</div>
						{formData.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE && (
							<CheckIcon className="w-5 h-5 text-blue-500 absolute right-4" />
						)}
					</label>

					<label
						className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all opacity-50 cursor-not-allowed`}
					>
						<input
							type="radio"
							name="navigationMode"
							value="typeform"
							disabled
							className="sr-only"
						/>
						<ViewColumnsIcon className="w-6 h-6 text-gray-400 mr-3" />
						<div className="flex-1">
							<div className="font-medium text-gray-500">Typeform Style</div>
							<div className="text-sm text-gray-400">Coming soon - immersive experience</div>
						</div>
					</label>
				</div>
			</div>

			{/* Summary */}
			<div className="bg-gray-50 rounded-lg p-4">
				<h4 className="font-medium text-gray-900 mb-3">Summary</h4>
				<dl className="space-y-2 text-sm">
					<div className="flex justify-between">
						<dt className="text-gray-600">Title:</dt>
						<dd className="font-medium text-gray-900">{formData.title || '-'}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-gray-600">Type:</dt>
						<dd className="font-medium text-gray-900">{formData.type}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-gray-600">Content:</dt>
						<dd className="font-medium text-gray-900">
							{formData.contentSource === 'manual' && 'Manual creation'}
							{formData.contentSource === 'quickSample' && '10 sample questions'}
							{formData.contentSource === 'myBanks' && `${formData.selectedBanks.length} bank(s) selected`}
							{formData.contentSource === 'publicBanks' && `${formData.selectedBanks.length} public bank(s)`}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-gray-600">Navigation:</dt>
						<dd className="font-medium text-gray-900">
							{formData.navigationMode === NAVIGATION_MODE.STEP_BY_STEP ? 'List view' : 'One per page'}
						</dd>
					</div>
				</dl>
			</div>
		</div>
	);

	const steps = [
		{ number: 1, title: 'Basics' },
		{ number: 2, title: 'Content' },
		{ number: 3, title: 'Display' },
	];

	return (
		<Drawer
			show={show}
			onClose={onClose}
			title={t('wizard.title', 'Create Survey')}
			width="max-w-2xl"
		>
			<div className="flex flex-col h-full">
				{/* Progress Steps */}
				<div className="px-6 py-4 border-b">
					<div className="flex items-center justify-between">
						{steps.map((step, index) => (
							<React.Fragment key={step.number}>
								<div className="flex items-center">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
											currentStep === step.number
												? 'bg-blue-600 text-white'
												: currentStep > step.number
												? 'bg-green-500 text-white'
												: 'bg-gray-200 text-gray-600'
										}`}
									>
										{currentStep > step.number ? (
											<CheckIcon className="w-5 h-5" />
										) : (
											step.number
										)}
									</div>
									<span className="ml-2 text-sm font-medium text-gray-900">
										{step.title}
									</span>
								</div>
								{index < steps.length - 1 && (
									<div className={`flex-1 h-0.5 mx-4 ${
										currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
									}`} />
								)}
							</React.Fragment>
						))}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto px-6 py-6">
					{currentStep === 1 && renderStep1()}
					{currentStep === 2 && renderStep2()}
					{currentStep === 3 && renderStep3()}

					{error && (
						<div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
							{error}
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<div className="px-6 py-4 border-t flex justify-between">
					<button
						type="button"
						onClick={currentStep === 1 ? onClose : handleBack}
						className="btn-secondary flex items-center"
						disabled={loading}
					>
						<ChevronLeftIcon className="w-4 h-4 mr-1" />
						{currentStep === 1 ? t('wizard.cancel', 'Cancel') : t('wizard.back', 'Back')}
					</button>
					
					{currentStep < 3 ? (
						<button
							type="button"
							onClick={handleNext}
							className="btn-primary flex items-center"
							disabled={loading}
						>
							{t('wizard.next', 'Next')}
							<ChevronRightIcon className="w-4 h-4 ml-1" />
						</button>
					) : (
						<button
							type="button"
							onClick={handleCreate}
							className="btn-primary flex items-center"
							disabled={loading}
						>
							{loading ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									{t('wizard.creating', 'Creating...')}
								</>
							) : (
								<>
									<CheckIcon className="w-4 h-4 mr-1" />
									{t('wizard.create', 'Create Survey')}
								</>
							)}
						</button>
					)}
				</div>
			</div>

			{/* Add animation styles */}
			<style jsx>{`
				@keyframes slide-in {
					from { transform: translateX(100%); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				@keyframes fade-out {
					from { opacity: 1; }
					to { opacity: 0; transform: translateY(-10px); }
				}
				.animate-slide-in {
					animation: slide-in 0.3s ease-out;
				}
				.animate-fade-out {
					animation: fade-out 0.3s ease-out;
				}
			`}</style>
		</Drawer>
	);
};

export default CreateSurveyWizard;