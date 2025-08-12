// User Agent rotation utilities for anonymity

// Popular browser user agents for rotation
const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
  
  // Firefox on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Firefox on Linux  
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  
  // Mobile Chrome on Android
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
  
  // Safari on iOS
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

// Privacy-focused browser user agents
const PRIVACY_USER_AGENTS = [
  // Tor Browser
  'Mozilla/5.0 (Windows NT 10.0; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  
  // Brave (looks like Chrome)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // DuckDuckGo Browser
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

class UserAgentRotator {
  private lastUserAgent: string = '';
  private usageHistory: Map<string, number> = new Map();
  
  constructor() {
    this.resetHistory();
  }

  /**
   * Get a random user agent different from the last used one
   */
  getRandomUserAgent(privacyMode: boolean = false): string {
    const agents = privacyMode ? PRIVACY_USER_AGENTS : USER_AGENTS;
    
    // Filter out the last used agent to ensure rotation
    const availableAgents = agents.filter(agent => agent !== this.lastUserAgent);
    
    if (availableAgents.length === 0) {
      // Fallback if all agents were used
      this.resetHistory();
      return agents[Math.floor(Math.random() * agents.length)];
    }
    
    // Select random agent with weighted preference for less-used agents
    const selectedAgent = this.selectWeightedRandom(availableAgents);
    
    // Update usage tracking
    this.lastUserAgent = selectedAgent;
    this.usageHistory.set(selectedAgent, (this.usageHistory.get(selectedAgent) || 0) + 1);
    
    return selectedAgent;
  }

  /**
   * Get a user agent that matches a specific browser type
   */
  getUserAgentByBrowser(browser: 'chrome' | 'firefox' | 'safari' | 'edge'): string {
    const browserAgents = USER_AGENTS.filter(agent => {
      switch (browser) {
        case 'chrome':
          return agent.includes('Chrome') && !agent.includes('Edg');
        case 'firefox':
          return agent.includes('Firefox');
        case 'safari':
          return agent.includes('Safari') && !agent.includes('Chrome');
        case 'edge':
          return agent.includes('Edg');
        default:
          return false;
      }
    });

    if (browserAgents.length === 0) {
      return this.getRandomUserAgent();
    }

    return browserAgents[Math.floor(Math.random() * browserAgents.length)];
  }

  /**
   * Get a mobile user agent
   */
  getMobileUserAgent(): string {
    const mobileAgents = USER_AGENTS.filter(agent => 
      agent.includes('Mobile') || agent.includes('Android') || agent.includes('iPhone') || agent.includes('iPad')
    );
    
    if (mobileAgents.length === 0) {
      return this.getRandomUserAgent();
    }
    
    return mobileAgents[Math.floor(Math.random() * mobileAgents.length)];
  }

  /**
   * Select a user agent with weighted randomness (prefer less-used agents)
   */
  private selectWeightedRandom(agents: string[]): string {
    // Calculate weights (inverse of usage count)
    const weights = agents.map(agent => {
      const usage = this.usageHistory.get(agent) || 0;
      return Math.max(1, 10 - usage); // Higher weight for less-used agents
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < agents.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return agents[i];
      }
    }

    // Fallback
    return agents[agents.length - 1];
  }

  /**
   * Reset usage history (call periodically to avoid patterns)
   */
  private resetHistory(): void {
    this.usageHistory.clear();
  }

  /**
   * Get statistics about user agent usage
   */
  getUsageStats(): { agent: string; count: number }[] {
    return Array.from(this.usageHistory.entries())
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate additional headers that match the user agent (API-safe version)
   */
  generateMatchingHeaders(userAgent: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      // Removed problematic headers for API requests:
      // - 'Connection': 'keep-alive' (handled by fetch)
      // - 'Upgrade-Insecure-Requests': '1' (causes CORS issues)
    };

    // Browser-specific modifications (disabled for API requests to avoid CORS issues)
    // Sec-* headers cause CORS preflight failures with many APIs
    // if (userAgent.includes('Chrome')) {
    //   headers['Sec-CH-UA'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    //   headers['Sec-CH-UA-Mobile'] = userAgent.includes('Mobile') ? '?1' : '?0';
    //   headers['Sec-CH-UA-Platform'] = this.getPlatformFromUserAgent(userAgent);
    //   headers['Sec-Fetch-Site'] = 'none';
    //   headers['Sec-Fetch-Mode'] = 'navigate';
    //   headers['Sec-Fetch-User'] = '?1';
    //   headers['Sec-Fetch-Dest'] = 'document';
    // }

    return headers;
  }

  /**
   * Extract platform information from user agent for Sec-CH-UA-Platform
   */
  private getPlatformFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Windows')) return '"Windows"';
    if (userAgent.includes('Macintosh')) return '"macOS"';
    if (userAgent.includes('Linux')) return '"Linux"';
    if (userAgent.includes('Android')) return '"Android"';
    return '"Unknown"';
  }
}

// Create singleton instance
export const userAgentRotator = new UserAgentRotator();

// Export helper functions
export const getRandomUserAgent = (privacyMode?: boolean) => 
  userAgentRotator.getRandomUserAgent(privacyMode);

export const getUserAgentByBrowser = (browser: 'chrome' | 'firefox' | 'safari' | 'edge') =>
  userAgentRotator.getUserAgentByBrowser(browser);

export const getMobileUserAgent = () => 
  userAgentRotator.getMobileUserAgent();

export const generateMatchingHeaders = (userAgent: string) =>
  userAgentRotator.generateMatchingHeaders(userAgent);