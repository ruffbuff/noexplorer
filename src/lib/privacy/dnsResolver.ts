// DNS-over-HTTPS resolver for enhanced privacy

interface DoHProvider {
  name: string;
  url: string;
  supportsTLS: boolean;
  location: string;
  privacy: 'high' | 'medium' | 'low';
}

// Popular DNS-over-HTTPS providers
const DOH_PROVIDERS: Record<string, DoHProvider> = {
  cloudflare: {
    name: 'Cloudflare',
    url: 'https://1.1.1.1/dns-query',
    supportsTLS: true,
    location: 'Global',
    privacy: 'high'
  },
  quad9: {
    name: 'Quad9',
    url: 'https://9.9.9.9/dns-query',
    supportsTLS: true,
    location: 'Global',
    privacy: 'high'
  },
  opendns: {
    name: 'OpenDNS',
    url: 'https://doh.opendns.com/dns-query',
    supportsTLS: true,
    location: 'US',
    privacy: 'medium'
  },
  adguard: {
    name: 'AdGuard DNS',
    url: 'https://dns.adguard.com/dns-query',
    supportsTLS: true,
    location: 'Global',
    privacy: 'high'
  },
  mullvad: {
    name: 'Mullvad DNS',
    url: 'https://doh.mullvad.net/dns-query',
    supportsTLS: true,
    location: 'Sweden',
    privacy: 'high'
  },
  nextdns: {
    name: 'NextDNS',
    url: 'https://dns.nextdns.io/',
    supportsTLS: true,
    location: 'Global',
    privacy: 'high'
  }
};

interface DNSResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{
    name: string;
    type: number;
  }>;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

class DNSResolver {
  private activeProvider: DoHProvider;
  private fallbackProviders: DoHProvider[];
  private cache: Map<string, { response: DNSResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(providerId: string = 'cloudflare') {
    this.activeProvider = DOH_PROVIDERS[providerId] || DOH_PROVIDERS.cloudflare;
    this.fallbackProviders = Object.values(DOH_PROVIDERS)
      .filter(provider => provider !== this.activeProvider)
      .sort((a, b) => (b.privacy === 'high' ? 1 : 0) - (a.privacy === 'high' ? 1 : 0));
  }

  /**
   * Resolve domain name to IP addresses using DNS-over-HTTPS
   */
  async resolve(domain: string, type: 'A' | 'AAAA' = 'A'): Promise<string[]> {
    const cacheKey = `${domain}:${type}`;
    
    // Check cache first
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return this.extractIPs(cached);
    }

    // Try active provider first
    try {
      const response = await this.queryProvider(this.activeProvider, domain, type);
      this.setCachedResponse(cacheKey, response);
      return this.extractIPs(response);
    } catch (error) {
      console.warn(`DNS resolution failed with ${this.activeProvider.name}, trying fallbacks`);
    }

    // Try fallback providers
    for (const provider of this.fallbackProviders.slice(0, 3)) { // Try up to 3 fallbacks
      try {
        const response = await this.queryProvider(provider, domain, type);
        this.setCachedResponse(cacheKey, response);
        return this.extractIPs(response);
      } catch (error) {
        console.warn(`DNS fallback failed with ${provider.name}`);
        continue;
      }
    }

    throw new Error(`DNS resolution failed for ${domain} with all providers`);
  }

  /**
   * Query a specific DNS-over-HTTPS provider
   */
  private async queryProvider(provider: DoHProvider, domain: string, type: 'A' | 'AAAA'): Promise<DNSResponse> {
    const typeNum = type === 'A' ? 1 : 28; // A = 1, AAAA = 28
    const url = new URL(provider.url);
    url.searchParams.set('name', domain);
    url.searchParams.set('type', typeNum.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json',
        'User-Agent': 'Mozilla/5.0 (compatible; DNSResolver/1.0)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status} ${response.statusText}`);
    }

    const data: DNSResponse = await response.json();
    
    if (data.Status !== 0) {
      throw new Error(`DNS query error: Status ${data.Status}`);
    }

    return data;
  }

  /**
   * Extract IP addresses from DNS response
   */
  private extractIPs(response: DNSResponse): string[] {
    if (!response.Answer) {
      return [];
    }

    return response.Answer
      .filter(answer => answer.type === 1 || answer.type === 28) // A or AAAA records
      .map(answer => answer.data)
      .filter(ip => this.isValidIP(ip));
  }

  /**
   * Validate IP address format
   */
  private isValidIP(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Get cached DNS response
   */
  private getCachedResponse(key: string): DNSResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache DNS response
   */
  private setCachedResponse(key: string, response: DNSResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Change active DNS provider
   */
  setProvider(providerId: string): void {
    const provider = DOH_PROVIDERS[providerId];
    if (provider) {
      this.activeProvider = provider;
      // Update fallback list
      this.fallbackProviders = Object.values(DOH_PROVIDERS)
        .filter(p => p !== this.activeProvider)
        .sort((a, b) => (b.privacy === 'high' ? 1 : 0) - (a.privacy === 'high' ? 1 : 0));
    }
  }

  /**
   * Set custom DNS provider
   */
  setCustomProvider(url: string, name: string = 'Custom'): void {
    this.activeProvider = {
      name,
      url,
      supportsTLS: url.startsWith('https://'),
      location: 'Unknown',
      privacy: 'medium'
    };
  }

  /**
   * Get available providers
   */
  getProviders(): Record<string, DoHProvider> {
    return { ...DOH_PROVIDERS };
  }

  /**
   * Get current provider info
   */
  getCurrentProvider(): DoHProvider {
    return { ...this.activeProvider };
  }

  /**
   * Test DNS resolution speed for all providers
   */
  async benchmarkProviders(testDomain: string = 'google.com'): Promise<Array<{
    provider: DoHProvider;
    responseTime: number;
    success: boolean;
  }>> {
    const results = [];

    for (const [id, provider] of Object.entries(DOH_PROVIDERS)) {
      const startTime = Date.now();
      try {
        await this.queryProvider(provider, testDomain, 'A');
        const responseTime = Date.now() - startTime;
        results.push({ provider, responseTime, success: true });
      } catch (error) {
        results.push({ 
          provider, 
          responseTime: Date.now() - startTime, 
          success: false 
        });
      }
    }

    return results.sort((a, b) => a.responseTime - b.responseTime);
  }

  /**
   * Clear DNS cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const dnsResolver = new DNSResolver();

// Export helper functions
export const resolveDomain = (domain: string, type?: 'A' | 'AAAA') =>
  dnsResolver.resolve(domain, type);

export const setDNSProvider = (providerId: string) =>
  dnsResolver.setProvider(providerId);

export const setCustomDNSProvider = (url: string, name?: string) =>
  dnsResolver.setCustomProvider(url, name);

export const benchmarkDNSProviders = (testDomain?: string) =>
  dnsResolver.benchmarkProviders(testDomain);

export const getDNSProviders = () =>
  dnsResolver.getProviders();

export const getCurrentDNSProvider = () =>
  dnsResolver.getCurrentProvider();