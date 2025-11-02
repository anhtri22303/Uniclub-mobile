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
 * Get local URL for check-in with phase and token
 * Phase should be: START, MID, END, or NONE
 */
export const getCheckinUrl = (token: string, phase: string = 'NONE'): string => {
  // Use phase directly - no mapping needed
  // API and mobile both use: START, MID, END, NONE
  const normalizedPhase = phase.toUpperCase();
  const url = getLocalUrl(`student/checkin/${normalizedPhase}/${token}`);
  console.log(`[QR URL] Phase: ${phase}, URL: ${url.substring(0, 80)}...`);
  return url;
};
