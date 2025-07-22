import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';
import {
	Survey,
	QuestionBank,
	Question,
	EnhancedStats,
	TabType,
	StatsViewType,
	QuestionForm,
	LoginForm,
	NewSurveyForm,
	QuestionBankForm,
	ProfileData,
	ProfileForm,
	PasswordForm,
	CompanyForm,
} from '../types/admin';

interface AdminContextType {
	// Authentication state
	loggedIn: boolean;
	loginForm: LoginForm;
	setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
	login: (e: React.FormEvent) => Promise<void>;
	logout: () => void;

	// Data state
	surveys: Survey[];
	setSurveys: React.Dispatch<React.SetStateAction<Survey[]>>;
	questionBanks: QuestionBank[];
	setQuestionBanks: React.Dispatch<React.SetStateAction<QuestionBank[]>>;

	// Selected items
	selectedSurvey: Survey | null;
	setSelectedSurvey: React.Dispatch<React.SetStateAction<Survey | null>>;
	selectedQuestionBankDetail: QuestionBank | null;
	setSelectedQuestionBankDetail: React.Dispatch<React.SetStateAction<QuestionBank | null>>;

	// Form state
	newSurvey: NewSurveyForm;
	setNewSurvey: React.Dispatch<React.SetStateAction<NewSurveyForm>>;
	editForm: NewSurveyForm;
	setEditForm: React.Dispatch<React.SetStateAction<NewSurveyForm>>;
	questionBankForm: QuestionBankForm;
	setQuestionBankForm: React.Dispatch<React.SetStateAction<QuestionBankForm>>;
	editQuestionBankForm: QuestionBankForm;
	setEditQuestionBankForm: React.Dispatch<React.SetStateAction<QuestionBankForm>>;

	// Question forms
	questionForms: Record<string, QuestionForm>;
	setQuestionForms: React.Dispatch<React.SetStateAction<Record<string, QuestionForm>>>;
	questionBankQuestionForms: Record<string, QuestionForm>;
	setQuestionBankQuestionForms: React.Dispatch<
		React.SetStateAction<Record<string, QuestionForm>>
	>;
	questionBankQuestionEditForms: Record<string, QuestionForm>;
	setQuestionBankQuestionEditForms: React.Dispatch<
		React.SetStateAction<Record<string, QuestionForm>>
	>;

	// Editing state
	editingQuestions: Record<string, boolean>;
	setEditingQuestions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	editingQuestionBankQuestions: Record<string, boolean>;
	setEditingQuestionBankQuestions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

	// UI state
	tab: TabType;
	setTab: React.Dispatch<React.SetStateAction<TabType>>;
	questionBankDetailTab: string;
	setQuestionBankDetailTab: React.Dispatch<React.SetStateAction<string>>;
	statsView: StatsViewType;
	setStatsView: React.Dispatch<React.SetStateAction<StatsViewType>>;

	// Modal state
	showCreateModal: boolean;
	setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
	showEditModal: boolean;
	setShowEditModal: React.Dispatch<React.SetStateAction<boolean>>;
	showQuestionBankModal: boolean;
	setShowQuestionBankModal: React.Dispatch<React.SetStateAction<boolean>>;
	showEditQuestionBankModal: boolean;
	setShowEditQuestionBankModal: React.Dispatch<React.SetStateAction<boolean>>;
	showScoringModal: boolean;
	setShowScoringModal: React.Dispatch<React.SetStateAction<boolean>>;
	showQR: Record<string, boolean>;
	setShowQR: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

	// Loading and error state
	loading: boolean;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	error: string;
	setError: React.Dispatch<React.SetStateAction<string>>;

	// Statistics
	stats: Record<string, EnhancedStats>;
	setStats: React.Dispatch<React.SetStateAction<Record<string, EnhancedStats>>>;

	// Profile data
	profileData: ProfileData | null;
	setProfileData: React.Dispatch<React.SetStateAction<ProfileData | null>>;
	profileForm: ProfileForm;
	setProfileForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
	passwordForm: PasswordForm;
	setPasswordForm: React.Dispatch<React.SetStateAction<PasswordForm>>;
	companyForm: CompanyForm;
	setCompanyForm: React.Dispatch<React.SetStateAction<CompanyForm>>;

	// Profile actions
	loadProfile: () => Promise<void>;
	updateProfile: () => Promise<void>;
	updatePassword: () => Promise<void>;
	updateCompany: () => Promise<void>;

	// Utility functions
	copyToClipboard: (text: string) => void;
	navigate: (path: string) => void;
	location: any;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
	const context = useContext(AdminContext);
	if (!context) {
		throw new Error('useAdmin must be used within AdminProvider');
	}
	return context;
};

interface AdminProviderProps {
	children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();

	// Authentication state
	const [loggedIn, setLoggedIn] = useState(false);
	const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });

	// Data state
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);

	// Selected items
	const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
	const [selectedQuestionBankDetail, setSelectedQuestionBankDetail] =
		useState<QuestionBank | null>(null);

	// Form state
	const [newSurvey, setNewSurvey] = useState<NewSurveyForm>({
		title: '',
		description: '',
		slug: '',
		type: 'survey',
		questions: [],
		status: 'draft',
		timeLimit: undefined,
		maxAttempts: undefined,
		instructions: '',
		navigationMode: 'step-by-step',
		sourceType: 'manual',
		questionBankId: undefined,
		questionCount: undefined,
		scoringSettings: {
			scoringMode: 'percentage',
			totalPoints: 0,
			passingThreshold: 70,
			showScore: true,
			showCorrectAnswers: true,
			showScoreBreakdown: true,
			customScoringRules: {
				useCustomPoints: false,
				defaultQuestionPoints: 1,
			},
		},
	});

	const [editForm, setEditForm] = useState<NewSurveyForm>({
		title: '',
		description: '',
		slug: '',
		type: 'survey',
		questions: [],
		status: 'draft',
		timeLimit: undefined,
		maxAttempts: undefined,
		instructions: '',
		navigationMode: 'step-by-step',
		sourceType: 'manual',
		questionBankId: undefined,
		questionCount: undefined,
		scoringSettings: {
			scoringMode: 'percentage',
			totalPoints: 0,
			passingThreshold: 70,
			showScore: true,
			showCorrectAnswers: true,
			showScoreBreakdown: true,
			customScoringRules: {
				useCustomPoints: false,
				defaultQuestionPoints: 1,
			},
		},
	});

	const [questionBankForm, setQuestionBankForm] = useState<QuestionBankForm>({
		name: '',
		description: '',
	});

	const [editQuestionBankForm, setEditQuestionBankForm] = useState<QuestionBankForm>({
		name: '',
		description: '',
	});

	// Question forms
	const [questionForms, setQuestionForms] = useState<Record<string, QuestionForm>>({});
	const [questionBankQuestionForms, setQuestionBankQuestionForms] = useState<
		Record<string, QuestionForm>
	>({});
	const [questionBankQuestionEditForms, setQuestionBankQuestionEditForms] = useState<
		Record<string, QuestionForm>
	>({});

	// Editing state
	const [editingQuestions, setEditingQuestions] = useState<Record<string, boolean>>({});
	const [editingQuestionBankQuestions, setEditingQuestionBankQuestions] = useState<
		Record<string, boolean>
	>({});

	// UI state
	const [tab, setTab] = useState<TabType>('list');
	const [questionBankDetailTab, setQuestionBankDetailTab] = useState('list');
	const [statsView, setStatsView] = useState<StatsViewType>('aggregated');

	// Modal state
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
	const [showEditQuestionBankModal, setShowEditQuestionBankModal] = useState(false);
	const [showScoringModal, setShowScoringModal] = useState(false);
	const [showQR, setShowQR] = useState<Record<string, boolean>>({});

	// Loading and error state
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Statistics
	const [stats, setStats] = useState<Record<string, EnhancedStats>>({});

	// Profile data
	const [profileData, setProfileData] = useState<ProfileData | null>(null);
	const [profileForm, setProfileForm] = useState<ProfileForm>({
		name: '',
		email: '',
		avatarUrl: '',
	});
	const [passwordForm, setPasswordForm] = useState<PasswordForm>({
		currentPassword: '',
		newPassword: '',
	});
	const [companyForm, setCompanyForm] = useState<CompanyForm>({
		name: '',
		industry: '',
		logoUrl: '',
		description: '',
		website: '',
	});

	// Check authentication on mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = localStorage.getItem('adminToken');
				if (!token) {
					setLoggedIn(false);
					return;
				}

				const response = await api.get('/admin/check-auth');
				console.log('Auth check response:', response);
				setLoggedIn(true);
			} catch (err) {
				console.log('Auth check failed:', err);
				setLoggedIn(false);
				// Remove invalid token
				localStorage.removeItem('adminToken');
			}
		};
		checkAuth();
	}, []);

	// Handle route changes
	useEffect(() => {
		const path = location.pathname;
		if (path === '/admin/question-banks' || path.startsWith('/admin/question-bank/')) {
			setTab('question-banks');
		} else if (path === '/admin/profile') {
			setTab('profile');
		} else if (path.startsWith('/admin/survey/') || path.startsWith('/admin/')) {
			if (path.startsWith('/admin/survey/')) {
				setTab('detail');
			} else {
				setTab('list');
			}
		}
	}, [location.pathname]);

	// Authentication functions
	const login = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const response = await api.post('/admin/login', loginForm);
			if (response.data.success) {
				// Save JWT token to localStorage
				localStorage.setItem('adminToken', response.data.token);
				setLoggedIn(true);
				setLoginForm({ username: '', password: '' });
			} else {
				setError(response.data.error || 'Login failed');
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		try {
			// Remove JWT token from localStorage
			localStorage.removeItem('adminToken');
			setLoggedIn(false);
			setSelectedSurvey(null);
			setSelectedQuestionBankDetail(null);
			setTab('list');
			navigate('/admin');
		} catch (err) {
			console.error('Logout error:', err);
		}
	};

	// Profile methods
	const loadProfile = async () => {
		try {
			setLoading(true);
			const response = await api.get('/admin/profile');
			setProfileData(response.data);
			
			// Update forms with current data
			setProfileForm({
				name: response.data.user.name,
				email: response.data.user.email,
				avatarUrl: response.data.user.avatarUrl || '',
			});
			
			setCompanyForm({
				name: response.data.company.name,
				industry: response.data.company.industry || '',
				logoUrl: response.data.company.logoUrl || '',
				description: response.data.company.description || '',
				website: response.data.company.website || '',
			});
		} catch (err) {
			console.error('Load profile error:', err);
			setError('Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const updateProfile = async () => {
		try {
			setLoading(true);
			const response = await api.put('/admin/profile', profileForm);
			
			// Update profile data
			if (profileData) {
				setProfileData({
					...profileData,
					user: response.data.user,
				});
			}
			
			setError('');
			alert('Profile updated successfully!');
		} catch (err: any) {
			console.error('Update profile error:', err);
			setError(err.response?.data?.error || 'Failed to update profile');
		} finally {
			setLoading(false);
		}
	};

	const updatePassword = async () => {
		try {
			setLoading(true);
			await api.put('/admin/profile/password', passwordForm);
			
			// Clear password form
			setPasswordForm({
				currentPassword: '',
				newPassword: '',
			});
			
			setError('');
			alert('Password updated successfully!');
		} catch (err: any) {
			console.error('Update password error:', err);
			setError(err.response?.data?.error || 'Failed to update password');
		} finally {
			setLoading(false);
		}
	};

	const updateCompany = async () => {
		try {
			setLoading(true);
			const response = await api.put('/admin/company', companyForm);
			
			// Update profile data
			if (profileData) {
				setProfileData({
					...profileData,
					company: response.data.company,
				});
			}
			
			setError('');
			alert('Company information updated successfully!');
		} catch (err: any) {
			console.error('Update company error:', err);
			setError(err.response?.data?.error || 'Failed to update company information');
		} finally {
			setLoading(false);
		}
	};

	// Utility functions
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const value: AdminContextType = {
		// Authentication
		loggedIn,
		loginForm,
		setLoginForm,
		login,
		logout,

		// Data
		surveys,
		setSurveys,
		questionBanks,
		setQuestionBanks,

		// Selected items
		selectedSurvey,
		setSelectedSurvey,
		selectedQuestionBankDetail,
		setSelectedQuestionBankDetail,

		// Forms
		newSurvey,
		setNewSurvey,
		editForm,
		setEditForm,
		questionBankForm,
		setQuestionBankForm,
		editQuestionBankForm,
		setEditQuestionBankForm,

		// Question forms
		questionForms,
		setQuestionForms,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		questionBankQuestionEditForms,
		setQuestionBankQuestionEditForms,

		// Editing state
		editingQuestions,
		setEditingQuestions,
		editingQuestionBankQuestions,
		setEditingQuestionBankQuestions,

		// UI state
		tab,
		setTab,
		questionBankDetailTab,
		setQuestionBankDetailTab,
		statsView,
		setStatsView,

		// Modal state
		showCreateModal,
		setShowCreateModal,
		showEditModal,
		setShowEditModal,
		showQuestionBankModal,
		setShowQuestionBankModal,
		showEditQuestionBankModal,
		setShowEditQuestionBankModal,
		showScoringModal,
		setShowScoringModal,
		showQR,
		setShowQR,

		// Loading and error
		loading,
		setLoading,
		error,
		setError,

		// Statistics
		stats,
		setStats,

		// Profile data
		profileData,
		setProfileData,
		profileForm,
		setProfileForm,
		passwordForm,
		setPasswordForm,
		companyForm,
		setCompanyForm,

		// Profile actions
		loadProfile,
		updateProfile,
		updatePassword,
		updateCompany,

		// Utilities
		copyToClipboard,
		navigate,
		location,
	};

	return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
