import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppStore, Toast, NetworkStatus, APIStatus } from '@/types/app';
import { networkMonitor, NetworkChangeEvent } from '@/lib/utils/networkMonitor';

// Generate unique session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Initial state
const initialState = {
  // Loading states
  initializing: true,
  globalLoading: false,
  
  // Error state
  globalError: null,
  
  // Network & API status
  networkStatus: networkMonitor.getStatus(),
  apiStatus: {
    mwmbl: 'unknown' as const,
    lastChecked: null,
  },
  
  // UI state
  toasts: [] as Toast[],
  sidebarOpen: false,
  
  // Feature flags
  features: {
    enableAdvancedSearch: true,
    enableVoiceSearch: false,
    enableExperimentalFeatures: false,
  },
  
  // Analytics (anonymous)
  analytics: {
    sessionId: generateSessionId(),
    startTime: new Date(),
    searchCount: 0,
    clickCount: 0,
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Loading states
      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading });
      },

      setInitializing: (initializing: boolean) => {
        set({ initializing });
      },

      // Error handling
      setGlobalError: (error: string | null) => {
        set({ globalError: error });
        
        // Auto-add error toast if error is set
        if (error) {
          get().addToast({
            title: 'Error',
            description: error,
            type: 'error',
            duration: 5000,
          });
        }
      },

      clearGlobalError: () => {
        set({ globalError: null });
      },

      // Toast management
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString();
        const newToast: Toast = {
          id,
          duration: 4000,
          ...toast,
        };
        
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }));

        // Auto-remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }));
      },

      clearAllToasts: () => {
        set({ toasts: [] });
      },

      // UI state
      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      // Network & API status
      updateNetworkStatus: (status: Partial<NetworkStatus>) => {
        set((state) => ({
          networkStatus: { ...state.networkStatus, ...status }
        }));
        
        // Show toast for significant network changes
        const currentStatus = get().networkStatus;
        if (status.online !== undefined && status.online !== currentStatus.online) {
          get().addToast({
            title: status.online ? 'Back Online' : 'Connection Lost',
            description: status.online 
              ? 'Internet connection restored'
              : 'Check your internet connection',
            type: status.online ? 'success' : 'error',
            duration: 3000,
          });
        }
      },

      updateAPIStatus: (service: keyof APIStatus, status: any) => {
        set((state) => ({
          apiStatus: {
            ...state.apiStatus,
            [service]: status,
            lastChecked: new Date(),
          }
        }));
      },

      checkAPIHealth: async () => {
        try {
          // TODO: Implement actual API health check when MWMBL is integrated
          // For now, just simulate a health check
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const isHealthy = Math.random() > 0.1; // 90% success rate simulation
          get().updateAPIStatus('mwmbl', isHealthy ? 'online' : 'degraded');
          
        } catch (error) {
          get().updateAPIStatus('mwmbl', 'offline');
          console.error('API health check failed:', error);
        }
      },

      // Analytics
      incrementSearchCount: () => {
        set((state) => ({
          analytics: {
            ...state.analytics,
            searchCount: state.analytics.searchCount + 1,
          }
        }));
      },

      incrementClickCount: () => {
        set((state) => ({
          analytics: {
            ...state.analytics,
            clickCount: state.analytics.clickCount + 1,
          }
        }));
      },

      resetAnalytics: () => {
        set((state) => ({
          analytics: {
            ...state.analytics,
            sessionId: generateSessionId(),
            startTime: new Date(),
            searchCount: 0,
            clickCount: 0,
          }
        }));
      },

      // Feature flags
      toggleFeature: (feature: keyof typeof initialState.features) => {
        set((state) => ({
          features: {
            ...state.features,
            [feature]: !state.features[feature],
          }
        }));
      },

      // Initialization
      initialize: async () => {
        set({ initializing: true });

        try {
          // Initialize network monitoring
          const handleNetworkChange = (event: NetworkChangeEvent) => {
            get().updateNetworkStatus(event.currentStatus);
          };
          
          networkMonitor.addListener(handleNetworkChange);
          networkMonitor.startMonitoring(30000); // Check every 30 seconds
          
          // Update initial status
          set({ networkStatus: networkMonitor.getStatus() });

          // Check API health on startup
          await get().checkAPIHealth();

          // Mark as initialized
          set({ initializing: false });

        } catch (error) {
          console.error('App initialization failed:', error);
          set({ 
            initializing: false,
            globalError: 'Failed to initialize application'
          });
        }
      },
    }),
    {
      name: 'astra-app-store',
      // Only persist feature flags and some UI state
      partialize: (state) => ({
        features: state.features,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Initialize the app when store is created
useAppStore.getState().initialize();

// Helper hooks for specific parts of app state
export const useToasts = () => {
  const toasts = useAppStore((state) => state.toasts);
  const addToast = useAppStore((state) => state.addToast);
  const removeToast = useAppStore((state) => state.removeToast);
  const clearAllToasts = useAppStore((state) => state.clearAllToasts);
  
  return { toasts, addToast, removeToast, clearAllToasts };
};

export const useNetworkStatus = () => {
  const networkStatus = useAppStore((state) => state.networkStatus);
  const apiStatus = useAppStore((state) => state.apiStatus);
  const checkAPIHealth = useAppStore((state) => state.checkAPIHealth);
  
  // Add extended network info
  const isSlowConnection = networkMonitor.isSlowConnection();
  const hasDataSaver = networkMonitor.hasDataSaver();
  const connectionQuality = networkMonitor.getConnectionQuality();
  
  return { 
    networkStatus, 
    apiStatus, 
    checkAPIHealth,
    isSlowConnection,
    hasDataSaver,
    connectionQuality,
  };
};

export const useFeatures = () => {
  const features = useAppStore((state) => state.features);
  const toggleFeature = useAppStore((state) => state.toggleFeature);
  
  return { features, toggleFeature };
};