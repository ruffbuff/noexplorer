// Circuit breaker pattern for API endpoints
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeMs: number; // Time to wait before trying to recover
  monitoringPeriodMs: number; // Time window for failure counting
}

export interface EndpointStats {
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private endpoints = new Map<string, EndpointStats>();

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    
    // Cleanup old stats periodically
    setInterval(() => this.cleanupOldStats(), this.config.monitoringPeriodMs);
  }

  // Check if request can be executed
  canExecute(endpoint: string): boolean {
    const stats = this.getEndpointStats(endpoint);
    const now = Date.now();

    switch (stats.state) {
      case 'closed':
        return true;

      case 'open':
        // Check if recovery time has passed
        if (now - stats.lastFailureTime >= this.config.recoveryTimeMs) {
          stats.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return true;
    }
  }

  // Record successful request
  recordSuccess(endpoint: string): void {
    const stats = this.getEndpointStats(endpoint);
    const now = Date.now();

    stats.successes++;
    stats.lastSuccessTime = now;

    // If we were in half-open state and got success, close the circuit
    if (stats.state === 'half-open') {
      stats.state = 'closed';
      stats.failures = 0; // Reset failure count
    }
  }

  // Record failed request
  recordFailure(endpoint: string): void {
    const stats = this.getEndpointStats(endpoint);
    const now = Date.now();

    stats.failures++;
    stats.lastFailureTime = now;

    // Check if we should open the circuit
    if (stats.failures >= this.config.failureThreshold) {
      stats.state = 'open';
    } else if (stats.state === 'half-open') {
      // If we were in half-open and failed, go back to open
      stats.state = 'open';
    }
  }

  // Get stats for endpoint
  private getEndpointStats(endpoint: string): EndpointStats {
    if (!this.endpoints.has(endpoint)) {
      this.endpoints.set(endpoint, {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        state: 'closed',
      });
    }
    return this.endpoints.get(endpoint)!;
  }

  // Clean up old statistics
  private cleanupOldStats(): void {
    const now = Date.now();
    const cutoffTime = now - this.config.monitoringPeriodMs;

    for (const [endpoint, stats] of this.endpoints.entries()) {
      // Reset failure count if last failure was outside monitoring period
      if (stats.lastFailureTime < cutoffTime && stats.state === 'closed') {
        stats.failures = 0;
      }

      // Reset success count periodically
      if (stats.lastSuccessTime < cutoffTime) {
        stats.successes = 0;
      }
    }
  }

  // Get all circuit breaker stats
  getStats() {
    const result: Record<string, EndpointStats> = {};
    
    for (const [endpoint, stats] of this.endpoints.entries()) {
      result[endpoint] = { ...stats };
    }
    
    return result;
  }

  // Reset circuit breaker for endpoint
  reset(endpoint?: string): void {
    if (endpoint) {
      const stats = this.getEndpointStats(endpoint);
      stats.failures = 0;
      stats.successes = 0;
      stats.state = 'closed';
    } else {
      // Reset all endpoints
      this.endpoints.clear();
    }
  }

  // Check if endpoint is available
  isEndpointAvailable(endpoint: string): boolean {
    const stats = this.getEndpointStats(endpoint);
    return stats.state !== 'open';
  }

  // Get failure rate for endpoint
  getFailureRate(endpoint: string): number {
    const stats = this.getEndpointStats(endpoint);
    const total = stats.failures + stats.successes;
    
    if (total === 0) return 0;
    return stats.failures / total;
  }
}