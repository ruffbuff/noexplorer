// Traffic obfuscation utilities for enhanced privacy

interface DelayOptions {
  minDelay: number;
  maxDelay: number;
  distributionType?: 'uniform' | 'exponential' | 'normal';
}

interface FakeQueryOptions {
  frequency: number; // queries per hour
  enabled: boolean;
  searchTerms?: string[];
}

// Common search terms for generating realistic fake queries
const FAKE_SEARCH_TERMS = [
  // General topics
  'weather', 'news', 'time', 'recipe', 'movie', 'music', 'sports', 'health',
  'technology', 'science', 'history', 'art', 'books', 'travel', 'food',
  
  // Trending topics (update periodically)
  'artificial intelligence', 'climate change', 'cryptocurrency', 'space exploration',
  'renewable energy', 'electric vehicles', 'quantum computing', 'gene therapy',
  
  // Educational queries
  'how to', 'what is', 'why does', 'when did', 'where is', 'who invented',
  'tutorial', 'guide', 'explanation', 'definition', 'example', 'comparison',
  
  // Shopping/commercial (without personal info)
  'laptop', 'headphones', 'camera', 'smartphone', 'tablet', 'monitor',
  'keyboard', 'mouse', 'chair', 'desk', 'book', 'game', 'software',
  
  // Academic subjects
  'mathematics', 'physics', 'chemistry', 'biology', 'psychology', 'philosophy',
  'literature', 'economics', 'politics', 'sociology', 'anthropology',
  
  // Languages and culture
  'spanish', 'french', 'japanese', 'chinese', 'arabic', 'culture', 'tradition',
  'festival', 'language learning', 'translation', 'pronunciation',
  
  // Hobbies and interests
  'photography', 'cooking', 'gardening', 'fitness', 'yoga', 'meditation',
  'painting', 'drawing', 'writing', 'reading', 'hiking', 'cycling',
];

class TrafficObfuscator {
  private lastRequestTime: number = 0;
  private fakeQueryScheduler: NodeJS.Timeout | null = null;
  private activeDelays: Set<Promise<void>> = new Set();

  constructor() {
    this.setupFakeQueryScheduler();
  }

  /**
   * Add a random delay before making a request
   */
  async addRandomDelay(options: DelayOptions): Promise<void> {
    const delay = this.generateRandomDelay(options);
    
    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const additionalDelay = Math.max(0, delay - timeSinceLastRequest);
    
    if (additionalDelay > 0) {
      const delayPromise = new Promise<void>(resolve => {
        setTimeout(resolve, additionalDelay);
      });
      
      this.activeDelays.add(delayPromise);
      await delayPromise;
      this.activeDelays.delete(delayPromise);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Generate a random delay based on distribution type
   */
  private generateRandomDelay(options: DelayOptions): number {
    const { minDelay, maxDelay, distributionType = 'uniform' } = options;
    
    switch (distributionType) {
      case 'exponential':
        return this.exponentialRandom(minDelay, maxDelay);
      case 'normal':
        return this.normalRandom(minDelay, maxDelay);
      case 'uniform':
      default:
        return Math.random() * (maxDelay - minDelay) + minDelay;
    }
  }

  /**
   * Generate exponential distribution delay (more short delays, fewer long ones)
   */
  private exponentialRandom(min: number, max: number): number {
    const lambda = 2 / (max - min); // rate parameter
    const uniform = Math.random();
    const exponential = -Math.log(1 - uniform) / lambda;
    return Math.min(max, min + exponential);
  }

  /**
   * Generate normal distribution delay (bell curve around middle)
   */
  private normalRandom(min: number, max: number): number {
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6; // 99.7% within range
    
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    const normal = mean + stdDev * z0;
    return Math.max(min, Math.min(max, normal));
  }

  /**
   * Setup automatic fake query generation
   */
  private setupFakeQueryScheduler(): void {
    // Clear existing scheduler
    if (this.fakeQueryScheduler) {
      clearInterval(this.fakeQueryScheduler);
    }

    // Schedule fake queries every 10-20 minutes
    const baseInterval = 15 * 60 * 1000; // 15 minutes
    const randomOffset = Math.random() * 10 * 60 * 1000; // ±5 minutes
    
    this.fakeQueryScheduler = setInterval(() => {
      this.scheduleFakeQuery();
    }, baseInterval + randomOffset);
  }

  /**
   * Generate and execute a fake search query
   */
  private async scheduleFakeQuery(): Promise<void> {
    try {
      const query = this.generateFakeQuery();
      
      // Add random delay before fake query
      await this.addRandomDelay({
        minDelay: 1000,
        maxDelay: 5000,
        distributionType: 'exponential'
      });

      // Execute fake query (don't store results)
      await this.executeFakeQuery(query);
      
    } catch (error) {
      // Silently ignore fake query errors
    }
  }

  /**
   * Generate a realistic fake search query
   */
  private generateFakeQuery(): string {
    const strategies = [
      () => this.getRandomSearchTerm(),
      () => this.generateCompoundQuery(),
      () => this.generateQuestionQuery(),
      () => this.generateComparisonQuery(),
    ];

    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
  }

  /**
   * Get a random search term from the predefined list
   */
  private getRandomSearchTerm(): string {
    return FAKE_SEARCH_TERMS[Math.floor(Math.random() * FAKE_SEARCH_TERMS.length)];
  }

  /**
   * Generate a compound query (two terms)
   */
  private generateCompoundQuery(): string {
    const term1 = this.getRandomSearchTerm();
    const term2 = this.getRandomSearchTerm();
    const connectors = ['and', 'vs', 'or', 'with', 'for'];
    const connector = connectors[Math.floor(Math.random() * connectors.length)];
    return `${term1} ${connector} ${term2}`;
  }

  /**
   * Generate a question-style query
   */
  private generateQuestionQuery(): string {
    const term = this.getRandomSearchTerm();
    const questionWords = ['how to', 'what is', 'why does', 'when did', 'where is'];
    const questionWord = questionWords[Math.floor(Math.random() * questionWords.length)];
    return `${questionWord} ${term}`;
  }

  /**
   * Generate a comparison query
   */
  private generateComparisonQuery(): string {
    const term1 = this.getRandomSearchTerm();
    const term2 = this.getRandomSearchTerm();
    return `${term1} vs ${term2}`;
  }

  /**
   * Execute a fake query (simulate search without storing results)
   */
  private async executeFakeQuery(query: string): Promise<void> {
    // This would normally call the search API, but we just simulate the request
    // to generate network traffic without affecting real search results
    
    const fakeEndpoint = 'https://httpbin.org/delay/1'; // Harmless test endpoint
    
    try {
      await fetch(fakeEndpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; bot)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
    } catch (error) {
      // Ignore errors from fake queries
    }
  }

  /**
   * Configure fake query generation
   */
  configureFakeQueries(options: FakeQueryOptions): void {
    if (options.enabled) {
      this.setupFakeQueryScheduler();
    } else {
      if (this.fakeQueryScheduler) {
        clearInterval(this.fakeQueryScheduler);
        this.fakeQueryScheduler = null;
      }
    }

    // Update search terms if provided
    if (options.searchTerms && options.searchTerms.length > 0) {
      FAKE_SEARCH_TERMS.push(...options.searchTerms);
    }
  }

  /**
   * Add traffic padding to requests (random data to mask real request size)
   */
  addTrafficPadding(data: any): any {
    const paddingSize = Math.floor(Math.random() * 1024) + 256; // 256-1280 bytes
    const padding = 'x'.repeat(paddingSize);
    
    return {
      ...data,
      _padding: padding, // This will be ignored by the server
    };
  }

  /**
   * Generate decoy headers to mask real request patterns
   */
  generateDecoyHeaders(): Record<string, string> {
    const decoyHeaders: Record<string, string> = {};
    
    // Random order of common headers
    const commonHeaders = [
      'X-Forwarded-For',
      'X-Real-IP', 
      'X-Client-IP',
      'CF-Connecting-IP',
    ];

    // Add some random headers with fake values
    if (Math.random() > 0.5) {
      decoyHeaders['X-Custom-Client'] = Math.random().toString(36);
    }
    
    if (Math.random() > 0.7) {
      decoyHeaders['X-Session-ID'] = Math.random().toString(36).substring(2);
    }

    return decoyHeaders;
  }

  /**
   * Clean up all scheduled activities
   */
  destroy(): void {
    if (this.fakeQueryScheduler) {
      clearInterval(this.fakeQueryScheduler);
      this.fakeQueryScheduler = null;
    }
    
    // Cancel any active delays
    this.activeDelays.clear();
  }

  /**
   * Get statistics about traffic obfuscation
   */
  getStats(): {
    fakeQueriesEnabled: boolean;
    activeDelays: number;
    lastRequestTime: number;
  } {
    return {
      fakeQueriesEnabled: this.fakeQueryScheduler !== null,
      activeDelays: this.activeDelays.size,
      lastRequestTime: this.lastRequestTime,
    };
  }
}

// Create singleton instance
export const trafficObfuscator = new TrafficObfuscator();

// Export helper functions
export const addRandomDelay = (options: DelayOptions) => 
  trafficObfuscator.addRandomDelay(options);

export const configureFakeQueries = (options: FakeQueryOptions) =>
  trafficObfuscator.configureFakeQueries(options);

export const addTrafficPadding = (data: any) =>
  trafficObfuscator.addTrafficPadding(data);

export const generateDecoyHeaders = () =>
  trafficObfuscator.generateDecoyHeaders();