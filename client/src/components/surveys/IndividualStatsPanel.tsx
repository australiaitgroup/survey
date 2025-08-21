import React from 'react';

type QuestionDetail = {
	questionIndex: number;
	questionText: string;
	timeSpent?: number;
	isCorrect?: boolean;
	maxPoints?: number;
	pointsAwarded?: number;
	tags?: string[]; // optional knowledge/skill tags if provided by backend
};

type ResponseSummary = {
	_id: string;
	name?: string;
	email?: string;
	createdAt: string;
	timeSpent?: number;
	score?: {
		passed?: boolean;
		percentage?: number;
		totalPoints?: number;
		maxPossiblePoints?: number;
		scoringMode?: 'percentage' | 'points';
	};
};

type Props = {
	onClose: () => void;
	response: ResponseSummary;
	details: { questionDetails: QuestionDetail[] } | null;
	cohort: ResponseSummary[]; // all responses for ranking/percentile
};

const Bar: React.FC<{ value: number; max: number; color?: string; label?: string }> = ({
	value,
	max,
	color = 'bg-blue-500',
	label,
}) => {
	const widthPct = Math.max(4, Math.min(100, (value / Math.max(1, max)) * 100));
	return (
		<div className='w-full bg-gray-200 rounded h-2 relative'>
			<div className={`${color} h-2 rounded`} style={{ width: `${widthPct}%` }} />
			{label && <div className='text-xs text-gray-600 mt-1'>{label}</div>}
		</div>
	);
};

const computePercentile = (values: number[], value: number): number => {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const idx = sorted.findIndex(v => v >= value);
	const rank = idx === -1 ? sorted.length : idx + 1;
	return Math.round((rank / sorted.length) * 100);
};

const IndividualStatsPanel: React.FC<Props> = ({ onClose, response, details, cohort }) => {
	const questions = details?.questionDetails || [];
	const totalTime = Math.round(response.timeSpent ?? 0);
	const accuracyPct = (() => {
		const answered = questions.filter(q => typeof q.isCorrect === 'boolean');
		if (answered.length === 0) return undefined;
		const correct = answered.filter(q => q.isCorrect).length;
		return Math.round((correct / answered.length) * 100);
	})();

	// Ranking/percentile
	const cohortTimes = cohort
		.map(r => Math.round(r.timeSpent || 0))
		.filter(x => Number.isFinite(x));
	const cohortAccs = cohort
		.map(r => {
			const s = (r as any).score as any;
			if (s?.scoringMode === 'percentage' && typeof s?.percentage === 'number')
				return s.percentage;
			return undefined;
		})
		.filter((x): x is number => typeof x === 'number');
	const timePercentile = computePercentile(cohortTimes, totalTime);
	const accPercentile =
		typeof accuracyPct === 'number' ? computePercentile(cohortAccs, accuracyPct) : undefined;

	// Skill profile by tags (if provided)
	const tagAgg = (() => {
		const m = new Map<string, { total: number; correct: number }>();
		questions.forEach(q => {
			const tags = (q as any).tags as string[] | undefined;
			if (!tags || tags.length === 0) return;
			const isC = !!q.isCorrect;
			tags.forEach(t => {
				const cur = m.get(t) || { total: 0, correct: 0 };
				cur.total += 1;
				if (isC) cur.correct += 1;
				m.set(t, cur);
			});
		});
		return Array.from(m.entries()).map(([tag, s]) => ({
			tag,
			pct: Math.round((s.correct / Math.max(1, s.total)) * 100),
			total: s.total,
		}));
	})();

	const maxQTime = Math.max(1, ...questions.map(q => Math.round(q.timeSpent || 0)));

	return (
		<div className='fixed inset-0 z-50 flex'>
			<div className='absolute inset-0 bg-black/40' onClick={onClose} />
			<div className='relative ml-auto h-full w-full max-w-3xl bg-white shadow-xl overflow-y-auto'>
				<div className='sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between'>
					<div>
						<div className='text-lg font-semibold text-gray-800'>
							{response.name || 'Unnamed'}{' '}
							<span className='text-gray-500 text-sm'>({response.email || '—'})</span>
						</div>
						<div className='text-xs text-gray-500'>
							Submitted: {new Date(response.createdAt).toLocaleString()}
						</div>
					</div>
					<button onClick={onClose} className='btn-secondary'>
						Close
					</button>
				</div>

				<div className='p-4 space-y-6'>
					{/* Summary */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='bg-gray-50 rounded p-3'>
							<div className='text-xs text-gray-500'>Total Time</div>
							<div className='text-xl font-bold text-gray-800'>{totalTime}s</div>
							<div className='text-xs text-gray-500 mt-1'>
								Percentile vs cohort: {timePercentile}th
							</div>
						</div>
						<div className='bg-gray-50 rounded p-3'>
							<div className='text-xs text-gray-500'>Accuracy</div>
							<div className='text-xl font-bold text-gray-800'>
								{typeof accuracyPct === 'number' ? `${accuracyPct}%` : '—'}
							</div>
							<div className='text-xs text-gray-500 mt-1'>
								Percentile vs cohort:{' '}
								{typeof accPercentile === 'number' ? `${accPercentile}th` : '—'}
							</div>
						</div>
					</div>

					{/* Time trend (per question) */}
					<div>
						<div className='font-semibold text-gray-800 mb-2'>
							Time Trend (per question)
						</div>
						<div className='space-y-2'>
							{questions.map(q => (
								<div key={q.questionIndex}>
									<div className='text-xs text-gray-600 mb-1'>
										#{q.questionIndex + 1} {q.questionText}
									</div>
									<Bar
										value={Math.round(q.timeSpent || 0)}
										max={maxQTime}
										color='bg-blue-500'
										label={`${Math.round(q.timeSpent || 0)}s`}
									/>
								</div>
							))}
						</div>
					</div>

					{/* Accuracy trend */}
					<div>
						<div className='font-semibold text-gray-800 mb-2'>Accuracy Trend</div>
						<div className='flex flex-wrap gap-2'>
							{questions.map(q => (
								<span
									key={`acc-${q.questionIndex}`}
									className={`px-2 py-1 rounded-full text-xs ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
								>
									Q{q.questionIndex + 1}: {q.isCorrect ? '✔' : '✘'}
								</span>
							))}
						</div>
					</div>

					{/* Skill profile */}
					<div>
						<div className='font-semibold text-gray-800 mb-2'>Skill Profile</div>
						{tagAgg.length === 0 ? (
							<div className='text-xs text-gray-500'>
								No skill tags found on questions
							</div>
						) : (
							<div className='space-y-2'>
								{tagAgg.map(t => (
									<div key={t.tag}>
										<div className='text-xs text-gray-700 mb-1'>
											{t.tag} — {t.pct}% ({t.total} questions)
										</div>
										<Bar value={t.pct} max={100} color='bg-purple-500' />
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default IndividualStatsPanel;
