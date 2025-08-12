// Helper to get privacy settings without using React hooks in classes

import type { PrivacySettings } from '@/types/settings';

// Get privacy settings from localStorage directly
export function getPrivacySettingsSync(): PrivacySettings {
  const defaultSettings: PrivacySettings = {
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
    minRequestDelay: 200,
    maxRequestDelay: 1000,
    fakeQueryFrequency: 5,
  };

  try {
    // Try to get settings from localStorage
    const storedSettings = localStorage.getItem('astra-settings-store');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed?.state?.privacy) {
        // Merge old settings with new defaults to handle missing fields
        return { ...defaultSettings, ...parsed.state.privacy };
      }
    }
  } catch (error) {
    console.warn('Failed to read privacy settings from localStorage:', error);
  }
  
  // Return default settings if localStorage is not available
  return defaultSettings;
}