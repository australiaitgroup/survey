import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuestionNavigatorProps {
	currentQuestion: number;
	totalQuestions: number;
	canProceed: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSubmit: () => void;
	loading?: boolean;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
	currentQuestion,
	totalQuestions,
	canProceed,
	onPrevious,
	onNext,
	onSubmit,
	loading = false,
}) => {
	const { t } = useTranslation('survey');
	const isFirstQuestion = currentQuestion === 0;
	const isLastQuestion = currentQuestion === totalQuestions - 1;

	return (
		<div className='flex justify-between items-center pt-6 mt-6 md:sticky md:bottom-0 md:bg-white md:rounded-t-2xl md:px-4 md:py-3 md:shadow-none'>
			{/* Previous Button */}
			<button
				type='button'
				onClick={onPrevious}
				disabled={isFirstQuestion || loading}
				className={`flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium transition-all duration-200 ${
					isFirstQuestion || loading
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-white text-[#484848] hover:bg-gray-50'
				}`}
			>
				<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M15 19l-7-7 7-7'
					/>
				</svg>
				{t('navigation.previous', 'Previous')}
			</button>

			{/* Progress Indicator */}
			<div className='flex items-center gap-3'>
				<div className='text-sm text-[#767676] font-medium'>
					{t('navigation.progress', 'Question {{current}} of {{total}}', {
						current: currentQuestion + 1,
						total: totalQuestions,
					})}
				</div>

				{/* Progress Bar */}
				<div className='w-44 h-2 bg-[#EBEBEB] rounded-full overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-[#FF5A5F] to-[#FF8A8D] transition-all duration-500 ease-out'
						style={{
							width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
						}}
					/>
				</div>
			</div>

			{/* Next/Submit Button */}
			{isLastQuestion ? (
				<button
					type='submit'
					disabled={!canProceed || loading}
					className={`flex items-center gap-2 px-4 py-2 sm:px-7 sm:py-2.5 rounded-lg font-medium transition-all duration-200 ${
						!canProceed || loading
							? 'bg-gray-100 text-gray-400 cursor-not-allowed'
							: 'bg-[#FF5A5F] text-white hover:bg-[#E54A4F]'
					}`}
				>
					{loading ? (
						<>
							<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
							{t('navigation.submitting', 'Submitting...')}
						</>
					) : (
						<>
							{t('navigation.submit', 'Submit Survey')}
							<svg
								className='w-4 h-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M5 13l4 4L19 7'
								/>
							</svg>
						</>
					)}
				</button>
			) : (
				<button
					type='button'
					onClick={onNext}
					disabled={!canProceed || loading}
					className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-medium transition-all duration-200 ${
						!canProceed || loading
							? 'bg-gray-100 text-gray-400 cursor-not-allowed'
							: 'bg-[#FF5A5F] text-white hover:bg-[#E54A4F]'
					}`}
				>
					{t('navigation.next', 'Next')}
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M9 5l7 7-7 7'
						/>
					</svg>
				</button>
			)}
		</div>
	);
};

export default QuestionNavigator;
