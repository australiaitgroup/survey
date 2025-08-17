import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePublicQuestionBanks } from '../../hooks/usePublicQuestionBanks';
import PublicQuestionBankCard from './PublicQuestionBankCard';

const MarketplaceView: React.FC = () => {
    const { t, i18n } = useTranslation('admin');
    const location = useLocation();
    const { data, loading, error, fetchPublicBanks, searchPublicBanks } = usePublicQuestionBanks();
    
    // State for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    React.useEffect(() => {
        i18n.loadNamespaces(['admin']).catch(() => {});
    }, [i18n]);
    
    // Initial load
    useEffect(() => {
        fetchPublicBanks({
            page: 1,
            pageSize: 12
        });
    }, []);
    
    // Check for payment/subscription success in URL
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const paymentStatus = urlParams.get('payment');
        const subscriptionStatus = urlParams.get('subscription');
        const bankId = urlParams.get('bank');
        
        if (paymentStatus === 'success' && bankId) {
            setSuccessMessage(t('questionBanks.marketplace.paymentSuccess', 'Payment successful! You now have access to this question bank.'));
            // Refresh data to update entitlements
            fetchPublicBanks({
                query: searchQuery,
                type: typeFilter,
                tags: selectedTags,
                page: currentPage,
                pageSize: 12
            });
            
            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        }
        
        if (subscriptionStatus === 'success' && bankId) {
            setSuccessMessage(t('questionBanks.marketplace.subscriptionSuccess', 'Subscription started! You now have access to this question bank.'));
            // Refresh data to update entitlements
            fetchPublicBanks({
                query: searchQuery,
                type: typeFilter,
                tags: selectedTags,
                page: currentPage,
                pageSize: 12
            });
            
            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        }
        
        if (paymentStatus === 'cancelled' || subscriptionStatus === 'cancelled') {
            setSuccessMessage(t('questionBanks.marketplace.paymentCancelled', 'Payment was cancelled.'));
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [location.search]);
    
    // Handle entitlement changes (when user adds/purchases a bank)
    const handleEntitlementChange = () => {
        // Refresh the current page to update entitlements
        fetchPublicBanks({
            query: searchQuery,
            type: typeFilter,
            tags: selectedTags,
            page: currentPage,
            pageSize: 12
        });
    };
    
    // Handle search with debounce
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
        searchPublicBanks({
            query,
            type: typeFilter,
            tags: selectedTags,
            page: 1,
            pageSize: 12
        });
    };
    
    // Handle type filter change
    const handleTypeFilterChange = (type: 'all' | 'free' | 'paid') => {
        setTypeFilter(type);
        setCurrentPage(1);
        fetchPublicBanks({
            query: searchQuery,
            type,
            tags: selectedTags,
            page: 1,
            pageSize: 12
        });
    };
    
    // Handle tag selection
    const toggleTag = (tag: string) => {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];
        
        setSelectedTags(newTags);
        setCurrentPage(1);
        fetchPublicBanks({
            query: searchQuery,
            type: typeFilter,
            tags: newTags,
            page: 1,
            pageSize: 12
        });
    };
    
    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchPublicBanks({
            query: searchQuery,
            type: typeFilter,
            tags: selectedTags,
            page,
            pageSize: 12
        });
    };
    
    // Skeleton loader component
    const SkeletonCard = () => (
        <div className="card animate-pulse">
            <div className="flex flex-col gap-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="flex gap-2 mt-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-4">
            {/* Header with Search and Filters */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {t('questionBanks.marketplace.title', 'Question Bank Marketplace')}
                    </h2>
                </div>
                
                {/* Search and Filters Row */}
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search Box */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={t('questionBanks.marketplace.searchPlaceholder', 'Search by name or description...')}
                                className="input-field pl-10"
                            />
                            <svg 
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    
                    {/* Type Filter */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => handleTypeFilterChange('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                typeFilter === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('questionBanks.marketplace.filterAll', 'All')}
                        </button>
                        <button
                            onClick={() => handleTypeFilterChange('free')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                typeFilter === 'free'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('questionBanks.marketplace.filterFree', 'Free')}
                        </button>
                        <button
                            onClick={() => handleTypeFilterChange('paid')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                typeFilter === 'paid'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t('questionBanks.marketplace.filterPaid', 'Paid')}
                        </button>
                    </div>
                    
                    {/* Tag Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTagDropdown(!showTagDropdown)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {t('questionBanks.marketplace.filterByTags', 'Filter by Tags')}
                            {selectedTags.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {selectedTags.length}
                                </span>
                            )}
                        </button>
                        
                        {/* Tag Dropdown */}
                        {showTagDropdown && (
                            <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                                <div className="p-3">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {t('questionBanks.marketplace.availableTags', 'Available Tags')}
                                    </div>
                                    {data.availableTags.map(tag => (
                                        <label key={tag} className="flex items-center py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTags.includes(tag)}
                                                onChange={() => toggleTag(tag)}
                                                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Active Filters Display */}
                {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map(tag => (
                            <span 
                                key={tag}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                            >
                                {tag}
                                <button
                                    onClick={() => toggleTag(tag)}
                                    className="ml-2 hover:text-blue-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => {
                                setSelectedTags([]);
                                fetchPublicBanks({
                                    query: searchQuery,
                                    type: typeFilter,
                                    tags: [],
                                    page: currentPage,
                                    pageSize: 12
                                });
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            {t('questionBanks.marketplace.clearTags', 'Clear all')}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-green-600 hover:text-green-800 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}
            
            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            
            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : data.banks.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg 
                                className="w-8 h-8 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {t('questionBanks.marketplace.noResults', 'No question banks found')}
                        </h3>
                        <p className="text-gray-600">
                            {t('questionBanks.marketplace.noResultsDescription', 'Try adjusting your search or filters to find what you\'re looking for.')}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        {data.banks.map(bank => (
                            <PublicQuestionBankCard 
                                key={bank._id} 
                                bank={bank}
                                onEntitlementChange={handleEntitlementChange}
                            />
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                    currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {t('questionBanks.marketplace.previous', 'Previous')}
                            </button>
                            
                            <div className="flex gap-1">
                                {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (data.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= data.totalPages - 2) {
                                        pageNum = data.totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    if (pageNum < 1 || pageNum > data.totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === data.totalPages}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                    currentPage === data.totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {t('questionBanks.marketplace.next', 'Next')}
                            </button>
                            
                            <span className="ml-4 text-sm text-gray-600">
                                {t('questionBanks.marketplace.pageInfo', 'Page {{current}} of {{total}}', {
                                    current: currentPage,
                                    total: data.totalPages
                                })}
                            </span>
                        </div>
                    )}
                </>
            )}
            
            {/* Click outside handler for tag dropdown */}
            {showTagDropdown && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowTagDropdown(false)}
                />
            )}
        </div>
    );
};

export default MarketplaceView;