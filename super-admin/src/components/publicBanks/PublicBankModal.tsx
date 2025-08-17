import React, { useState, useEffect } from 'react';
import { PublicBank, PublicBankFormData } from '../../types/publicBanks';

interface PublicBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PublicBankFormData) => Promise<void>;
  editingBank: PublicBank | null;
  loading?: boolean;
}

const PublicBankModal: React.FC<PublicBankModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBank,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PublicBankFormData>({
    title: '',
    description: '',
    type: 'free',
    priceOneTime: 0,
    tags: [],
    locales: ['en'],
    isActive: true,
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editingBank) {
      setFormData({
        title: editingBank.title,
        description: editingBank.description,
        type: editingBank.type || 'free',
        priceOneTime: editingBank.priceOneTime || 0,
        tags: editingBank.tags || [],
        locales: editingBank.locales || ['en'],
        isActive: editingBank.isActive !== false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'free',
        priceOneTime: 0,
        tags: [],
        locales: ['en'],
        isActive: true,
      });
    }
  }, [editingBank, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const toggleLocale = (locale: string) => {
    setFormData(prev => ({
      ...prev,
      locales: prev.locales.includes(locale)
        ? prev.locales.filter(l => l !== locale)
        : [...prev.locales, locale],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingBank ? 'Edit Public Bank' : 'Create Public Bank'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank description"
                rows={3}
              />
            </div>

            {/* Type and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'free' | 'paid',
                    priceOneTime: e.target.value === 'free' ? 0 : prev.priceOneTime
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {formData.type === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (One-time)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.priceOneTime}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      priceOneTime: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded"
                  >
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
            </div>

            {/* Locales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supported Languages
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.locales.includes('en')}
                    onChange={() => toggleLocale('en')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">English</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.locales.includes('zh')}
                    onChange={() => toggleLocale('zh')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">中文</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.locales.includes('es')}
                    onChange={() => toggleLocale('es')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">Español</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.locales.includes('fr')}
                    onChange={() => toggleLocale('fr')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">Français</span>
                </label>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Active</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Active banks can be used by companies to create surveys
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingBank ? 'Save Changes' : 'Create Bank')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicBankModal;