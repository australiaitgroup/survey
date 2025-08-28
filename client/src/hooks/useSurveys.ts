import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/axiosConfig';
import { useAdmin } from '../contexts/AdminContext';
import { Survey } from '../types/admin';
import {
	SURVEY_TYPE,
	SURVEY_STATUS,
	QUESTION_TYPE,
	NAVIGATION_MODE,
	SCORING_MODE,
	SOURCE_TYPE,
} from '../constants';

export const useSurveys = () => {
	const { t } = useTranslation();
	const {
		surveys,
		setSurveys,
		selectedSurvey,
		setSelectedSurvey,
		newSurvey,
		setNewSurvey,
		editForm,
		setEditForm,
		questionForms,
		setQuestionForms,
		editingQuestions,
		setEditingQuestions,
		showCreateModal,
		setShowCreateModal,
		showEditModal,
		setShowEditModal,
		showScoringModal,
		setShowScoringModal,
		stats,
		setStats,
		statsView,
		setStatsView,
		loading,
		setLoading,
		error,
		setError,
		loggedIn,
		tab,
		setTab,
		navigate,
		location,
	} = useAdmin();

	// Track if surveys have been loaded to prevent duplicate calls
	const surveysLoadedRef = useRef(false);

	// Load surveys - only once when logged in
	useEffect(() => {
		if (loggedIn && !surveysLoadedRef.current) {
			surveysLoadedRef.current = true;
			loadSurveys();
		}
	}, [loggedIn]);

	// Handle URL routing
	useEffect(() => {
		if (!loggedIn) return;

		const path = location.pathname;
		if (path.startsWith('/admin/survey/')) {
			const surveyId = path.split('/').pop();
			if (surveyId) {
				if (tab !== 'detail') {
					setTab('detail');
				}
				if (!selectedSurvey || selectedSurvey._id !== surveyId) {
					const survey = surveys.find(s => s._id === surveyId);
					if (survey) {
						setSelectedSurvey(survey);
					}
				}
			}
		}
	}, [location.pathname, loggedIn, surveys, selectedSurvey, tab]);

	const loadSurveys = async () => {
		try {
			const response = await api.get('/admin/surveys');
			setSurveys(response.data);
		} catch (err) {
			console.error('Error loading surveys:', err);
			setError('Failed to load surveys');
		}
	};

	const refreshSurveys = async () => {
		surveysLoadedRef.current = false;
		await loadSurveys();
		surveysLoadedRef.current = true;
	};

	const createSurvey = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			// Use status field directly
			const surveyData = {
				...newSurvey,
				// Ensure isActive matches status for backward compatibility
				isActive: newSurvey.status === 'active',
			};

			const response = await api.post('/admin/surveys', surveyData);
			setSurveys([...surveys, response.data]);
			setNewSurvey({
				title: '',
				description: '',
				slug: '',
				type: SURVEY_TYPE.SURVEY,
				questions: [],
				status: SURVEY_STATUS.DRAFT,
				timeLimit: undefined,
				maxAttempts: undefined,
				instructions: '',
				navigationMode: NAVIGATION_MODE.STEP_BY_STEP,
				sourceType: SOURCE_TYPE.MANUAL,
				questionBankId: undefined,
				questionCount: undefined,
				scoringSettings: {
					scoringMode: SCORING_MODE.PERCENTAGE,
					totalPoints: 0,
					passingThreshold: 70,
					showScore: false,
					showCorrectAnswers: true,
					showScoreBreakdown: true,
					customScoringRules: {
						useCustomPoints: false,
						defaultQuestionPoints: 1,
					},
				},
			});
			setShowCreateModal(false);
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to create survey');
		} finally {
			setLoading(false);
		}
	};

	const updateSurvey = async (surveyId: string, surveyData: unknown) => {
		try {
			// Use status field directly and ensure isActive matches
			const dataToSend = {
				...surveyData,
				// Ensure isActive matches status for backward compatibility
				isActive: surveyData.status === 'active',
			};

			const response = await api.put(`/admin/surveys/${surveyId}`, dataToSend);
			const updatedSurvey = response.data;

			setSurveys(surveys.map(s => (s._id === surveyId ? updatedSurvey : s)));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
			return updatedSurvey;
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to update survey');
			throw err;
		}
	};

	const deleteSurvey = async (surveyId: string) => {
		if (!window.confirm('Are you sure you want to delete this survey?')) return;

		try {
			await api.delete(`/admin/surveys/${surveyId}`);
			setSurveys(surveys.filter(s => s._id !== surveyId));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(null);
				setTab('list');
				navigate('/admin');
			}
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to delete survey');
		}
	};

	const toggleSurveyStatus = async (surveyId: string) => {
		try {
			const response = await api.put(`/admin/surveys/${surveyId}/toggle-status`);
			let updatedSurvey = response.data;

			// Handle preview-suppressed writes: synthesize updated survey locally
			if (updatedSurvey && updatedSurvey.preview === true) {
				const current = surveys.find(s => s._id === surveyId) || selectedSurvey;
				if (current) {
					const nextIsActive = !current.isActive;
					updatedSurvey = {
						...current,
						isActive: nextIsActive,
						status: nextIsActive ? SURVEY_STATUS.ACTIVE : SURVEY_STATUS.DRAFT,
					};
				}
			}
			setSurveys(surveys.map(s => (s._id === surveyId ? updatedSurvey : s)));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to toggle survey status');
		}
	};

	const handleSurveyClick = (survey: Survey) => {
		setSelectedSurvey(survey);
		setTab('detail');
		navigate(`/admin/survey/${survey._id}`);
	};

	const handleBackToList = () => {
		setSelectedSurvey(null);
		setTab('list');
		navigate('/admin');
	};

	const openEditModal = (survey: Survey) => {

		// Extract the ID if questionBankId is an object
		let questionBankId = survey.questionBankId;
		if (questionBankId && typeof questionBankId === 'object') {
			// If it's an object with _id property
			questionBankId = (questionBankId as any)._id || (questionBankId as any).id;
		}

		const securitySettings = survey.securitySettings || {
			antiCheatEnabled: false,
		};

		setEditForm({
			title: survey.title,
			description: survey.description,
			slug: survey.slug,
			type: survey.type,
			questions: survey.questions,
			status: survey.status || SURVEY_STATUS.DRAFT,
			timeLimit: survey.timeLimit,
			maxAttempts: survey.maxAttempts,
			instructions: survey.instructions,
			navigationMode: survey.navigationMode,
			sourceType: survey.sourceType,
			questionBankId: questionBankId,
			questionCount: survey.questionCount,
			multiQuestionBankConfig: survey.multiQuestionBankConfig || [],
			selectedQuestions: survey.selectedQuestions || [],
			securitySettings: securitySettings,
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

	const closeEditModal = () => {
		setShowEditModal(false);
		setEditForm({
			title: '',
			description: '',
			slug: '',
			type: SURVEY_TYPE.SURVEY,
			questions: [],
			status: SURVEY_STATUS.DRAFT,
			timeLimit: undefined,
			maxAttempts: undefined,
			instructions: '',
			navigationMode: NAVIGATION_MODE.STEP_BY_STEP,
			sourceType: SOURCE_TYPE.MANUAL,
			questionBankId: undefined,
			questionCount: undefined,
			securitySettings: {
				antiCheatEnabled: false,
			},
			scoringSettings: {
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
	};

	const loadStats = async (
		surveyId: string,
		filters?: {
			name?: string;
			email?: string;
			fromDate?: string;
			toDate?: string;
			status?: string;
		}
	) => {
		try {
			const params = new URLSearchParams();
			if (filters?.name) params.append('name', filters.name);
			if (filters?.email) params.append('email', filters.email);
			if (filters?.fromDate) params.append('fromDate', filters.fromDate);
			if (filters?.toDate) params.append('toDate', filters.toDate);
			if (filters?.status) params.append('status', filters.status);

			const queryString = params.toString();
			const url = `/admin/surveys/${surveyId}/statistics${queryString ? `?${queryString}` : ''}`;

			const response = await api.get(url);
			setStats(prev => {
				const surveyKey = String(surveyId); // Ensure key is a string
				const newStats = {
					...prev,
					[surveyKey]: response.data,
				};
				return newStats;
			});
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to load statistics');
		}
	};

	const addQuestion = async (surveyId: string, questionData?: unknown) => {
		const form = questionData || questionForms[surveyId];
		if (!form || !form.text) {
			setError('Please fill in question text');
			return;
		}

		// For choice questions, require at least 2 options
		if (
			form.type !== QUESTION_TYPE.SHORT_TEXT &&
			(!form.options ||
				form.options.filter(opt => {
					const text = typeof opt === 'string' ? opt : opt?.text;
					return text && text.trim();
				}).length < 2)
		) {
			setError('Please provide at least 2 options for choice questions');
			return;
		}

		try {
			const response = await api.put(`/admin/surveys/${surveyId}/questions`, form);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => (s._id === surveyId ? updatedSurvey : s)));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}

			// Reset form
			setQuestionForms(prev => ({
				...prev,
				[surveyId]: {
					text: '',
					options: [],
					type: QUESTION_TYPE.SINGLE_CHOICE,
					correctAnswer: undefined,
					points: undefined,
				},
			}));
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to add question');
		}
	};

	const updateQuestion = async (
		surveyId: string,
		questionIndex: number,
		questionData: unknown
	) => {
		try {
			const response = await api.patch(
				`/admin/surveys/${surveyId}/questions/${questionIndex}`,
				questionData
			);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => (s._id === surveyId ? updatedSurvey : s)));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
			return updatedSurvey;
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to update question');
			throw err;
		}
	};

	const deleteQuestion = async (surveyId: string, questionIndex: number) => {
		if (!window.confirm('Are you sure you want to delete this question?')) return;

		try {
			const response = await api.delete(
				`/admin/surveys/${surveyId}/questions/${questionIndex}`
			);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => (s._id === surveyId ? updatedSurvey : s)));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to delete question');
		}
	};

	const duplicateSurvey = async (surveyId: string) => {
		const survey = surveys.find(s => s._id === surveyId);
		if (!survey) {
			setError('Survey not found');
			return;
		}

		if (!window.confirm(t('survey.duplicateConfirm', { title: survey.title }))) {
			return;
		}

		setLoading(true);
		setError('');
		try {
			const duplicatedSurveyData = {
				title: `${survey.title} (Copy)`,
				description: survey.description,
				slug: `${survey.slug}-copy-${Date.now()}`,
				type: survey.type,
				questions: survey.questions,
				status: SURVEY_STATUS.DRAFT,
				timeLimit: survey.timeLimit,
				maxAttempts: survey.maxAttempts,
				instructions: survey.instructions,
				navigationMode: survey.navigationMode,
				sourceType: survey.sourceType,
				questionBankId: survey.questionBankId,
				questionCount: survey.questionCount,
				multiQuestionBankConfig: survey.multiQuestionBankConfig || [],
				selectedQuestions: survey.selectedQuestions || [],
				securitySettings: survey.securitySettings || {
					antiCheatEnabled: false,
				},
				scoringSettings: survey.scoringSettings || {
					scoringMode: SCORING_MODE.PERCENTAGE,
					totalPoints: 0,
					passingThreshold: 70,
					showScore: false,
					showCorrectAnswers: true,
					showScoreBreakdown: true,
					customScoringRules: {
						useCustomPoints: false,
						defaultQuestionPoints: 1,
					},
				},
				isActive: false,
			};

			const response = await api.post('/admin/surveys', duplicatedSurveyData);
			setSurveys([...surveys, response.data]);
			return response.data;
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to duplicate survey');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		surveys,
		selectedSurvey,
		newSurvey,
		setNewSurvey,
		editForm,
		setEditForm,
		questionForms,
		setQuestionForms,
		editingQuestions,
		setEditingQuestions,
		showCreateModal,
		setShowCreateModal,
		showEditModal,
		setShowEditModal,
		showScoringModal,
		setShowScoringModal,
		stats,
		statsView,
		setStatsView,
		loading,
		error,
		setError,
		// Functions
		loadSurveys,
		refreshSurveys,
		createSurvey,
		updateSurvey,
		deleteSurvey,
		toggleSurveyStatus,
		handleSurveyClick,
		handleBackToList,
		openEditModal,
		closeEditModal,
		loadStats,
		addQuestion,
		updateQuestion,
		deleteQuestion,
		duplicateSurvey,
	};
};
