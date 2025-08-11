import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchStore, SearchResult, SearchFilters } from '@/types/search';

const HISTORY_LIMIT = 50;

// Initial state
const initialState = {
  query: '',
  results: [] as SearchResult[],
  loading: false,
  error: null,
  hasMore: false,
  page: 1,
  totalCount: 0,
  searchTime: 0,
  suggestions: [] as string[],
  history: [] as string[],
  filters: {} as SearchFilters,
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Set current search query
      setQuery: (query: string) => {
        set({ query });
      },

      // Main search function using real API
      search: async (query: string, page = 1, limit = 10) => {
        if (!query.trim()) return;

        set({ 
          loading: true, 
          error: null, 
          query: query.trim(),
          page,
          ...(page === 1 && { results: [] }) // Clear results for new search
        });

        try {
          // Import search API dynamically to avoid circular dependency
          const { searchAPI } = await import('@/lib/api');
          
          // Use current filters from state
          const { filters } = get();
          
          // Call real search API
          const response = await searchAPI.search({
            query: query.trim(),
            page,
            limit,
            filters,
          });

          // Update state with API response
          const currentResults = page === 1 ? [] : get().results;
          const newResults = page === 1 ? response.results : [...currentResults, ...response.results];

          set({
            results: newResults,
            loading: false,
            hasMore: response.hasMore,
            totalCount: response.totalCount,
            searchTime: response.searchTime,
            suggestions: response.suggestions,
          });

          // Add to history if it's a new search
          if (page === 1) {
            get().addToHistory(query);
          }

        } catch (error) {
          console.error('Search failed:', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Search failed'
          });
        }
      },

      // Clear all results
      clearResults: () => {
        set({ 
          results: [], 
          query: '', 
          error: null, 
          hasMore: false, 
          page: 1,
          totalCount: 0,
          searchTime: 0,
          suggestions: []
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set search filters
      setFilters: (newFilters: Partial<SearchFilters>) => {
        const currentFilters = get().filters;
        set({ 
          filters: { ...currentFilters, ...newFilters }
        });
      },

      // Add query to history
      addToHistory: (query: string) => {
        if (!query.trim()) return;
        
        const currentHistory = get().history;
        const trimmedQuery = query.trim();
        
        // Remove if already exists to move it to top
        const filteredHistory = currentHistory.filter(h => h !== trimmedQuery);
        
        // Add to beginning and limit size
        const newHistory = [trimmedQuery, ...filteredHistory].slice(0, HISTORY_LIMIT);
        
        set({ history: newHistory });
      },

      // Clear search history
      clearHistory: () => {
        set({ history: [] });
      },

      // Load more results (pagination)
      loadMore: async () => {
        const { hasMore, loading, query, page } = get();
        if (!hasMore || loading || !query) return;

        await get().search(query, page + 1);
      },
    }),
    {
      name: 'astra-search-store',
      partialize: (state) => ({
        history: state.history,
        filters: state.filters,
      }),
    }
  )
);