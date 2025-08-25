import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AnalyticsProvider from './AnalyticsProvider';
import Survey from './Survey';
import TakeSurvey from './TakeSurvey';
import TakeAssessment from './TakeAssessment';
import Admin from './Admin';
import OnboardingPage from './components/onboarding/OnboardingPage';
import LandingPage from './components/landing/LandingPage';
import FeaturesPage from './components/landing/FeaturesPage';
import AboutPage from './components/landing/AboutPage';
import ContactPage from './components/landing/ContactPage';
import PrivacyPage from './components/landing/PrivacyPage';
import TermsPage from './components/landing/TermsPage';
import CaseStudiesPage from './components/landing/CaseStudiesPage';
import PricingPage from './components/landing/PricingPage';
import ResponsiveLayoutDemo from './components/survey/ResponsiveLayoutDemo';
import JoinLive from './components/live/JoinLive';
import LiveSession from './components/live/LiveSession';
import './styles.css';
import './styles/markdown.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<AnalyticsProvider>
				<Routes>
					<Route path='/' element={<LandingPage />} />
					<Route path='/home' element={<LandingPage />} />
					<Route path='/signup' element={<OnboardingPage />} />
					<Route path='/login' element={<Admin />} />
					<Route path='/demo' element={<TakeSurvey />} />
					<Route path='/responsive-demo' element={<ResponsiveLayoutDemo />} />
					<Route path='/contact-sales' element={<LandingPage />} />
					<Route path='/pricing' element={<PricingPage />} />
					<Route path='/features' element={<FeaturesPage />} />
					<Route path='/about' element={<AboutPage />} />
					<Route path='/contact' element={<ContactPage />} />
					<Route path='/privacy' element={<PrivacyPage />} />
					<Route path='/terms' element={<TermsPage />} />
					<Route path='/case-studies' element={<CaseStudiesPage />} />
					<Route path='/onboarding' element={<OnboardingPage />} />
					<Route path='/admin' element={<Admin />} />
					<Route path='/admin/login' element={<Admin />} />
					<Route path='/admin/register' element={<Admin />} />
					<Route path='/admin/surveys' element={<Admin />} />
					<Route path='/admin/question-banks' element={<Admin />} />
					<Route path='/admin/collections' element={<Admin />} />
					<Route path='/admin/collections/:id' element={<Admin />} />
					<Route path='/admin/question-bank/:id' element={<Admin />} />
					<Route path='/admin/survey/:id' element={<Admin />} />
					<Route path='/admin/survey/:id/invitations' element={<Admin />} />
					<Route path='/admin/survey/:id/statistics' element={<Admin />} />
					<Route
						path='/admin/survey/:surveyId/candidate/:responseId'
						element={<Admin />}
					/>
					<Route
						path='/admin/survey/:surveyId/candidate/:responseId/overview'
						element={<Admin />}
					/>
					<Route
						path='/admin/survey/:surveyId/candidate/:responseId/answers'
						element={<Admin />}
					/>
					<Route
						path='/admin/survey/:surveyId/candidate/:responseId/analysis'
						element={<Admin />}
					/>
					<Route path='/admin/profile' element={<Admin />} />
					<Route path='/admin/billing' element={<Admin />} />
					<Route path='/admin/:id' element={<Admin />} />
					{/* Non-tenant routes (backward compatibility) */}
					<Route path='/survey/:slug' element={<TakeSurvey />} />
					<Route path='/assessment/:slug' element={<TakeAssessment />} />

					{/* Multi-tenant routes */}
					<Route path='/:companySlug/survey/:slug' element={<TakeSurvey />} />
					<Route path='/:companySlug/assessment/:slug' element={<TakeAssessment />} />
					<Route path='/legacy' element={<Survey />} />
					{/* Live quiz participant routes */}
					<Route path='/live/join' element={<JoinLive />} />
					<Route path='/live/session/:sessionId' element={<LiveSession />} />
				</Routes>
			</AnalyticsProvider>
		</BrowserRouter>
	</React.StrictMode>
);
