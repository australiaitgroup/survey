import React, { useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAdmin } from '../contexts/AdminContext';
import { QuestionBank, Question } from '../types/admin';

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

	// Load question banks
	useEffect(() => {
		if (loggedIn) {
			loadQuestionBanks();
		}
	}, [loggedIn]);

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
			const response = await api.get('/admin/question-banks');
			setQuestionBanks(response.data);
		} catch (err) {
			console.error('Error loading question banks:', err);
			setError('Failed to load question banks');
		}
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

		const questionData: unknown = {
			text: currentForm.text,
			type: currentForm.type,
			points: currentForm.points,
			explanation: currentForm.explanation,
			tags: currentForm.tags,
			difficulty: currentForm.difficulty,
		};

		// Add description image if provided
		if (currentForm.descriptionImage) {
			questionData.descriptionImage = currentForm.descriptionImage;
		}

		// For choice questions, add options and correctAnswer
		if (currentForm.type !== 'short_text') {
			if (currentForm.options) {
				// Use the already filtered options from above
				questionData.options = filteredOptions;
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
