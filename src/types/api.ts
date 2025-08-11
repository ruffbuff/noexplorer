// API request and response types

// Base API response structure
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// API error types
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

// HTTP methods
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration
export interface RequestConfig {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  signal?: AbortSignal;
}

// MWMBL API specific types
export interface MWMBLSearchRequest {
  q: string; // search query
  s?: number; // start position (for pagination)
  o?: string; // output format
  c?: string; // category filter
}

export interface MWMBLSearchResult {
  title: string;
  url: string;
  extract: string; // snippet
  score?: number;
}

export interface MWMBLSearchResponse {
  results: MWMBLSearchResult[];
  total?: number;
  time?: number;
  suggestions?: string[];
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    search_index: boolean;
    cache: boolean;
  };
}

// API endpoints configuration
export interface APIEndpoints {
  search: string;
  health: string;
  suggestions: string;
  stats: string;
}

// Default API configuration
export const DEFAULT_API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000/api' 
    : '/api',
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API endpoints
export const API_ENDPOINTS: APIEndpoints = {
  search: '/search',
  health: '/health',
  suggestions: '/suggestions',
  stats: '/stats',
};