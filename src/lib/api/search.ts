// Search API service
import { apiClient } from './client';
import { privacyClient } from './privacyClient';
import { API_ENDPOINTS } from '@/types/api';
import { SearchResult, SearchResponse, SearchParams } from '@/types/search';
import { 
  MWMBLSearchRequest, 
  MWMBLSearchResponse, 
  HealthCheckResponse 
} from '@/types/api';
import { getPrivacySettingsSync } from '@/lib/privacy/settingsHelper';

// Transform MWMBL result to our SearchResult format
function transformMWMBLResult(result: any, index: number): SearchResult {
  return {
    id: `${result.url}-${index}`,
    title: result.title || 'Untitled',
    url: result.url,
    snippet: result.extract || '',
    domain: new URL(result.url).hostname,
    timestamp: new Date(),
    relevance: result.score || 0,
    type: 'web',
    metadata: {
      score: result.score,
      originalIndex: index,
    },
  };
}

// Cache for MWMBL results to enable pagination
const resultsCache = new Map<string, any[]>();

// Search service class
export class SearchAPI {
  // Get the appropriate API client based on privacy settings
  private getClient() {
    try {
      const privacy = getPrivacySettingsSync();
      
      // Use privacy client if any privacy features are enabled
      const shouldUsePrivacyClient = 
        privacy.privacyLevel !== 'standard' || 
        privacy.rotateUserAgent || 
        privacy.randomizeRequestTiming || 
        privacy.enableTrafficObfuscation ||
        privacy.useProxy ||
        privacy.enableDnsOverHttps;
        
      if (shouldUsePrivacyClient) {
        return privacyClient;
      }
    } catch (error) {
      console.warn('Failed to get privacy settings, using standard client:', error);
    }
    
    // Fallback to standard client
    return apiClient;
  }

  // Main search function
  async search(params: SearchParams): Promise<SearchResponse> {
    const { query, page = 1, limit = 10, filters } = params;
    
    if (!query.trim()) {
      throw new Error('Search query is required');
    }


    // Check cache first for pagination
    const cacheKey = query.trim().toLowerCase();
    let allResults = resultsCache.get(cacheKey);
    
    if (allResults && page > 1) {
      // Use cached results for pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);

      return {
        results: paginatedResults,
        totalCount: allResults.length,
        page,
        hasMore: endIndex < allResults.length,
        searchTime: 0,
        suggestions: [],
        query: query.trim(),
      };
    }

    // Try multiple search engines for better diversity
    try {
      // Determine if we're in production
      const isProduction = typeof window !== 'undefined' && 
                         window.location.hostname !== 'localhost' && 
                         !window.location.hostname.includes('127.0.0.1');

      // Use different endpoints based on environment
      const searchSources = [
        {
          name: 'MWMBL',
          endpoints: isProduction ? [
            // In production, use our Vercel API proxy to avoid CORS
            `/api/search?q=${encodeURIComponent(query.trim())}`,
          ] : [
            // In development, use direct MWMBL endpoints
            `https://api.mwmbl.org/search?s=${encodeURIComponent(query.trim())}`,
            `https://mwmbl.org/api/v1/search/?s=${encodeURIComponent(query.trim())}`,
          ]
        }
      ];
      
      const allResults: any[] = [];
      let lastError = null;
      
      // Try each search source
      for (const source of searchSources) {
        for (const endpoint of source.endpoints) {
          try {
            // Handle relative URLs for Vercel API
            let requestUrl = endpoint;
            if (endpoint.startsWith('/api/') && typeof window !== 'undefined') {
              requestUrl = `${window.location.origin}${endpoint}`;
            }
            
            const client = this.getClient();
            const data = await client.request(requestUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                // User-Agent will be handled by privacy client if enabled
              },
              timeout: 8000,
              priority: 'high', // Search requests have high priority
              useQueue: false, // Disable queue until fixed
              cache: false, // Don't cache search API responses
            });
            
            // Handle different response formats
            let results = [];
            if (Array.isArray(data)) {
              // Direct MWMBL response (development)
              results = data;
            } else if (data.results && Array.isArray(data.results)) {
              // Wrapped MWMBL response (from our API proxy)
              results = data.results;
            } else if (data.success && data.results) {
              // Our Vercel API proxy response format
              results = Array.isArray(data.results) ? data.results : [];
            }
            
            // Add source metadata to results
            const resultsWithSource = results.map((result: any) => ({
              ...result,
              _source: source.name
            }));
            
            allResults.push(...resultsWithSource);
            
            // If we get good results from this endpoint, break to next source
            if (results.length > 0) {
              break; // Break from endpoints loop, continue to next source
            }
            
          } catch (endpointError) {
            lastError = endpointError;
            continue; // Try next endpoint
          }
        }
      }
      
      // If no results from any source, throw error
      if (allResults.length === 0) {
        throw lastError || new Error('All search endpoints failed');
      }
      
      // Transform results from all sources to our format
      const transformedResults = allResults.map((result: any, index: number) => {
        // Helper function to extract text from complex objects
        const extractText = (value: any): string => {
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'string') {
            return value;
          }
          if (typeof value === 'number') {
            return String(value);
          }
          if (Array.isArray(value)) {
            // Handle MWMBL format: array of {value: string, is_bold: boolean}
            return value.map(item => {
              if (typeof item === 'object' && item !== null && 'value' in item) {
                return item.value || '';
              }
              return extractText(item);
            }).join('').trim();
          }
          if (typeof value === 'object') {
            if (value.value !== undefined) {
              return extractText(value.value);
            }
            const textFields = ['text', 'content', 'title', 'description', 'snippet'];
            for (const field of textFields) {
              if (value[field] !== undefined) {
                return extractText(value[field]);
              }
            }
            return '';
          }
          return String(value);
        };

        // Handle MWMBL result format
        let title = 'Untitled';
        let snippet = '';
        
        // Use extractText for all title processing
        title = extractText(result.title || result.name || result.heading) || 'Untitled';
        
        const url = String(result.url || result.link || '');
        
        // Use extractText for all snippet processing  
        snippet = extractText(result.extract || result.snippet || result.description || result.content) || '';
        
        // Extract thumbnail image from various possible fields
        let thumbnail = result.image_url || result.thumbnail || result.imageUrl || result.image || undefined;
        
        // Enhanced thumbnail logic for different domains
        try {
          const parsedUrl = new URL(url);
          const domain = parsedUrl.hostname;
          
          if (!thumbnail) {
            // Wikipedia - use page preview API
            if (domain.includes('wikipedia.org')) {
              const match = url.match(/\/wiki\/([^?#]+)/);
              if (match) {
                const pageTitle = decodeURIComponent(match[1]);
                thumbnail = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}?thumbnail=true`;
              }
            }
            // GitHub - use avatar or repo image
            else if (domain.includes('github.com')) {
              const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
              if (pathParts.length >= 2) {
                thumbnail = `https://github.com/${pathParts[0]}.png?size=200`;
              }
            }
            // YouTube - extract video thumbnail
            else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
              const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
              if (videoMatch) {
                thumbnail = `https://img.youtube.com/vi/${videoMatch[1]}/hqdefault.jpg`;
              }
            }
            // For major sites, just skip thumbnails due to CORS issues with favicon services
            // Focus on sites that provide direct API access or don't have CORS restrictions
          }
        } catch (e) {
          // Invalid URL, skip thumbnail generation
        }
        
        // Extract domain safely
        let domain = 'unknown';
        try {
          if (url && url.startsWith('http')) {
            domain = new URL(url).hostname;
          }
        } catch (e) {
          // Invalid URL
        }
        
        const transformedResult = {
          id: `${result._source?.toLowerCase() || 'unknown'}-${url}-${index}`,
          title,
          url,
          snippet,
          domain,
          timestamp: new Date(),
          relevance: result.score || result.rank || Math.random(),
          type: 'web' as const,
          thumbnail,
          metadata: {
            score: result.score || result.rank,
            source: result._source?.toLowerCase() || 'unknown',
            originalIndex: index,
            raw: result,
          },
        };
        
        
        return transformedResult;
      }).filter(result => {
        if (!result.url || !result.url.startsWith('http')) {
          return false;
        }
        if (result.title.includes('[object Object]') || result.snippet.includes('[object Object]')) {
          return false;
        }
        return true;
      });

      const deduplicatedResults = this.deduplicateAndImproveResults(transformedResults);
      resultsCache.set(cacheKey, deduplicatedResults);

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = deduplicatedResults.slice(startIndex, endIndex);

      return {
        results: paginatedResults,
        totalCount: deduplicatedResults.length,
        page,
        hasMore: endIndex < deduplicatedResults.length,
        searchTime: 0,
        suggestions: [],
        query: query.trim(),
      };

    } catch (error) {
      // All search API attempts failed
      console.error('[SEARCH] All search attempts failed:', error);
      
      // In production, provide helpful error information
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        console.error('[SEARCH] Production search failed. This might be due to:');
        console.error('- CORS restrictions in production environment');
        console.error('- Network policies blocking external API calls');
        console.error('- MWMBL API being unavailable');
        console.error('- Vercel serverless function limitations');
      }
      
      // Return empty results with error context
      return {
        results: [],
        totalCount: 0,
        page,
        hasMore: false,
        searchTime: 0,
        suggestions: [],
        query: query.trim(),
        // Add error metadata for debugging
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  // Get search suggestions
  async getSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const client = this.getClient();
      const response = await client.get<{ suggestions: string[] }>(
        API_ENDPOINTS.suggestions,
        {
          params: { q: query.trim() },
          cache: true,
        }
      );

      return response.suggestions || [];

    } catch (error) {
      console.error('Suggestions API error:', error);
      
      // Return empty suggestions instead of mock data
      return [];
    }
  }

  // Check API health
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const client = this.getClient();
      const response = await client.get<HealthCheckResponse>(
        API_ENDPOINTS.health,
        { cache: false, timeout: 5000 }
      );

      return response;

    } catch (error) {
      console.error('Health check failed:', error);
      
      // Return unhealthy status
      return {
        status: 'unhealthy',
        version: 'unknown',
        uptime: 0,
        checks: {
          database: false,
          search_index: false,
          cache: false,
        },
      };
    }
  }

  // Get search statistics (optional)
  async getStats(): Promise<{ totalSearches: number; avgResponseTime: number }> {
    try {
      const client = this.getClient();
      const response = await client.get<{
        total_searches: number;
        avg_response_time: number;
      }>(API_ENDPOINTS.stats);

      return {
        totalSearches: response.total_searches || 0,
        avgResponseTime: response.avg_response_time || 0,
      };

    } catch (error) {
      console.error('Stats API error:', error);
      
      return {
        totalSearches: 0,
        avgResponseTime: 0,
      };
    }
  }

  // Deduplicate and improve result diversity
  private deduplicateAndImproveResults(results: SearchResult[]): SearchResult[] {
    const seenUrls = new Set<string>();
    const seenDomains = new Map<string, number>();
    const deduplicatedResults: SearchResult[] = [];
    
    // Sort by relevance and source priority (SearXNG first for diversity)
    const sortedResults = results.sort((a, b) => {
      // Prioritize non-Wikipedia results
      const aIsWiki = a.domain?.includes('wikipedia') || a.url?.includes('wikipedia');
      const bIsWiki = b.domain?.includes('wikipedia') || b.url?.includes('wikipedia');
      
      if (aIsWiki && !bIsWiki) return 1;
      if (!aIsWiki && bIsWiki) return -1;
      
      // Then sort by source (privacy-focused sources first for diversity)
      const aIsDiverse = ['duckduckgo', 'brave', 'startpage'].includes(a.metadata?.source || '');
      const bIsDiverse = ['duckduckgo', 'brave', 'startpage'].includes(b.metadata?.source || '');
      
      if (aIsDiverse && !bIsDiverse) return -1;
      if (!aIsDiverse && bIsDiverse) return 1;
      
      // Finally sort by relevance
      return (b.relevance || 0) - (a.relevance || 0);
    });
    
    for (const result of sortedResults) {
      // Skip duplicates
      if (seenUrls.has(result.url)) {
        continue;
      }
      
      // Limit results per domain to improve diversity
      const domainCount = seenDomains.get(result.domain) || 0;
      const maxPerDomain = result.domain?.includes('wikipedia') ? 2 : 3; // Less Wikipedia
      
      if (domainCount >= maxPerDomain) {
        continue;
      }
      
      seenUrls.add(result.url);
      seenDomains.set(result.domain, domainCount + 1);
      deduplicatedResults.push(result);
    }
    
    return deduplicatedResults;
  }

}

// Create and export default search API instance
export const searchAPI = new SearchAPI();

// Export individual methods for convenience
export const { 
  search, 
  getSuggestions, 
  checkHealth, 
  getStats 
} = searchAPI;