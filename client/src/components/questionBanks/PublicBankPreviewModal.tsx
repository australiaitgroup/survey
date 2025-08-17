import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import api from '../../utils/axiosConfig';

interface Question {
    _id: string;
    text: string;
    description?: string;
    type: string;
    options?: string[];
    correctAnswer?: number | number[] | string | null;
    explanation?: string;
    points: number;
    tags: string[];
    difficulty: string;
    isPreview?: boolean;
}

interface PreviewData {
    bankId: string;
    bankTitle: string;
    hasAccess: boolean;
    questions: Question[];
    totalQuestions: number;
    previewOnly: boolean;
}

interface PublicBankPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bankId: string;
    bankTitle: string;
    onCopyQuestions?: (bankId: string, questionIds: string[]) => void;
}

const PublicBankPreviewModal: React.FC<PublicBankPreviewModalProps> = ({
    isOpen,
    onClose,
    bankId,
    bankTitle,
    onCopyQuestions
}) => {
    const { t } = useTranslation('admin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

    // Load preview data when modal opens
    useEffect(() => {
        if (isOpen && bankId) {
            loadPreviewData();
        }
    }, [isOpen, bankId]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPreviewData(null);
            setCurrentQuestionIndex(0);
            setShowAnswers(false);
            setSelectedQuestions(new Set());
            setError(null);
        }
    }, [isOpen]);

    const loadPreviewData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/public-banks/${bankId}/sample-questions`);
            setPreviewData(response.data);
        } catch (err: any) {
            console.error('Error loading preview data:', err);
            setError(err.response?.data?.error || 'Failed to load preview data');
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionSelect = (questionId: string, selected: boolean) => {
        const newSelected = new Set(selectedQuestions);
        if (selected) {
            newSelected.add(questionId);
        } else {
            newSelected.delete(questionId);
        }
        setSelectedQuestions(newSelected);
    };

    const handleSelectAll = () => {
        if (!previewData) return;
        
        if (selectedQuestions.size === previewData.questions.length) {
            setSelectedQuestions(new Set());
        } else {
            setSelectedQuestions(new Set(previewData.questions.map(q => q._id)));
        }
    };

    const handleCopySelected = () => {
        if (previewData && selectedQuestions.size > 0) {
            onCopyQuestions?.(previewData.bankId, Array.from(selectedQuestions));
            onClose();
        }
    };

    const renderQuestion = (question: Question) => {
        const isCorrectAnswer = (optionIndex: number): boolean => {
            if (!showAnswers || question.correctAnswer === null || question.correctAnswer === undefined) {
                return false;
            }
            
            if (question.type === 'single_choice') {
                return question.correctAnswer === optionIndex;
            } else if (question.type === 'multiple_choice' && Array.isArray(question.correctAnswer)) {
                return question.correctAnswer.includes(optionIndex);
            }
            
            return false;
        };

        return (
            <div className="space-y-4">
                {/* Question Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                                Question {currentQuestionIndex + 1} of {previewData?.questions.length}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                                question.difficulty === 'easy' 
                                    ? 'bg-green-100 text-green-700'
                                    : question.difficulty === 'hard'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {question.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">{question.points} pts</span>
                        </div>
                        
                        {/* Question Text */}
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {question.text}
                        </h3>
                        
                        {/* Question Description */}
                        {question.description && (
                            <p className="text-gray-600 text-sm mb-3">
                                {question.description}
                            </p>
                        )}
                    </div>
                    
                    {/* Copy Checkbox */}
                    {previewData?.hasAccess && onCopyQuestions && (
                        <div className="ml-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedQuestions.has(question._id)}
                                    onChange={(e) => handleQuestionSelect(question._id, e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Copy</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Options */}
                {question.options && question.options.length > 0 && (
                    <div className="space-y-2">
                        {question.options.map((option, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${
                                    isCorrectAnswer(index)
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                        isCorrectAnswer(index)
                                            ? 'border-green-500 bg-green-500 text-white'
                                            : 'border-gray-400 text-gray-600'
                                    }`}>
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="text-gray-800">{option}</span>
                                    {isCorrectAnswer(index) && (
                                        <span className="ml-auto text-green-600 text-sm font-medium">
                                            ✓ Correct
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Short Text Answer */}
                {question.type === 'short_text' && question.correctAnswer && showAnswers && (
                    <div className="p-3 rounded-lg border border-green-500 bg-green-50">
                        <span className="text-sm font-medium text-gray-600">Expected Answer: </span>
                        <span className="text-gray-800">{question.correctAnswer}</span>
                    </div>
                )}

                {/* Explanation */}
                {question.explanation && showAnswers && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <span className="text-sm font-medium text-blue-800">Explanation: </span>
                        <span className="text-blue-700">{question.explanation}</span>
                    </div>
                )}

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {question.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Preview Warning */}
                {question.isPreview && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-amber-800 text-sm">
                            🔒 This is a preview. Purchase or subscribe to access all questions and answers.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Modal 
            show={isOpen} 
            onClose={onClose}
            title={`Preview: ${bankTitle}`}
            size="large"
        >
            <div className="space-y-4">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {previewData && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">{previewData.bankTitle}</h2>
                                <p className="text-sm text-gray-600">
                                    {previewData.hasAccess 
                                        ? `${previewData.questions.length} questions`
                                        : `Preview of ${previewData.questions.length}/${previewData.totalQuestions} questions`
                                    }
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Show Answers Toggle */}
                                {previewData.hasAccess && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showAnswers}
                                            onChange={(e) => setShowAnswers(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">Show Answers</span>
                                    </label>
                                )}

                                {/* Select All */}
                                {previewData.hasAccess && onCopyQuestions && (
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        {selectedQuestions.size === previewData.questions.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Question Display */}
                        {previewData.questions.length > 0 && (
                            <>
                                {renderQuestion(previewData.questions[currentQuestionIndex])}

                                {/* Navigation */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-600">
                                        {currentQuestionIndex + 1} / {previewData.questions.length}
                                    </span>

                                    <button
                                        onClick={() => setCurrentQuestionIndex(Math.min(previewData.questions.length - 1, currentQuestionIndex + 1))}
                                        disabled={currentQuestionIndex === previewData.questions.length - 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>

                            {previewData.hasAccess && onCopyQuestions && selectedQuestions.size > 0 && (
                                <button
                                    onClick={handleCopySelected}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Copy {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''} to My Bank
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PublicBankPreviewModal;