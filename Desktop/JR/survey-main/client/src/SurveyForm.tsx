import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import api from './utils/axiosConfig';

interface Question {
	id: string;
	text: string;
	type: string;
	options: string[];
}

interface SurveyFormProps {
	questions: Question[];
}

// Form values type with dynamic keys for questions
export type SurveyFormValues = {
	name: string;
	email: string;
} & Record<string, string | string[]>;

const SurveyForm: React.FC<SurveyFormProps> = ({ questions }) => {
	const { t } = useTranslation('survey');
	const { t: tCommon } = useTranslation(); // 默认命名空间用于通用翻译

	// Build validation schema based on question ids
	const schema = React.useMemo(() => {
		const questionShape: Record<string, z.ZodTypeAny> = {};
		for (const q of questions) {
			if (q.type === 'multiple_choice') {
				questionShape[q.id] = z.array(z.string()).min(1, t('form.pleaseSelectOption'));
			} else {
				questionShape[q.id] = z.string().nonempty(t('form.pleaseSelectOption'));
			}
		}
		return z
			.object({
				name: z.string().nonempty(t('form.nameRequired')),
				email: z.string().email(t('form.emailInvalid')),
			})
			.extend(questionShape);
	}, [questions, t]);

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
		getValues,
	} = useForm<SurveyFormValues>({
		resolver: zodResolver(schema),
	});

	// Handle multiple choice changes
	const handleMultipleChoiceChange = (
		questionId: string,
		optionValue: string,
		checked: boolean
	) => {
		const currentAnswers = (getValues(questionId) as string[]) || [];
		let newAnswers: string[];

		if (checked) {
			newAnswers = [...currentAnswers, optionValue];
		} else {
			newAnswers = currentAnswers.filter(answer => answer !== optionValue);
		}

		setValue(questionId, newAnswers);
	};

	const onSubmit = async (data: SurveyFormValues) => {
		await api.post('/submit', data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-4 max-w-xl mx-auto'>
			<div>
				<label className='block mb-1 font-semibold'>{tCommon('common.name')}</label>
				<input className='w-full p-2 border rounded' {...register('name')} />
				{errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
			</div>

			<div>
				<label className='block mb-1 font-semibold'>{tCommon('common.email')}</label>
				<input type='email' className='w-full p-2 border rounded' {...register('email')} />
				{errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
			</div>

			{questions.map(q => (
				<div key={q.id}>
					<label className='block mb-1 font-semibold'>{q.text}</label>
					{q.type === 'short_text' ? (
						<textarea
							className='w-full p-3 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors'
							placeholder={t('form.enterAnswerHere')}
							rows={4}
							{...register(q.id)}
						/>
					) : q.type === 'single_choice' ? (
						// Single choice options - radio buttons
						q.options.map((opt, index) => {
							const optionValue = typeof opt === 'string' ? opt : opt.text;
							const optionText = typeof opt === 'string' ? opt : opt.text;
							return (
								<label key={`${q.id}-${index}`} className='block'>
									<input
										type='radio'
										value={optionValue}
										{...register(q.id)}
										className='mr-2'
									/>
									{optionText}
								</label>
							);
						})
					) : q.type === 'multiple_choice' ? (
						// Multiple choice options - checkboxes
						q.options.map((opt, index) => {
							const optionValue = typeof opt === 'string' ? opt : opt.text;
							const optionText = typeof opt === 'string' ? opt : opt.text;
							const currentAnswers = (watch(q.id) as string[]) || [];
							return (
								<label key={`${q.id}-${index}`} className='block'>
									<input
										type='checkbox'
										value={optionValue}
										checked={currentAnswers.includes(optionValue)}
										onChange={e =>
											handleMultipleChoiceChange(
												q.id,
												optionValue,
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{optionText}
								</label>
							);
						})
					) : (
						// Default case - unsupported question type
						<div className='text-red-500 p-2 border border-red-300 rounded'>
							Unsupported question type: {q.type}
						</div>
					)}
					{errors[q.id] && (
						<p className='text-red-500 text-sm'>{(errors as any)[q.id]?.message}</p>
					)}
				</div>
			))}

			<button className='px-4 py-2 bg-blue-500 text-white rounded' type='submit'>
				{tCommon('buttons.submit')}
			</button>
		</form>
	);
};

export default SurveyForm;
