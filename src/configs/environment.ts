// Environment configuration
export const ENV = {
  // API URLs - Production backend URL (NO /api prefix!)
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://uniclub-qyn9a.ondigitalocean.app',
  
  // Development settings
  IS_DEV: process.env.EXPO_PUBLIC_ENV === 'development',
  
  // Timeout settings
  REQUEST_TIMEOUT: 20000, // Increased timeout for network requests
} as const;

// API Configuration reference (for documentation purposes)
export const API_CONFIG = {
  // Production URL - NO /api prefix
  PRODUCTION: 'https://uniclub-qyn9a.ondigitalocean.app',
  
  // Current active URL
  CURRENT: ENV.API_URL,
} as const;
