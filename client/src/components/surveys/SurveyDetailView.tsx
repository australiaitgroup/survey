import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { Survey, Question, QuestionForm, EnhancedStats } from '../../types/admin';
import QRCodeComponent from '../QRCode';
import AddSurveyQuestionModal from '../modals/AddSurveyQuestionModal';
import EditSurveyQuestionModal from '../modals/EditSurveyQuestionModal';
import InviteAssessmentModal from '../modals/InviteAssessmentModal';
import DroppableQuestionList from './DroppableQuestionList';
import { StatisticsFilter } from './StatisticsFilter';
import api from '../../utils/axiosConfig';
import {
	SURVEY_TYPE,
	SURVEY_STATUS,
	QUESTION_TYPE,
	TAB_TYPES,
	STATS_VIEW,
	SOURCE_TYPE,
	NAVIGATION_MODE,
	SCORING_MODE,
	TYPES_REQUIRING_ANSWERS,
} from '../../constants';
import SurveyPreviewTab from './SurveyPreviewTab';

interface SurveyDetailViewProps {
	survey: Survey;
}

const SurveyDetailView: React.FC<SurveyDetailViewProps> = ({ survey }) => {
	const { t } = useTranslation();
	const {
		surveys,
		setSurveys,
		setSelectedSurvey,
		setTab,
		navigate,
		showQR,
		setShowQR,
		copyToClipboard,
		questionForms,
		setQuestionForms,
		editingQuestions,
		setEditingQuestions,
		stats,
		setStats,
		statsView,
		setStatsView,
		setShowEditModal,
		setEditForm,
		setShowScoringModal,
		loading,
		setLoading,
		error,
		setError,
	} = useAdmin();

	const {
		selectedSurvey,
		deleteSurvey,
		toggleSurveyStatus,
		addQuestion,
		updateQuestion,
		deleteQuestion,
		loadStats,
		duplicateSurvey,
		loadSurveys,
	} = useSurveys();

	const { questionBanks } = useQuestionBanks();

	// Local state for question editing
	const [questionEditForms, setQuestionEditForms] = useState<Record<string, QuestionForm>>({});
	// Local state for add question modal
	const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
	// Local state for edit question modal
	const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
	const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1);
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [tabLocal, setTabLocal] = useState<'detail' | 'invitations' | 'statistics' | 'preview'>(
		TAB_TYPES.DETAIL
	);
	const [invitations, setInvitations] = useState<any[]>([]);
	const [loadingInvitations, setLoadingInvitations] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [filterLoading, setFilterLoading] = useState(false);
	const [responsePage, setResponsePage] = useState(1);
	// Inline preview toggle within Assessment Details
	const [showInlinePreview, setShowInlinePreview] = useState<boolean>(false);
	const PAGE_SIZE = 10;
	const RESPONSE_PAGE_SIZE = 5;

	// Get company information for generating tenant URLs
	const [companySlug, setCompanySlug] = useState<string>('');

	// Load company information
	useEffect(() => {
		const loadCompanyInfo = async () => {
			try {
				const res = await api.get('/companies/current');
				if (res.data.success && res.data.company?.slug) {
					setCompanySlug(res.data.company.slug);
				}
			} catch (err) {
				console.error('Failed to load company info:', err);
			}
		};

		loadCompanyInfo();
	}, []);

	// Handle statistics filter
	const handleStatisticsFilter = async (filters: {
		name?: string;
		email?: string;
		fromDate?: string;
		toDate?: string;
		status?: string;
	}) => {
		setFilterLoading(true);
		setResponsePage(1); // Reset pagination when applying filters
		try {
			await loadStats(survey._id, filters);
		} finally {
			setFilterLoading(false);
		}
	};

	// Load initial statistics with default filter (last 30 days)
	useEffect(() => {
		if (tabLocal === TAB_TYPES.STATISTICS && survey._id) {
			const today = new Date();
			const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

			handleStatisticsFilter({
				fromDate: thirtyDaysAgo.toISOString().split('T')[0],
				toDate: today.toISOString().split('T')[0],
			});
		}
	}, [tabLocal, survey._id]);

	// Load invitation list
	const loadInvitations = async () => {
		setLoadingInvitations(true);
		try {
			const res = await api.get(`/invitations/survey/${survey._id}`);
			setInvitations(res.data || []);
		} catch (err) {
			// ignore
		} finally {
			setLoadingInvitations(false);
		}
	};

	useEffect(() => {
		if (tabLocal === TAB_TYPES.INVITATIONS) {
			loadInvitations();
		} else if (tabLocal === TAB_TYPES.STATISTICS) {
			loadStats(survey._id);
		}
	}, [tabLocal, survey._id]);

	// Copy link
	const handleCopy = (token: string) => {
		const basePath = companySlug ? `/${companySlug}` : '';
		const url = `${window.location.origin}${basePath}/assessment/${token}`;
		navigator.clipboard.writeText(url);
	};

	// Filter and pagination
	const filtered = invitations.filter(
		inv =>
			!search ||
			(inv.targetEmails && inv.targetEmails.some((e: string) => e.includes(search)))
	);
	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	// Status determination
	const getStatus = (inv: unknown) => {
		const now = new Date();
		if (inv.completedBy && inv.completedBy.length > 0)
			return { label: 'Completed', color: 'green' };
		if (inv.expiresAt && new Date(inv.expiresAt) < now)
			return { label: 'Expired', color: 'red' };
		return { label: 'Not filled', color: 'gray' };
	};

	// Token display
	const maskToken = (token: string) =>
		token ? token.slice(0, 6) + '****' + token.slice(-4) : '';

	const s = survey;
	const currentForm = questionForms[s._id] || {
		text: '',
		imageUrl: null,
		descriptionImage: null,
		options: [],
		type: QUESTION_TYPE.SINGLE_CHOICE,
	};

	const handleBackToList = () => {
		setSelectedSurvey(null);
		setTab(TAB_TYPES.LIST);
		navigate('/admin');
	};

	const openEditModal = (survey: Survey) => {
		// Extract the ID if questionBankId is an object
		let questionBankId = survey.questionBankId;
		if (questionBankId && typeof questionBankId === 'object') {
			// If it's an object with _id property
			questionBankId = (questionBankId as any)._id || (questionBankId as any).id;
		}

		setEditForm({
			title: survey.title,
			description: survey.description || '',
			slug: survey.slug,
			type: survey.type,
			questions: survey.questions || [],
			status: survey.status || SURVEY_STATUS.DRAFT,
			timeLimit: survey.timeLimit,
			maxAttempts: survey.maxAttempts || 1,
			instructions: survey.instructions || '',
			navigationMode: survey.navigationMode || NAVIGATION_MODE.STEP_BY_STEP,
			sourceType: survey.sourceType || SOURCE_TYPE.MANUAL,
			questionBankId: questionBankId,
			questionCount: survey.questionCount,
			multiQuestionBankConfig: survey.multiQuestionBankConfig || [],
			selectedQuestions: survey.selectedQuestions || [],
			scoringSettings: survey.scoringSettings || {
				scoringMode: SCORING_MODE.PERCENTAGE,
				totalPoints: 0,
				passingThreshold: 70,
				showScore: true,
				showCorrectAnswers: true,
				showScoreBreakdown: true,
				customScoringRules: {
					useCustomPoints: false,
					defaultQuestionPoints: 1,
				},
			},
		});
		setShowEditModal(true);
	};

	const getSurveyUrl = (slug: string, companySlug?: string) => {
		const basePath = companySlug ? `/${companySlug}` : '';
		return `${window.location.origin}${basePath}/survey/${slug}`;
	};

	const getAssessmentUrl = (slug: string, companySlug?: string) => {
		const basePath = companySlug ? `/${companySlug}` : '';
		return `${window.location.origin}${basePath}/assessment/${slug}`;
	};

	const toggleQR = (surveyId: string) => {
		setShowQR(prev => ({
			...prev,
			[surveyId]: !prev[surveyId],
		}));
	};

	// Question management functions
	const handleQuestionChange = (surveyId: string, field: string, value: unknown) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				imageUrl: null,
				descriptionImage: null,
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};

			const updatedForm = { ...currentForm, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === QUESTION_TYPE.SHORT_TEXT) {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === QUESTION_TYPE.SINGLE_CHOICE || value === QUESTION_TYPE.MULTIPLE_CHOICE)
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return {
				...prev,
				[surveyId]: updatedForm,
			};
		});
	};

	const addOption = (surveyId: string) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				imageUrl: null,
				descriptionImage: null,
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: [...(currentForm.options || []), { text: '', imageUrl: null }],
				},
			};
		});
	};

	const removeOption = (surveyId: string, index: number) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				imageUrl: null,
				descriptionImage: null,
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== index),
				},
			};
		});
	};

	const handleOptionChange = (
		surveyId: string,
		index: number,
		value: string | { text?: string; imageUrl?: string }
	) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				imageUrl: null,
				descriptionImage: null,
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			const newOptions = [...(currentForm.options || [])];
			newOptions[index] = value;
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: newOptions,
				},
			};
		});
	};

	// Add question modal handler
	const addQuestionModalHandler = async (form: unknown) => {
		try {
			setLoading(true);

			// Prepare form data - don't send options for short_text
			const formData: unknown = {
				text: form.text,
				type: form.type,
			};

			// Add description image if provided
			if (form.descriptionImage) {
				formData.descriptionImage = form.descriptionImage;
			}

			// Only add options for choice questions
			if (form.type !== QUESTION_TYPE.SHORT_TEXT && form.options) {
				formData.options = form.options;
			}

			// Add correctAnswer if provided
			if (form.correctAnswer !== undefined) {
				formData.correctAnswer = form.correctAnswer;
			}

			// Add points if provided
			if (form.points !== undefined) {
				formData.points = form.points;
			}

			await addQuestion(s._id, formData);

			// Reset form and close modal
			setQuestionForms(prev => ({
				...prev,
				[s._id]: {
					text: '',
					imageUrl: null,
					descriptionImage: null,
					options: ['', ''],
					type: QUESTION_TYPE.SINGLE_CHOICE,
					correctAnswer: undefined,
					points: undefined,
				},
			}));
			setShowAddQuestionModal(false);

			setLoading(false);
		} catch (err: unknown) {
			console.error('Add question error:', err);
			setError(err.response?.data?.error || 'Failed to add question. Please try again.');
			setLoading(false);
		}
	};

	// Question editing functions
	const startEditQuestion = (surveyId: string, questionIndex: number) => {
		const question = survey.questions[questionIndex];
		const formKey = `${surveyId}-${questionIndex}`;

		// Determine question type - if no options exist, it's likely a short text question
		let questionType = question.type;
		if (!questionType) {
			if (!question.options || question.options.length === 0) {
				questionType = QUESTION_TYPE.SHORT_TEXT;
			} else {
				questionType = QUESTION_TYPE.SINGLE_CHOICE;
			}
		}

		setQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				text: question.text,
				description: question.description || '',
				imageUrl: question.imageUrl || null,
				descriptionImage: question.descriptionImage || null,
				type: questionType,
				options: [...(question.options || [])],
				correctAnswer: question.correctAnswer,
				points: question.points,
			},
		}));

		setEditingQuestionIndex(questionIndex);
		setShowEditQuestionModal(true);
	};

	const cancelEditQuestion = () => {
		setShowEditQuestionModal(false);
		setEditingQuestionIndex(-1);
	};

	const handleEditQuestionSubmit = async (form: QuestionForm) => {
		if (editingQuestionIndex === -1) return;

		try {
			setLoading(true);

			// Prepare the data for the API call
			const updateData = {
				text: form.text,
				type: form.type,
			};

			// Add description if provided
			if (form.description !== undefined) {
				updateData.description = form.description;
			}

			// Add description image if provided
			if (form.descriptionImage !== undefined) {
				updateData.descriptionImage = form.descriptionImage;
			}

			// Add image URL if provided
			if (form.imageUrl !== undefined) {
				updateData.imageUrl = form.imageUrl;
			}

			// Only include options for non-short-text questions
			if (form.type !== QUESTION_TYPE.SHORT_TEXT) {
				updateData.options = form.options || [];
				// Include correctAnswer if it exists
				if (form.correctAnswer !== undefined) {
					updateData.correctAnswer = form.correctAnswer;
				}
			} else {
				// For short text, only include correctAnswer if it's a non-empty string
				if (
					form.correctAnswer &&
					typeof form.correctAnswer === 'string' &&
					form.correctAnswer.trim()
				) {
					updateData.correctAnswer = form.correctAnswer;
				}
			}

			// Include points if defined
			if (form.points !== undefined) {
				updateData.points = form.points;
			}

			// Use the updateQuestion function from useSurveys hook
			await updateQuestion(survey._id, editingQuestionIndex, updateData);

			// Close modal
			setShowEditQuestionModal(false);
			setEditingQuestionIndex(-1);
		} catch (error) {
			console.error('Error updating question:', error);
			setError('Failed to update question. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleQuestionEditChange = (
		surveyId: string,
		questionIndex: number,
		field: string,
		value: unknown
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		setQuestionEditForms(prev => {
			const currentForm = prev[formKey];
			const updatedForm = { ...currentForm, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === QUESTION_TYPE.SHORT_TEXT) {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === QUESTION_TYPE.SINGLE_CHOICE || value === QUESTION_TYPE.MULTIPLE_CHOICE)
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return {
				...prev,
				[formKey]: updatedForm,
			};
		});
	};

	const handleQuestionEditOptionChange = (
		surveyId: string,
		questionIndex: number,
		optionIndex: number,
		value: string
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			const newOptions = [...(currentForm.options || [])];
			newOptions[optionIndex] = value;
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: newOptions,
				},
			}));
		}
	};

	const addQuestionEditOption = (surveyId: string, questionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: [...(currentForm.options || []), { text: '', imageUrl: null }],
				},
			}));
		}
	};

	const removeQuestionEditOption = (
		surveyId: string,
		questionIndex: number,
		optionIndex: number
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== optionIndex),
				},
			}));
		}
	};

	const toggleCorrectAnswer = (surveyId: string, questionIndex: number, optionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			const isCorrect = Array.isArray(currentForm.correctAnswer)
				? currentForm.correctAnswer.includes(optionIndex)
				: currentForm.correctAnswer === optionIndex;

			let newCorrectAnswer;
			if (isCorrect) {
				// Remove from correct answers
				if (Array.isArray(currentForm.correctAnswer)) {
					newCorrectAnswer = currentForm.correctAnswer.filter(i => i !== optionIndex);
					if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
				} else {
					newCorrectAnswer = undefined;
				}
			} else {
				// Add to correct answers
				if (Array.isArray(currentForm.correctAnswer)) {
					newCorrectAnswer = [...currentForm.correctAnswer, optionIndex].sort(
						(a, b) => a - b
					);
				} else if (currentForm.correctAnswer !== undefined) {
					newCorrectAnswer = [currentForm.correctAnswer, optionIndex].sort(
						(a, b) => a - b
					);
				} else {
					newCorrectAnswer = optionIndex;
				}
			}

			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					correctAnswer: newCorrectAnswer,
				},
			}));
		}
	};

	const saveQuestionEdit = async (surveyId: string, questionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const editForm = questionEditForms[formKey];

		if (!editForm) return;

		try {
			setLoading(true);

			// Prepare the data for the API call (PATCH method - only send necessary fields)
			const updateData: unknown = {
				text: editForm.text,
				type: editForm.type,
			};

			// Include description if provided
			if (editForm.description !== undefined) {
				updateData.description = editForm.description;
			}

			// Include description image if provided
			if (editForm.descriptionImage !== undefined) {
				updateData.descriptionImage = editForm.descriptionImage;
			}

			// Only include options for non-short-text questions
			if (editForm.type !== QUESTION_TYPE.SHORT_TEXT) {
				updateData.options = editForm.options || [];
				// Include correctAnswer if it exists
				if (editForm.correctAnswer !== undefined) {
					updateData.correctAnswer = editForm.correctAnswer;
				}
			} else {
				// For short text, only include correctAnswer if it's a non-empty string
				if (
					editForm.correctAnswer &&
					typeof editForm.correctAnswer === 'string' &&
					editForm.correctAnswer.trim()
				) {
					updateData.correctAnswer = editForm.correctAnswer;
				}
			}

			// Include points if defined
			if (editForm.points !== undefined) {
				updateData.points = editForm.points;
			}

			// Update the question via API
			await updateQuestion(surveyId, questionIndex, updateData);

			// Clear editing state
			setEditingQuestions(prev => ({
				...prev,
				[surveyId]: undefined,
			}));

			// Clear edit form
			setQuestionEditForms(prev => {
				const updated = { ...prev };
				delete updated[formKey];
				return updated;
			});
		} catch (err) {
			setError('Failed to save question. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	// Handle question reordering
	const handleQuestionsReorder = async (surveyId: string, newQuestions: Question[]) => {
		// Set loading state to prevent multiple reorders
		setLoading(true);

		// Extract question IDs in the new order
		const questionIds = newQuestions
			.map(q => {
				console.log('Processing question:', {
					id: q._id,
					hasId: !!q._id,
					text: q.text?.substring(0, 20),
				});
				return q._id;
			})
			.filter(id => id != null); // Remove null/undefined IDs

		if (questionIds.length !== newQuestions.length) {
			console.error('ERROR: Some questions are missing IDs');
			console.error('Expected:', newQuestions.length, 'Got:', questionIds.length);
			setError('Some questions are missing IDs - cannot reorder');
			return;
		}

		// Validate all IDs are strings and not empty
		const validIds = questionIds.every(id => typeof id === 'string' && id.length > 0);
		if (!validIds) {
			console.error('ERROR: Some IDs are invalid');
			console.error('IDs:', questionIds);
			setError('Invalid question IDs detected');
			return;
		}

		try {
			// Update backend with just the IDs
			const response = await api.patch(`/admin/surveys/${surveyId}/questions-reorder`, {
				questionIds: questionIds,
			});

			// Optimistically update the local state immediately
			const updatedSurvey = {
				...survey,
				questions: newQuestions,
			};

			// Update the surveys array
			setSurveys(prev => prev.map(s => (s._id === surveyId ? updatedSurvey : s)));

			// Also update selectedSurvey if it's the current survey
			setSelectedSurvey(updatedSurvey);
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.error ||
				err.response?.data?.message ||
				'Failed to reorder questions. Please try again.';
			setError(t('survey.questions.reorderError', errorMessage));
			alert(`Reorder Error: ${errorMessage}`);

			// Reload surveys on error to restore original state
			await loadSurveys();
		} finally {
			// Always reset loading state
			setLoading(false);
		}
	};

	return (
		<>
			<div className='space-y-4'>
				<div className='flex items-center gap-4'>
					<button onClick={handleBackToList} className='btn-secondary'>
						← Back to List
					</button>
					<h2 className='text-xl font-semibold text-gray-800'>
						Survey Detail: {s.title}
					</h2>
					{s.type === SURVEY_TYPE.ASSESSMENT && (
						<button
							className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-4'
							onClick={() => setShowInviteModal(true)}
						>
							📧 Invite Users for Assessment
						</button>
					)}
				</div>
				{/* Tab switching */}
				<div className='flex gap-4 border-b mb-4'>
					<button
						className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.DETAIL ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
						onClick={() => setTabLocal(TAB_TYPES.DETAIL)}
					>
						Assessment Details
					</button>
					{s.type === SURVEY_TYPE.ASSESSMENT && (
						<button
							className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.INVITATIONS ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
							onClick={() => setTabLocal(TAB_TYPES.INVITATIONS)}
						>
							Invited Users
						</button>
					)}
					<button
						className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.STATISTICS ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
						onClick={() => setTabLocal(TAB_TYPES.STATISTICS)}
					>
						Statistics
					</button>
					{/* Preview moved inline into Assessment Details via toggle */}
				</div>
				{/* Tab content */}
				{tabLocal === TAB_TYPES.DETAIL && (
					<div
						className={
							showInlinePreview ? 'flex flex-col lg:flex-row gap-4 items-stretch' : ''
						}
					>
						<div className={showInlinePreview ? 'w-full lg:w-1/2' : ''}>
							<div className='card'>
								<div className='flex justify-between items-start mb-4'>
									<div className='flex-1'>
										<div className='flex items-center gap-3 mb-2'>
											<h3 className='text-xl font-bold text-gray-800'>
												{s.title}
											</h3>
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${
													s.type === SURVEY_TYPE.ASSESSMENT
														? 'bg-blue-100 text-blue-800'
														: s.type === SURVEY_TYPE.QUIZ
															? 'bg-green-100 text-green-800'
															: s.type === SURVEY_TYPE.IQ
																? 'bg-purple-100 text-purple-800'
																: 'bg-gray-100 text-gray-800'
												}`}
											>
												{s.type === SURVEY_TYPE.ASSESSMENT
													? 'Assessment'
													: s.type === SURVEY_TYPE.QUIZ
														? 'Quiz'
														: s.type === SURVEY_TYPE.IQ
															? 'IQ Test'
															: 'Survey'}
											</span>
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${
													s.status === SURVEY_STATUS.ACTIVE
														? 'bg-green-100 text-green-800'
														: s.status === SURVEY_STATUS.DRAFT
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-red-100 text-red-800'
												}`}
											>
												{s.status === SURVEY_STATUS.ACTIVE
													? 'Active'
													: s.status === SURVEY_STATUS.DRAFT
														? 'Draft'
														: 'Closed'}
											</span>
										</div>
										{s.description && (
											<p className='text-gray-600 mb-3'>{s.description}</p>
										)}
									</div>
									<div className='flex items-center gap-2'>
										<button
											className='btn-secondary text-sm px-3 py-1'
											onClick={() => openEditModal(s)}
										>
											Edit
										</button>
										<button
											className='btn-secondary text-sm px-3 py-1'
											onClick={() => toggleSurveyStatus(s._id)}
										>
											{s.status === SURVEY_STATUS.ACTIVE
												? 'Deactivate'
												: 'Activate'}
										</button>
										<button
											className='px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors'
											onClick={() => duplicateSurvey(s._id)}
										>
											{t('buttons.duplicate')}
										</button>
										<button
											className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
											onClick={() => deleteSurvey(s._id)}
										>
											Delete
										</button>
										<button
											className='btn-outline text-sm px-3 py-1'
											onClick={() => setShowInlinePreview(prev => !prev)}
										>
											{showInlinePreview ? 'Hide Preview' : 'Show Preview'}
										</button>
									</div>
								</div>

								{/* Assessment Configuration Display */}
								{(s.timeLimit ||
									s.maxAttempts !== 1 ||
									s.instructions ||
									s.navigationMode !== NAVIGATION_MODE.STEP_BY_STEP) && (
									<div className='bg-blue-50 rounded-lg p-3 mb-3'>
										<h5 className='font-medium text-gray-800 mb-2'>
											Assessment Configuration
										</h5>
										<div className='grid grid-cols-2 gap-2 text-sm'>
											{s.timeLimit && (
												<div className='flex justify-between'>
													<span className='text-gray-600'>
														Time Limit:
													</span>
													<span className='font-medium text-blue-600'>
														{s.timeLimit} minutes
													</span>
												</div>
											)}
											{s.maxAttempts !== 1 && (
												<div className='flex justify-between'>
													<span className='text-gray-600'>
														Max Attempts:
													</span>
													<span className='font-medium text-blue-600'>
														{s.maxAttempts} times
													</span>
												</div>
											)}
                                            {s.navigationMode !== NAVIGATION_MODE.STEP_BY_STEP && (
												<div className='flex justify-between'>
													<span className='text-gray-600'>
														Navigation Mode:
													</span>
													<span className='font-medium text-blue-600'>
                                                        {s.navigationMode === NAVIGATION_MODE.ONE_QUESTION_PER_PAGE
                                                            ? 'One Question Per Page'
                                                            : 'Step-by-step'}
													</span>
												</div>
											)}
										</div>
										{s.instructions && (
											<div className='mt-2 pt-2 border-t border-blue-200'>
												<div className='text-xs text-gray-600 mb-1'>
													Special Instructions:
												</div>
												<div className='text-sm text-gray-700'>
													{s.instructions}
												</div>
											</div>
										)}
									</div>
								)}

								{/* Scoring Settings Display */}
								{TYPES_REQUIRING_ANSWERS.includes(s.type as any) &&
									s.scoringSettings && (
									<div className='bg-green-50 rounded-lg p-3 mb-3'>
										<div className='flex items-center justify-between mb-2'>
											<h5 className='font-medium text-gray-800'>
													Scoring Rules
											</h5>
											<button
												className='text-sm text-blue-600 hover:text-blue-800'
												onClick={() => setShowScoringModal(true)}
											>
													Edit Scoring Rules
											</button>
										</div>
										<div className='grid grid-cols-2 gap-2 text-sm'>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
														Scoring Mode:
												</span>
												<span className='font-medium text-green-600'>
													{s.scoringSettings.scoringMode ===
														SCORING_MODE.PERCENTAGE
														? 'Percentage'
														: 'Accumulated'}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
														Passing Threshold:
												</span>
												<span className='font-medium text-green-600'>
													{s.scoringSettings.passingThreshold} points
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
														Total Score:
												</span>
												<span className='font-medium text-green-600'>
													{s.scoringSettings.scoringMode ===
														SCORING_MODE.PERCENTAGE
														? '100'
														: s.scoringSettings.totalPoints}{' '}
														points
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
														Custom Points:
												</span>
												<span className='font-medium text-green-600'>
													{s.scoringSettings.customScoringRules
														?.useCustomPoints
														? 'Yes'
														: 'No'}
												</span>
											</div>
										</div>
									</div>
								)}

								{/* Question Source Display */}
								{s.sourceType === SOURCE_TYPE.QUESTION_BANK && (
									<div className='bg-purple-50 rounded-lg p-3 mb-3'>
										<h5 className='font-medium text-gray-800 mb-2'>
											Question Bank Configuration
										</h5>
										<div className='grid grid-cols-2 gap-2 text-sm'>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Source:</span>
												<span className='font-medium text-purple-600'>
													{(() => {
														// Extract ID if questionBankId is an object
														const questionBankId =
															s.questionBankId &&
															typeof s.questionBankId === 'object'
																? (s.questionBankId as any)._id ||
																	(s.questionBankId as any).id
																: s.questionBankId;

														return (
															questionBanks.find(
																bank => bank._id === questionBankId
															)?.name || 'Unknown Question Bank'
														);
													})()}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>
													Questions to Select:
												</span>
												<span className='font-medium text-purple-600'>
													{s.questionCount} random
												</span>
											</div>
										</div>
									</div>
								)}

								<div className='text-sm text-gray-500'>
									Created: {new Date(s.createdAt).toLocaleDateString()}
								</div>

								{/* Actions moved next to Edit button above */}

								{/* Survey URLs */}
								<div className='bg-gray-50 rounded-lg p-4 mb-4'>
									<div className='space-y-3'>
										{s.type === SURVEY_TYPE.ASSESSMENT ? (
											// Assessment type: only show enhanced URL
											<div className='flex items-center justify-between'>
												<div>
													<label className='block text-sm font-medium text-gray-700 mb-1'>
														Enhanced Assessment URL
													</label>
													<div className='text-sm text-gray-600 font-mono'>
														{getAssessmentUrl(s.slug, companySlug)}
													</div>
												</div>
												<div className='flex flex-wrap items-center gap-1 sm:gap-2'>
													<button
														className='btn-secondary btn-small'
														onClick={() =>
															copyToClipboard(
																getAssessmentUrl(
																	s.slug,
																	companySlug
																)
															)
														}
													>
														Copy URL
													</button>
													<button
														className='btn-outline btn-small'
														onClick={() =>
															window.open(
																getAssessmentUrl(
																	s.slug,
																	companySlug
																),
																'_blank'
															)
														}
													>
														Open
													</button>
													<button
														className='btn-primary btn-small'
														onClick={() => toggleQR(s._id)}
													>
														{showQR[s._id] ? 'Hide QR' : 'Show QR'}
													</button>
												</div>
											</div>
										) : (
											// Non-assessment types: show classic URL and optionally enhanced URL
											<>
												<div className='flex items-center justify-between'>
													<div>
														<label className='block text-sm font-medium text-gray-700 mb-1'>
															Classic Survey URL
														</label>
														<div className='text-sm text-gray-600 font-mono'>
															{getSurveyUrl(s.slug, companySlug)}
														</div>
													</div>
													<div className='flex flex-wrap items-center gap-1 sm:gap-2'>
														<button
															className='btn-secondary btn-small'
															onClick={() =>
																copyToClipboard(
																	getSurveyUrl(
																		s.slug,
																		companySlug
																	)
																)
															}
														>
															Copy URL
														</button>
														<button
															className='btn-outline btn-small'
															onClick={() =>
																window.open(
																	getSurveyUrl(
																		s.slug,
																		companySlug
																	),
																	'_blank'
																)
															}
														>
															Open
														</button>
														<button
															className='btn-primary btn-small'
															onClick={() => toggleQR(s._id)}
														>
															{showQR[s._id] ? 'Hide QR' : 'Show QR'}
														</button>
													</div>
												</div>

												{[SURVEY_TYPE.QUIZ, SURVEY_TYPE.IQ].includes(
													s.type
												) && (
													<div className='flex items-center justify-between pt-3 border-t border-gray-200'>
														<div>
															<label className='block text-sm font-medium text-gray-700 mb-1'>
																Enhanced Assessment URL
															</label>
															<div className='text-sm text-gray-600 font-mono'>
																{getAssessmentUrl(
																	s.slug,
																	companySlug
																)}
															</div>
														</div>
														<div className='flex flex-wrap items-center gap-1 sm:gap-2'>
															<button
																className='btn-secondary btn-small'
																onClick={() =>
																	copyToClipboard(
																		getAssessmentUrl(
																			s.slug,
																			companySlug
																		)
																	)
																}
															>
																Copy Enhanced URL
															</button>
															<button
																className='btn-outline btn-small'
																onClick={() =>
																	window.open(
																		getAssessmentUrl(
																			s.slug,
																			companySlug
																		),
																		'_blank'
																	)
																}
															>
																Open
															</button>
														</div>
													</div>
												)}
											</>
										)}
									</div>
									{showQR[s._id] && (
										<div className='border-t border-gray-200 pt-4'>
											<QRCodeComponent
												url={
													s.type === SURVEY_TYPE.ASSESSMENT
														? getAssessmentUrl(s.slug, companySlug)
														: getSurveyUrl(s.slug, companySlug)
												}
											/>
										</div>
									)}
								</div>

								{/* Question Management */}
								{s.sourceType === SOURCE_TYPE.MANUAL ? (
									// Manual Question Management with Drag & Drop
									<DroppableQuestionList
										questions={s.questions || []}
										surveyId={s._id}
										surveyType={s.type}
										onQuestionsReorder={newQuestions =>
											handleQuestionsReorder(s._id, newQuestions)
										}
										onEditQuestion={index => startEditQuestion(s._id, index)}
										onDeleteQuestion={index => deleteQuestion(s._id, index)}
										onAddQuestion={() => setShowAddQuestionModal(true)}
										loading={loading}
									/>
								) : s.sourceType === SOURCE_TYPE.QUESTION_BANK ? (
									// Single Question Bank Survey Information
									<div className='mb-4'>
										<h4 className='font-semibold text-gray-800 mb-3'>
											Question Bank Survey
										</h4>
										<div className='bg-purple-50 rounded-lg p-4'>
											<div className='flex items-center justify-between mb-3'>
												<div>
													<div className='font-medium text-gray-800'>
														Random Question Selection
													</div>
													<div className='text-sm text-gray-600'>
														This survey will randomly select{' '}
														{s.questionCount} questions from the linked
														question bank for each student.
													</div>
												</div>
												<div className='text-lg font-bold text-purple-600'>
													{s.questionCount} questions
												</div>
											</div>
											<div className='text-xs text-gray-500'>
												💡 Questions are randomized per student to ensure
												assessment fairness
											</div>
										</div>
									</div>
								) : s.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK ? (
									// Multi-Question Bank Survey Information
									<div className='mb-4'>
										<h4 className='font-semibold text-gray-800 mb-3'>
											Multi-Question Bank Survey
										</h4>
										<div className='bg-blue-50 rounded-lg p-4'>
											<div className='space-y-3'>
												{s.multiQuestionBankConfig &&
												s.multiQuestionBankConfig.length > 0 ? (
														s.multiQuestionBankConfig.map(
															(config: any, index: number) => {
																const bank = questionBanks.find(
																	b => b._id === config.questionBankId
																);
																return (
																	<div
																		key={index}
																		className='flex items-center justify-between p-3 bg-white rounded-lg border'
																	>
																		<div>
																			<div className='font-medium text-gray-800'>
																				{bank?.name ||
																				'Unknown Bank'}
																			</div>
																			<div className='text-sm text-gray-600'>
																				{config.questionCount}{' '}
																			questions
																				{config.filters &&
																				Object.keys(
																					config.filters
																				).length > 0 && (
																					<span className='text-blue-600'>
																						{' '}
																						(with
																						filters)
																					</span>
																				)}
																			</div>
																		</div>
																		<div className='text-lg font-bold text-blue-600'>
																			{config.questionCount}
																		</div>
																	</div>
																);
															}
														)
													) : (
														<div className='text-gray-500 text-sm text-center py-4'>
														No question bank configurations set
														</div>
													)}
												<div className='text-xs text-gray-500 mt-2'>
													💡 Questions are selected based on configured
													rules for each bank
												</div>
											</div>
										</div>
									</div>
								) : s.sourceType === SOURCE_TYPE.MANUAL_SELECTION ? (
									// Manual Selection Survey Information
									<div className='mb-4'>
										<h4 className='font-semibold text-gray-800 mb-3'>
											Manual Question Selection Survey
										</h4>
										<div className='bg-green-50 rounded-lg p-4'>
											<div className='flex items-center justify-between mb-3'>
												<div>
													<div className='font-medium text-gray-800'>
														Pre-selected Questions
													</div>
													<div className='text-sm text-gray-600'>
														This survey uses{' '}
														{s.selectedQuestions?.length || 0} manually
														selected questions from various question
														banks.
													</div>
												</div>
												<div className='text-lg font-bold text-green-600'>
													{s.selectedQuestions?.length || 0} questions
												</div>
											</div>
											<div className='text-xs text-gray-500'>
												💡 Questions are pre-selected and will be the same
												for all students
											</div>
										</div>
									</div>
								) : null}
							</div>
						</div>
						{showInlinePreview && (
							<div className='w-full lg:flex-1'>
								<div className='card'>
									<SurveyPreviewTab survey={s} hideLeftPane />
								</div>
							</div>
						)}
					</div>
				)}
				{tabLocal === TAB_TYPES.STATISTICS && (
					<div className='card'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-xl font-bold text-gray-800'>Statistics</h3>
							<button
								className='btn-secondary text-sm'
								onClick={() => loadStats(s._id)}
								type='button'
							>
								Refresh Data
							</button>
						</div>

						{stats && stats[s._id] ? (
							<div className='space-y-4'>
								{/* Statistics Summary */}
								<div className='bg-blue-50 rounded-lg p-4'>
									<h5 className='font-semibold text-gray-800 mb-2'>Overview</h5>
									<div className='grid grid-cols-3 gap-4 text-sm'>
										<div className='text-center'>
											<div className='font-bold text-blue-600 text-lg'>
												{stats[s._id]?.summary?.totalResponses || 0}
											</div>
											<div className='text-gray-600'>Total Responses</div>
										</div>
										<div className='text-center'>
											<div className='font-bold text-green-600 text-lg'>
												{stats[s._id]?.summary?.completionRate || 0}%
											</div>
											<div className='text-gray-600'>Completion Rate</div>
										</div>
										<div className='text-center'>
											<div className='font-bold text-purple-600 text-lg'>
												{stats[s._id]?.summary?.totalQuestions || 0}
											</div>
											<div className='text-gray-600'>Total Questions</div>
										</div>
									</div>
								</div>

								{/* Filter Component - moved after overview */}
								<StatisticsFilter
									onFilter={handleStatisticsFilter}
									loading={filterLoading}
								/>

								{/* Statistics View Toggle */}
								<div className='flex space-x-4 border-b border-gray-200 pb-2'>
									<button
										className={`py-2 px-4 font-medium text-sm transition-colors ${
											statsView === STATS_VIEW.INDIVIDUAL
												? 'text-blue-600 border-b-2 border-blue-600'
												: 'text-gray-500 hover:text-blue-600'
										}`}
										onClick={() => setStatsView(STATS_VIEW.INDIVIDUAL)}
									>
										Individual Responses (
										{stats[s._id]?.userResponses?.length || 0})
									</button>
									<button
										className={`py-2 px-4 font-medium text-sm transition-colors ${
											statsView === STATS_VIEW.AGGREGATED
												? 'text-blue-600 border-b-2 border-blue-600'
												: 'text-gray-500 hover:text-blue-600'
										}`}
										onClick={() => setStatsView(STATS_VIEW.AGGREGATED)}
									>
										Aggregated Results
									</button>
								</div>

								{/* Aggregated Statistics */}
								{statsView === STATS_VIEW.AGGREGATED && (
									<div className='space-y-4'>
										{stats[s._id]?.aggregatedStats?.map((st, idx) => (
											<div key={idx} className='bg-gray-50 rounded-lg p-4'>
												<div className='font-semibold text-gray-800 mb-2'>
													{st.question}
												</div>
												<div className='space-y-2'>
													{Object.entries(st.options).map(
														([opt, count]) => {
															const percentage =
																stats[s._id]?.summary
																	?.totalResponses > 0
																	? (
																		(count /
																				stats[s._id].summary
																					.totalResponses) *
																			100
																	).toFixed(1)
																	: 0;
															return (
																<div
																	key={opt}
																	className='flex justify-between items-center'
																>
																	<span className='text-gray-700'>
																		{opt}
																	</span>
																	<div className='flex items-center gap-2'>
																		<div className='w-20 bg-gray-200 rounded-full h-2'>
																			<div
																				className='bg-blue-600 h-2 rounded-full transition-all duration-300'
																				style={{
																					width: `${percentage}%`,
																				}}
																			></div>
																		</div>
																		<span className='font-medium text-blue-600 text-sm w-12'>
																			{count}
																		</span>
																		<span className='text-gray-500 text-xs w-12'>
																			({percentage}%)
																		</span>
																	</div>
																</div>
															);
														}
													)}
												</div>
											</div>
										))}
									</div>
								)}

								{/* Individual User Responses */}
								{statsView === STATS_VIEW.INDIVIDUAL && (
									<div className='space-y-4'>
										{stats[s._id].userResponses?.length > 0 ? (
											<>
												{/* Pagination info */}
												<div className='flex justify-between items-center text-sm text-gray-600 mb-4'>
													<div>
														{stats[s._id].userResponses.length} records,
														showing page{' '}
														{(responsePage - 1) * RESPONSE_PAGE_SIZE +
															1}{' '}
														-{' '}
														{Math.min(
															responsePage * RESPONSE_PAGE_SIZE,
															stats[s._id].userResponses.length
														)}{' '}
													</div>
												</div>

												{stats[s._id].userResponses
													.slice(
														(responsePage - 1) * RESPONSE_PAGE_SIZE,
														responsePage * RESPONSE_PAGE_SIZE
													)
													.map((response, idx) => (
														<div
															key={response._id}
															className='bg-gray-50 rounded-lg p-4'
														>
															<div className='flex justify-between items-start mb-3'>
																<div>
																	<div className='font-semibold text-gray-800'>
																		{response.name}
																	</div>
																	<div className='text-sm text-gray-500'>
																		{response.email}
																	</div>
																	{/* Score Information */}
																	{response.score &&
																		[
																			'quiz',
																			'assessment',
																			'iq',
																		].includes(s.type) && (
																		<div className='mt-2 space-y-1'>
																			<div className='flex items-center gap-2'>
																				<span className='text-sm font-medium text-blue-600'>
																						Score:{' '}
																					{
																						response
																							.score
																							.displayScore
																					}
																					{response
																						.score
																						.scoringMode ===
																						'percentage'
																						? '%'
																						: ' points'}
																				</span>
																				<span
																					className={`text-xs px-2 py-1 rounded-full ${
																						response
																							.score
																							.passed
																							? 'bg-green-100 text-green-800'
																							: 'bg-red-100 text-red-800'
																					}`}
																				>
																					{response
																						.score
																						.passed
																						? 'Pass'
																						: 'Fail'}
																				</span>
																			</div>
																			<div className='text-xs text-gray-500'>
																					Correct:{' '}
																				{
																					response
																						.score
																						.correctAnswers
																				}{' '}
																					/ Incorrect:{' '}
																				{
																					response
																						.score
																						.wrongAnswers
																				}
																				{response.timeSpent && (
																					<span className='ml-2'>
																							Time
																							used:{' '}
																						{Math.floor(
																							response.timeSpent /
																									60
																						)}{' '}
																							minutes{' '}
																						{response.timeSpent %
																								60}{' '}
																							seconds{' '}
																					</span>
																				)}
																			</div>
																		</div>
																	)}
																</div>
																<div className='text-xs text-gray-500'>
																	{new Date(
																		response.createdAt
																	).toLocaleDateString()}{' '}
																	{new Date(
																		response.createdAt
																	).toLocaleTimeString()}
																	{response.isAutoSubmit && (
																		<div className='text-orange-600 mt-1'>
																			(Auto-submitted)
																		</div>
																	)}
																</div>
															</div>
															<div className='space-y-2'>
																{/* Show question snapshots with durations if available */}
																{response.questionSnapshots &&
																response.questionSnapshots.length >
																	0
																	? response.questionSnapshots.map(
																		(snapshot, qIdx) => (
																			<div
																				key={
																					snapshot.questionIndex
																				}
																				className='border-l-4 border-blue-200 pl-3'
																			>
																				<div className='flex justify-between items-start mb-1'>
																					<div className='font-medium text-gray-700 text-sm'>
																							Q
																						{snapshot.questionIndex +
																								1}
																							:{' '}
																						{
																							snapshot
																								.questionData
																								.text
																						}
																					</div>
																					{snapshot.durationInSeconds !==
																							undefined && (
																						<div className='flex items-center text-xs text-gray-500 ml-2'>
																							<svg
																								className='w-3 h-3 mr-1'
																								fill='none'
																								stroke='currentColor'
																								viewBox='0 0 24 24'
																							>
																								<path
																									strokeLinecap='round'
																									strokeLinejoin='round'
																									strokeWidth={
																										2
																									}
																									d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
																								/>
																							</svg>
																							<span
																								className={
																									snapshot.durationInSeconds >
																										90
																										? 'text-red-500 font-medium'
																										: ''
																								}
																							>
																								{
																									snapshot.durationInSeconds
																								}

																									s
																							</span>
																							{snapshot.durationInSeconds >
																									90 && (
																								<svg
																									className='w-3 h-3 ml-1 text-red-500'
																									fill='currentColor'
																									viewBox='0 0 20 20'
																								>
																									<path
																										fillRule='evenodd'
																										d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
																										clipRule='evenodd'
																									/>
																								</svg>
																							)}
																						</div>
																					)}
																				</div>
																				<div className='flex justify-between text-sm'>
																					<div
																						className={`${snapshot.userAnswer === null || snapshot.userAnswer === 'No answer' ? 'text-gray-400 italic' : 'text-gray-900'}`}
																					>
																						<span className='font-medium text-gray-600'>
																								Answer:{' '}
																						</span>
																						{snapshot.userAnswer ||
																								'No answer'}
																					</div>
																					{snapshot.scoring && (
																						<div
																							className={`text-xs px-2 py-1 rounded ${snapshot.scoring.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
																						>
																							{snapshot
																								.scoring
																								.isCorrect
																								? '✓ Correct'
																								: '✗ Wrong'}
																							{snapshot
																								.scoring
																								.pointsAwarded !==
																									undefined && (
																								<span className='ml-1'>
																										(
																									{
																										snapshot
																											.scoring
																											.pointsAwarded
																									}

																										/
																									{
																										snapshot
																											.scoring
																											.maxPoints
																									}
																										pts)
																								</span>
																							)}
																						</div>
																					)}
																				</div>
																			</div>
																		)
																	)
																	: // Fallback to old format
																	Object.entries(
																		response.answers
																	).map(
																		([
																			question,
																			answer,
																		]) => (
																			<div
																				key={question}
																				className='border-l-4 border-blue-200 pl-3'
																			>
																				<div className='font-medium text-gray-700 text-sm'>
																					{question}
																				</div>
																				<div
																					className={`text-sm ${answer === 'No answer' ? 'text-gray-400 italic' : 'text-gray-900'}`}
																				>
																					{answer}
																				</div>
																			</div>
																		)
																	)}
															</div>
														</div>
													))}

												{/* Pagination Controls */}
												{stats[s._id].userResponses.length >
													RESPONSE_PAGE_SIZE && (
													<div className='flex justify-center items-center gap-2 mt-6'>
														<button
															onClick={() =>
																setResponsePage(prev =>
																	Math.max(1, prev - 1)
																)
															}
															disabled={responsePage === 1}
															className='px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
														>
															Previous
														</button>

														<div className='flex gap-1'>
															{Array.from(
																{
																	length: Math.ceil(
																		stats[s._id].userResponses
																			.length /
																			RESPONSE_PAGE_SIZE
																	),
																},
																(_, i) => i + 1
															)
																.filter(pageNum => {
																	const totalPages = Math.ceil(
																		stats[s._id].userResponses
																			.length /
																			RESPONSE_PAGE_SIZE
																	);
																	return (
																		pageNum === 1 ||
																		pageNum === totalPages ||
																		Math.abs(
																			pageNum - responsePage
																		) <= 1
																	);
																})
																.map((pageNum, index, array) => (
																	<React.Fragment key={pageNum}>
																		{index > 0 &&
																			array[index - 1] !==
																				pageNum - 1 && (
																			<span className='px-2 py-1 text-gray-400'>
																					...
																			</span>
																		)}
																		<button
																			onClick={() =>
																				setResponsePage(
																					pageNum
																				)
																			}
																			className={`px-3 py-1 text-sm border rounded ${
																				responsePage ===
																				pageNum
																					? 'bg-blue-600 text-white border-blue-600'
																					: 'hover:bg-gray-50'
																			}`}
																		>
																			{pageNum}
																		</button>
																	</React.Fragment>
																))}
														</div>

														<button
															onClick={() =>
																setResponsePage(prev =>
																	Math.min(
																		Math.ceil(
																			stats[s._id]
																				.userResponses
																				.length /
																				RESPONSE_PAGE_SIZE
																		),
																		prev + 1
																	)
																)
															}
															disabled={
																responsePage >=
																Math.ceil(
																	stats[s._id].userResponses
																		.length / RESPONSE_PAGE_SIZE
																)
															}
															className='px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
														>
															Next
														</button>
													</div>
												)}
											</>
										) : (
											<div className='text-center py-8 text-gray-500'>
												<p>No response data</p>
											</div>
										)}
									</div>
								)}
							</div>
						) : (
							<div className='text-center py-8 text-gray-500'>
								<p>No statistics data, click "Refresh Data" to load</p>
							</div>
						)}
					</div>
				)}
				{tabLocal === TAB_TYPES.INVITATIONS && (
					<div className='mt-4'>
						<div className='flex justify-between items-center mb-2'>
							<div className='font-medium text-gray-800'>Invited Users List</div>
							<input
								className='border rounded px-2 py-1 text-sm'
								placeholder='Search Email'
								value={search}
								onChange={e => {
									setSearch(e.target.value);
									setPage(1);
								}}
								style={{ width: 180 }}
							/>
						</div>
						<div className='overflow-x-auto'>
							<table className='min-w-full text-sm border'>
								<thead>
									<tr className='bg-gray-100'>
										<th className='px-2 py-1 border'>Email</th>
										<th className='px-2 py-1 border'>Token</th>
										<th className='px-2 py-1 border'>Invitation Time</th>
										<th className='px-2 py-1 border'>Valid Until</th>
										<th className='px-2 py-1 border'>Status</th>
										<th className='px-2 py-1 border'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{loadingInvitations ? (
										<tr>
											<td colSpan={6} className='text-center py-4'>
												Loading...
											</td>
										</tr>
									) : paged.length === 0 ? (
										<tr>
											<td colSpan={6} className='text-center py-4'>
												No invitations
											</td>
										</tr>
									) : (
										paged.map(inv => {
											const status = getStatus(inv);
											return (
												<tr key={inv._id}>
													<td className='px-2 py-1 border'>
														{inv.targetEmails?.[0]}
													</td>
													<td className='px-2 py-1 border font-mono'>
														{maskToken(inv.invitationCode)}
													</td>
													<td className='px-2 py-1 border'>
														{inv.createdAt
															? new Date(
																inv.createdAt
															).toLocaleString()
															: ''}
													</td>
													<td className='px-2 py-1 border'>
														{inv.expiresAt
															? new Date(
																inv.expiresAt
															).toLocaleDateString()
															: 'Permanent'}
													</td>
													<td className='px-2 py-1 border'>
														<span
															className={`px-2 py-1 rounded text-xs font-bold ${
																status.color === 'green'
																	? 'bg-green-100 text-green-700'
																	: status.color === 'red'
																		? 'bg-red-100 text-red-700'
																		: 'bg-gray-100 text-gray-700'
															}`}
														>
															{status.label}
														</span>
													</td>
													<td className='px-2 py-1 border space-x-2'>
														<button
															className='text-blue-600 hover:underline'
															onClick={() =>
																handleCopy(inv.invitationCode)
															}
														>
															Copy Link
														</button>
														{/* Expandable: resend/delete invitations */}
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
						{/* Pagination */}
						{totalPages > 1 && (
							<div className='flex justify-center items-center gap-2 mt-2'>
								<button
									disabled={page === 1}
									onClick={() => setPage(page - 1)}
									className='px-2 py-1 border rounded disabled:opacity-50'
								>
									Previous
								</button>
								<span>
									Page {page} / {totalPages}
								</span>
								<button
									disabled={page === totalPages}
									onClick={() => setPage(page + 1)}
									className='px-2 py-1 border rounded disabled:opacity-50'
								>
									Next
								</button>
							</div>
						)}
					</div>
				)}
				{/* Preview tab removed in favor of inline toggle in Assessment Details */}
				{/* Only show modal when showInviteModal is true */}
				{showInviteModal && (
					<InviteAssessmentModal
						show={showInviteModal}
						onClose={() => setShowInviteModal(false)}
						surveyId={survey._id}
						surveyTitle={survey.title}
					/>
				)}

				{/* Add Question Modal */}
				<AddSurveyQuestionModal
					isOpen={showAddQuestionModal}
					onClose={() => setShowAddQuestionModal(false)}
					onSubmit={addQuestionModalHandler}
					form={currentForm}
					onChange={(field, value) => handleQuestionChange(s._id, field, value)}
					onOptionChange={(index, value) => handleOptionChange(s._id, index, value)}
					onAddOption={() => addOption(s._id)}
					onRemoveOption={index => removeOption(s._id, index)}
					loading={loading}
					surveyType={s.type}
					isCustomScoringEnabled={s.scoringSettings?.customScoringRules?.useCustomPoints}
					defaultQuestionPoints={
						s.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1
					}
				/>

				{/* Edit Question Modal */}
				{showEditQuestionModal && editingQuestionIndex >= 0 && (
					<EditSurveyQuestionModal
						isOpen={showEditQuestionModal}
						onClose={cancelEditQuestion}
						onSubmit={handleEditQuestionSubmit}
						form={
							questionEditForms[`${s._id}-${editingQuestionIndex}`] || {
								text: '',
								type: QUESTION_TYPE.SINGLE_CHOICE,
								options: [],
							}
						}
						onChange={(field, value) =>
							handleQuestionEditChange(s._id, editingQuestionIndex, field, value)
						}
						onOptionChange={(index, value) =>
							handleQuestionEditOptionChange(
								s._id,
								editingQuestionIndex,
								index,
								value
							)
						}
						onAddOption={() => addQuestionEditOption(s._id, editingQuestionIndex)}
						onRemoveOption={index =>
							removeQuestionEditOption(s._id, editingQuestionIndex, index)
						}
						loading={loading}
						surveyType={s.type}
						isCustomScoringEnabled={
							s.scoringSettings?.customScoringRules?.useCustomPoints
						}
						defaultQuestionPoints={
							s.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1
						}
						questionIndex={editingQuestionIndex}
					/>
				)}
			</div>
		</>
	);
};

export default SurveyDetailView;
