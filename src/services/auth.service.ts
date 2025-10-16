import { axiosPublic } from '@configs/axios';
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
    const request: ForgotPasswordRequest = { email };
    const response = await axiosPublic.post<ForgotPasswordResponse>('/auth/forgot-password', request);
    console.log('Forgot password response:', response.data);
    return response.data;
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
