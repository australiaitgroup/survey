import React from 'react';
import { useTranslation } from 'react-i18next';
import type { EnhancedStats, Survey } from '../../types/admin';
import { STATS_VIEW } from '../../constants';
import { StatisticsFilter } from './tabs/StatisticsFilter';

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

	const totals = stats?.summary || { totalResponses: 0, completionRate: 0, totalQuestions: 0 };

	return (
		<div className='card'>
			<div className='flex justify-between items-center mb-4'>
				<h3 className='text-xl font-bold text-gray-800'>Statistics</h3>
				<button className='btn-secondary text-sm' onClick={onRefresh} type='button'>
					Refresh Data
				</button>
			</div>

			{!stats ? (
				<div className='text-center py-8 text-gray-500'>
					<p>No statistics data, click "Refresh Data" to load</p>
				</div>
			) : (
				<div className='space-y-4'>
					<StatisticsFilter onFilter={onFilter} loading={filterLoading} />
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
							{stats.userResponses?.length > 0 ? (
								<>
									<div className='flex justify-between items-center text-sm text-gray-600 mb-4'>
										<div>
											{stats.userResponses.length} records, showing page{' '}
											{(responsePage - 1) * pageSize + 1} -{' '}
											{Math.min(
												responsePage * pageSize,
												stats.userResponses.length
											)}
										</div>
									</div>
									{stats.userResponses
										.slice(
											(responsePage - 1) * pageSize,
											responsePage * pageSize
										)
										.map(response => (
											<div
												key={response._id}
												className='bg-gray-50 rounded-lg p-4'
											>
                                                <div className='flex justify-between items-start mb-3'>
                                                    <div>
                                                        <div className='font-semibold text-gray-800'>
                                                            {response.name}
                                                        </div>
                                                        <div className='text-sm text-gray-500'>
                                                            {response.email}
                                                        </div>
                                                    </div>
                                                    {survey.type !== 'survey' && response.score && (
                                                        <div className='flex items-center gap-2'>
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded-full ${
                                                                    response.score.passed
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}
                                                            >
                                                                {response.score.passed ? 'Passed' : 'Failed'}
                                                            </span>
                                                            <span className='text-sm text-gray-700'>
                                                                {response.score.scoringMode === 'percentage'
                                                                    ? `${response.score.percentage}%`
                                                                    : `${response.score.totalPoints}/${response.score.maxPossiblePoints}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className='grid gap-2'>
                                                    {Object.entries(response.answers).map(
                                                        ([q, a]) => (
                                                            <div
                                                                key={q}
                                                                className='flex justify-between text-sm'
                                                            >
                                                                <div className='text-gray-700 w-1/2 pr-2 truncate'>
                                                                    {q}
                                                                </div>
                                                                <div className='text-gray-900 w-1/2 pl-2 break-words'>
                                                                    {a}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                                {survey.type !== 'survey' && (
                                                    <div className='mt-3 text-right'>
                                                        <a
                                                            className='text-blue-600 hover:underline cursor-pointer text-sm'
                                                            href={`/api/admin/responses/${(response as any)._id}`}
                                                            target='_blank'
                                                            rel='noopener noreferrer'
                                                        >
                                                            View Result Detail
                                                        </a>
                                                    </div>
                                                )}
											</div>
										))}
									{stats.userResponses.length > pageSize && (
										<div className='flex items-center justify-between mt-2'>
											<button
												onClick={() =>
													setResponsePage(prev =>
														Math.max(
															1,
															(typeof prev === 'number' ? prev : 1) -
																1
														)
													)
												}
												disabled={responsePage <= 1}
												className='px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
											>
												Prev
											</button>
											<button
												onClick={() =>
													setResponsePage(prev =>
														Math.min(
															Math.ceil(
																stats.userResponses.length /
																	pageSize
															),
															(typeof prev === 'number' ? prev : 1) +
																1
														)
													)
												}
												disabled={
													responsePage >=
													Math.ceil(stats.userResponses.length / pageSize)
												}
												className='px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
											>
												Next
											</button>
										</div>
									)}
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
