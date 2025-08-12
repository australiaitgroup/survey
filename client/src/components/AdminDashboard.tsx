import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
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
	const { tab, selectedSurvey, selectedQuestionBankDetail } = useAdmin();
	const location = useLocation();
	const params = useParams();

	const renderContent = () => {
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
