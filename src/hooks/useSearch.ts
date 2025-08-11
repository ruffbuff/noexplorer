// Custom hook for search functionality
import { useCallback } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { useAppStore } from '@/store/appStore';
import { useSearchSettings } from '@/store/settingsStore';

export function useSearch() {
  // Get state and actions from stores
  const {
    query,
    results,
    loading,
    error,
    hasMore,
    page,
    totalCount,
    searchTime,
    suggestions,
    history,
    filters,
    setQuery,
    search,
    clearResults,
    clearError,
    setFilters,
    addToHistory,
    clearHistory,
    loadMore,
  } = useSearchStore();

  const { incrementSearchCount } = useAppStore();
  const { search: searchSettings } = useSearchSettings();

  // Enhanced search function with analytics
  const performSearch = useCallback(async (searchQuery: string, pageNum = 1) => {
    if (!searchQuery.trim()) return;

    try {
      // Use resultsPerPage setting
      await search(searchQuery, pageNum, searchSettings.resultsPerPage);
      
      // Track search in analytics (only for new searches)
      if (pageNum === 1) {
        incrementSearchCount();
      }
      
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [search, incrementSearchCount, searchSettings.resultsPerPage]);

  // Quick search function (for search bar)
  const quickSearch = useCallback(async (searchQuery: string) => {
    clearError(); // Clear any previous errors
    await performSearch(searchQuery, 1);
  }, [performSearch, clearError]);

  // Load more results
  const loadMoreResults = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadMore();
  }, [hasMore, loading, loadMore]);

  // Apply filters and re-search
  const applyFilters = useCallback(async (newFilters: typeof filters) => {
    setFilters(newFilters);
    
    // Re-search with new filters if we have a query
    if (query) {
      await performSearch(query, 1);
    }
  }, [setFilters, query, performSearch]);

  // Clear search and results
  const clearSearch = useCallback(() => {
    clearResults();
    clearError();
  }, [clearResults, clearError]);

  // Search from history
  const searchFromHistory = useCallback(async (historyQuery: string) => {
    setQuery(historyQuery);
    await performSearch(historyQuery, 1);
  }, [setQuery, performSearch]);

  return {
    // State
    query,
    results,
    loading,
    error,
    hasMore,
    page,
    totalCount,
    searchTime,
    suggestions,
    history,
    filters,
    
    // Actions
    setQuery,
    search: performSearch,
    quickSearch,
    loadMore: loadMoreResults,
    clearSearch,
    clearError,
    
    // Filters
    applyFilters,
    setFilters,
    
    // History
    addToHistory,
    clearHistory,
    searchFromHistory,
    
    // Computed values
    hasResults: results.length > 0,
    isEmpty: !loading && results.length === 0 && query.length > 0,
    hasError: !!error,
  };
}