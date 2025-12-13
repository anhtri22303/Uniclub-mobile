/// <reference types="jest" />

import { axiosPrivate, axiosPublic } from '@configs/axios';
import {
    GoogleLoginRequest,
    LoginCredentials,
    LoginResponse,
    SignUpCredentials,
    SignUpResponse,
} from '@models/auth/auth.types';
import { AuthService } from '@services/auth.service';
import * as SecureStore from 'expo-secure-store';
import { mockAxiosError, mockAxiosResponse } from '../__mocks__/axiosMock';

// Mock axios and expo-secure-store
jest.mock('@configs/axios');
jest.mock('expo-secure-store');

const mockedAxiosPublic = axiosPublic as jest.Mocked<typeof axiosPublic>;
const mockedAxiosPrivate = axiosPrivate as jest.Mocked<typeof axiosPrivate>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse: LoginResponse = {
        token: 'mock-jwt-token',
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'STUDENT',
        staff: false,
      };

      mockedAxiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await AuthService.login(credentials);

      expect(mockedAxiosPublic.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error on invalid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = mockAxiosError('Invalid credentials', 401);
      mockedAxiosPublic.post.mockRejectedValue(mockError);

      await expect(AuthService.login(credentials)).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });
    });

    it('should handle network errors', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockError = {
        message: 'Network Error',
        isAxiosError: true,
      };
      mockedAxiosPublic.post.mockRejectedValue(mockError);

      await expect(AuthService.login(credentials)).rejects.toMatchObject({
        message: 'Network Error',
      });
    });
  });

  describe('signUp', () => {
    it('should successfully register a new user', async () => {
      const credentials: SignUpCredentials = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        phone: '0123456789',
        roleName: 'STUDENT',
        studentCode: 'ST12345',
        majorName: 'Computer Science',
      };

      const mockResponse: SignUpResponse = {
        token: 'new-token',
        userId: 1,
        email: 'newuser@example.com',
        fullName: 'New User',
        role: 'STUDENT',
      };

      mockedAxiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await AuthService.signUp(credentials);

      expect(mockedAxiosPublic.post).toHaveBeenCalledWith('/auth/register', credentials);
      expect(result.token).toBe('new-token');
      expect(result.email).toBe('newuser@example.com');
    });

    it('should throw error on duplicate email', async () => {
      const credentials: SignUpCredentials = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
        phone: '0123456789',
        roleName: 'STUDENT',
        studentCode: 'ST12345',
        majorName: 'Computer Science',
      };

      const mockError = mockAxiosError('Email already exists', 400, {
        message: 'Email already exists',
      });
      mockedAxiosPublic.post.mockRejectedValue(mockError);

      await expect(AuthService.signUp(credentials)).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email', async () => {
      const email = 'test@example.com';

      const mockResponse = {
        success: true,
        message: 'Password reset email sent successfully',
        data: null,
      };

      mockedAxiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await AuthService.forgotPassword(email);

      expect(mockedAxiosPublic.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('reset email sent');
    });

    it('should normalize email before sending', async () => {
      const email = '  Test@Example.COM  ';

      const mockResponse = {
        success: true,
        message: 'Password reset email sent successfully',
        data: null,
      };

      mockedAxiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      await AuthService.forgotPassword(email);

      expect(mockedAxiosPublic.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
    });

    it('should throw error for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      const mockError = mockAxiosError('User not found', 404);
      mockedAxiosPublic.post.mockRejectedValue(mockError);

      await expect(AuthService.forgotPassword(email)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const email = 'test@example.com';
      const token = 'valid-reset-token';
      const newPassword = 'newpassword123';

      const mockResponse = {
        success: true,
        message: 'Your password has been successfully reset.',
        data: null,
      };

      mockedAxiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await AuthService.resetPassword(email, token, newPassword);

      expect(mockedAxiosPublic.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'test@example.com',
        token,
        newPassword,
      });
      expect(result.success).toBe(true);
    });

    it('should throw error with invalid token', async () => {
      const email = 'test@example.com';
      const token = 'invalid-token';
      const newPassword = 'newpassword123';

      const mockError = mockAxiosError('Invalid or expired token', 400);
      mockedAxiosPublic.post.mockRejectedValue(mockError);

      await expect(
        AuthService.resetPassword(email, token, newPassword)
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });
  });

  describe('loginWithGoogleToken', () => {
    it('should successfully login with Google token', async () => {
      const credentials: GoogleLoginRequest = {
        token: 'mock-google-token',
      };

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          token: 'mock-jwt-token',
          userId: 1,
          email: 'test@gmail.com',
          fullName: 'Test User',
          role: 'STUDENT',
          staff: false,
        },
      };

      mockedAxiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await AuthService.loginWithGoogleToken(credentials);

      expect(mockedAxiosPublic.post).toHaveBeenCalledWith('/auth/google', credentials);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw error on invalid Google token', async () => {
      const credentials: GoogleLoginRequest = {
        token: 'invalid-google-token',
      };

      const mockError = mockAxiosError('Invalid Google token', 401);
      mockedAxiosPublic.post.mockRejectedValue(mockError);

      await expect(AuthService.loginWithGoogleToken(credentials)).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword456';

      const mockResponse = {
        success: true,
        message: 'Password changed successfully. Please re-login.',
        data: null,
      };

      mockedAxiosPrivate.post.mockResolvedValue(mockAxiosResponse(mockResponse));

      const result = await AuthService.changePassword(oldPassword, newPassword);

      expect(mockedAxiosPrivate.post).toHaveBeenCalledWith('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      expect(result.success).toBe(true);
    });

    it('should throw error on incorrect old password', async () => {
      const oldPassword = 'wrongoldpassword';
      const newPassword = 'newpassword456';

      const mockError = mockAxiosError('Incorrect old password', 400);
      mockedAxiosPrivate.post.mockRejectedValue(mockError);

      await expect(
        AuthService.changePassword(oldPassword, newPassword)
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });
  });

  describe('logout', () => {
    it('should clear all stored credentials', async () => {
      mockedSecureStore.deleteItemAsync.mockResolvedValue();

      await AuthService.logout();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('needsPasswordChange');
    });
  });
});
