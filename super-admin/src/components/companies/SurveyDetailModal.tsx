import React, { useState, useEffect } from 'react';

interface Survey {
	_id: string;
	title: string;
	description?: string;
	type: string;
	status: string;
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: string;
	isActive?: boolean;
	securitySettings?: {
		antiCheatEnabled?: boolean;
		[key: string]: any;
	};
	scoringSettings?: {
		scoringMode?: string;
		passingThreshold?: number;
		showScore?: boolean;
		showCorrectAnswers?: boolean;
		[key: string]: any;
	};
	questionBankId?: {
		_id: string;
		name: string;
		description?: string;
	};
	questions?: any[];
	responseCount?: number;
	lastActivity?: string;
	createdAt: string;
	updatedAt: string;
}

interface SurveyDetailModalProps {
	survey: Survey | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: (updatedSurvey: Survey) => void;
}

const SurveyDetailModal: React.FC<SurveyDetailModalProps> = ({
	survey,
	isOpen,
	onClose,
	onUpdate,
}) => {
	const [editMode, setEditMode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [formData, setFormData] = useState<Partial<Survey>>({});

	useEffect(() => {
		if (survey) {
			setFormData(survey);
		}
	}, [survey]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;
		let parsedValue: any = value;

		if (type === 'number') {
			parsedValue = value === '' ? undefined : parseInt(value);
		} else if (type === 'checkbox') {
			parsedValue = (e.target as HTMLInputElement).checked;
		}

		setFormData(prev => ({
			...prev,
			[name]: parsedValue,
		}));
	};

	const handleSave = async () => {
		if (!survey) return;

		setLoading(true);
		setError(null);
		setSuccessMessage(null);

		try {
			const token = localStorage.getItem('sa_token');
			if (!token) {
				throw new Error('No authentication token');
			}

			const response = await fetch(`/api/sa/surveys/${survey._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const data = await response.json();
				setSuccessMessage('Survey updated successfully');
				onUpdate(data.data);
				setEditMode(false);

				// Clear success message after 3 seconds
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update survey');
			}
		} catch (err: any) {
			setError(err.message || 'An error occurred while updating the survey');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setFormData(survey || {});
		setEditMode(false);
		setError(null);
		setSuccessMessage(null);
	};

	if (!isOpen || !survey) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-xl font-medium text-gray-900">
						{editMode ? 'Edit Survey' : 'Survey Details'}
					</h3>
					<div className="flex items-center space-x-2">
						{!editMode && (
							<button
								onClick={() => setEditMode(true)}
								className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								Edit
							</button>
						)}
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						{error}
					</div>
				)}

				{successMessage && (
					<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
						{successMessage}
					</div>
				)}

				<div className="space-y-6">
					{/* Basic Information */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Title
							</label>
							{editMode ? (
								<input
									type="text"
									name="title"
									value={formData.title || ''}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{survey.title}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Type
							</label>
							{editMode ? (
								<select
									name="type"
									value={formData.type || ''}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="survey">Survey</option>
									<option value="assessment">Assessment</option>
									<option value="onboarding">Onboarding</option>
									<option value="live_quiz">Live Quiz</option>
								</select>
							) : (
								<p className="text-gray-900 capitalize">{survey.type}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Status
							</label>
							{editMode ? (
								<select
									name="status"
									value={formData.status || ''}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="draft">Draft</option>
									<option value="active">Active</option>
									<option value="closed">Closed</option>
								</select>
							) : (
								<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
									survey.status === 'active' ? 'bg-green-100 text-green-800' :
									survey.status === 'closed' ? 'bg-gray-100 text-gray-800' :
									'bg-yellow-100 text-yellow-800'
								}`}>
									{survey.status}
								</span>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Time Limit (minutes)
							</label>
							{editMode ? (
								<input
									type="number"
									name="timeLimit"
									value={formData.timeLimit || ''}
									onChange={handleInputChange}
									min="0"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{survey.timeLimit || 'No limit'}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Max Attempts
							</label>
							{editMode ? (
								<input
									type="number"
									name="maxAttempts"
									value={formData.maxAttempts || ''}
									onChange={handleInputChange}
									min="1"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							) : (
								<p className="text-gray-900">{survey.maxAttempts || 1}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Navigation Mode
							</label>
							{editMode ? (
								<select
									name="navigationMode"
									value={formData.navigationMode || ''}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="step-by-step">Step by Step</option>
									<option value="paginated">Paginated</option>
									<option value="all-in-one">All in One</option>
									<option value="one-question-per-page">One Question per Page</option>
								</select>
							) : (
								<p className="text-gray-900">{survey.navigationMode || 'step-by-step'}</p>
							)}
						</div>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						{editMode ? (
							<textarea
								name="description"
								value={formData.description || ''}
								onChange={handleInputChange}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						) : (
							<p className="text-gray-900">{survey.description || 'No description'}</p>
						)}
					</div>

					{/* Instructions */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Instructions
						</label>
						{editMode ? (
							<textarea
								name="instructions"
								value={formData.instructions || ''}
								onChange={handleInputChange}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						) : (
							<p className="text-gray-900">{survey.instructions || 'No instructions'}</p>
						)}
					</div>

					{/* Question Bank Information */}
					{survey.questionBankId && (
						<div className="bg-gray-50 p-4 rounded-lg">
							<h4 className="text-sm font-medium text-gray-700 mb-2">Question Bank</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs text-gray-500">Name</label>
									<p className="text-sm text-gray-900">{survey.questionBankId.name}</p>
								</div>
								<div>
									<label className="block text-xs text-gray-500">Description</label>
									<p className="text-sm text-gray-900">{survey.questionBankId.description || 'No description'}</p>
								</div>
							</div>
						</div>
					)}

					{/* Statistics */}
					<div className="bg-blue-50 p-4 rounded-lg">
						<h4 className="text-sm font-medium text-gray-700 mb-3">Statistics</h4>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-xs text-gray-500">Questions</label>
								<p className="text-lg font-semibold text-blue-600">{survey.questions?.length || 0}</p>
							</div>
							<div>
								<label className="block text-xs text-gray-500">Responses</label>
								<p className="text-lg font-semibold text-blue-600">{survey.responseCount || 0}</p>
							</div>
							<div>
								<label className="block text-xs text-gray-500">Created</label>
								<p className="text-sm text-gray-900">{new Date(survey.createdAt).toLocaleDateString()}</p>
							</div>
							<div>
								<label className="block text-xs text-gray-500">Last Activity</label>
								<p className="text-sm text-gray-900">
									{survey.lastActivity ? new Date(survey.lastActivity).toLocaleDateString() : 'No activity'}
								</p>
							</div>
						</div>
					</div>

					{/* Security Settings */}
					{survey.securitySettings && (
						<div className="bg-yellow-50 p-4 rounded-lg">
							<h4 className="text-sm font-medium text-gray-700 mb-3">Security Settings</h4>
							<div className="space-y-2">
								{Object.entries(survey.securitySettings).map(([key, value]) => (
									<div key={key} className="flex items-center justify-between">
										<span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
										<span className="text-sm text-gray-900">
											{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Scoring Settings */}
					{survey.scoringSettings && (
						<div className="bg-green-50 p-4 rounded-lg">
							<h4 className="text-sm font-medium text-gray-700 mb-3">Scoring Settings</h4>
							<div className="space-y-2">
								{Object.entries(survey.scoringSettings).map(([key, value]) => (
									<div key={key} className="flex items-center justify-between">
										<span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
										<span className="text-sm text-gray-900">
											{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				{editMode && (
					<div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
						<button
							onClick={handleCancel}
							className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={loading}
							className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{loading ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default SurveyDetailModal;
