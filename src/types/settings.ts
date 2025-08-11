// Search engine options
export type SearchEngine = 'mwmbl' | 'local' | 'hybrid';

// Language codes
export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'auto';

// Region codes
export type Region = 'global' | 'us' | 'uk' | 'eu' | 'ru' | 'cn' | 'jp' | 'auto';

// Theme options
export type Theme = 'light' | 'dark' | 'system';

// Search settings
export interface SearchSettings {
  engine: SearchEngine;
  resultsPerPage: number;
  safeSearch: boolean;
  language: Language;
  region: Region;
  timeout: number; // in milliseconds
  enableHistory: boolean;
  enableSuggestions: boolean;
}

// Privacy settings
export interface PrivacySettings {
  anonymizeTelemetry: boolean;
  enableCookies: boolean;
  trackSearchAnalytics: boolean;
  shareUsageData: boolean;
}

// UI/Interface settings
export interface InterfaceSettings {
  theme: Theme;
  resultsView: 'list' | 'grid' | 'compact';
  showDomainInfo: boolean;
  showTimestamp: boolean;
  enableAnimations: boolean;
  enableSounds: boolean;
  compactMode: boolean;
}

// Performance settings
export interface PerformanceSettings {
  enableCaching: boolean;
  cacheTimeout: number; // in minutes
  enablePrefetch: boolean;
  maxCacheSize: number; // in MB
  enableVirtualization: boolean;
}

// All settings combined
export interface AppSettings {
  search: SearchSettings;
  privacy: PrivacySettings;
  interface: InterfaceSettings;
  performance: PerformanceSettings;
}

// Settings store state
export interface SettingsState extends AppSettings {
  initialized: boolean;
}

// Settings actions
export interface SettingsActions {
  updateSearchSettings: (settings: Partial<SearchSettings>) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  updateInterfaceSettings: (settings: Partial<InterfaceSettings>) => void;
  updatePerformanceSettings: (settings: Partial<PerformanceSettings>) => void;
  resetToDefaults: () => void;
  exportSettings: () => AppSettings;
  importSettings: (settings: AppSettings) => void;
}

export type SettingsStore = SettingsState & SettingsActions;