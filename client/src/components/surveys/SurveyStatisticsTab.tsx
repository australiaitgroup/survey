import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EnhancedStats, Survey } from '../../types/admin';
import { STATS_VIEW } from '../../constants';
import { StatisticsFilter } from './tabs/StatisticsFilter';
import api from '../../utils/axiosConfig';
import TimeSpentChart from './TimeSpentChart';
import DeviceChart from './DeviceChart';
import CalendarHeatmap, { HeatmapDatum } from './CalendarHeatmap';
import IndividualStatsPanel from './IndividualStatsPanel';
 

type Filters = {
	name?: string;
	email?: string;
	fromDate?: string;
	toDate?: string;
	status?: string;
};

interface Props {
	survey: Survey;
	stats?: EnhancedStats;
	statsView: string;
	setStatsView: (view: string) => void;
	onRefresh: () => void;
	onFilter: (filters: Filters) => Promise<void> | void;
	responsePage: number;
	setResponsePage: (page: number | ((prev: number) => number)) => void;
	pageSize?: number;
	filterLoading?: boolean;
}

const SurveyStatisticsTab: React.FC<Props> = ({
	survey,
	stats,
	statsView,
	setStatsView,
	onRefresh,
	onFilter,
	responsePage,
	setResponsePage,
	pageSize = 5,
	filterLoading = false,
}) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [distributionTab, setDistributionTab] = useState<'time' | 'device'>('time');

	const escapeCsv = (value: unknown): string => {
		const s = value === null || value === undefined ? '' : String(value);
		if (/[",\n]/.test(s)) {
			return '"' + s.replace(/"/g, '""') + '"';
		}
		return s;
	};

	const downloadCsv = (csv: string, filename: string) => {
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const exportIndividualCsv = () => {
		if (!stats?.userResponses) return;
		const headers = [
			'RESPONSE_ID',
			'NAME',
			'EMAIL',
			'SUBMITTED_AT',
			'TIME_SPENT_SECONDS',
			'PASSED',
			'SCORE',
		];
		const rows = stats.userResponses.map(r => {
			const submitted = new Date(r.createdAt).toISOString();
			const passed = (r as any)?.score ? ((r as any).score.passed ? 'YES' : 'NO') : '';
			const score = (r as any)?.score
				? (r as any).score.scoringMode === 'percentage'
					? `${(r as any).score.percentage}%`
					: `${(r as any).score.totalPoints}/${(r as any).score.maxPossiblePoints}`
				: '';
			return [
				escapeCsv((r as any)._id),
				escapeCsv((r as any).name),
				escapeCsv((r as any).email),
				escapeCsv(submitted),
				escapeCsv((r as any).timeSpent ?? ''),
				escapeCsv(passed),
				escapeCsv(score),
			].join(',');
		});
		const csv = [headers.join(','), ...rows].join('\n');
		downloadCsv(csv, `${survey.slug || survey.title || 'survey'}-responses.csv`);
	};

	const exportAggregatedCsv = () => {
		if (!stats?.aggregatedStats) return;
		const total = stats?.summary?.totalResponses || 0;
		const headers = ['QUESTION', 'OPTION', 'COUNT', 'PERCENTAGE'];
		const rows: string[] = [];
		stats.aggregatedStats.forEach(st => {
			Object.entries(st.options).forEach(([opt, count]) => {
				const pct =
					total > 0 ? (((count as number) / total) * 100).toFixed(1) + '%' : '0.0%';
				rows.push(
					[
						escapeCsv(st.question),
						escapeCsv(opt),
						escapeCsv(count as number),
						escapeCsv(pct),
					].join(',')
				);
			});
		});
		const csv = [headers.join(','), ...rows].join('\n');
		downloadCsv(csv, `${survey.slug || survey.title || 'survey'}-aggregated.csv`);
	};

	const totals = stats?.summary || { totalResponses: 0, completionRate: 0, totalQuestions: 0 };

	const formatTime = (seconds: number): string => {
		if (seconds < 60) {
			return `${Math.round(seconds)}s`;
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}m ${remainingSeconds}s`;
	};

	// Local state for per-response details (question-level correctness)
	const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
	const [details, setDetails] = React.useState<Record<string, unknown>>({});
	const [loadingDetail, setLoadingDetail] = React.useState<Record<string, boolean>>({});

	// Sort state
	const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest');

	// Individual panel state
	const [selectedResponseId, setSelectedResponseId] = React.useState<string | null>(null);
	const selectedResponse = React.useMemo(
		() => getSortedResponses().find((r: any) => (r as any)._id === selectedResponseId) as any,
		[selectedResponseId, statsView, stats]
	);
	const selectedDetails = selectedResponseId
		? (details as any)[selectedResponseId] || null
		: null;

	const toggleExpand = async (responseId: string): Promise<void> => {
		const isOpen = expanded[responseId];
		const next = { ...expanded, [responseId]: !isOpen };
		setExpanded(next);
		if (!isOpen && !details[responseId]) {
			try {
				setLoadingDetail(prev => ({ ...prev, [responseId]: true }));
				const res = await api.get(`/admin/responses/${responseId}`);
				setDetails(prev => ({ ...prev, [responseId]: res.data }));
			} catch {
				// noop
			} finally {
				setLoadingDetail(prev => ({ ...prev, [responseId]: false }));
			}
		}
	};

	// Sort responses by date (function declaration so it is hoisted)
	function getSortedResponses(): Array<{
		_id: string;
		name?: string;
		email?: string;
		createdAt: string;
		timeSpent?: number;
		score?: unknown;
	}> {
		if (!stats?.userResponses) return [];
		const sorted = [...stats.userResponses].sort((a, b) => {
			const dateA = new Date((a as any).createdAt).getTime();
			const dateB = new Date((b as any).createdAt).getTime();
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
		});
		return sorted as any;
	}

	return (
		<div className='card'>
			<div className='flex justify-between items-center mb-4'>
				<h3 className='text-xl font-bold text-gray-800'>Statistics</h3>
				<div className='flex gap-2'>
					<div className='relative'>
						<select
							value={sortOrder}
							onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
							className='btn-secondary text-sm pr-8 appearance-none bg-white border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
						>
							<option value='newest'>Newest First</option>
							<option value='oldest'>Oldest First</option>
						</select>
						<div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
							<svg
								className='fill-current h-4 w-4'
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 20 20'
							>
								<path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
							</svg>
						</div>
					</div>
					<button className='btn-secondary text-sm' onClick={onRefresh} type='button'>
						Refresh Data
					</button>
					<button
						className='btn-secondary text-sm'
						onClick={exportIndividualCsv}
						type='button'
					>
						Export CSV (Individual)
					</button>
					<button
						className='btn-secondary text-sm'
						onClick={exportAggregatedCsv}
						type='button'
					>
						Export CSV (Aggregated)
					</button>
				</div>
			</div>

			{!stats ? (
				<div className='text-center py-8 text-gray-500'>
					<p>No statistics data, click &quot;Refresh Data&quot; to load</p>
				</div>
			) : (
				<div className='space-y-4'>
					{/* Overview */}
					<div className='bg-blue-50 rounded-lg p-4'>
						<h5 className='font-semibold text-gray-800 mb-2'>Overview</h5>
						<div className='grid grid-cols-3 gap-4 text-sm'>
							<div className='text-center'>
								<div className='font-bold text-blue-600 text-lg'>
									{totals.totalResponses}
								</div>
								<div className='text-gray-600'>Total Responses</div>
							</div>
							<div className='text-center'>
								<div className='font-bold text-green-600 text-lg'>
									{totals.completionRate}%
								</div>
								<div className='text-gray-600'>Completion Rate</div>
							</div>
							<div className='text-center'>
								<div className='font-bold text-purple-600 text-lg'>
									{totals.totalQuestions}
								</div>
								<div className='text-gray-600'>Total Questions</div>
							</div>
						</div>
					</div>

					{/* Time charts in two columns */}
					{stats?.userResponses && stats.userResponses.length > 0 && (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='bg-white rounded-lg p-4 border border-gray-200'>
								{/* Tab Header */}
								<div className='flex items-center justify-between mb-4'>
									<div className='flex border-b border-gray-200'>
										<button
											className={`py-2 px-4 text-sm font-medium transition-colors ${
												distributionTab === 'time'
													? 'text-blue-600 border-b-2 border-blue-600'
													: 'text-gray-500 hover:text-gray-700'
											}`}
											onClick={() => setDistributionTab('time')}
										>
											Time Distribution
										</button>
										<button
											className={`py-2 px-4 text-sm font-medium transition-colors ${
												distributionTab === 'device'
													? 'text-blue-600 border-b-2 border-blue-600'
													: 'text-gray-500 hover:text-gray-700'
											}`}
											onClick={() => setDistributionTab('device')}
										>
											Device Usage
										</button>
									</div>
								</div>

								{/* Tab Content */}
								{distributionTab === 'time' ? (
									<>
										<TimeSpentChart
											seconds={stats.userResponses.map(
												r => (r as any).timeSpent
											)}
										/>
										<p className='text-xs text-gray-500 mt-2'>
											Distribution of total time spent per response
										</p>
									</>
								) : (
									<>
										<DeviceChart responses={stats.userResponses} />
										<p className='text-xs text-gray-500 mt-2'>
											Distribution of devices used by respondents
										</p>
									</>
								)}
							</div>
							<div className='bg-white rounded-lg p-4 border border-gray-200'>
								<h5 className='font-semibold text-gray-800 mb-2'>Daily Activity</h5>
								<CalendarHeatmap
									data={
										stats.userResponses.map(r => ({
											date: new Date((r as any).createdAt)
												.toISOString()
												.slice(0, 10),
											value: Number((r as any).timeSpent || 0),
										})) as HeatmapDatum[]
									}
									weeks={20}
									valueLabel={v => `${Math.round(v)}s`}
								/>
								<p className='text-xs text-gray-500 mt-2'>
									Daily responses and total time (last ~20 weeks)
								</p>
							</div>
						</div>
					)}

					<StatisticsFilter onFilter={onFilter} loading={filterLoading} />

					{/* View toggle */}
					<div className='flex space-x-4 border-b border-gray-200 pb-2'>
						<button
							className={`py-2 px-4 font-medium text-sm transition-colors ${
								statsView === STATS_VIEW.INDIVIDUAL
									? 'text-blue-600 border-b-2 border-blue-600'
									: 'text-gray-500 hover:text-blue-600'
							}`}
							onClick={() => setStatsView(STATS_VIEW.INDIVIDUAL)}
						>
							Individual Responses ({stats.userResponses?.length || 0})
						</button>
						<button
							className={`py-2 px-4 font-medium text-sm transition-colors ${
								statsView === STATS_VIEW.AGGREGATED
									? 'text-blue-600 border-b-2 border-blue-600'
									: 'text-gray-500 hover:text-blue-600'
							}`}
							onClick={() => setStatsView(STATS_VIEW.AGGREGATED)}
						>
							Aggregated Results
						</button>
					</div>

					{/* Aggregated */}
					{statsView === STATS_VIEW.AGGREGATED && (
						<div className='space-y-4'>
							{stats.aggregatedStats?.map((st, idx) => {
								const total = totals.totalResponses || 0;
								return (
									<div key={idx} className='bg-gray-50 rounded-lg p-4'>
										<div className='font-semibold text-gray-800 mb-2'>
											{st.question}
										</div>
										<div className='space-y-2'>
											{Object.entries(st.options).map(([opt, count]) => {
												const pct =
													total > 0
														? ((count as number) / total) * 100
														: 0;
												return (
													<div
														key={opt}
														className='flex justify-between items-center'
													>
														<span className='text-gray-700'>{opt}</span>
														<div className='flex items-center gap-2'>
															<div className='w-20 bg-gray-200 rounded-full h-2'>
																<div
																	className='bg-blue-600 h-2 rounded-full'
																	style={{
																		width: `${pct.toFixed(1)}%`,
																	}}
																/>
															</div>
															<span className='font-medium text-blue-600 text-sm w-12'>
																{count as number}
															</span>
															<span className='text-gray-500 text-xs w-12'>
																({pct.toFixed(1)}%)
															</span>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* Individual */}
					{statsView === STATS_VIEW.INDIVIDUAL && (
						<div className='space-y-4'>
							{getSortedResponses()?.length > 0 ? (
								<>
									<div className='flex justify-between items-center text-sm text-gray-600 mb-4'>
										<div>
											{getSortedResponses().length} records, showing page{' '}
											{(responsePage - 1) * pageSize + 1} -{' '}
											{Math.min(
												responsePage * pageSize,
												getSortedResponses().length
											)}
										</div>
										<div className='flex items-center gap-2'>
											<button
												className='btn-secondary btn-small'
												onClick={() =>
													setResponsePage(prev => Math.max(1, prev - 1))
												}
												disabled={responsePage === 1}
												type='button'
											>
												← Previous
											</button>
											<span className='text-xs text-gray-500'>
												Page {responsePage} of{' '}
												{Math.ceil(getSortedResponses().length / pageSize)}
											</span>
											<button
												className='btn-secondary btn-small'
												onClick={() => setResponsePage(prev => prev + 1)}
												disabled={
													responsePage * pageSize >=
													getSortedResponses().length
												}
												type='button'
											>
												Next →
											</button>
										</div>
									</div>
									{getSortedResponses()
										.slice(
											(responsePage - 1) * pageSize,
											responsePage * pageSize
										)
										.map(response => (
											<div
												key={(response as any)._id}
												className='bg-gray-50 rounded-lg p-4'
											>
												<div className='flex justify-between items-start mb-3'>
													<div>
														<div
															className='font-semibold text-blue-600 hover:underline cursor-pointer text-left'
															onClick={() =>
																navigate(
																	`/admin/survey/${survey._id}/candidate/${(response as any)._id}`
																)
															}
														>
															{(response as any).name}
														</div>
														<div className='text-sm text-gray-500'>
															{(response as any).email}
														</div>
													</div>
													{survey.type !== 'survey' &&
														(response as any).score && (
														<div className='flex items-center gap-2'>
															<span
																className={`px-2 py-1 text-xs rounded-full ${
																	(response as any).score
																		.passed
																		? 'bg-green-100 text-green-700'
																		: 'bg-red-100 text-red-700'
																}`}
															>
																{(response as any).score.passed
																	? 'Passed'
																	: 'Failed'}
															</span>
															<span className='text-sm text-gray-700'>
																{(response as any).score
																	.scoringMode ===
																	'percentage'
																	? `${(response as any).score.percentage}%`
																	: `${(response as any).score.totalPoints}/${(response as any).score.maxPossiblePoints}`}
															</span>
														</div>
													)}
												</div>
												<div className='text-sm text-gray-600'>
													<div>
														Submitted at:{' '}
														<span className='font-medium text-gray-800'>
															{new Date(
																(response as any).createdAt
															).toLocaleString('en-US', {
																timeZone:
																	Intl.DateTimeFormat().resolvedOptions()
																		.timeZone,
																timeZoneName: 'short',
															})}
														</span>
													</div>
													<div>
														Time spent:{' '}
														<span className='font-medium text-gray-800'>
															{formatTime(
																(response as any).timeSpent ?? 0
															)}
														</span>
													</div>
												</div>
												<div className='mt-3 flex gap-2'>
													<button
														className='btn-outline btn-small'
														onClick={() =>
															toggleExpand((response as any)._id)
														}
														type='button'
													>
														{expanded[(response as any)._id]
															? 'Hide Result Detail'
															: 'View Result Detail'}
													</button>
													<button
														className='btn-secondary btn-small text-red-600'
														onClick={async () => {
															if (
																!confirm(
																	'Are you sure you want to delete this response?'
																)
															)
																return;
															try {
																await api.delete(
																	`/admin/responses/${(response as any)._id}`
																);
																onRefresh();
															} catch {
																alert('Failed to delete response');
															}
														}}
														type='button'
													>
														Delete
													</button>
												</div>

												{expanded[(response as any)._id] && (
													<div className='mt-3 rounded-md border border-gray-200 bg-white'>
														{loadingDetail[(response as any)._id] ? (
															<div className='p-3 text-sm text-gray-500'>
																Loading...
															</div>
														) : (
															<>
																<div className='divide-y divide-gray-100'>
																	{(
																		(
																			details[
																				(response as any)
																					._id
																			] as any
																		)?.questionDetails || []
																	).map((q: any, idx: number) => {
																		const normalizeOptionText =
																			(opt: any) => {
																				if (
																					typeof opt ===
																					'string'
																				) {
																					if (
																						opt.includes(
																							'text:'
																						)
																					) {
																						const m =
																							opt.match(
																								/text:\s*'([^']+)'/
																							);
																						return m
																							? m[1]
																							: opt;
																					}
																					return opt;
																				}
																				return (
																					(opt &&
																						(opt as any)
																							.text) ||
																					''
																				);
																			};
																		const getCorrectDisplay =
																			() => {
																				if (
																					q.questionType ===
																						'single_choice' &&
																					typeof q.correctAnswer ===
																						'number'
																				) {
																					const opts =
																						q.options ||
																						[];
																					return normalizeOptionText(
																						opts[
																							q
																								.correctAnswer
																						]
																					);
																				}
																				if (
																					q.questionType ===
																						'multiple_choice' &&
																					Array.isArray(
																						q.correctAnswer
																					)
																				) {
																					const opts =
																						q.options ||
																						[];
																					return q.correctAnswer
																						.map(
																							(
																								idxx: number
																							) =>
																								normalizeOptionText(
																									opts[
																										idxx
																									]
																								)
																						)
																						.join(', ');
																				}
																				return String(
																					q.correctAnswer ??
																						'—'
																				);
																			};
																		const getUserDisplay =
																			() => {
																				if (
																					Array.isArray(
																						q.userAnswer
																					)
																				)
																					return q.userAnswer.join(
																						', '
																					);
																				return String(
																					q.userAnswer ??
																						'—'
																				);
																			};
																		const correctDisplay =
																			getCorrectDisplay();
																		const userDisplay =
																			getUserDisplay();
																		return (
																			<div
																				key={idx}
																				className='p-3 text-sm flex items-start gap-3'
																			>
																				{survey.type !==
																					'survey' && (
																					<div
																						className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
																					>
																						{q.isCorrect
																							? 'Correct'
																							: 'Wrong'}
																					</div>
																				)}
																				<div className='flex-1 min-w-0'>
																					<div className='font-medium text-gray-800 truncate'>
																						#
																						{q.questionIndex +
																							1}{' '}
																						{
																							q.questionText
																						}
																					</div>
																					<div className='text-gray-600 mt-0.5'>
																						<span className='mr-2'>
																							Your
																							answer:{' '}
																							<span className='font-medium text-gray-800'>
																								{
																									userDisplay
																								}
																							</span>
																						</span>
																						{survey.type !==
																							'survey' && (
																							<span>
																								Correct:{' '}
																								<span className='font-medium text-gray-800'>
																									{
																										correctDisplay
																									}
																								</span>
																							</span>
																						)}
																					</div>
																					<div className='text-xs text-gray-500 mt-0.5'>
																						Time on
																						question:{' '}
																						{q.timeSpent ??
																							0}
																						s
																					</div>
																				</div>
																				{survey.type !==
																					'survey' && (
																					<div className='text-right text-gray-700 whitespace-nowrap'>
																						{
																							q.pointsAwarded
																						}
																						/
																						{
																							q.maxPoints
																						}{' '}
																						pts
																					</div>
																				)}
																			</div>
																		);
																	})}
																</div>

																{/* Device info moved to CandidateDetailView */}
															</>
														)}
													</div>
												)}
											</div>
										))}
								</>
							) : (
								<div className='text-center py-8 text-gray-500'>
									<p>No response data</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default SurveyStatisticsTab;
