import { ENV } from '@configs/environment';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AuthService from '@services/auth.service';
import * as SecureStore from 'expo-secure-store';

/**
 * Google Authentication Service
 * Handles Google Sign-In flow and token exchange with backend
 * 
 * ⚠️ CURRENTLY DISABLED - Requires Google Console setup
 * See QUICK_START.md for setup instructions
 */
export class GoogleAuthService {
  /**
   * Configure Google Sign-In
   * Should be called once when app starts
   */
  static configure() {
    GoogleSignin.configure({
      webClientId: ENV.GOOGLE_WEB_CLIENT_ID, // Web Client ID from Google Cloud Console
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    console.log('✅ Google Sign-In configured with webClientId:', ENV.GOOGLE_WEB_CLIENT_ID?.substring(0, 30) + '...');
  }

  /**
   * Sign in with Google and authenticate with backend
   * Returns user data from backend
   */
  static async signInWithGoogle() {
    try {
      console.log('🔵 Starting Google Sign-In flow...');

      // 1. Check if device supports Google Play Services (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Google Play Services available');

      // 2. Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo || userInfo.type !== 'success') {
        throw new Error('Google Sign-In was not successful');
      }
      
      console.log('✅ Google Sign-In successful:', userInfo.data.user.email);

      // 3. Get ID Token (JWT) - This is what we send to backend
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error('Failed to get ID token from Google');
      }

      console.log('✅ Got Google ID Token:', idToken.substring(0, 30) + '...');
      console.log('📤 Sending ID Token to backend...');

      // 4. Send ID Token to backend for verification
      const response = await AuthService.loginWithGoogleToken({ token: idToken });

      console.log('📥 Backend response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
      });

      if (response.success && response.data) {
        // 5. Save JWT token to secure storage
        const jwtToken = response.data.token;
        await SecureStore.setItemAsync('token', jwtToken);
        console.log('💾 JWT token saved to secure storage');

        // Transform response to LoginResponse format for auth store
        return {
          token: jwtToken,
          userId: typeof response.data.userId === 'string' 
            ? parseInt(response.data.userId) 
            : response.data.userId || 0,
          email: response.data.email,
          fullName: response.data.fullName,
          role: response.data.role || 'student',
          staff: response.data.staff || false,
          clubIds: response.data.clubIds || [],
        };
      } else {
        throw new Error(response.message || 'Google authentication failed');
      }

    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google Sign-In cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available or outdated');
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        throw new Error('Sign in required');
      }

      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  static async signOut() {
    try {
      await GoogleSignin.signOut();
      await SecureStore.deleteItemAsync('token');
      console.log('🚪 Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Check if user is signed in with Google
   */
  static async isSignedIn(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('token');
      return !!token;
    } catch (error) {
      console.error('Error checking sign in status:', error);
      return false;
    }
  }

  /**
   * Get current signed in user info (from Google, not backend)
   */
  static async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

export default GoogleAuthService;
