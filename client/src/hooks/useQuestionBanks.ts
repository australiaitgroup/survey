import React, { useEffect, useRef } from 'react';
import api from '../utils/axiosConfig';
import { useAdmin } from '../contexts/AdminContext';
import { QuestionBank, Question } from '../types/admin';
import { usePublicBanksForSurvey, PublicBankForSurvey } from './usePublicBanksForSurvey';

export const useQuestionBanks = () => {
	const {
		questionBanks,
		setQuestionBanks,
		selectedQuestionBankDetail,
		setSelectedQuestionBankDetail,
		questionBankForm,
		setQuestionBankForm,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		showQuestionBankModal,
		setShowQuestionBankModal,
		questionBankDetailTab,
		setQuestionBankDetailTab,
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

	// Get authorized public banks to include in "My Banks"
	const { authorized: authorizedPublicBanks, refresh: refreshPublicBanks } = usePublicBanksForSurvey();

	// Track if question banks have been loaded to prevent duplicate calls
	const questionBanksLoadedRef = useRef(false);

	// Load question banks - only once when logged in
	useEffect(() => {
		if (loggedIn && !questionBanksLoadedRef.current) {
			questionBanksLoadedRef.current = true;
			loadQuestionBanks();
		}
	}, [loggedIn]);

	// Reload question banks when authorized public banks change
	useEffect(() => {
		if (loggedIn && questionBanksLoadedRef.current) {
			loadQuestionBanks();
		}
	}, [authorizedPublicBanks, loggedIn]);

	// Handle URL routing for question banks
	useEffect(() => {
		if (!loggedIn || questionBanks.length === 0) return;

		const path = location.pathname;
		if (path.startsWith('/admin/question-bank/')) {
			const questionBankId = path.split('/').pop();
			if (questionBankId && !selectedQuestionBankDetail) {
				const questionBank = questionBanks.find(qb => qb._id === questionBankId);
				if (questionBank) {
					setSelectedQuestionBankDetail(questionBank);
				} else {
					navigate('/admin/question-banks');
				}
			}
		}
	}, [questionBanks, loggedIn, location.pathname, selectedQuestionBankDetail]);

	// Set tab based on current path
	useEffect(() => {
		if (!loggedIn) return;

		const path = location.pathname;
		if (path === '/admin/question-banks' || path.startsWith('/admin/question-bank/')) {
			if (tab !== 'question-banks') {
				setTab('question-banks');
			}
		}
	}, [location.pathname, loggedIn, tab]);

	const loadQuestionBanks = async () => {
		try {
			// Load local question banks only (not mixing with purchased ones)
			const localResponse = await api.get('/admin/question-banks');
			const localBanks = localResponse.data;
			setQuestionBanks(localBanks);
		} catch (err) {
			console.error('Error loading question banks:', err);
			setError('Failed to load question banks');
		}
	};

	const refreshQuestionBanks = async () => {
		questionBanksLoadedRef.current = false;
		// Refresh both local and public banks
		await refreshPublicBanks();
		await loadQuestionBanks();
		questionBanksLoadedRef.current = true;
	};

	const createQuestionBank = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const response = await api.post('/admin/question-banks', questionBankForm);
			setQuestionBanks([...questionBanks, response.data]);
			setQuestionBankForm({ name: '', description: '' });
			setShowQuestionBankModal(false);
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to create question bank');
		} finally {
			setLoading(false);
		}
	};

	const updateQuestionBank = async (
		questionBankId: string,
		formData: { name: string; description: string }
	) => {
		// Check if this is a public bank - prevent editing
		const bank = questionBanks.find(qb => qb._id === questionBankId);
		if (bank?.isPublic) {
			setError('Cannot edit public question banks');
			throw new Error('Cannot edit public question banks');
		}

		setLoading(true);
		setError('');
		try {
			const response = await api.put(`/admin/question-banks/${questionBankId}`, formData);
			const updatedQuestionBank = response.data;

			setQuestionBanks(prev =>
				prev.map(qb => (qb._id === questionBankId ? updatedQuestionBank : qb))
			);

			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to update question bank');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const deleteQuestionBank = async (questionBankId: string) => {
		// Check if this is a public bank - prevent deletion
		const bank = questionBanks.find(qb => qb._id === questionBankId);
		if (bank?.isPublic) {
			setError('Cannot delete public question banks');
			return;
		}

		if (!window.confirm('Are you sure you want to delete this question bank?')) return;

		try {
			await api.delete(`/admin/question-banks/${questionBankId}`);
			setQuestionBanks(questionBanks.filter(qb => qb._id !== questionBankId));
			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(null);
				setTab('question-banks');
				navigate('/admin/question-banks');
			}
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to delete question bank');
		}
	};

	const handleQuestionBankClick = (questionBank: QuestionBank) => {
		console.log('Clicking question bank:', questionBank.name, questionBank._id);
		setSelectedQuestionBankDetail(questionBank);
		setQuestionBankDetailTab('detail');
		navigate(`/admin/question-bank/${questionBank._id}`);
	};

	const handleQuestionBankBackToList = () => {
		setSelectedQuestionBankDetail(null);
		setQuestionBankDetailTab('list');
		navigate('/admin/question-banks');
	};

	const addQuestionBankQuestion = async (questionBankId: string, formData?: unknown) => {
		// Check if this is a public bank - prevent adding questions
		const bank = questionBanks.find(qb => qb._id === questionBankId);
		if (bank?.isPublic) {
			setError('Cannot add questions to public question banks');
			throw new Error('Cannot add questions to public question banks');
		}

		const currentForm = formData || questionBankQuestionForms[questionBankId];

		if (!currentForm || !currentForm.text.trim()) {
			setError('Question text is required');
			throw new Error('Question text is required');
		}

		// Declare filteredOptions in the outer scope
		let filteredOptions: unknown[] = [];

		// For choice-based questions, validate options and correct answer
		if (currentForm.type !== 'short_text') {
			if (!currentForm.options || currentForm.options.length < 2) {
				setError('At least 2 options are required for choice questions');
				throw new Error('At least 2 options are required for choice questions');
			}

			// Filter out empty options (handle both string and object formats)
			filteredOptions = currentForm.options.filter((opt: unknown) => {
				if (typeof opt === 'string') {
					return opt.trim();
				} else if (typeof opt === 'object' && opt !== null) {
					return (opt as { text?: string }).text?.trim();
				}
				return false;
			});

			// Additional validation
			if (filteredOptions.length < 2) {
				setError('At least 2 valid options are required');
				throw new Error('At least 2 valid options are required');
			}

			if (currentForm.correctAnswer === undefined || currentForm.correctAnswer === null) {
				setError('Please select a correct answer');
				throw new Error('Please select a correct answer');
			}
		}

        const questionData: any = {
            text: currentForm.text,
            type: currentForm.type,
            points: currentForm.points,
            explanation: currentForm.explanation,
            tags: currentForm.tags,
            difficulty: currentForm.difficulty,
            // Include description when adding a question to the bank
            description: currentForm.description || '',
        };

		// Add description image if provided
		if (currentForm.descriptionImage) {
			questionData.descriptionImage = currentForm.descriptionImage;
		}

		// For choice questions, add options and correctAnswer
		if (currentForm.type !== 'short_text') {
            if (currentForm.options) {
                // Normalize to array of strings for API
                questionData.options = filteredOptions.map((opt: any) =>
                    typeof opt === 'string' ? opt : (opt?.text || '')
                );
            }
			questionData.correctAnswer = currentForm.correctAnswer;
		} else {
			// For short_text, only add correctAnswer if it's provided and not empty
			if (
				currentForm.correctAnswer &&
				typeof currentForm.correctAnswer === 'string' &&
				currentForm.correctAnswer.trim()
			) {
				questionData.correctAnswer = currentForm.correctAnswer.trim();
			}
		}

		try {
			const response = await api.post(
				`/admin/question-banks/${questionBankId}/questions`,
				questionData
			);
			const updatedQuestionBank = response.data;

			setQuestionBanks(prev =>
				prev.map(qb => (qb._id === questionBankId ? updatedQuestionBank : qb))
			);

			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}

			setQuestionBankQuestionForms(prev => ({
				...prev,
				[questionBankId]: { text: '', options: [], type: 'single_choice' as const },
			}));
		} catch (err: unknown) {
			setError(err.response?.data?.error || 'Failed to add question');
			throw err;
		}
	};

	const updateQuestionBankQuestion = async (
		questionBankId: string,
		questionIndex: number,
		formData: unknown
	) => {
		// Check if this is a public bank - prevent editing questions
		const bank = questionBanks.find(qb => qb._id === questionBankId);
		if (bank?.isPublic) {
			setError('Cannot edit questions in public question banks');
			throw new Error('Cannot edit questions in public question banks');
		}

		if (!selectedQuestionBankDetail) return;
		const question = selectedQuestionBankDetail.questions[questionIndex];
		if (!question) return;

		try {
			const response = await api.put(
				`/admin/question-banks/${questionBankId}/questions/${question._id}`,
				formData
			);
			const updatedQuestionBank = response.data;

			setQuestionBanks(prev =>
				prev.map(qb => (qb._id === questionBankId ? updatedQuestionBank : qb))
			);

			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
		} catch (err: unknown) {
			console.error('Error updating question bank question:', err);
			setError(err.response?.data?.error || 'Failed to update question');
			throw err;
		}
	};

	const deleteQuestionBankQuestion = async (questionBankId: string, questionIndex: number) => {
		// Check if this is a public bank - prevent deleting questions
		const bank = questionBanks.find(qb => qb._id === questionBankId);
		if (bank?.isPublic) {
			setError('Cannot delete questions from public question banks');
			return;
		}

		if (!window.confirm('Are you sure you want to delete this question?')) return;

		if (!selectedQuestionBankDetail) return;
		const question = selectedQuestionBankDetail.questions[questionIndex];
		if (!question) return;

		try {
			const response = await api.delete(
				`/admin/question-banks/${questionBankId}/questions/${question._id}`
			);
			const updatedQuestionBank = response.data;

			setQuestionBanks(prev =>
				prev.map(qb => (qb._id === questionBankId ? updatedQuestionBank : qb))
			);

			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
		} catch (err: unknown) {
			console.error('Error deleting question bank question:', err);
			setError(err.response?.data?.error || 'Failed to delete question');
		}
	};

	return {
		questionBanks,
		selectedQuestionBankDetail,
		questionBankForm,
		setQuestionBankForm,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		showQuestionBankModal,
		setShowQuestionBankModal,
		questionBankDetailTab,
		setQuestionBankDetailTab,
		loading,
		error,
		setError,
		// Functions
		loadQuestionBanks,
		refreshQuestionBanks,
		createQuestionBank,
		updateQuestionBank,
		deleteQuestionBank,
		handleQuestionBankClick,
		handleQuestionBankBackToList,
		addQuestionBankQuestion,
		updateQuestionBankQuestion,
		deleteQuestionBankQuestion,
	};
};
