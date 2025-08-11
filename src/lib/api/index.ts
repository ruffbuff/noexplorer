// Main API index - exports all API services and utilities

// Export HTTP client
export { apiClient, HTTPClient } from './client';

// Export search API
export { searchAPI, SearchAPI, search, getSuggestions, checkHealth, getStats } from './search';

// Export error utilities
export { 
  APIError,
  NetworkError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  ServerError,
  createAPIError,
  getUserFriendlyError,
  isRetryableError,
  reportError,
  ERROR_MESSAGES
} from './errors';

// Re-export API types for convenience
export type {
  APIResponse,
  RequestConfig,
  MWMBLSearchRequest,
  MWMBLSearchResponse,
  HealthCheckResponse,
  APIEndpoints
} from '@/types/api';