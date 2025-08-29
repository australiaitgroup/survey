import React from 'react';
import { Survey } from '../../../types/admin';
import { SURVEY_TYPE, SURVEY_STATUS, SOURCE_TYPE } from '../../../constants';
import SurveyHeaderActions from './SurveyHeaderActions';
import SurveyPreviewTab from '../SurveyPreviewTab';
import QRCodeComponent from '../../QRCode';
import { getSurveyUrl, getAssessmentUrl } from '../utils/url';
import SurveyQuestionList from './SurveyQuestionList';
import SurveyAssessmentConfig from './SurveyAssessmentConfig';

interface Props {
	survey: Survey;
	t: any;
	showInlinePreview: boolean;
	setShowInlinePreview: (next: boolean) => void;
	questionBanks: any[];
	companySlug: string;
	showQR: Record<string, boolean>;
	toggleQR: (surveyId: string) => void;
	getAssessmentUrl: (slug: string, companySlug: string) => string;
	getSurveyUrl: (slug: string, companySlug: string) => string;
	copyToClipboard: (text: string) => void;
	loading: boolean;
	handleQuestionsReorder: (surveyId: string, newQuestions: any[]) => void;
	startEditQuestion: (surveyId: string, index: number) => void;
	deleteQuestion: (surveyId: string, index: number) => void;
	setShowAddQuestionModal: (open: boolean) => void;
	onEdit: () => void;
	onToggleStatus: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onOpenScoringModal: () => void;
}

const SurveyDetailTab: React.FC<Props> = ({
	survey: s,
	t,
	showInlinePreview,
	setShowInlinePreview,
	questionBanks,
	companySlug,
	showQR,
	toggleQR,
	getAssessmentUrl,
	getSurveyUrl,
	copyToClipboard,
	loading,
	handleQuestionsReorder,
	startEditQuestion,
	deleteQuestion,
	setShowAddQuestionModal,
	onEdit,
	onToggleStatus,
	onDuplicate,
	onDelete,
	onOpenScoringModal,
}) => {
	return (
		<div className={showInlinePreview ? 'flex flex-col lg:flex-row gap-4 items-stretch' : ''}>
			<div className={showInlinePreview ? 'w-full lg:w-1/2' : ''}>
				<div className='card'>
					<div className='flex flex-col justify-between items-start mb-4 gap-3'>
						<div className='flex-1 min-w-0 w-full'>
							<div className='flex items-center gap-3 mb-2'>
								<h3 className='text-xl font-bold text-gray-800 truncate flex-1'>
									{s.title}
								</h3>
								<span
									className={`px-2 py-1 text-xs font-medium rounded-full ${
										s.type === SURVEY_TYPE.ASSESSMENT
											? 'bg-blue-100 text-blue-800'
											: s.type === SURVEY_TYPE.LIVE_QUIZ
												? 'bg-green-100 text-green-800'
												: s.type === SURVEY_TYPE.ONBOARDING
													? 'bg-purple-100 text-purple-800'
													: 'bg-gray-100 text-gray-800'
									}`}
								>
									{s.type === SURVEY_TYPE.ASSESSMENT
										? 'Assessment'
										: s.type === SURVEY_TYPE.LIVE_QUIZ
											? 'Kahoot (Live Quiz)'
											: s.type === SURVEY_TYPE.ONBOARDING
												? 'Onboarding'
												: 'Survey'}
								</span>
								<span
									className={`px-2 py-1 text-xs font-medium rounded-full ${
										s.status === SURVEY_STATUS.ACTIVE
											? 'bg-green-100 text-green-800'
											: s.status === SURVEY_STATUS.DRAFT
												? 'bg-yellow-100 text-yellow-800'
												: 'bg-red-100 text-red-800'
									}`}
								>
									{s.status === SURVEY_STATUS.ACTIVE
										? 'Active'
										: s.status === SURVEY_STATUS.DRAFT
											? 'Draft'
											: 'Closed'}
								</span>
							</div>
							{s.description && (
								<p className='text-gray-600 mb-3 line-clamp-2'>{s.description}</p>
							)}
						</div>
						{/* Actions + Preview switch on the same row */}
						<div className='w-full flex justify-between items-center'>
							{/* Left: Edit / Activate / Duplicate / Delete */}
							<div className='flex-1'>
								<SurveyHeaderActions
									survey={s}
									onEdit={onEdit}
									onToggleStatus={onToggleStatus}
									onDuplicate={onDuplicate}
									onDelete={onDelete}
									showInlinePreview={showInlinePreview}
									setShowInlinePreview={setShowInlinePreview}
									t={t}
									variant='no-preview'
								/>
							</div>
							{/* Right: Preview switcher */}
							<div className='flex items-center'>
								<label className='flex items-center gap-2 text-sm text-gray-700'>
									<span>Preview</span>
									<button
										className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showInlinePreview ? 'bg-blue-600' : 'bg-gray-300'}`}
										onClick={() => setShowInlinePreview(!showInlinePreview)}
										type='button'
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showInlinePreview ? 'translate-x-4' : 'translate-x-1'}`}
										/>
									</button>
								</label>
							</div>
						</div>
					</div>

					<SurveyAssessmentConfig survey={s} onEditScoring={onOpenScoringModal} />

					{s.sourceType === SOURCE_TYPE.QUESTION_BANK && (
						<div className='bg-purple-50 rounded-lg p-3 mb-3'>
							<h5 className='font-medium text-gray-800 mb-2'>
								Question Bank Configuration
							</h5>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Source:</span>
									<span className='font-medium text-purple-600'>
										{(() => {
											const questionBankId =
												s.questionBankId &&
												typeof s.questionBankId === 'object'
													? (s.questionBankId as any)._id ||
														(s.questionBankId as any).id
													: s.questionBankId;
											return (
												questionBanks.find(
													bank => bank._id === questionBankId
												)?.name || 'Unknown Question Bank'
											);
										})()}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Questions to Select:</span>
									<span className='font-medium text-purple-600'>
										{s.questionCount} random
									</span>
								</div>
							</div>
						</div>
					)}

					<div className='text-sm text-gray-500'>
						Created: {new Date(s.createdAt).toLocaleDateString()}
					</div>

					<div className='bg-gray-50 rounded-lg p-4 mb-4'>
						<div className='space-y-3'>
							{s.type === SURVEY_TYPE.ASSESSMENT ? (
								<div className='flex flex-col items-start gap-2'>
									<label className='block text-sm font-medium text-gray-700'>
										Enhanced Assessment URL
									</label>
									<div className='text-sm text-gray-600 font-mono break-all'>
										{getAssessmentUrl(s.slug || s._id, companySlug)}
									</div>
									<div className='flex items-center gap-1 sm:gap-2'>
										<button
											className='btn-outline btn-small'
											onClick={() =>
												copyToClipboard(
													getAssessmentUrl(s.slug || s._id, companySlug)
												)
											}
										>
											Copy URL
										</button>
										<button
											className='btn-outline btn-small'
											onClick={() =>
												window.open(
													getAssessmentUrl(s.slug || s._id, companySlug),
													'_blank'
												)
											}
										>
											Open
										</button>
										<button
											className='btn-outline btn-small'
											onClick={() => toggleQR(s._id)}
										>
											{showQR[s._id] ? 'Hide QR' : 'Show QR'}
										</button>
									</div>
								</div>
							) : (
								<>
									<div className='flex flex-col items-start gap-2'>
										<label className='block text-sm font-medium text-gray-700'>
											Classic Survey URL
										</label>
										<div className='text-sm text-gray-600 font-mono break-all'>
											{s.slug
												? getSurveyUrl(s.slug, companySlug)
												: 'Generating URL...'}
										</div>
										<div className='flex items-center gap-1 sm:gap-2'>
											<button
												className='btn-outline btn-small'
												onClick={() =>
													s.slug &&
													copyToClipboard(
														getSurveyUrl(s.slug, companySlug)
													)
												}
												disabled={!s.slug}
											>
												Copy URL
											</button>
											<button
												className='btn-outline btn-small'
												onClick={() =>
													s.slug &&
													window.open(
														getSurveyUrl(s.slug, companySlug),
														'_blank'
													)
												}
												disabled={!s.slug}
											>
												Open
											</button>
											<button
												className='btn-outline btn-small'
												onClick={() => toggleQR(s._id)}
											>
												{showQR[s._id] ? 'Hide QR' : 'Show QR'}
											</button>
										</div>
									</div>
								</>
							)}
						</div>
						{showQR[s._id] && (
							<div className='border-t border-gray-200 pt-4'>
								<QRCodeComponent
									url={
										s.type === SURVEY_TYPE.ASSESSMENT
											? getAssessmentUrl(s.slug || s._id, companySlug)
											: getSurveyUrl(s.slug || s._id, companySlug)
									}
								/>
							</div>
						)}
					</div>

					{/* Question Management */}
					<SurveyQuestionList
						survey={s}
						questionBanks={questionBanks}
						loading={loading}
						handleQuestionsReorder={handleQuestionsReorder}
						startEditQuestion={startEditQuestion}
						deleteQuestion={deleteQuestion}
						setShowAddQuestionModal={setShowAddQuestionModal}
					/>
				</div>
			</div>

			{showInlinePreview && (
				<div className='w-full lg:w-1/2' id='survey-preview'>
					<div className='card'>
						<SurveyPreviewTab survey={s} hideLeftPane />
					</div>
				</div>
			)}
		</div>
	);
};

export default SurveyDetailTab;
