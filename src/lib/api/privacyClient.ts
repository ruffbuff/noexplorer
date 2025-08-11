// Privacy-enhanced HTTP client with anonymity features
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
import { getRandomUserAgent, generateMatchingHeaders } from '@/lib/privacy/userAgentRotator';
import { addRandomDelay, addTrafficPadding, generateDecoyHeaders } from '@/lib/privacy/trafficObfuscation';
import { usePrivacySettings } from '@/store/settingsStore';

interface PrivacyRequestConfig {
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
  
  // Privacy-specific options
  rotateUserAgent?: boolean;
  addRandomDelay?: boolean;
  obfuscateTraffic?: boolean;
  useProxy?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class PrivacyHTTPClient {
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

  // Main request method with privacy enhancements
  async request<T = any>(endpoint: string, config: PrivacyRequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      params,
      data,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      cache = true,
      signal,
      priority = 'normal',
      useQueue = false,
      rotateUserAgent = true,
      addRandomDelay: enableRandomDelay = true,
      obfuscateTraffic = true,
      useProxy = false
    } = config;

    // Get privacy settings from store
    const privacySettings = this.getPrivacySettings();

    // Build URL
    const url = this.buildURL(endpoint, params);
    const cacheKey = this.getCacheKey(url, method, data);

    // Check cache first (if enabled and GET request)
    if (cache && method === 'GET') {
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Apply privacy enhancements
    let finalHeaders = { ...this.defaultHeaders, ...headers };
    let finalData = data;

    // 1. User-Agent rotation
    if (rotateUserAgent && privacySettings?.rotateUserAgent) {
      const userAgent = getRandomUserAgent(privacySettings.privacyLevel === 'paranoid');
      const matchingHeaders = generateMatchingHeaders(userAgent);
      finalHeaders = { ...finalHeaders, ...matchingHeaders };
    }

    // 2. Traffic obfuscation
    if (obfuscateTraffic && privacySettings?.enableTrafficObfuscation) {
      // Add decoy headers
      const decoyHeaders = generateDecoyHeaders();
      finalHeaders = { ...finalHeaders, ...decoyHeaders };
      
      // Add traffic padding
      if (finalData && method !== 'GET') {
        finalData = addTrafficPadding(finalData);
      }
    }

    // 3. Random delays
    if (enableRandomDelay && privacySettings?.randomizeRequestTiming) {
      await addRandomDelay({
        minDelay: privacySettings.minRequestDelay,
        maxDelay: privacySettings.maxRequestDelay,
        distributionType: this.getDelayDistribution(privacySettings.privacyLevel)
      });
    }

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Chain with existing signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      let response: Response;

      if (useQueue && requestQueue) {
        // Use request queue for rate limiting
        response = await requestQueue.addRequest(async () => {
          return this.performFetch(url, {
            method,
            headers: finalHeaders,
            body: finalData ? JSON.stringify(finalData) : undefined,
            signal: controller.signal,
          });
        }, priority);
      } else {
        // Direct request
        response = await this.performFetch(url, {
          method,
          headers: finalHeaders,
          body: finalData ? JSON.stringify(finalData) : undefined,
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      // Parse response
      const responseData = await this.parseResponse<T>(response);

      // Cache successful GET responses
      if (cache && method === 'GET' && response.ok) {
        this.setCachedResponse(cacheKey, responseData);
      }

      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (controller.signal.aborted) {
        throw new TimeoutError('Request timeout');
      }

      // Retry logic for retryable errors
      if (retries > 0 && isRetryableError(error as Error)) {
        return this.request(endpoint, {
          ...config,
          retries: retries - 1,
        });
      }

      // Convert to appropriate error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network connection failed');
      }

      throw createAPIError(error as Error, endpoint);
    }
  }

  // Perform the actual fetch with proxy support
  private async performFetch(url: string, options: RequestInit): Promise<Response> {
    const privacySettings = this.getPrivacySettings();

    // TODO: Implement proxy support
    // For now, this would need a backend proxy service or browser extension
    if (privacySettings?.useProxy && privacySettings.proxyType !== 'none') {
      // This is a placeholder - actual proxy implementation would depend on the proxy type
      // For Tor: would need to route through Tor proxy (SOCKS5 localhost:9050)
      // For HTTP proxy: would need to use the proxy URL
      // For now, we'll use normal fetch but log the intention
      console.log(`Privacy mode: ${privacySettings.proxyType} proxy requested but not implemented in browser`);
    }

    return fetch(url, options);
  }

  // Parse response based on content type
  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    if (contentType.includes('text/')) {
      return response.text() as unknown as T;
    }

    return response.blob() as unknown as T;
  }

  // Get privacy settings (handles cases where store might not be available)
  private getPrivacySettings() {
    try {
      return usePrivacySettings().privacy;
    } catch (error) {
      // Fallback to default privacy settings if store is not available
      return {
        privacyLevel: 'enhanced' as const,
        rotateUserAgent: true,
        randomizeRequestTiming: true,
        enableTrafficObfuscation: true,
        useProxy: false,
        proxyType: 'none' as const,
        minRequestDelay: 200,
        maxRequestDelay: 1000,
      };
    }
  }

  // Get delay distribution based on privacy level
  private getDelayDistribution(privacyLevel: string): 'uniform' | 'exponential' | 'normal' {
    switch (privacyLevel) {
      case 'standard':
        return 'uniform';
      case 'enhanced':
        return 'exponential';
      case 'maximum':
      case 'paranoid':
        return 'normal';
      default:
        return 'exponential';
    }
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

  // Convenience methods
  async get<T = any>(endpoint: string, config?: Omit<PrivacyRequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: Omit<PrivacyRequestConfig, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data });
  }

  async put<T = any>(endpoint: string, data?: any, config?: Omit<PrivacyRequestConfig, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data });
  }

  async delete<T = any>(endpoint: string, config?: Omit<PrivacyRequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const privacyClient = new PrivacyHTTPClient();

// Export the class for custom instances
export { PrivacyHTTPClient };