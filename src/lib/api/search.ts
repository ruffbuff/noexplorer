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
import { usePrivacySettings } from '@/store/settingsStore';

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
      const { privacy } = usePrivacySettings();
      
      // Use privacy client if privacy features are enabled
      if (privacy.privacyLevel !== 'standard' || 
          privacy.rotateUserAgent || 
          privacy.randomizeRequestTiming || 
          privacy.enableTrafficObfuscation) {
        return privacyClient;
      }
    } catch (error) {
      // Fallback to privacy client if store is unavailable
      return privacyClient;
    }
    
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
      // Use MWMBL as primary search source (others have CORS issues)
      const searchSources = [
        {
          name: 'MWMBL',
          endpoints: [
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
            const client = this.getClient();
            const data = await client.request(endpoint, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                // User-Agent will be handled by privacy client if enabled
              },
              timeout: 8000,
              priority: 'high', // Search requests have high priority
              useQueue: true,
              cache: false, // Don't cache search API responses
            });
            
            // Handle MWMBL response format
            let results = [];
            if (Array.isArray(data)) {
              results = data;
            } else if (data.results && Array.isArray(data.results)) {
              results = data.results;
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
            return value.map(item => extractText(item)).join('').trim();
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
        const title = extractText(result.title || result.name || result.heading) || 'Untitled';
        const url = String(result.url || result.link || '');
        const snippet = extractText(result.extract || result.snippet || result.description || result.content) || '';
        
        // Extract thumbnail image
        const thumbnail = result.image_url || result.thumbnail || result.imageUrl || undefined;
        
        // Extract domain safely
        let domain = 'unknown';
        try {
          if (url && url.startsWith('http')) {
            domain = new URL(url).hostname;
          }
        } catch (e) {
          // Invalid URL
        }
        
        return {
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
      
      // Return empty results instead of mock data
      return {
        results: [],
        totalCount: 0,
        page,
        hasMore: false,
        searchTime: 0,
        suggestions: [],
        query: query.trim(),
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