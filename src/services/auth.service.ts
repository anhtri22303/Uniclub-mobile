import { axiosPrivate, axiosPublic } from '@configs/axios';
import {
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GoogleLoginRequest,
    LoginCredentials,
    LoginResponse,
    SignUpCredentials,
    SignUpResponse,
} from '@models/auth/auth.types';

export class AuthService {
  /**
   * Login with email and password - USE axiosPublic (no JWT token)
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axiosPublic.post<LoginResponse>('/auth/login', credentials);
    console.log('Login response:', response.data);
    return response.data;
  }

  /**
   * Register new user - USE axiosPublic (no JWT token)
   */
  static async signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
    const response = await axiosPublic.post<SignUpResponse>('/auth/register', credentials);
    return response.data;
  }

  /**
   * Forgot password - USE axiosPublic (no JWT token)
   */
  static async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const request: ForgotPasswordRequest = { email: normalizedEmail };
      const response = await axiosPublic.post<ForgotPasswordResponse>('/auth/forgot-password', request);
      console.log('Forgot password response:', response.data);
      
      // Handle both wrapped and direct response formats
      if (response.data && typeof response.data === 'object') {
        // If response is wrapped in standard format { success, message, data }
        if ('success' in response.data && 'message' in response.data) {
          return response.data as ForgotPasswordResponse;
        }
        // If response is direct message string or other format
        return {
          success: true,
          message: (response.data as any).message || 'Password reset email sent successfully',
          data: null
        };
      }
      
      // Fallback for unexpected response format
      return {
        success: true,
        message: 'Password reset email sent successfully',
        data: null
      };
    } catch (error: any) {
      console.error('Forgot password error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Reset password with token - USE axiosPublic (no JWT token)
   */
  static async resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<ForgotPasswordResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await axiosPublic.post<ForgotPasswordResponse>('/auth/reset-password', {
        email: normalizedEmail,
        token,
        newPassword
      });
      console.log('Reset password response:', response.data);
      
      // Handle both wrapped and direct response formats
      if (response.data && typeof response.data === 'object') {
        // If response is wrapped in standard format { success, message, data }
        if ('success' in response.data && 'message' in response.data) {
          return response.data as ForgotPasswordResponse;
        }
        // If response is direct message string or other format
        return {
          success: true,
          message: (response.data as any).message || 'Your password has been successfully reset.',
          data: null
        };
      }
      
      // Fallback for unexpected response format
      return {
        success: true,
        message: 'Your password has been successfully reset.',
        data: null
      };
    } catch (error: any) {
      console.error('Reset password error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Login with Google token - USE axiosPublic (no JWT token)
   */
  static async loginWithGoogleToken(credentials: GoogleLoginRequest): Promise<LoginResponse> {
    try {
      console.log('🚀 Sending Google token to backend:', {
        url: `${axiosPublic.defaults.baseURL}/auth/google`,
        tokenLength: credentials.token?.length || 0,
        tokenStart: credentials.token?.substring(0, 20) + '...',
      });

      const response = await axiosPublic.post<LoginResponse>('/auth/google', credentials);
      console.log('✅ Google token login success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error during Google token login:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      throw error;
    }
  }

  /**
   * Change password - USE axiosPrivate (requires JWT token)
   */
  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponse> {
    try {
      const request: ChangePasswordRequest = {
        oldPassword,
        newPassword
      };
      const response = await axiosPrivate.post<ChangePasswordResponse>('/auth/change-password', request);
      console.log('Change password response:', response.data);
      
      // Handle both wrapped and direct response formats
      if (response.data && typeof response.data === 'object') {
        // If response is wrapped in standard format { success, message, data }
        if ('success' in response.data && 'message' in response.data) {
          return response.data as ChangePasswordResponse;
        }
        // If response is direct message string or other format
        return {
          success: true,
          message: (response.data as any).message || 'Password changed successfully. Please re-login.',
          data: null
        };
      }
      
      // Fallback for unexpected response format
      return {
        success: true,
        message: 'Password changed successfully. Please re-login.',
        data: null
      };
    } catch (error: any) {
      console.error('Change password error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    // Clear token from secure storage
    const { deleteItemAsync } = await import('expo-secure-store');
    await deleteItemAsync('token');
    await deleteItemAsync('user');
    await deleteItemAsync('needsPasswordChange');
  }
}

export default AuthService;
