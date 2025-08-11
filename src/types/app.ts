// Global application state types

// Toast/notification types
export interface Toast {
  id: string;
  title?: string;
  description: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Network status
export interface NetworkStatus {
  online: boolean;
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

// API status
export interface APIStatus {
  mwmbl: 'online' | 'offline' | 'degraded' | 'unknown';
  lastChecked: Date | null;
}

// App state
export interface AppState {
  // Loading states
  initializing: boolean;
  globalLoading: boolean;
  
  // Error state
  globalError: string | null;
  
  // Network & API status
  networkStatus: NetworkStatus;
  apiStatus: APIStatus;
  
  // UI state
  toasts: Toast[];
  sidebarOpen: boolean;
  
  // Feature flags
  features: {
    enableAdvancedSearch: boolean;
    enableVoiceSearch: boolean;
    enableExperimentalFeatures: boolean;
  };
  
  // Analytics (anonymous)
  analytics: {
    sessionId: string;
    startTime: Date;
    searchCount: number;
    clickCount: number;
  };
}

// App actions
export interface AppActions {
  // Loading
  setGlobalLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  
  // Error handling
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  
  // Toast management
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  
  // UI state
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Network & API status
  updateNetworkStatus: (status: Partial<NetworkStatus>) => void;
  updateAPIStatus: (service: keyof APIStatus, status: APIStatus[keyof APIStatus]) => void;
  checkAPIHealth: () => Promise<void>;
  
  // Analytics
  incrementSearchCount: () => void;
  incrementClickCount: () => void;
  resetAnalytics: () => void;
  
  // Feature flags
  toggleFeature: (feature: keyof AppState['features']) => void;
  
  // Initialization
  initialize: () => Promise<void>;
}

export type AppStore = AppState & AppActions;