import { axiosClient } from '@configs/axios';
import {
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
   * Login with email and password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginResponse>('/auth/login', credentials);
    console.log('Login response:', response.data);
    return response.data;
  }

  /**
   * Register new user
   */
  static async signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
    const response = await axiosClient.post<SignUpResponse>('/auth/register', credentials);
    return response.data;
  }

  /**
   * Forgot password
   */
  static async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const request: ForgotPasswordRequest = { email };
    const response = await axiosClient.post<ForgotPasswordResponse>('/auth/forgot-password', request);
    console.log('Forgot password response:', response.data);
    return response.data;
  }

  /**
   * Login with Google token
   */
  static async loginWithGoogleToken(credentials: GoogleLoginRequest): Promise<LoginResponse> {
    try {
      console.log('🚀 Sending Google token to backend:', {
        url: `${axiosClient.defaults.baseURL}/auth/google`,
        tokenLength: credentials.token?.length || 0,
        tokenStart: credentials.token?.substring(0, 20) + '...',
      });

      const response = await axiosClient.post<LoginResponse>('/auth/google', credentials);
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
   * Logout user
   */
  static async logout(): Promise<void> {
    // Clear token from secure storage
    const { deleteItemAsync } = await import('expo-secure-store');
    await deleteItemAsync('token');
    await deleteItemAsync('user');
  }
}

export default AuthService;
