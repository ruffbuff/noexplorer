// Main store index - exports all stores and their hooks
export { useSearchStore } from './searchStore';
export { 
  useSettingsStore,
  useSearchSettings,
  usePrivacySettings,
  useInterfaceSettings,
  usePerformanceSettings
} from './settingsStore';
export { 
  useAppStore,
  useToasts,
  useNetworkStatus,
  useFeatures
} from './appStore';

// Re-export types for convenience
export type { SearchStore } from '@/types/search';
export type { SettingsStore } from '@/types/settings';
export type { AppStore } from '@/types/app';