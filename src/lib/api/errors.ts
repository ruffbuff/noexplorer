// API error handling utilities

export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

export class CircuitBreakerError extends APIError {
  constructor(endpoint: string) {
    super(`Service temporarily unavailable: ${endpoint}`, 'CIRCUIT_BREAKER', 503);
    this.name = 'CircuitBreakerError';
  }
}

export class SearchError extends APIError {
  constructor(message: string, public searchQuery?: string) {
    super(message, 'SEARCH_ERROR', 400);
    this.name = 'SearchError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

// Error factory function
export function createAPIError(status: number, message: string, code?: string): APIError {
  switch (status) {
    case 0:
      return new NetworkError(message);
    case 400:
      return new ValidationError(message);
    case 404:
      return new NotFoundError(message);
    case 408:
      return new TimeoutError(message);
    case 429:
      return new RateLimitError(message);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message);
    default:
      return new APIError(message, code || 'UNKNOWN_ERROR', status);
  }
}

// Error message mapping
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to search services. Check your internet connection and try again.',
  TIMEOUT_ERROR: 'Search took too long to complete. The service might be slow - try again in a moment.',
  VALIDATION_ERROR: 'Invalid search query. Please check your search terms.',
  NOT_FOUND: 'No results found for your search query.',
  SERVER_ERROR: 'Search service is temporarily unavailable. Please try again in a few minutes.',
  UNKNOWN_ERROR: 'Something went wrong. Please try your search again.',
  SEARCH_ERROR: 'Search failed. Please refine your query and try again.',
  PARSE_ERROR: 'Unable to process search results. This might be a temporary issue.',
  RATE_LIMITED: 'Slow down! You\'re searching too quickly. Please wait a moment before searching again.',
  CIRCUIT_BREAKER: 'Search service is temporarily unavailable due to high load. Please try again in a few minutes.',
  CORS_ERROR: 'Search service blocked the request. This is a known limitation of privacy-focused search.',
  DNS_ERROR: 'Could not reach search service. Check your internet connection.',
  SSL_ERROR: 'Secure connection to search service failed.',
} as const;

// Get user-friendly error message with context
export function getUserFriendlyError(error: Error, context?: { query?: string; source?: string }): string {
  // Handle API errors
  if (error instanceof APIError) {
    let message = ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;
    
    // Add context for search errors
    if (error instanceof SearchError && context?.query) {
      message += ` Query: "${context.query}"`;
    }
    
    // Add retry information for rate limiting
    if (error instanceof RateLimitError && error.retryAfter) {
      message += ` Try again in ${error.retryAfter} seconds.`;
    }
    
    return message;
  }
  
  // Handle browser/fetch errors
  const message = error.message.toLowerCase();
  
  if (error.name === 'AbortError') {
    return 'Search was cancelled. Try again if needed.';
  }
  
  if (message.includes('cors')) {
    return ERROR_MESSAGES.CORS_ERROR;
  }
  
  if (message.includes('dns') || message.includes('name not resolved')) {
    return ERROR_MESSAGES.DNS_ERROR;
  }
  
  if (message.includes('ssl') || message.includes('certificate')) {
    return ERROR_MESSAGES.SSL_ERROR;
  }
  
  if (message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Check if error is retryable
export function isRetryableError(error: Error): boolean {
  if (error instanceof APIError) {
    // Don't retry client errors (except timeout and rate limit)
    if (error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429;
    }
    // Retry server errors and network errors
    return error.status >= 500 || error.status === 0;
  }
  
  // Retry network and timeout errors
  const message = error.message.toLowerCase();
  return message.includes('timeout') || 
         message.includes('network') || 
         message.includes('fetch') ||
         error.name === 'TimeoutError' ||
         error.name === 'NetworkError';
}

// Error reporter for logging/analytics
export function reportError(error: Error, context?: Record<string, any>) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...(error instanceof APIError && {
      code: error.code,
      status: error.status,
      details: error.details,
    }),
    context,
  };
  
  // In development, just log to console with better formatting
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 ${error.name}: ${error.message}`);
    console.error('Details:', errorInfo);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.groupEnd();
    return;
  }
  
  // In production, you would send to your error tracking service
  try {
    // Store in localStorage for debugging if needed
    const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    errors.push(errorInfo);
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.shift();
    }
    localStorage.setItem('app_errors', JSON.stringify(errors));
    
    console.warn('Error logged:', error.message);
  } catch (reportingError) {
    console.error('Failed to log error:', reportingError);
  }
}

// Get error suggestions for users
export function getErrorSuggestions(error: Error, context?: { query?: string }): string[] {
  const suggestions: string[] = [];
  
  if (error instanceof NetworkError) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try refreshing the page');
    suggestions.push('Disable VPN or proxy if using one');
  }
  
  if (error instanceof TimeoutError) {
    suggestions.push('Try a shorter search query');
    suggestions.push('Search again in a moment');
    suggestions.push('Check your internet speed');
  }
  
  if (error instanceof RateLimitError) {
    suggestions.push('Wait a moment before searching again');
    suggestions.push('Try a different search query');
  }
  
  if (error instanceof SearchError && context?.query) {
    suggestions.push('Try different search terms');
    suggestions.push('Check spelling in your query');
    suggestions.push('Use more general keywords');
    if (context.query.length < 3) {
      suggestions.push('Use at least 3 characters in your search');
    }
  }
  
  if (error instanceof CircuitBreakerError) {
    suggestions.push('Wait a few minutes and try again');
    suggestions.push('The service is recovering from high load');
  }
  
  // Default suggestions for unknown errors
  if (suggestions.length === 0) {
    suggestions.push('Try your search again');
    suggestions.push('Refresh the page');
    suggestions.push('Check your internet connection');
  }
  
  return suggestions;
}