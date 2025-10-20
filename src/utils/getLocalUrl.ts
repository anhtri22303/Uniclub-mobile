import Constants from 'expo-constants';

/**
 * Get local development URL for deep linking using Expo's URL
 * Automatically uses the Expo dev server URL
 */
export const getLocalUrl = (path: string): string => {
  // Get Expo's development URL
  const expoUrl = Constants.expoConfig?.hostUri;
  
  if (!expoUrl) {
    // Fallback to localhost if not available
    console.warn('Expo URL not found, using localhost');
    return `exp://localhost:8081/--/${path.startsWith('/') ? path.substring(1) : path}`;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Return Expo deep link URL using the actual expo dev server
  return `exp://${expoUrl}/--/${cleanPath}`;
};

/**
 * Get local URL for check-in with token
 */
export const getCheckinUrl = (token: string): string => {
  return getLocalUrl(`student/checkin/${token}`);
};
