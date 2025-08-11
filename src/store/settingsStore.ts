import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SettingsStore, 
  AppSettings, 
  SearchSettings,
  PrivacySettings,
  InterfaceSettings,
  PerformanceSettings
} from '@/types/settings';

// Default settings
const defaultSettings: AppSettings = {
  search: {
    engine: 'mwmbl',
    resultsPerPage: 10,
    safeSearch: true,
    language: 'auto',
    region: 'auto',
    timeout: 10000, // 10 seconds
    enableHistory: true,
    enableSuggestions: true,
  },
  privacy: {
    // Existing settings
    anonymizeTelemetry: true,
    enableCookies: false,
    trackSearchAnalytics: false,
    shareUsageData: false,
    
    // New anonymity settings
    privacyLevel: 'enhanced',
    useProxy: false,
    proxyType: 'none',
    proxyUrl: undefined,
    rotateUserAgent: true,
    randomizeRequestTiming: true,
    enableFakeQueries: false,
    
    // DNS privacy
    dnsResolver: 'cloudflare',
    customDnsUrl: undefined,
    enableDnsOverHttps: true,
    enableDnsOverTls: false,
    
    // Traffic obfuscation
    enableTrafficObfuscation: true,
    minRequestDelay: 200, // 200ms
    maxRequestDelay: 1000, // 1s
    fakeQueryFrequency: 5, // 5 fake queries per hour
  },
  interface: {
    theme: 'system',
    resultsView: 'list',
    showDomainInfo: true,
    showTimestamp: false,
    enableAnimations: true,
    enableSounds: false,
    compactMode: false,
  },
  performance: {
    enableCaching: true,
    cacheTimeout: 30, // 30 minutes
    enablePrefetch: false,
    maxCacheSize: 50, // 50 MB
    enableVirtualization: true,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      initialized: true,

      // Update search settings
      updateSearchSettings: (newSettings: Partial<SearchSettings>) => {
        set((state) => ({
          search: { ...state.search, ...newSettings }
        }));
      },

      // Update privacy settings
      updatePrivacySettings: (newSettings: Partial<PrivacySettings>) => {
        set((state) => ({
          privacy: { ...state.privacy, ...newSettings }
        }));
      },

      // Update interface settings
      updateInterfaceSettings: (newSettings: Partial<InterfaceSettings>) => {
        set((state) => ({
          interface: { ...state.interface, ...newSettings }
        }));
      },

      // Update performance settings
      updatePerformanceSettings: (newSettings: Partial<PerformanceSettings>) => {
        set((state) => ({
          performance: { ...state.performance, ...newSettings }
        }));
      },

      // Reset all settings to defaults
      resetToDefaults: () => {
        set({ ...defaultSettings, initialized: true });
      },

      // Export current settings
      exportSettings: (): AppSettings => {
        const state = get();
        return {
          search: state.search,
          privacy: state.privacy,
          interface: state.interface,
          performance: state.performance,
        };
      },

      // Import settings
      importSettings: (settings: AppSettings) => {
        set({
          ...settings,
          initialized: true,
        });
      },
    }),
    {
      name: 'astra-settings-store',
      // Don't persist the initialized flag
      partialize: (state) => {
        const { initialized, ...persistedState } = state;
        return persistedState;
      },
    }
  )
);

// Helper hooks for specific setting sections
export const useSearchSettings = () => {
  const search = useSettingsStore((state) => state.search);
  const updateSearchSettings = useSettingsStore((state) => state.updateSearchSettings);
  return { search, updateSearchSettings };
};

export const usePrivacySettings = () => {
  const privacy = useSettingsStore((state) => state.privacy);
  const updatePrivacySettings = useSettingsStore((state) => state.updatePrivacySettings);
  return { privacy, updatePrivacySettings };
};

export const useInterfaceSettings = () => {
  const interface_ = useSettingsStore((state) => state.interface);
  const updateInterfaceSettings = useSettingsStore((state) => state.updateInterfaceSettings);
  return { interface: interface_, updateInterfaceSettings };
};

export const usePerformanceSettings = () => {
  const performance = useSettingsStore((state) => state.performance);
  const updatePerformanceSettings = useSettingsStore((state) => state.updatePerformanceSettings);
  return { performance, updatePerformanceSettings };
};