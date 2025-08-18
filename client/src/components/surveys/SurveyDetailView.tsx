import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { Survey, Question, QuestionForm, EnhancedStats } from '../../types/admin';
// moved into extracted components
import AddQuestionSection from './tabs/AddQuestionSection';
import EditQuestionSection from './tabs/EditQuestionSection';
import InviteAssessmentModal from '../modals/InviteAssessmentModal';
import SurveyInvitationsTab from './tabs/SurveyInvitationsTab';
// DroppableQuestionList and StatisticsFilter are used inside extracted tabs
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
import SurveyHeaderActions from './tabs/SurveyHeaderActions';
import SurveyStatisticsTab from './tabs/SurveyStatisticsTab';
import SurveyDetailTab from './tabs/SurveyDetailTab';
import { getSurveyUrl, getAssessmentUrl } from './utils/url';
import { useCompanySlug } from './hooks/useCompanySlug';
import { useQuestionReorder } from './hooks/useQuestionReorder';
import { useLocalQuestionEditing } from './hooks/useLocalQuestionEditing';

interface SurveyDetailViewProps {
	survey: Survey;
}

const SurveyDetailView: React.FC<SurveyDetailViewProps> = ({ survey }) => {
	const { t: tOriginal } = useTranslation();

	// Create a wrapper function to provide default values for common translation keys
	const t = (key: string, defaultValue?: string) => {
		const translations: Record<string, string> = {
			'buttons.duplicate': 'Duplicate',
			'buttons.delete': 'Delete',
			'buttons.edit': 'Edit',
			'buttons.save': 'Save',
			'buttons.cancel': 'Cancel',
		};
		const translated = tOriginal(key);
		// Check if translation exists and is not empty/just the key
		if (translated && translated !== key && translated.trim() !== '') {
			return translated;
		}
		// Fallback to provided default value, then built-in translations, then key
		return defaultValue || translations[key] || key;
	};
	const location = useLocation();
	const navigateRouter = useNavigate();
	const params = useParams();

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

	// Local question editing moved to hook
	const {
		// modal visibility + indices
		showAddQuestionModal,
		setShowAddQuestionModal,
		showEditQuestionModal,
		setShowEditQuestionModal,
		editingQuestionIndex,
		setEditingQuestionIndex,
		// add-question helpers (shared)
		addOption,
		removeOption,
		handleOptionChange,
		addQuestionModalHandler,
		// edit-question helpers/state
		questionEditForms,
		setQuestionEditForms,
		startEditQuestion,
		cancelEditQuestion,
		handleEditQuestionSubmit,
		handleQuestionEditChange,
		handleQuestionEditOptionChange,
		addQuestionEditOption,
		removeQuestionEditOption,
		toggleCorrectAnswer,
	} = useLocalQuestionEditing({
		survey,
		setQuestionForms,
		addQuestion,
		updateQuestion,
		setLoading,
		setError,
	});
	const [showInviteModal, setShowInviteModal] = useState(false);

	// Get tab from URL path, default to 'detail' if not specified
	const getTabFromPath = () => {
		const pathSegments = location.pathname.split('/');
		const tabIndex = pathSegments.indexOf('survey') + 2; // Find index after survey/{id}/
		const tab = pathSegments[tabIndex];

		if (tab === 'invitations') return TAB_TYPES.INVITATIONS;
		if (tab === 'statistics') return TAB_TYPES.STATISTICS;
		return TAB_TYPES.DETAIL;
	};

	const tabLocal = getTabFromPath();

	// Invitations moved into SurveyInvitationsTab
	const [filterLoading, setFilterLoading] = useState(false);
	const [responsePage, setResponsePage] = useState(1);
	// Inline preview toggle within Assessment Details (default ON)
	const [showInlinePreview, setShowInlinePreview] = useState<boolean>(true);
	const RESPONSE_PAGE_SIZE = 5;

	const companySlug = useCompanySlug();

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
			// Load all-time stats on first enter; users can narrow with filter UI
			loadStats(survey._id);
		}
	}, [tabLocal, survey._id]);

	// Check for action=preview query parameter
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		if (searchParams.get('action') === 'preview') {
			// Scroll to preview section or show preview tab
			setTimeout(() => {
				const previewElement = document.getElementById('survey-preview');
				if (previewElement) {
					previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
				// Also show inline preview if it was hidden
				setShowInlinePreview(true);
			}, 500);
			// Clean up the URL
			searchParams.delete('action');
			const newUrl = searchParams.toString() 
				? `${location.pathname}?${searchParams.toString()}`
				: location.pathname;
			window.history.replaceState({}, '', newUrl);
		}
	}, [location.search]);

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

	// moved to utils/url

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

	// Handlers already provided by the single useLocalQuestionEditing instance above

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

	const { handleQuestionsReorder } = useQuestionReorder({
		survey,
		setLoading,
		setError,
		setSurveys,
		setSelectedSurvey,
		loadSurveys,
		t: (k: string, v?: any) => t(k, v),
	});

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
						onClick={() => navigateRouter(`/admin/survey/${s._id}`)}
					>
						Assessment Details
					</button>
					{s.type === SURVEY_TYPE.ASSESSMENT && (
						<button
							className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.INVITATIONS ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
							onClick={() => navigateRouter(`/admin/survey/${s._id}/invitations`)}
						>
							Invited Users
						</button>
					)}
					<button
						className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.STATISTICS ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
						onClick={() => navigateRouter(`/admin/survey/${s._id}/statistics`)}
					>
						Statistics
					</button>
					{/* Preview moved inline into Assessment Details via toggle */}
				</div>
				{/* Tab content */}
				{tabLocal === TAB_TYPES.DETAIL && (
					<SurveyDetailTab
						survey={s}
						t={t as any}
						showInlinePreview={showInlinePreview}
						setShowInlinePreview={(next: boolean) => setShowInlinePreview(next)}
						questionBanks={questionBanks}
						companySlug={companySlug}
						showQR={showQR}
						toggleQR={toggleQR}
						getAssessmentUrl={getAssessmentUrl}
						getSurveyUrl={getSurveyUrl}
						copyToClipboard={copyToClipboard}
						loading={loading}
						handleQuestionsReorder={handleQuestionsReorder}
						startEditQuestion={startEditQuestion}
						deleteQuestion={deleteQuestion}
						setShowAddQuestionModal={setShowAddQuestionModal}
						onEdit={openEditModal}
						onToggleStatus={toggleSurveyStatus}
						onDuplicate={duplicateSurvey}
						onDelete={deleteSurvey}
						onOpenScoringModal={() => setShowScoringModal(true)}
					/>
				)}
				{tabLocal === TAB_TYPES.STATISTICS && (
					<SurveyStatisticsTab
						survey={s}
						stats={stats[s._id]}
						statsView={statsView}
						setStatsView={setStatsView}
						onRefresh={() => loadStats(s._id)}
						onFilter={handleStatisticsFilter}
						responsePage={responsePage}
						setResponsePage={setResponsePage}
						pageSize={RESPONSE_PAGE_SIZE}
					/>
				)}
				{tabLocal === TAB_TYPES.INVITATIONS && (
					<SurveyInvitationsTab surveyId={survey._id} companySlug={companySlug} />
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
				<AddQuestionSection
					survey={s}
					form={currentForm}
					setForm={setQuestionForms}
					onSubmit={addQuestionModalHandler}
					open={showAddQuestionModal}
					setOpen={setShowAddQuestionModal}
					onOptionChange={handleOptionChange}
					onAddOption={addOption}
					onRemoveOption={removeOption}
					loading={loading}
				/>

				{/* Edit Question Modal */}
				<EditQuestionSection
					survey={s}
					open={showEditQuestionModal}
					questionIndex={editingQuestionIndex}
					form={questionEditForms[`${s._id}-${editingQuestionIndex}`]}
					onClose={cancelEditQuestion}
					onSubmit={handleEditQuestionSubmit}
					onChange={(field, value) =>
						handleQuestionEditChange(s._id, editingQuestionIndex, field, value)
					}
					onOptionChange={(index, value) =>
						handleQuestionEditOptionChange(s._id, editingQuestionIndex, index, value)
					}
					onAddOption={() => addQuestionEditOption(s._id, editingQuestionIndex)}
					onRemoveOption={index =>
						removeQuestionEditOption(s._id, editingQuestionIndex, index)
					}
					loading={loading}
				/>
			</div>
		</>
	);
};

export default SurveyDetailView;
