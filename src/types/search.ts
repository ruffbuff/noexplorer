// Search result types based on MWMBL API structure
export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  timestamp: Date;
  relevance: number;
  type: 'web' | 'image' | 'news';
  thumbnail?: string; // URL to thumbnail image
  metadata?: Record<string, any>;
}

// Search response from API
export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  searchTime: number;
  suggestions?: string[];
  query: string;
}

// Search request parameters
export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
}

// Search filters
export interface SearchFilters {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  domain?: string;
  language?: string;
  type?: SearchResult['type'];
  safeSearch?: boolean;
}

// Search state for store
export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalCount: number;
  searchTime: number;
  suggestions: string[];
  history: string[];
  filters: SearchFilters;
}

// Search actions
export interface SearchActions {
  setQuery: (query: string) => void;
  search: (query: string, page?: number, limit?: number) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  loadMore: () => Promise<void>;
}

export type SearchStore = SearchState & SearchActions;