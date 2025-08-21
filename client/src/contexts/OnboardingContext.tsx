import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/axiosConfig';
import { Company } from '../types/admin';

export interface OnboardingStep1Data {
	companyName: string;
	logoUrl: string;
	industry: string;
	size: string;
}

export interface OnboardingStep2Data {
	contactName: string;
	contactEmail: string;
	role: string;
}

export interface OnboardingStep3Data {
	themeColor: string;
	customLogoEnabled: boolean;
}

export interface OnboardingStep4Data {
	defaultLanguage: string;
	autoNotifyCandidate: boolean;
}

export interface OnboardingData
	extends OnboardingStep1Data,
		OnboardingStep2Data,
		OnboardingStep3Data,
		OnboardingStep4Data {}

interface OnboardingContextType {
	// Current step (1-4)
	currentStep: number;
	setCurrentStep: (step: number) => void;

	// Form data for each step
	step1Data: OnboardingStep1Data;
	setStep1Data: (data: Partial<OnboardingStep1Data>) => void;
	step2Data: OnboardingStep2Data;
	setStep2Data: (data: Partial<OnboardingStep2Data>) => void;
	step3Data: OnboardingStep3Data;
	setStep3Data: (data: Partial<OnboardingStep3Data>) => void;
	step4Data: OnboardingStep4Data;
	setStep4Data: (data: Partial<OnboardingStep4Data>) => void;

	// Company data
	company: Company | null;
	setCompany: (company: Company | null) => void;

	// Actions
	saveStepData: (stepData: Partial<OnboardingData>) => Promise<boolean>;
	completeOnboarding: () => Promise<boolean>;
	fetchCompanyData: () => Promise<void>;

	// UI state
	loading: boolean;
	error: string | null;
	setError: (error: string | null) => void;

	// Upload state
	uploading: boolean;
	setUploading: (uploading: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
	children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [company, setCompany] = useState<Company | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	// Step form data
	const [step1Data, setStep1DataState] = useState<OnboardingStep1Data>({
		companyName: '',
		logoUrl: '',
		industry: '',
		size: '',
	});

	const [step2Data, setStep2DataState] = useState<OnboardingStep2Data>({
		contactName: '',
		contactEmail: '',
		role: '',
	});

	const [step3Data, setStep3DataState] = useState<OnboardingStep3Data>({
		themeColor: '#3B82F6',
		customLogoEnabled: false,
	});

	const [step4Data, setStep4DataState] = useState<OnboardingStep4Data>({
		defaultLanguage: 'en',
		autoNotifyCandidate: true,
	});

	// Update step data functions
	const setStep1Data = (data: Partial<OnboardingStep1Data>) => {
		setStep1DataState(prev => ({ ...prev, ...data }));
	};

	const setStep2Data = (data: Partial<OnboardingStep2Data>) => {
		setStep2DataState(prev => ({ ...prev, ...data }));
	};

	const setStep3Data = (data: Partial<OnboardingStep3Data>) => {
		setStep3DataState(prev => ({ ...prev, ...data }));
	};

	const setStep4Data = (data: Partial<OnboardingStep4Data>) => {
		setStep4DataState(prev => ({ ...prev, ...data }));
	};

	// Fetch company data
	const fetchCompanyData = async () => {
		try {
			setLoading(true);
			const response = await api.get('/companies/current');
			if (response.data.success) {
				const companyData = response.data.company;
				setCompany(companyData);

				// Populate form data if company exists
				setStep1Data({
					companyName: companyData.name || '',
					logoUrl: companyData.logoUrl || '',
					industry: companyData.industry || '',
					size: companyData.size || '',
				});

				setStep2Data({
					contactName: companyData.contactName || '',
					contactEmail: companyData.contactEmail || '',
					role: companyData.role || '',
				});

				setStep3Data({
					themeColor: companyData.themeColor || '#3B82F6',
					customLogoEnabled: companyData.customLogoEnabled || false,
				});

				setStep4Data({
					defaultLanguage: companyData.defaultLanguage || 'en',
					autoNotifyCandidate:
						companyData.autoNotifyCandidate !== undefined
							? companyData.autoNotifyCandidate
							: true,
				});
			}
		} catch (error) {
			console.error('Error fetching company data:', error);
			// Don't set error for 404, as it means no company exists yet
			if (error.response?.status !== 404) {
				setError('Failed to fetch company information');
			}
		} finally {
			setLoading(false);
		}
	};

	// Save step data
	const saveStepData = async (stepData: Partial<OnboardingData>): Promise<boolean> => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.patch('/companies/current', stepData);

			if (response.data.success) {
				setCompany(response.data.company);
				return true;
			} else {
				setError(response.data.error || 'Failed to save data');
				return false;
			}
		} catch (error) {
			console.error('Error saving step data:', error);
			setError(error.response?.data?.error || 'Failed to save data');
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Complete onboarding
	const completeOnboarding = async (): Promise<boolean> => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.post('/companies/complete-onboarding');

			if (response.data.success) {
				setCompany(response.data.company);
				return true;
			} else {
				setError(response.data.error || 'Failed to complete onboarding');
				return false;
			}
		} catch (error) {
			console.error('Error completing onboarding:', error);
			setError(error.response?.data?.error || 'Failed to complete onboarding');
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Load company data on mount
	useEffect(() => {
		fetchCompanyData();
	}, []);

	const value: OnboardingContextType = {
		currentStep,
		setCurrentStep,
		step1Data,
		setStep1Data,
		step2Data,
		setStep2Data,
		step3Data,
		setStep3Data,
		step4Data,
		setStep4Data,
		company,
		setCompany,
		saveStepData,
		completeOnboarding,
		fetchCompanyData,
		loading,
		error,
		setError,
		uploading,
		setUploading,
	};

	return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = (): OnboardingContextType => {
	const context = useContext(OnboardingContext);
	if (context === undefined) {
		throw new Error('useOnboarding must be used within an OnboardingProvider');
	}
	return context;
};
