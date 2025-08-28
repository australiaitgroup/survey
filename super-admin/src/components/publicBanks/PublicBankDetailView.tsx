import React, { useState, useEffect } from 'react';
import { PublicBank, Question, QuestionForm } from '../../types/publicBanks';
import QuestionDrawer from './QuestionDrawer';
// Local lightweight CSV import modal (inline)
const ImportCSVModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<void> | void;
    loading?: boolean;
    onDownloadTemplate?: () => void | Promise<void>;
}> = ({ isOpen, onClose, onImport, loading = false, onDownloadTemplate }) => {
    const [file, setFile] = React.useState<File | null>(null);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">Import Questions from CSV</h3>
                <div className="space-y-3">
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="w-full"
                    />
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-2">
                            {onDownloadTemplate && (
                                <button
                                    onClick={() => onDownloadTemplate()}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                    Download Template
                                </button>
                            )}
                            <button
                                disabled={!file || loading}
                                onClick={() => file && onImport(file)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                            >
                                {loading ? 'Importing...' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
import ImportResultModal from './ImportResultModal';

interface PublicBankDetailViewProps {
	bank: PublicBank;
	onBack: () => void;
}

const PublicBankDetailView: React.FC<PublicBankDetailViewProps> = ({ bank, onBack }) => {
	// State
	const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');
	const [questions, setQuestions] = useState<Question[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Question management
	const [showQuestionDrawer, setShowQuestionDrawer] = useState(false);
	const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
	const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

	// CSV Import
	const [showImportCSVModal, setShowImportCSVModal] = useState(false);
	const [showImportResultModal, setShowImportResultModal] = useState(false);
	const [importResult, setImportResult] = useState<{
		success: boolean;
		message: string;
		imported: number;
		warnings?: string[];
		errors?: string[];
	} | null>(null);

	// Filters and pagination
	const [searchTerm, setSearchTerm] = useState('');
	const [filterType, setFilterType] = useState<string>('');
	const [filterDifficulty, setFilterDifficulty] = useState<string>('');
	const [currentPage, setCurrentPage] = useState(1);
	const questionsPerPage = 20;

	useEffect(() => {
		// Load questions when component mounts or when switching to questions tab
		if (activeTab === 'questions' || !questions.length) {
			loadQuestions();
		}
	}, [activeTab, bank._id]);

	const loadQuestions = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('sa_token');
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: questionsPerPage.toString(),
			});

			if (searchTerm) params.append('search', searchTerm);
			if (filterDifficulty) params.append('difficulty', filterDifficulty);

			const response = await fetch(`/api/sa/public-banks/${bank._id}/questions?${params}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setQuestions(data.data?.questions || bank.questions || []);
			} else {
				// Fallback to bank's questions if API fails
				setQuestions(bank.questions || []);
			}
		} catch (error) {
			console.error('Failed to load questions:', error);
			// Fallback to bank's questions if API fails
			setQuestions(bank.questions || []);
		} finally {
			setLoading(false);
		}
	};

	const handleAddQuestion = () => {
		setEditingQuestion(null);
		setEditingQuestionIndex(null);
		setShowQuestionDrawer(true);
	};

	const handleEditQuestion = (question: Question, index: number) => {
		setEditingQuestion(question);
		setEditingQuestionIndex(index);
		setShowQuestionDrawer(true);
	};

	const handleSaveQuestion = async (form: QuestionForm) => {
		try {
			setLoading(true);
			const token = localStorage.getItem('sa_token');

			const questionData = {
				...form,
				difficulty: (form.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
				points: form.points || 1,
				tags: form.tags || [],
			};

			let response;

			if (editingQuestionIndex !== null) {
				response = await fetch(
					`/api/sa/public-banks/${bank._id}/questions/${editingQuestionIndex}`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(questionData),
					}
				);
			} else {
				response = await fetch(`/api/sa/public-banks/${bank._id}/questions`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(questionData),
				});
			}

			if (response.ok) {
				await loadQuestions();
				setShowQuestionDrawer(false);
				setEditingQuestion(null);
				setEditingQuestionIndex(null);
			} else {
				const errorData = await response.json();
				setError(errorData.error || 'Failed to save question');
			}
		} catch (error) {
			console.error('Failed to save question:', error);
			setError('Failed to save question');
		} finally {
			setLoading(false);
		}
	};

	const handleDuplicateQuestion = async (index: number) => {
		try {
			setLoading(true);
			const token = localStorage.getItem('sa_token');
			const response = await fetch(
				`/api/sa/public-banks/${bank._id}/questions/${index}/duplicate`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.ok) {
				await loadQuestions();
			} else {
				const errorData = await response.json();
				setError(errorData.error || 'Failed to duplicate question');
			}
		} catch (error) {
			console.error('Failed to duplicate question:', error);
			setError('Failed to duplicate question');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteQuestion = async (index: number) => {
		if (!confirm('Are you sure you want to delete this question?')) {
			return;
		}

		try {
			setLoading(true);
			const token = localStorage.getItem('sa_token');
			const response = await fetch(`/api/sa/public-banks/${bank._id}/questions/${index}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				await loadQuestions();
			} else {
				const errorData = await response.json();
				setError(errorData.error || 'Failed to delete question');
			}
		} catch (error) {
			console.error('Failed to delete question:', error);
			setError('Failed to delete question');
		} finally {
			setLoading(false);
		}
	};

	const handleCSVImport = async (file: File) => {
		try {
			setLoading(true);
			const formData = new FormData();
			formData.append('csvFile', file);

			const response = await fetch(`/api/sa/public-banks/${bank._id}/import-csv`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('sa_token')}`,
				},
				body: formData,
			});

			const data = await response.json();

			if (response.ok) {
				setImportResult({
					success: true,
					message: data.message,
					imported: data.imported,
					warnings: data.warnings,
				});
				await loadQuestions();
			} else {
				setImportResult({
					success: false,
					message: data.error || 'Import failed',
					imported: 0,
					errors: data.errors,
				});
			}

			setShowImportResultModal(true);
		} catch (error) {
			console.error('CSV import error:', error);
			setImportResult({
				success: false,
				message: 'Network error occurred during import',
				imported: 0,
			});
			setShowImportResultModal(true);
		} finally {
			setLoading(false);
		}
	};

	// Filter questions
	const filteredQuestions = questions.filter(q => {
		let matches = true;

		if (searchTerm) {
			matches =
				q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(q.description
					? q.description.toLowerCase().includes(searchTerm.toLowerCase())
					: false);
		}

		if (filterType && q.type !== filterType) {
			matches = false;
		}

		if (filterDifficulty && q.difficulty !== filterDifficulty) {
			matches = false;
		}

		return matches;
	});

	// Pagination
	const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
	const paginatedQuestions = filteredQuestions.slice(
		(currentPage - 1) * questionsPerPage,
		currentPage * questionsPerPage
	);

	return (
		<>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={onBack}
							className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Back to List
						</button>
						<h2 className="text-2xl font-semibold text-gray-900">{bank.title}</h2>
					</div>
				</div>

				{/* Bank Info Card */}
				<div className="bg-white rounded-lg shadow p-6">
					<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
						<div>
							<p className="text-sm text-gray-600">Type</p>
							<p className="font-medium capitalize">{bank.type || 'free'}</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Price</p>
							<p className="font-medium">
								{bank.type === 'paid'
									? (bank.priceOneTime || 0).toLocaleString(undefined, {
										style: 'currency',
										currency: 'USD',
										maximumFractionDigits: 2,
									})
									: 'Free'}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Status</p>
							<span
								className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
									bank.isActive === true
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800'
								}`}
							>
								{bank.isActive === true ? 'Active' : 'Inactive'}
							</span>
						</div>
						<div>
							<p className="text-sm text-gray-600">Questions</p>
							<p className="font-medium">{questions.length}</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Created</p>
							<p className="font-medium">
								{new Date(bank.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>

					{bank.description && (
						<div className="border-t pt-4">
							<p className="text-gray-600">{bank.description}</p>
						</div>
					)}
				</div>

				{/* Tabs */}
				<div className="bg-white rounded-lg shadow">
					<div className="border-b border-gray-200">
						<nav className="flex -mb-px">
							<button
								onClick={() => setActiveTab('overview')}
								className={`px-6 py-3 text-sm font-medium ${
									activeTab === 'overview'
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'
								}`}
							>
								Overview
							</button>
							<button
								onClick={() => setActiveTab('questions')}
								className={`px-6 py-3 text-sm font-medium ${
									activeTab === 'questions'
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-500 hover:text-gray-700'
								}`}
							>
								Questions ({questions.length})
							</button>
						</nav>
					</div>

					{/* Tab Content */}
					<div className="p-6">
						{activeTab === 'overview' ? (
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<h3 className="text-lg font-medium mb-2">Bank Settings</h3>
										<dl className="space-y-2">
											<div>
												<dt className="text-sm text-gray-600">Locales</dt>
												<dd className="font-medium">
													{bank.locales?.join(', ') || 'en'}
												</dd>
											</div>
											<div>
												<dt className="text-sm text-gray-600">Tags</dt>
												<dd className="flex flex-wrap gap-1 mt-1">
													{bank.tags?.map((tag, idx) => (
														<span
															key={idx}
															className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
														>
															{tag}
														</span>
													)) || (
														<span className="text-gray-500">
															No tags
														</span>
													)}
												</dd>
											</div>
										</dl>
									</div>

									<div>
										<h3 className="text-lg font-medium mb-2">
											Usage Statistics
										</h3>
										<dl className="space-y-2">
											<div>
												<dt className="text-sm text-gray-600">
													Times Used
												</dt>
												<dd className="font-medium">0</dd>
											</div>
											<div>
												<dt className="text-sm text-gray-600">Last Used</dt>
												<dd className="font-medium">Never</dd>
											</div>
										</dl>
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								{/* Questions Actions Bar */}
								<div className="flex flex-col md:flex-row gap-4 justify-between">
									<div className="flex flex-col md:flex-row gap-3 flex-1">
										<input
											type="text"
											placeholder="Search questions..."
											value={searchTerm}
											onChange={e => setSearchTerm(e.target.value)}
											className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
										/>
										<select
											value={filterType}
											onChange={e => setFilterType(e.target.value)}
											className="px-3 py-2 border border-gray-300 rounded-lg"
										>
											<option value="">All Types</option>
											<option value="single_choice">Single Choice</option>
											<option value="multiple_choice">Multiple Choice</option>
											<option value="short_text">Short Text</option>
										</select>
										<select
											value={filterDifficulty}
											onChange={e => setFilterDifficulty(e.target.value)}
											className="px-3 py-2 border border-gray-300 rounded-lg"
										>
											<option value="">All Difficulties</option>
											<option value="easy">Easy</option>
											<option value="medium">Medium</option>
											<option value="hard">Hard</option>
										</select>
									</div>

									<div className="flex gap-2">
										<button
											onClick={() => setShowImportCSVModal(true)}
											className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
										>
											Import CSV
										</button>
										<button
											onClick={handleAddQuestion}
											className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
										>
											+ Add Question
										</button>
									</div>
								</div>

								{/* Error Display */}
								{error && (
									<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
										{error}
									</div>
								)}

								{/* Questions List */}
								{loading ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
									</div>
								) : paginatedQuestions.length > 0 ? (
									<div className="space-y-4">
										{paginatedQuestions.map((question, idx) => (
											<div key={idx} className="bg-gray-50 rounded-lg p-4">
												<div className="flex justify-between items-start mb-2">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-1">
															<span className="font-medium text-gray-800">
																{(currentPage - 1) *
																	questionsPerPage +
																	idx +
																	1}
																. {question.text}
															</span>
															<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
																{question.type === 'multiple_choice'
																	? 'Multiple Choice'
																	: question.type ===
																		  'single_choice'
																		? 'Single Choice'
																		: 'Short Text'}
															</span>
															<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
																{question.points || 1} pts
															</span>
															{question.difficulty && (
																<span
																	className={`text-xs px-2 py-1 rounded ${
																		question.difficulty ===
																		'easy'
																			? 'bg-green-100 text-green-800'
																			: question.difficulty ===
																				  'medium'
																				? 'bg-yellow-100 text-yellow-800'
																				: 'bg-red-100 text-red-800'
																	}`}
																>
																	{question.difficulty}
																</span>
															)}
														</div>
														{question.tags &&
															question.tags.length > 0 && (
															<div className="flex flex-wrap gap-1 mt-1">
																{question.tags.map(
																	(tag, tagIdx) => (
																		<span
																			key={tagIdx}
																			className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
																		>
																			{tag}
																		</span>
																	)
																)}
															</div>
														)}
													</div>
													<div className="flex items-center gap-2">
														<button
															onClick={() =>
																handleEditQuestion(question, idx)
															}
															className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
														>
															Edit
														</button>
														<button
															onClick={() =>
																handleDuplicateQuestion(idx)
															}
															className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
														>
															Duplicate
														</button>
														<button
															onClick={() =>
																handleDeleteQuestion(idx)
															}
															className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
														>
															Delete
														</button>
													</div>
												</div>

												{question.description && (
													<p className="text-sm text-gray-600 mb-2">
														{question.description}
													</p>
												)}

												{question.type !== 'short_text' &&
													question.options && (
													<div className="text-sm text-gray-600 space-y-1">
														<div className="font-medium">
																Options:
														</div>
														{question.options.map((opt, optIdx) => {
															const isCorrect = Array.isArray(
																question.correctAnswer
															)
																? question.correctAnswer.includes(
																	optIdx
																)
																: question.correctAnswer ===
																		optIdx;
															return (
																<div
																	key={optIdx}
																	className={`flex items-center gap-2 pl-4 ${
																		isCorrect
																			? 'text-green-600 font-semibold'
																			: ''
																	}`}
																>
																	{isCorrect && (
																		<svg
																			className="w-4 h-4"
																			fill="currentColor"
																			viewBox="0 0 20 20"
																		>
																			<path
																				fillRule="evenodd"
																				d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																				clipRule="evenodd"
																			/>
																		</svg>
																	)}
																	<span>
																		{typeof opt === 'string'
																			? opt
																			: opt.text}
																	</span>
																</div>
															);
														})}
													</div>
												)}

												{question.explanation && (
													<div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-200 rounded">
														<div className="font-medium text-blue-800 text-sm">
															Explanation:
														</div>
														<div className="text-blue-700 text-sm mt-1">
															{question.explanation}
														</div>
													</div>
												)}
											</div>
										))}

										{/* Pagination */}
										{totalPages > 1 && (
											<div className="flex justify-center gap-2 mt-6">
												<button
													onClick={() =>
														setCurrentPage(p => Math.max(1, p - 1))
													}
													disabled={currentPage === 1}
													className="px-3 py-1 border rounded disabled:opacity-50"
												>
													Previous
												</button>
												{Array.from(
													{ length: Math.min(5, totalPages) },
													(_, i) => {
														const page = i + 1;
														return (
															<button
																key={page}
																onClick={() => setCurrentPage(page)}
																className={`px-3 py-1 border rounded ${
																	currentPage === page
																		? 'bg-blue-600 text-white'
																		: ''
																}`}
															>
																{page}
															</button>
														);
													}
												)}
												<button
													onClick={() =>
														setCurrentPage(p =>
															Math.min(totalPages, p + 1)
														)
													}
													disabled={currentPage === totalPages}
													className="px-3 py-1 border rounded disabled:opacity-50"
												>
													Next
												</button>
											</div>
										)}
									</div>
								) : (
									<div className="text-center py-8 text-gray-500">
										No questions found. Add your first question to get started.
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Question Drawer */}
			<QuestionDrawer
				isOpen={showQuestionDrawer}
				onClose={() => {
					setShowQuestionDrawer(false);
					setEditingQuestion(null);
					setEditingQuestionIndex(null);
				}}
				onSubmit={handleSaveQuestion}
				editingQuestion={editingQuestion}
				loading={loading}
			/>

			{/* CSV Import Modal */}
			<ImportCSVModal
				isOpen={showImportCSVModal}
				onClose={() => setShowImportCSVModal(false)}
				onImport={handleCSVImport}
				loading={loading}
				onDownloadTemplate={async () => {
					const token = localStorage.getItem('sa_token');
					const res = await fetch(
						`/api/sa/public-banks/csv-template/download?ts=${Date.now()}`,
						{
							headers: { Authorization: token ? `Bearer ${token}` : '' },
						}
					);
					if (!res.ok) {
						alert('Failed to download template');
						return;
					}
					const blob = await res.blob();
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'question_bank_template.csv';
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				}}
			/>

			{/* Import Result Modal */}
			<ImportResultModal
				isOpen={showImportResultModal}
				onClose={() => setShowImportResultModal(false)}
				result={importResult}
			/>
		</>
	);
};

export default PublicBankDetailView;
