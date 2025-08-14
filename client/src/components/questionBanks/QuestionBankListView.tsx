import React from 'react';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useAdmin } from '../../contexts/AdminContext';
import QuestionBankCard from './QuestionBankCard';
import { useTranslation } from 'react-i18next';

const QuestionBankListView: React.FC = () => {
	const { questionBanks } = useQuestionBanks();
	const { setShowQuestionBankModal } = useAdmin();
    const { t, i18n } = useTranslation('admin');

    React.useEffect(() => {
        i18n.loadNamespaces(['admin']).catch(() => {});
    }, [i18n]);

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<h2 className='text-xl font-semibold text-gray-800'>{t('questionBanks.title', 'Question Banks')}</h2>
                <div className='flex gap-2'>
                    <button className='btn-primary' onClick={() => setShowQuestionBankModal(true)}>
						+ {t('questionBanks.createButton', 'Create Question Bank')}
					</button>
				</div>
			</div>

			{questionBanks.length === 0 ? (
				<div className='text-center py-8 text-gray-500'>
					<p>{t('questionBanks.empty.title', 'No question banks yet')}</p>
					<p className='text-sm mt-2'>{t('questionBanks.empty.description', 'Create your first question bank to get started.')}</p>
				</div>
			) : (
				<div className='grid gap-4'>
					{questionBanks.map(bank => (
						<QuestionBankCard key={bank._id} bank={bank} />
					))}
				</div>
			)}
		</div>
	);
};

export default QuestionBankListView;
