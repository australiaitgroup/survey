import { useState } from 'react';
import { QUESTION_TYPE } from '../../../constants';
import type { Survey, QuestionForm } from '../../../types/admin';

interface UseLocalQuestionEditingParams {
	survey: Survey;
	setQuestionForms: (
		updater: (prev: Record<string, QuestionForm>) => Record<string, QuestionForm>
	) => void;
	addQuestion: (surveyId: string, formData: any) => Promise<void>;
	updateQuestion: (surveyId: string, index: number, updateData: any) => Promise<void>;
	setLoading: (loading: boolean) => void;
	setError: (message: string) => void;
}

export const useLocalQuestionEditing = ({
	survey,
	setQuestionForms,
	addQuestion,
	updateQuestion,
	setLoading,
	setError,
}: UseLocalQuestionEditingParams) => {
	const [questionEditForms, setQuestionEditForms] = useState<Record<string, QuestionForm>>({});
	const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
	const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
	const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1);

	const addOption = (surveyId: string) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				imageUrl: null as any,
				descriptionImage: null as any,
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: [...(currentForm.options || []), { text: '', imageUrl: null as any }],
				},
			};
		});
	};

	const removeOption = (surveyId: string, index: number) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				imageUrl: null as any,
				descriptionImage: null as any,
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
				imageUrl: null as any,
				descriptionImage: null as any,
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			const newOptions = [...(currentForm.options || [])];
			newOptions[index] = value as any;
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: newOptions,
				},
			};
		});
	};

	const addQuestionModalHandler = async (form: any) => {
		try {
			setLoading(true);
			const formData: any = { text: form.text, type: form.type };
			if (form.descriptionImage) formData.descriptionImage = form.descriptionImage;
			if (form.type !== QUESTION_TYPE.SHORT_TEXT && form.options)
				formData.options = form.options;
			if (form.correctAnswer !== undefined) formData.correctAnswer = form.correctAnswer;
			if (form.points !== undefined) formData.points = form.points;
			await addQuestion(survey._id, formData);
			setQuestionForms(prev => ({
				...prev,
				[survey._id]: {
					text: '',
					imageUrl: null as any,
					descriptionImage: null as any,
					options: ['', ''],
					type: QUESTION_TYPE.SINGLE_CHOICE,
					correctAnswer: undefined,
					points: undefined,
				},
			}));
			setShowAddQuestionModal(false);
			setLoading(false);
		} catch (err: any) {
			console.error('Add question error:', err);
			setError(err?.response?.data?.error || 'Failed to add question. Please try again.');
			setLoading(false);
		}
	};

	const startEditQuestion = (surveyId: string, questionIndex: number) => {
		const question = survey.questions[questionIndex];
		const formKey = `${surveyId}-${questionIndex}`;
		let questionType = question.type;
		if (!questionType) {
			if (!question.options || question.options.length === 0)
				questionType = QUESTION_TYPE.SHORT_TEXT;
			else questionType = QUESTION_TYPE.SINGLE_CHOICE;
		}
		setQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				text: question.text,
				description: question.description || '',
				imageUrl: (question as any).imageUrl || null,
				descriptionImage: question.descriptionImage || null,
				type: questionType as any,
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
			const updateData: any = { text: form.text, type: form.type };
			if (form.description !== undefined) updateData.description = form.description;
			if (form.descriptionImage !== undefined)
				updateData.descriptionImage = form.descriptionImage;
			if ((form as any).imageUrl !== undefined) updateData.imageUrl = (form as any).imageUrl;
			if (form.type !== QUESTION_TYPE.SHORT_TEXT) {
				updateData.options = form.options || [];
				if (form.correctAnswer !== undefined) updateData.correctAnswer = form.correctAnswer;
			} else {
				if (
					form.correctAnswer &&
					typeof form.correctAnswer === 'string' &&
					form.correctAnswer.trim()
				) {
					updateData.correctAnswer = form.correctAnswer;
				}
			}
			if (form.points !== undefined) updateData.points = form.points;
			await updateQuestion(survey._id, editingQuestionIndex, updateData);
			setShowEditQuestionModal(false);
			setEditingQuestionIndex(-1);
			setLoading(false);
		} catch (err: any) {
			console.error('Update question error:', err);
			setError(err?.response?.data?.error || 'Failed to update question. Please try again.');
			setLoading(false);
		}
	};

	const handleQuestionEditChange = (
		surveyId: string,
		questionIndex: number,
		field: string,
		value: any
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		setQuestionEditForms(prev => {
			const currentForm = prev[formKey];
			const updatedForm: any = { ...currentForm, [field]: value };
			if (field === 'type' && value === QUESTION_TYPE.SHORT_TEXT) {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			} else if (
				field === 'type' &&
				(value === QUESTION_TYPE.SINGLE_CHOICE || value === QUESTION_TYPE.MULTIPLE_CHOICE)
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}
			return { ...prev, [formKey]: updatedForm };
		});
	};

	const handleQuestionEditOptionChange = (
		surveyId: string,
		questionIndex: number,
		optionIndex: number,
		value: any
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey] as any;
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
		const currentForm = questionEditForms[formKey] as any;
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: [...(currentForm.options || []), { text: '', imageUrl: null as any }],
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
		const currentForm = questionEditForms[formKey] as any;
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: (currentForm.options || []).filter(
						(_: any, i: number) => i !== optionIndex
					),
				},
			}));
		}
	};

	const toggleCorrectAnswer = (surveyId: string, questionIndex: number, optionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey] as any;
		if (currentForm) {
			const isCorrect = Array.isArray(currentForm.correctAnswer)
				? currentForm.correctAnswer.includes(optionIndex)
				: currentForm.correctAnswer === optionIndex;

			let newCorrectAnswer: any;
			if (isCorrect) {
				if (Array.isArray(currentForm.correctAnswer)) {
					newCorrectAnswer = currentForm.correctAnswer.filter(
						(i: number) => i !== optionIndex
					);
					if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
				} else {
					newCorrectAnswer = undefined;
				}
			} else {
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

	return {
		questionEditForms,
		setQuestionEditForms,
		showAddQuestionModal,
		setShowAddQuestionModal,
		showEditQuestionModal,
		setShowEditQuestionModal,
		editingQuestionIndex,
		setEditingQuestionIndex,
		addOption,
		removeOption,
		handleOptionChange,
		addQuestionModalHandler,
		startEditQuestion,
		cancelEditQuestion,
		handleEditQuestionSubmit,
		handleQuestionEditChange,
		handleQuestionEditOptionChange,
		addQuestionEditOption,
		removeQuestionEditOption,
		toggleCorrectAnswer,
	};
};
