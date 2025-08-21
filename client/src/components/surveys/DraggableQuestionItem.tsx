import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question } from '../../types/admin';
import { QUESTION_TYPE, TYPES_REQUIRING_ANSWERS } from '../../constants';

interface DraggableQuestionItemProps {
	question: Question;
	index: number;
	surveyType: string;
	onEdit: () => void;
	onDelete: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}

const DraggableQuestionItem: React.FC<DraggableQuestionItemProps> = ({
	question,
	index,
	surveyType,
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}) => {
	const { t } = useTranslation();

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `question-${index}`,
	});

	// Debug log (only when dragging)
	if (isDragging) {
		console.log(`Question ${index} is being dragged:`, {
			id: `question-${index}`,
			questionId: question._id,
			text: question.text?.substring(0, 30),
		});
	}

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const getQuestionTypeLabel = (type: string) => {
		switch (type) {
			case QUESTION_TYPE.MULTIPLE_CHOICE:
				return t('question.type.multipleChoice', 'Multiple Choice');
			case QUESTION_TYPE.SINGLE_CHOICE:
				return t('question.type.singleChoice', 'Single Choice');
			case QUESTION_TYPE.SHORT_TEXT:
				return t('question.type.shortText', 'Short Text');
			default:
				return t('question.type.singleChoice', 'Single Choice');
		}
	};

	const getQuestionTypeStyle = (type: string) => {
		switch (type) {
			case QUESTION_TYPE.MULTIPLE_CHOICE:
				return 'bg-purple-100 text-purple-800';
			case QUESTION_TYPE.SINGLE_CHOICE:
				return 'bg-green-100 text-green-800';
			case QUESTION_TYPE.SHORT_TEXT:
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`bg-gray-50 rounded-lg p-3 ${
				isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
			} transition-all duration-200`}
		>
			<div className='flex items-start gap-3'>
				{/* Drag Handle */}
				<div
					{...attributes}
					{...listeners}
					className='flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 transition-colors'
					title={t('dragHandle.tooltip', 'Drag to reorder')}
				>
					<svg className='w-5 h-5 text-gray-400' fill='currentColor' viewBox='0 0 20 20'>
						<path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM7 11a1 1 0 100 2h6a1 1 0 100-2H7zM5 15a1 1 0 100 2h10a1 1 0 100-2H5z' />
					</svg>
				</div>

				{/* Question Content */}
				<div className='flex-1 min-w-0'>
					<div className='flex justify-between items-start mb-1'>
						<div className='flex-1'>
							<div className='flex items-center gap-2 mb-1'>
								<span className='font-medium text-gray-800'>
									{index + 1}. {question.text}
								</span>
								<span
									className={`text-xs px-2 py-1 rounded ${getQuestionTypeStyle(question.type)}`}
								>
									{getQuestionTypeLabel(question.type)}
								</span>
								{question.imageUrl && (
									<span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
										📷 {t('question.hasImage', 'Has Image')}
									</span>
								)}
								{TYPES_REQUIRING_ANSWERS.includes(surveyType as any) && (
									<div className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
										{question.points || 1} {t('question.points', 'pts')}
									</div>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex items-center gap-2'>
							{/* Mobile fallback buttons */}
							<div className='md:hidden flex gap-1'>
								{!isFirst && onMoveUp && (
									<button
										className='p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded'
										onClick={onMoveUp}
										title={t('question.moveUp', 'Move up')}
									>
										<svg
											className='w-4 h-4'
											fill='currentColor'
											viewBox='0 0 20 20'
										>
											<path
												fillRule='evenodd'
												d='M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'
												clipRule='evenodd'
											/>
										</svg>
									</button>
								)}
								{!isLast && onMoveDown && (
									<button
										className='p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded'
										onClick={onMoveDown}
										title={t('question.moveDown', 'Move down')}
									>
										<svg
											className='w-4 h-4'
											fill='currentColor'
											viewBox='0 0 20 20'
										>
											<path
												fillRule='evenodd'
												d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
												clipRule='evenodd'
											/>
										</svg>
									</button>
								)}
							</div>

							<button className='btn-secondary text-sm px-3 py-1' onClick={onEdit}>
								{t('question.edit', 'Edit')}
							</button>
							<button
								className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
								onClick={onDelete}
							>
								{t('question.delete', 'Delete')}
							</button>
						</div>
					</div>

					{/* Question Details */}
					{question.type === QUESTION_TYPE.SHORT_TEXT ? (
						<div className='text-sm text-gray-600 mb-1'>
							<div className='font-medium'>
								{t('question.type.textResponse', 'Type: Text Response')}
							</div>
							{TYPES_REQUIRING_ANSWERS.includes(surveyType as any) &&
								question.correctAnswer &&
								typeof question.correctAnswer === 'string' && (
								<div className='text-xs text-green-600 font-medium mt-1'>
										✓ {t('question.expectedAnswer', 'Expected Answer')}:{' '}
									{question.correctAnswer}
								</div>
							)}
						</div>
					) : (
						<div className='text-sm text-gray-600 mb-1'>
							{t('question.options', 'Options')}:{' '}
							{question.options &&
								question.options.map((opt, optIdx) => {
									const isCorrect = Array.isArray(question.correctAnswer)
										? question.correctAnswer.includes(optIdx)
										: question.correctAnswer === optIdx;
									return (
										<span
											key={optIdx}
											className={`${
												TYPES_REQUIRING_ANSWERS.includes(
													surveyType as any
												) && isCorrect
													? 'font-semibold text-green-600'
													: ''
											}`}
										>
											{typeof opt === 'string' ? opt : (opt as any).text}
											{optIdx < (question.options?.length || 0) - 1 && ', '}
										</span>
									);
								})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default DraggableQuestionItem;
