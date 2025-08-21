import React from 'react';
import { QuestionBank } from '../../types/admin';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useTranslation } from 'react-i18next';

interface QuestionBankCardProps {
	bank: QuestionBank;
}

const QuestionBankCard: React.FC<QuestionBankCardProps> = ({ bank }) => {
	const { handleQuestionBankClick, deleteQuestionBank } = useQuestionBanks();
	const { t } = useTranslation('admin');

	return (
		<div
			className='card hover:shadow-lg transition-shadow cursor-pointer'
			onClick={() => handleQuestionBankClick(bank)}
		>
			<div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3'>
				<div className='flex-1'>
					<h3 className='text-base sm:text-lg font-bold text-gray-800'>{bank.name}</h3>
					{bank.description && (
						<p className='text-gray-600 mt-1 text-sm'>{bank.description}</p>
					)}
					<div className='flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500'>
						<span>
							{bank.questions.length} {t('questionBanks.meta.questions', 'questions')}
						</span>
						<span>
							{t('questionBanks.meta.created', 'Created')}:{' '}
							{new Date(bank.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
				<div className='flex gap-2'>
					<button
						className='btn-secondary text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2'
						onClick={e => {
							e.stopPropagation();
							handleQuestionBankClick(bank);
						}}
					>
						{t('questionBanks.viewDetails', 'View Details')}
					</button>
					<button
						className='px-2 sm:px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded-lg transition-colors'
						onClick={e => {
							e.stopPropagation();
							deleteQuestionBank(bank._id);
						}}
					>
						{t('questionBanks.delete', 'Delete')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default QuestionBankCard;
