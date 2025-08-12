// Base HTTP client for API requests
import { 
  APIError, 
  NetworkError, 
  TimeoutError, 
  createAPIError,
  reportError,
  isRetryableError 
} from './errors';
import { DEFAULT_API_CONFIG } from '@/types/api';
import { requestQueue } from './requestQueue';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  signal?: AbortSignal;
  priority?: 'low' | 'normal' | 'high';
  useQueue?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class HTTPClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetries: number;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(config = DEFAULT_API_CONFIG) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.headers;
    this.defaultTimeout = config.timeout;
    this.defaultRetries = config.retries;
  }

  // Build URL with parameters
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  // Generate cache key
  private getCacheKey(url: string, method: string, data?: any): string {
    const key = `${method}:${url}`;
    if (data && method !== 'GET') {
      return `${key}:${JSON.stringify(data)}`;
    }
    return key;
  }

  // Check if cached response is valid
  private getCachedResponse(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  // Cache response
  private setCachedResponse(cacheKey: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Clear expired cache entries
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Main request method with retries
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      params,
      data,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      cache = method === 'GET',
      signal,
      priority = 'normal',
      useQueue = true,
    } = config;

    const url = this.buildURL(endpoint, params);
    const cacheKey = cache ? this.getCacheKey(url, method, data) : null;

    // Check cache for GET requests
    if (cache && cacheKey) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      signal,
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    // Use request queue for better rate limiting and reliability
    if (useQueue) {
      try {
        const responseData = await requestQueue.enqueue<T>(url, requestOptions, priority);
        
        // Cache successful GET requests
        if (cache && cacheKey && method === 'GET') {
          this.setCachedResponse(cacheKey, responseData);
        }
        
        return responseData;
      } catch (error) {
        const lastError = error instanceof Error ? error : new Error(String(error));
        
        reportError(lastError, {
          endpoint,
          method,
          params,
          queueUsed: true,
        });
        
        throw lastError;
      }
    }

    // Fallback to direct fetch (legacy mode)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    if (!signal) {
      requestOptions.signal = controller.signal;
    }

    let lastError: Error | null = null;
    let attempt = 0;

    // Retry loop (legacy mode)
    while (attempt <= retries) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch {
            // Ignore JSON parse error for error response
          }

          throw createAPIError(response.status, errorMessage);
        }

        // Parse response
        let responseData: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text() as unknown as T;
        }

        // Cache successful GET requests
        if (cache && cacheKey && method === 'GET') {
          this.setCachedResponse(cacheKey, responseData);
        }

        return responseData;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle abort/timeout
        if (lastError.name === 'AbortError') {
          if (signal?.aborted) {
            throw lastError; // User cancelled
          } else {
            throw new TimeoutError();
          }
        }

        // Handle network errors
        if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
          lastError = new NetworkError();
        }

        // Don't retry if it's not a retryable error or if we're out of retries
        if (!isRetryableError(lastError) || attempt >= retries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt++;
      }
    }

    // Report error and throw
    if (lastError) {
      reportError(lastError, {
        endpoint,
        method,
        params,
        attempt: attempt + 1,
        maxRetries: retries,
        queueUsed: false,
      });
      throw lastError;
    }

    throw new Error('Request failed without error');
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data });
  }

  async put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data });
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Set base URL (useful for environment changes)
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  // Get request queue stats
  getQueueStats() {
    return requestQueue.getStats();
  }

  // Clear request queue
  clearQueue(): void {
    requestQueue.clearQueue();
  }
}

// Create and export default client instance
export const apiClient = new HTTPClient();

// Export the class for custom instances
export { HTTPClient };

// Clean cache periodically (every 10 minutes)
setInterval(() => {
  apiClient['cleanCache']();
}, 10 * 60 * 1000);