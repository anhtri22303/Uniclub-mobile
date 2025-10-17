// Environment configuration
export const ENV = {
  // API URLs - IMPORTANT: Backend does NOT have /api prefix!
  // API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://uniclub-qyn9a.ondigitalocean.app/api', // ❌ WRONG
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080', // ✅ For local development
  // API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://uniclub-qyn9a.ondigitalocean.app', // ✅ For production
  
  // Development settings
  IS_DEV: process.env.EXPO_PUBLIC_ENV === 'development',
  
  // Timeout settings
  REQUEST_TIMEOUT: 15000, // Increased timeout for network requests
} as const;

// You can switch between development and production URLs here
export const API_CONFIG = {
  // Development - NO /api prefix
  DEVELOPMENT: 'http://localhost:8080',
  
  // Production - NO /api prefix
  PRODUCTION: 'https://uniclub-qyn9a.ondigitalocean.app',
  
  // Current active URL
  CURRENT: ENV.API_URL,
} as const;
