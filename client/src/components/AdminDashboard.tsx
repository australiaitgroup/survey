import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { useSurveys } from '../hooks/useSurveys';
import api from '../utils/axiosConfig';
import AdminNavbar from './layout/AdminNavbar';
import AdminHeader from './layout/AdminHeader';
import NavigationTabs from './navigation/NavigationTabs';
import SurveyListView from './surveys/SurveyListView';
import SurveyDetailView from './surveys/SurveyDetailView';
import CandidateDetailView from './surveys/CandidateDetailView';
import QuestionBankListView from './questionBanks/QuestionBankListView';
import QuestionBankDetailView from './questionBanks/QuestionBankDetailView';
import ProfileView from './profile/ProfileView';
import BillingView from './billing/BillingView';
import CreateSurveyModal from './modals/CreateSurveyModal';
import EditSurveyModal from './modals/EditSurveyModal';
import ScoringModal from './modals/ScoringModal';
import QuestionBankModal from './modals/QuestionBankModal';
import EditQuestionBankModal from './modals/EditQuestionBankModal';

const AdminDashboard: React.FC = () => {
	const { tab, selectedSurvey, selectedQuestionBankDetail, setSelectedSurvey, setTab, surveys } = useAdmin();
	const { loadSurveys } = useSurveys();
	const location = useLocation();
	const params = useParams();

	const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

	// Load survey based on URL params when component mounts or params change
	useEffect(() => {
		const loadSurveyFromUrl = async () => {
			// Check if we're on a survey detail route
			if (params.id && location.pathname.includes('/survey/')) {
				setIsLoadingSurvey(true);
				
				try {
					// First try to find the survey in existing surveys
					let survey = surveys.find(s => s._id === params.id);
					
					// If not found, fetch directly from API
					if (!survey) {
						const response = await api.get(`/admin/surveys/${params.id}`);
						survey = response.data;
						// Also trigger a reload of all surveys to keep state in sync
						loadSurveys();
					}
					
					// Set the survey if found and not already selected
					if (survey && (!selectedSurvey || selectedSurvey._id !== survey._id)) {
						setSelectedSurvey(survey);
						setTab('detail');
					}
				} catch (error) {
					console.error('Error loading survey:', error);
				} finally {
					setIsLoadingSurvey(false);
				}
			}
		};

		loadSurveyFromUrl();
	}, [params.id, location.pathname]);

	const renderContent = () => {
		// Show loading state while survey is being loaded
		if (isLoadingSurvey) {
			return (
				<div className='flex items-center justify-center h-64'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			);
		}

		// Check if we're on a candidate detail route
		if (location.pathname.includes('/candidate/') && params.responseId && params.surveyId) {
			return (
				<CandidateDetailView
					responseId={params.responseId}
					onBack={() => {
						// Navigate back to survey statistics tab
						window.location.href = `/admin/survey/${params.surveyId}#statistics`;
					}}
				/>
			);
		}

		// Check if we're on a survey detail route (including tabs)
		if (params.id && location.pathname.includes('/survey/') && selectedSurvey) {
			return <SurveyDetailView survey={selectedSurvey} />;
		}

		if (tab === 'detail' && selectedSurvey) {
			return <SurveyDetailView survey={selectedSurvey} />;
		}

		if (tab === 'question-banks') {
			if (selectedQuestionBankDetail) {
				return <QuestionBankDetailView questionBank={selectedQuestionBankDetail} />;
			}
			return <QuestionBankListView />;
		}

		if (tab === 'profile') {
			return <ProfileView />;
		}

		if (tab === 'billing') {
			return <BillingView />;
		}

		// Default: survey list view
		return <SurveyListView />;
	};

	// Check if we're on candidate detail route to adjust layout
	const isCandidateDetailRoute = location.pathname.includes('/candidate/');

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
			{/* Top Navigation */}
			<AdminNavbar />

			{/* Main Content */}
			<div className='w-full mx-auto px-4 pt-8' style={{ maxWidth: '1440px' }}>
				{!isCandidateDetailRoute && <AdminHeader />}
				{!isCandidateDetailRoute && <NavigationTabs />}
				{renderContent()}

				{/* Modals */}
				<CreateSurveyModal />
				<EditSurveyModal />
				<ScoringModal />
				<QuestionBankModal />
				<EditQuestionBankModal />
			</div>
		</div>
	);
};

export default AdminDashboard;
