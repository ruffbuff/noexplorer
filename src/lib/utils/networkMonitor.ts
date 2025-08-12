// Network status monitoring utility
export interface NetworkStatus {
  online: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastChecked: Date;
}

export interface NetworkChangeEvent {
  online: boolean;
  previousStatus?: NetworkStatus;
  currentStatus: NetworkStatus;
}

export type NetworkChangeHandler = (event: NetworkChangeEvent) => void;

export class NetworkMonitor {
  private listeners: Set<NetworkChangeHandler> = new Set();
  private currentStatus: NetworkStatus;
  private checkInterval: number | null = null;
  private isMonitoring = false;

  constructor() {
    this.currentStatus = this.getCurrentNetworkStatus();
    this.setupEventListeners();
  }

  // Get current network status
  private getCurrentNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    // Map browser connection types to our defined types
    const mapConnectionType = (type: string): 'wifi' | 'cellular' | 'ethernet' | 'unknown' => {
      if (!type) return 'unknown';
      switch (type.toLowerCase()) {
        case 'wifi':
        case 'bluetooth':
          return 'wifi';
        case 'cellular':
        case '3g':
        case '4g':
        case '5g':
          return 'cellular';
        case 'ethernet':
        case 'wired':
          return 'ethernet';
        default:
          return 'unknown';
      }
    };

    // Map effective types to our defined types
    const mapEffectiveType = (type: string): 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' => {
      if (!type) return 'unknown';
      switch (type) {
        case 'slow-2g':
        case '2g':
        case '3g':
        case '4g':
          return type;
        default:
          return 'unknown';
      }
    };

    return {
      online: navigator.onLine,
      connectionType: mapConnectionType(connection?.type),
      effectiveType: mapEffectiveType(connection?.effectiveType),
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      lastChecked: new Date(),
    };
  }

  // Setup browser event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen to connection changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange);
    }
  }

  // Handle online event
  private handleOnline = (): void => {
    this.updateStatus({ online: true });
  };

  // Handle offline event
  private handleOffline = (): void => {
    this.updateStatus({ online: false });
  };

  // Handle connection change
  private handleConnectionChange = (): void => {
    const newStatus = this.getCurrentNetworkStatus();
    this.updateStatus(newStatus);
  };

  // Update status and notify listeners
  private updateStatus(updates: Partial<NetworkStatus>): void {
    const previousStatus = { ...this.currentStatus };
    this.currentStatus = {
      ...this.currentStatus,
      ...updates,
      lastChecked: new Date(),
    };

    const event: NetworkChangeEvent = {
      online: this.currentStatus.online,
      previousStatus,
      currentStatus: this.currentStatus,
    };

    this.notifyListeners(event);
  }

  // Notify all listeners
  private notifyListeners(event: NetworkChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // Add listener
  addListener(handler: NetworkChangeHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  // Remove listener
  removeListener(handler: NetworkChangeHandler): void {
    this.listeners.delete(handler);
  }

  // Get current status
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  // Check if online
  isOnline(): boolean {
    return this.currentStatus.online;
  }

  // Check if connection is slow
  isSlowConnection(): boolean {
    const status = this.currentStatus;
    
    // Check by effective type
    if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
      return true;
    }

    // Check by RTT and downlink
    if (status.rtt > 500 || (status.downlink > 0 && status.downlink < 0.5)) {
      return true;
    }

    return false;
  }

  // Check if user has data saving enabled
  hasDataSaver(): boolean {
    return this.currentStatus.saveData;
  }

  // Start monitoring with periodic checks
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.checkInterval = window.setInterval(() => {
      this.performConnectivityCheck();
    }, intervalMs);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Perform actual connectivity check
  private async performConnectivityCheck(): Promise<void> {
    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });

      // If we get here, we have some connectivity
      if (!this.currentStatus.online) {
        this.updateStatus({ online: true });
      }
    } catch (error) {
      // Network error - we're probably offline
      if (this.currentStatus.online) {
        this.updateStatus({ online: false });
      }
    }
  }

  // Test connectivity to specific URL
  async testConnectivity(url: string, timeoutMs: number = 5000): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(timeoutMs),
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get connection quality score (0-1)
  getConnectionQuality(): number {
    const status = this.currentStatus;
    
    if (!status.online) return 0;

    let score = 0.5; // Base score for being online

    // Factor in effective type
    switch (status.effectiveType) {
      case '4g':
        score += 0.4;
        break;
      case '3g':
        score += 0.3;
        break;
      case '2g':
        score += 0.1;
        break;
      case 'slow-2g':
        score += 0.05;
        break;
      case 'unknown':
        // No adjustment for unknown
        break;
    }

    // Factor in RTT (round trip time)
    if (status.rtt > 0) {
      if (status.rtt < 50) score += 0.1;
      else if (status.rtt < 100) score += 0.05;
      else if (status.rtt > 500) score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.removeEventListener('change', this.handleConnectionChange);
    }

    this.listeners.clear();
  }
}

// Create and export singleton instance
export const networkMonitor = new NetworkMonitor();

// Export hook for React components
export function useNetworkStatus(): NetworkStatus & { 
  isSlowConnection: boolean; 
  hasDataSaver: boolean; 
  connectionQuality: number; 
} {
  const status = networkMonitor.getStatus();
  
  return {
    ...status,
    isSlowConnection: networkMonitor.isSlowConnection(),
    hasDataSaver: networkMonitor.hasDataSaver(),
    connectionQuality: networkMonitor.getConnectionQuality(),
  };
}