import React, { useEffect, useState } from 'react';
import api from './utils/axiosConfig';

interface Question {
	id: string;
	text: string;
	options: string[];
}

const Survey: React.FC = () => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [formData, setFormData] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		api.get<Question[]>('/questions').then(res => setQuestions(res.data));
	}, []);

	const handleChange = (id: string, value: string) => {
		setFormData({ ...formData, [id]: value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await api.post('/response', formData);
		setSubmitted(true);
	};

	if (submitted) {
		return <div>Thanks for your response!</div>;
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4 max-w-xl'>
			{questions.map(q => (
				<div key={q.id}>
					<label className='block mb-1 font-semibold'>{q.text}</label>
					{q.type === 'short_text' ? (
						<textarea
							className='w-full p-3 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors'
							placeholder='Enter your answer here...'
							rows={4}
							value={formData[q.id] || ''}
							onChange={e => handleChange(q.id, e.target.value)}
							required
						/>
					) : (
						q.options.map((opt, index) => {
							const optionValue = typeof opt === 'string' ? opt : opt.text;
							const optionText = typeof opt === 'string' ? opt : opt.text;
							return (
								<label key={`${q.id}-${index}`} className='block'>
									<input
										type='radio'
										name={q.id}
										className='mr-2'
										value={optionValue}
										onChange={() => handleChange(q.id, optionValue)}
										required
									/>
									{optionText}
								</label>
							);
						})
					)}
				</div>
			))}
			<button className='px-4 py-2 bg-blue-500 text-white rounded' type='submit'>
				Submit
			</button>
		</form>
	);
};

export default Survey;
