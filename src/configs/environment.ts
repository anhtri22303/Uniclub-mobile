// Environment configuration
export const ENV = {
  // API URLs
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080',
  
  // Development settings
  IS_DEV: process.env.EXPO_PUBLIC_ENV === 'development',
  
  // Timeout settings
  REQUEST_TIMEOUT: 10000,
} as const;

// You can switch between development and production URLs here
export const API_CONFIG = {
  // Development
  DEVELOPMENT: 'http://localhost:8080',
  
  // Production
  PRODUCTION: 'https://uniclub-qyn9a.ondigitalocean.app/',
  
  // Current active URL
  CURRENT: ENV.API_URL,
} as const;
