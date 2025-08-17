import React, { useState, useEffect } from 'react';
import { Question, QuestionForm } from '../../types/publicBanks';

interface QuestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: QuestionForm) => void;
  editingQuestion: Question | null;
  loading?: boolean;
}

const QuestionDrawer: React.FC<QuestionDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingQuestion,
  loading = false,
}) => {
  const [form, setForm] = useState<QuestionForm>({
    text: '',
    description: '',
    type: 'single_choice',
    options: ['', ''],
    correctAnswer: undefined,
    explanation: '',
    points: 1,
    tags: [],
    difficulty: 'medium',
  });

  useEffect(() => {
    if (editingQuestion) {
      setForm({
        text: editingQuestion.text,
        description: editingQuestion.description || '',
        descriptionImage: editingQuestion.descriptionImage,
        type: editingQuestion.type,
        options: editingQuestion.options ? [...editingQuestion.options] : ['', ''],
        correctAnswer: editingQuestion.correctAnswer,
        explanation: editingQuestion.explanation || '',
        points: editingQuestion.points || 1,
        tags: editingQuestion.tags ? [...editingQuestion.tags] : [],
        difficulty: editingQuestion.difficulty || 'medium',
      });
    } else {
      setForm({
        text: '',
        description: '',
        type: 'single_choice',
        options: ['', ''],
        correctAnswer: undefined,
        explanation: '',
        points: 1,
        tags: [],
        difficulty: 'medium',
      });
    }
  }, [editingQuestion]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleTypeChange = (type: string) => {
    setForm(prev => {
      const updatedForm = { ...prev, type: type as QuestionForm['type'] };
      
      if (type === 'short_text') {
        updatedForm.options = [];
        updatedForm.correctAnswer = undefined;
      } else if ((type === 'single_choice' || type === 'multiple_choice') && 
                 (!prev.options || prev.options.length < 2)) {
        updatedForm.options = ['', ''];
        updatedForm.correctAnswer = undefined;
      }
      
      return updatedForm;
    });
  };

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...(prev.options || []), ''],
    }));
  };

  const removeOption = (index: number) => {
    setForm(prev => {
      const newOptions = (prev.options || []).filter((_, i) => i !== index);
      let newCorrectAnswer = prev.correctAnswer;
      
      // Adjust correct answer if needed
      if (prev.type === 'single_choice' && prev.correctAnswer === index) {
        newCorrectAnswer = undefined;
      } else if (prev.type === 'multiple_choice' && Array.isArray(prev.correctAnswer)) {
        newCorrectAnswer = prev.correctAnswer
          .filter(i => i !== index)
          .map(i => i > index ? i - 1 : i);
        if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
      }
      
      return {
        ...prev,
        options: newOptions,
        correctAnswer: newCorrectAnswer,
      };
    });
  };

  const updateOption = (index: number, value: string | { text?: string; imageUrl?: string }) => {
    setForm(prev => {
      const newOptions = [...(prev.options || [])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const toggleCorrectAnswer = (optionIndex: number) => {
    setForm(prev => {
      let newCorrectAnswer;
      const isCorrect = Array.isArray(prev.correctAnswer)
        ? prev.correctAnswer.includes(optionIndex)
        : prev.correctAnswer === optionIndex;

      if (prev.type === 'single_choice') {
        newCorrectAnswer = isCorrect ? undefined : optionIndex;
      } else {
        if (isCorrect) {
          if (Array.isArray(prev.correctAnswer)) {
            newCorrectAnswer = prev.correctAnswer.filter(i => i !== optionIndex);
            if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
          } else {
            newCorrectAnswer = undefined;
          }
        } else {
          if (Array.isArray(prev.correctAnswer)) {
            newCorrectAnswer = [...prev.correctAnswer, optionIndex].sort((a, b) => a - b);
          } else if (prev.correctAnswer !== undefined) {
            newCorrectAnswer = [prev.correctAnswer, optionIndex].sort((a, b) => a - b);
          } else {
            newCorrectAnswer = [optionIndex];
          }
        }
      }

      return { ...prev, correctAnswer: newCorrectAnswer as (number | number[] | string | undefined) };
    });
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !form.tags.includes(tag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const removeTag = (index: number) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!form.text.trim()) {
      errors.push('Question text is required');
    }

    if (form.type !== 'short_text') {
      const validOptions = form.options?.filter(opt => {
        const text = typeof opt === 'string' ? opt : opt.text || '';
        return text.trim();
      }) || [];

      if (validOptions.length < 2) {
        errors.push('At least 2 valid options are required');
      }

      if (form.correctAnswer === undefined) {
        errors.push('Please select a correct answer');
      }
    }

    return errors;
  };

  const isFormValid = () => {
    return getValidationErrors().length === 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer - slides from bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out transform translate-y-0 animate-slide-up">
        <div className="h-[90vh] flex flex-col">
          {/* Drawer Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 transform -translate-x-1/2 -top-3"></div>
              
              <h2 className="text-xl font-semibold text-gray-900 flex-1">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="question-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Question Configuration */}
                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter question text"
                      value={form.text}
                      onChange={e => setForm(prev => ({ ...prev, text: e.target.value }))}
                      rows={3}
                      required
                    />
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={form.type}
                      onChange={e => handleTypeChange(e.target.value)}
                    >
                      <option value="single_choice">Single Choice</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="short_text">Short Text</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      {form.type === 'single_choice' && 'Students can select only one correct answer'}
                      {form.type === 'multiple_choice' && 'Students can select multiple correct answers'}
                      {form.type === 'short_text' && 'Students can enter a text response'}
                    </div>
                  </div>

                  {/* Question Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Description (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter scenario or context for the question..."
                      value={form.description || ''}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Answer Configuration for Short Text */}
                  {form.type === 'short_text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Answer (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter expected answer for scoring (optional)"
                        value={typeof form.correctAnswer === 'string' ? form.correctAnswer : ''}
                        onChange={e => setForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        For assessments/quizzes, you can specify an expected answer for automatic scoring
                      </div>
                    </div>
                  )}

                  {/* Correct Answer Selection for Choice Questions */}
                  {form.type !== 'short_text' && form.options && form.options.filter(opt => {
                    const text = typeof opt === 'string' ? opt : opt.text || '';
                    return text.trim();
                  }).length >= 2 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Correct Answer(s) *
                      </label>
                      <div className="space-y-2">
                        {form.options.map((opt, idx) => {
                          const optionText = typeof opt === 'string' ? opt : opt.text || '';
                          if (!optionText.trim()) return null;
                          const isCorrect = Array.isArray(form.correctAnswer)
                            ? (form.correctAnswer as number[]).includes(idx)
                            : form.correctAnswer === idx;
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCorrectAnswer(idx)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isCorrect
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                              >
                                {isCorrect && (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1">
                                <span className="text-sm text-gray-700">
                                  {optionText || `Option ${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {form.type === 'single_choice'
                          ? 'Click to select the single correct answer'
                          : 'Click the checkboxes to select multiple correct answers'}
                      </div>
                    </div>
                  )}

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Points for this question"
                      value={form.points || ''}
                      onChange={e => setForm(prev => ({ 
                        ...prev, 
                        points: e.target.value ? parseInt(e.target.value) : 1 
                      }))}
                      min="1"
                      max="100"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Points awarded for answering this question correctly
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={form.difficulty || 'medium'}
                      onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      Set the difficulty level for this question
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (Optional)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        id="tag-input"
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a tag"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            addTag(input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('tag-input') as HTMLInputElement;
                          if (input) {
                            addTag(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Add tags to help organize and filter questions
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Explanation (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Explain why this is the correct answer"
                      value={form.explanation || ''}
                      onChange={e => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Provide explanation to help users understand the correct answer
                    </div>
                  </div>
                </div>

                {/* Right Column - Options Management */}
                <div className="space-y-6">
                  {/* Options (for choice questions) */}
                  {form.type !== 'short_text' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-lg font-medium text-gray-700">
                          Options Management
                        </label>
                        <button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                          onClick={addOption}
                          type="button"
                        >
                          + Add Option
                        </button>
                      </div>
                      {form.options && form.options.length > 0 ? (
                        <div className="space-y-4">
                          {form.options.map((option, index) => {
                            const optionText = typeof option === 'string' ? option : option.text || '';
                            
                            return (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500 min-w-[80px]">
                                    Option {index + 1}
                                  </span>
                                  <input
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Enter option ${index + 1} text`}
                                    value={optionText}
                                    onChange={e => {
                                      const newOption = typeof option === 'string'
                                        ? e.target.value
                                        : { ...option, text: e.target.value };
                                      updateOption(index, newOption);
                                    }}
                                  />
                                  {form.options && form.options.length > 2 && (
                                    <button
                                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                                      onClick={() => removeOption(index)}
                                      type="button"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Add Option Button at Bottom */}
                          <div className="flex justify-center pt-2">
                            <button
                              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                              onClick={addOption}
                              type="button"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Option
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                          <div className="mb-2">📝</div>
                          <div>No options added yet</div>
                          <div className="text-xs mt-1">
                            Click "Add Option" to start creating answer choices
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Short Text Type Info */}
                  {form.type === 'short_text' && (
                    <div className="text-gray-500 text-sm p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                      <div className="mb-2">✍️</div>
                      <div>Short Text Question</div>
                      <div className="text-xs mt-1">
                        Users will be able to enter their own text response
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {!isFormValid() && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    {getValidationErrors().map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </div>

          {/* Fixed Action Area */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="question-form"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                disabled={!isFormValid() || loading}
              >
                {loading ? 'Saving...' : (editingQuestion ? 'Save Question' : 'Add Question')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QuestionDrawer;