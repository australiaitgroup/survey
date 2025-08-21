import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableQuestionItem from './DraggableQuestionItem';
import { Question } from '../../types/admin';

interface DroppableQuestionListProps {
	questions: Question[];
	surveyId: string;
	surveyType: string;
	onQuestionsReorder: (newOrder: Question[]) => void;
	onEditQuestion: (questionIndex: number) => void;
	onDeleteQuestion: (questionIndex: number) => void;
	onAddQuestion: () => void;
	loading?: boolean;
}

const DroppableQuestionList: React.FC<DroppableQuestionListProps> = ({
	questions,
	surveyId,
	surveyType,
	onQuestionsReorder,
	onEditQuestion,
	onDeleteQuestion,
	onAddQuestion,
	loading = false,
}) => {
	const { t } = useTranslation();
	const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Minimum distance to start dragging
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragStart = (event: any) => {
		const { active } = event;
		const questionIndex = parseInt(active.id.split('-')[1]);
		setDraggedQuestionIndex(questionIndex);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setDraggedQuestionIndex(null);

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = parseInt(active.id.toString().split('-')[1]);
		const newIndex = parseInt(over.id.toString().split('-')[1]);

		if (oldIndex !== newIndex && !isNaN(oldIndex) && !isNaN(newIndex)) {
			const newQuestions = arrayMove(questions, oldIndex, newIndex);

			onQuestionsReorder(newQuestions);
		} else {
			console.error('Invalid indices for reorder:', { oldIndex, newIndex });
		}
	};

	const handleMoveUp = (questionIndex: number) => {
		if (questionIndex > 0) {
			const newQuestions = arrayMove(questions, questionIndex, questionIndex - 1);
			onQuestionsReorder(newQuestions);
		}
	};

	const handleMoveDown = (questionIndex: number) => {
		if (questionIndex < questions.length - 1) {
			const newQuestions = arrayMove(questions, questionIndex, questionIndex + 1);
			onQuestionsReorder(newQuestions);
		}
	};

	const items = questions.map((_, index) => `question-${index}`);

	if (loading) {
		return (
			<div className='mb-4'>
				<div className='flex justify-between items-center mb-3'>
					<h4 className='font-semibold text-gray-800'>
						{t('survey.questions.title', 'Questions')} (...)
					</h4>
					<button className='btn-primary text-sm opacity-50 cursor-not-allowed' disabled>
						+ {t('survey.questions.add', 'Add Question')}
					</button>
				</div>
				<div className='text-center py-8 text-gray-500'>
					{t('common.loading', 'Loading...')}
				</div>
			</div>
		);
	}

	return (
		<div className='mb-4'>
			<div className='flex justify-between items-center mb-3'>
				<h4 className='font-semibold text-gray-800'>
					{t('survey.questions.title', 'Questions')} ({questions.length})
				</h4>
				<button className='btn-primary text-sm' onClick={onAddQuestion} type='button'>
					+ {t('survey.questions.add', 'Add Question')}
				</button>
			</div>

			{questions.length === 0 ? (
				<div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg'>
					<div className='mb-2'>
						<svg
							className='w-12 h-12 mx-auto text-gray-300'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={1}
								d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
					</div>
					<p className='text-lg font-medium text-gray-600 mb-2'>
						{t('survey.questions.empty.title', 'No questions yet')}
					</p>
					<p className='text-sm text-gray-500 mb-4'>
						{t(
							'survey.questions.empty.description',
							'Add your first question to get started'
						)}
					</p>
					<button className='btn-primary' onClick={onAddQuestion} type='button'>
						+ {t('survey.questions.add', 'Add Question')}
					</button>
				</div>
			) : (
				<>
					{/* Drag and Drop Instructions */}
					<div className='hidden md:block mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-sm text-blue-700'>
							💡{' '}
							{t(
								'survey.questions.dragInstructions',
								'Tip: Drag questions by the handle (⋮⋮) to reorder them. Changes are saved automatically.'
							)}
						</p>
					</div>

					{/* Mobile Instructions */}
					<div className='md:hidden mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-sm text-blue-700'>
							📱{' '}
							{t(
								'survey.questions.mobileInstructions',
								'Use the up/down arrow buttons to reorder questions on mobile devices.'
							)}
						</p>
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<SortableContext items={items} strategy={verticalListSortingStrategy}>
							<div className='space-y-2'>
								{questions.map((question, index) => (
									<DraggableQuestionItem
										key={`${surveyId}-question-${index}`}
										question={question}
										index={index}
										surveyType={surveyType}
										onEdit={() => onEditQuestion(index)}
										onDelete={() => onDeleteQuestion(index)}
										onMoveUp={() => handleMoveUp(index)}
										onMoveDown={() => handleMoveDown(index)}
										isFirst={index === 0}
										isLast={index === questions.length - 1}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>

					{/* Auto-save indicator */}
					{draggedQuestionIndex !== null && (
						<div className='mt-2 text-xs text-blue-600 flex items-center gap-1'>
							<svg
								className='w-3 h-3 animate-spin'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
								/>
							</svg>
							{t('survey.questions.autoSaving', 'Saving order...')}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default DroppableQuestionList;
