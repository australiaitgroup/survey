import React, { useState, useCallback } from 'react';
import SafeMarkdown from '../survey/SafeMarkdown';

interface Question {
	_id: string;
	text: string;
	description?: string;
	type: 'single_choice' | 'multiple_choice' | 'short_text';
	options?: Array<{ text: string; imageUrl?: string }>;
	correctAnswer: any;
	explanation?: string;
	points: number;
	onboarding?: {
		hints: Array<{
			order: number;
			content: string;
			showAfterAttempts: number;
			isProgressive: boolean;
		}>;
		learningContext?: {
			background?: string;
			keyConcepts?: string[];
			relatedTopics?: string[];
		};
		learningObjectives?: string[];
		difficulty?: 'beginner' | 'intermediate' | 'advanced';
		maxAttempts?: number;
	};
}

interface Section {
	id: string;
	title: string;
	description: string;
	required: boolean;
	order: number;
}

interface QuestionRendererProps {
	question: Question;
	section?: Section;
	questionIndex: number;
	totalQuestions: number;
	attempts: number;
	onAnswerSubmit: (questionId: string, answer: any) => Promise<void>;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
	question,
	section,
	questionIndex,
	totalQuestions,
	attempts,
	onAnswerSubmit,
}) => {
	const [selectedAnswer, setSelectedAnswer] = useState<any>('');
	const [showHints, setShowHints] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
		explanation?: string;
	} | null>(null);

	// Get available hints based on attempts
	const availableHints =
		question.onboarding?.hints.filter(hint => hint.showAfterAttempts <= attempts) || [];

	// Handle answer change
	const handleAnswerChange = useCallback((value: any) => {
		setSelectedAnswer(value);
		setFeedback(null); // Clear previous feedback
	}, []);

	// Handle answer submission
	const handleSubmit = useCallback(async () => {
		if (!selectedAnswer || isSubmitting) return;

		setIsSubmitting(true);
		setFeedback(null);

		try {
			await onAnswerSubmit(question._id, selectedAnswer);

			// Clear answer for next question
			setSelectedAnswer('');
		} catch (error: any) {
			setFeedback({
				type: 'error',
				message: error.message || 'Failed to submit answer',
			});
		} finally {
			setIsSubmitting(false);
		}
	}, [selectedAnswer, isSubmitting, question._id, onAnswerSubmit]);

	// Check if max attempts reached
	const maxAttemptsReached =
		question.onboarding?.maxAttempts && attempts >= question.onboarding.maxAttempts;

	return (
		<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
			{/* Question Header */}
			<div className='mb-6'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center space-x-3'>
						<span className='inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium'>
							{questionIndex + 1}
						</span>
						<span className='text-sm text-gray-500'>
							Question {questionIndex + 1} of {totalQuestions}
						</span>
					</div>
					<div className='text-sm text-gray-500'>
						Attempts: {attempts}
						{question.onboarding?.maxAttempts &&
							` / ${question.onboarding.maxAttempts}`}
					</div>
				</div>

				{/* Section Info */}
				<div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
					<h3 className='text-sm font-medium text-blue-800 mb-1'>
						Current Section: {section?.title || 'Unknown Section'}
					</h3>
					<p className='text-sm text-blue-700'>{section?.description || 'No description available'}</p>
				</div>

				{/* Learning Context */}
				{question.onboarding?.learningContext && (
					<div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
						<h4 className='text-sm font-medium text-green-800 mb-2'>
							Learning Context
						</h4>
						{question.onboarding.learningContext.background && (
							<p className='text-sm text-green-700 mb-2'>
								{question.onboarding.learningContext.background}
							</p>
						)}
						{question.onboarding.learningContext.keyConcepts &&
							question.onboarding.learningContext.keyConcepts.length > 0 && (
								<div className='mb-2'>
									<span className='text-sm font-medium text-green-800'>
										Key Concepts:{' '}
									</span>
									<span className='text-sm text-green-700'>
										{question.onboarding.learningContext.keyConcepts.join(', ')}
									</span>
								</div>
							)}
					</div>
				)}

				{/* Learning Objectives */}
				{question.onboarding?.learningObjectives &&
					question.onboarding.learningObjectives.length > 0 && (
						<div className='bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4'>
							<h4 className='text-sm font-medium text-purple-800 mb-2'>
								Learning Objectives
							</h4>
							<ul className='text-sm text-purple-700 space-y-1'>
								{question.onboarding.learningObjectives.map((objective, index) => (
									<li key={index} className='flex items-start'>
										<span className='text-purple-500 mr-2 mt-1'>•</span>
										{objective}
									</li>
								))}
							</ul>
						</div>
					)}
			</div>

			{/* Question Content */}
			<div className='mb-6'>
				<h2 className='text-xl font-semibold text-gray-900 mb-4'>{question.text}</h2>

				{question.description && (
					<div className='prose prose-sm max-w-none mb-4'>
						<SafeMarkdown content={question.description} />
					</div>
				)}

				{/* Question Type Indicator */}
				<div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 bg-gray-100 text-gray-800'>
					{question.type === 'single_choice' && 'Single Choice'}
					{question.type === 'multiple_choice' && 'Multiple Choice'}
					{question.type === 'short_text' && 'Short Answer'}
				</div>
			</div>

			{/* Answer Options */}
			<div className='mb-6'>
				{question.type === 'single_choice' && question.options && (
					<div className='space-y-3'>
						{question.options.map((option, index) => (
							<label
								key={index}
								className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors duration-150 ${
									selectedAnswer === option.text
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-blue-300/60'
								}`}
							>
								<input
									type='radio'
									name={`question_${question._id}`}
									className='mt-1 mr-3'
									checked={selectedAnswer === option.text}
									onChange={() => handleAnswerChange(option.text)}
									disabled={maxAttemptsReached}
								/>
								<div className='flex-1'>
									<div className='text-gray-900'>{option.text}</div>
									{option.imageUrl && (
										<img
											src={option.imageUrl}
											alt='Option'
											className='mt-2 max-w-xs rounded-lg border border-gray-200'
										/>
									)}
								</div>
							</label>
						))}
					</div>
				)}

				{question.type === 'multiple_choice' && question.options && (
					<div className='space-y-3'>
						{question.options.map((option, index) => (
							<label
								key={index}
								className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors duration-150 ${
									Array.isArray(selectedAnswer) &&
									selectedAnswer.includes(option.text)
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-blue-300/60'
								}`}
							>
								<input
									type='checkbox'
									name={`question_${question._id}`}
									className='mt-1 mr-3'
									checked={
										Array.isArray(selectedAnswer) &&
										selectedAnswer.includes(option.text)
									}
									onChange={() => {
										const currentAnswers = Array.isArray(selectedAnswer)
											? selectedAnswer
											: [];
										if (currentAnswers.includes(option.text)) {
											handleAnswerChange(
												currentAnswers.filter(a => a !== option.text)
											);
										} else {
											handleAnswerChange([...currentAnswers, option.text]);
										}
									}}
									disabled={maxAttemptsReached}
								/>
								<div className='flex-1'>
									<div className='text-gray-900'>{option.text}</div>
									{option.imageUrl && (
										<img
											src={option.imageUrl}
											alt='Option'
											className='mt-2 max-w-xs rounded-lg border border-gray-200'
										/>
									)}
								</div>
							</label>
						))}
					</div>
				)}

				{question.type === 'short_text' && (
					<div>
						<textarea
							value={selectedAnswer}
							onChange={e => handleAnswerChange(e.target.value)}
							placeholder='Enter your answer here...'
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
							rows={4}
							disabled={maxAttemptsReached}
						/>
					</div>
				)}
			</div>

			{/* Hints Section */}
			{availableHints.length > 0 && (
				<div className='mb-6'>
					<div className='flex items-center justify-between mb-3'>
						<h4 className='text-sm font-medium text-gray-700'>
							Available Hints ({availableHints.length})
						</h4>
						<button
							onClick={() => setShowHints(!showHints)}
							className='text-sm text-blue-600 hover:text-blue-700 font-medium'
						>
							{showHints ? 'Hide Hints' : 'Show Hints'}
						</button>
					</div>

					{showHints && (
						<div className='space-y-3'>
							{availableHints.map((hint, index) => (
								<div
									key={index}
									className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'
								>
									<div className='flex items-start'>
										<span className='text-yellow-600 mr-2 mt-1'>💡</span>
										<div className='text-sm text-yellow-800'>
											<strong>Hint {hint.order}:</strong> {hint.content}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Feedback */}
			{feedback && (
				<div
					className={`mb-6 p-4 rounded-lg border ${
						feedback.type === 'success'
							? 'bg-green-50 border-green-200 text-green-800'
							: feedback.type === 'error'
								? 'bg-red-50 border-red-200 text-red-800'
								: 'bg-blue-50 border-blue-200 text-blue-800'
					}`}
				>
					<div className='flex items-start'>
						<span className='mr-2 mt-1'>
							{feedback.type === 'success'
								? '✅'
								: feedback.type === 'error'
									? '❌'
									: 'ℹ️'}
						</span>
						<div>
							<div className='font-medium'>{feedback.message}</div>
							{feedback.explanation && (
								<div className='text-sm mt-1'>{feedback.explanation}</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Submit Button */}
			<div className='flex items-center justify-between'>
				<div className='text-sm text-gray-500'>
					{question.points > 0 && `${question.points} points`}
					{question.onboarding?.difficulty &&
						` • ${question.onboarding.difficulty} level`}
				</div>

				<button
					onClick={handleSubmit}
					disabled={!selectedAnswer || isSubmitting || maxAttemptsReached}
					className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
						!selectedAnswer || isSubmitting || maxAttemptsReached
							? 'bg-gray-300 text-gray-500 cursor-not-allowed'
							: 'bg-blue-600 text-white hover:bg-blue-700'
					}`}
				>
					{isSubmitting ? 'Submitting...' : 'Submit Answer'}
				</button>
			</div>

			{/* Max Attempts Warning */}
			{maxAttemptsReached && (
				<div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
					<div className='text-sm text-red-800'>
						<strong>Maximum attempts reached.</strong> Please contact your instructor
						for assistance.
					</div>
				</div>
			)}
		</div>
	);
};

export default QuestionRenderer;
