// Request queue with rate limiting and exponential backoff
import { CircuitBreaker } from './circuitBreaker';

export interface QueuedRequest<T = unknown> {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
  createdAt: number;
  priority: 'low' | 'normal' | 'high';
}

export interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxConcurrentRequests: number;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private lastRequestTime = 0;
  private requestIntervalMs: number;
  private config: RateLimitConfig;
  private circuitBreaker: CircuitBreaker;
  private processing = false;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequestsPerSecond: 10,
      maxConcurrentRequests: 5,
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      timeoutMs: 15000,
      ...config,
    };

    this.requestIntervalMs = 1000 / this.config.maxRequestsPerSecond;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeMs: 30000,
      monitoringPeriodMs: 60000,
    });

    this.startProcessing();
  }

  // Add request to queue
  async enqueue<T = any>(
    url: string,
    options: RequestInit = {},
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<T> {
    const id = this.generateRequestId();

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id,
        url,
        options: {
          ...options,
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
        resolve,
        reject,
        retryCount: 0,
        createdAt: Date.now(),
        priority,
      };

      // Insert based on priority
      const insertIndex = this.findInsertIndex(priority);
      this.queue.splice(insertIndex, 0, request);

      this.processQueue();
    });
  }

  // Process queue
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.config.maxConcurrentRequests) {
      const request = this.queue.shift();
      if (!request) break;

      // Check if request has expired
      if (Date.now() - request.createdAt > this.config.timeoutMs) {
        request.reject(new Error('Request timeout in queue'));
        continue;
      }

      // Rate limiting - ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.requestIntervalMs) {
        await this.delay(this.requestIntervalMs - timeSinceLastRequest);
      }

      this.executeRequest(request);
    }

    this.processing = false;
  }

  // Execute individual request
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    this.activeRequests++;
    this.lastRequestTime = Date.now();

    try {
      // Check circuit breaker
      if (!this.circuitBreaker.canExecute(request.url)) {
        throw new Error('Circuit breaker is open for this endpoint');
      }

      const response = await fetch(request.url, request.options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Success - record for circuit breaker
      this.circuitBreaker.recordSuccess(request.url);
      request.resolve(data);

    } catch (error) {
      // Record failure for circuit breaker
      this.circuitBreaker.recordFailure(request.url);

      // Handle retries with exponential backoff
      if (request.retryCount < this.config.maxRetries && this.shouldRetry(error as Error)) {
        request.retryCount++;
        
        const delay = Math.min(
          this.config.baseDelayMs * Math.pow(2, request.retryCount - 1),
          this.config.maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        setTimeout(() => {
          this.queue.unshift(request); // Re-add to front of queue
          this.processQueue();
        }, totalDelay);

      } else {
        // Max retries reached or non-retryable error
        request.reject(error as Error);
      }
    } finally {
      this.activeRequests--;
      
      // Continue processing queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 10);
      }
    }
  }

  // Check if error should be retried
  private shouldRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry CORS errors or client errors
    if (message.includes('cors') || 
        message.includes('cross-origin') ||
        message.includes('http 4') ||
        message.includes('forbidden')) {
      return false;
    }
    
    // Retry on network errors, timeouts, and 5xx errors
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('http 5') ||
      message.includes('http 429') // Rate limited
    );
  }

  // Find insertion index based on priority
  private findInsertIndex(priority: 'low' | 'normal' | 'high'): number {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    const requestPriority = priorityOrder[priority];

    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[this.queue[i].priority] < requestPriority) {
        return i;
      }
    }
    return this.queue.length;
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Start processing queue periodically
  private startProcessing(): void {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, 100); // Check every 100ms
  }

  // Get queue statistics
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      circuitBreakerStats: this.circuitBreaker.getStats(),
      config: this.config,
    };
  }

  // Clear queue (for testing or emergency stop)
  clearQueue(): void {
    const remainingRequests = this.queue.splice(0);
    remainingRequests.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
  }
}

// Create default instance
export const requestQueue = new RequestQueue({
  maxRequestsPerSecond: 8, // Conservative rate limiting
  maxConcurrentRequests: 4, // Conservative concurrency
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 15000,
});