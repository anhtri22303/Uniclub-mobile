import { LoginResponse } from '@models/auth/auth.types';
import { useAuthStore } from '@stores/auth.store';
import * as SecureStore from 'expo-secure-store';

/**
 * Integration Tests for Authentication Flow
 * These tests simulate the complete user authentication flow from login to logout
 */

// Mock dependencies
jest.mock('@configs/axios');
jest.mock('expo-secure-store');

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('Authentication Flow - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      needsPasswordChange: false,
    });
  });

  describe('Complete Login Flow', () => {
    it('should complete full login flow with student role', async () => {
      // 1. Mock login response
      const mockLoginResponse: LoginResponse = {
        token: 'mock-jwt-token-123',
        userId: 1,
        email: 'student@example.com',
        fullName: 'Test Student',
        role: 'STUDENT',
        staff: false,
      };

      // 2. Mock SecureStore methods
      mockSecureStore.setItemAsync.mockResolvedValue();
      mockSecureStore.getItemAsync.mockResolvedValue('mock-jwt-token-123');

      // 3. Execute login in auth store
      const { login } = useAuthStore.getState();
      await login(mockLoginResponse, 'password123');

      // 4. Verify token was stored
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'token',
        'mock-jwt-token-123'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'user',
        expect.any(String)
      );

      // 5. Verify auth state was updated
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('student@example.com');
      expect(state.user?.role).toBe('student');
    });

    it('should handle club leader login with password change requirement', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'mock-token-456',
        userId: 2,
        email: 'leader@example.com',
        fullName: 'Club Leader',
        role: 'CLUB_MANAGER',
        staff: false,
        clubId: 1,
      };

      mockSecureStore.setItemAsync.mockResolvedValue();

      const { login } = useAuthStore.getState();
      await login(mockLoginResponse, '123');

      const state = useAuthStore.getState();
      expect(state.needsPasswordChange).toBe(true);
      expect(state.user?.role).toBe('club_leader');
      expect(state.user?.clubIds).toEqual([1]);
    });

    it('should handle login with multiple clubs', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'mock-token-789',
        userId: 3,
        email: 'multiclub@example.com',
        fullName: 'Multi Club User',
        role: 'CLUB_MANAGER',
        staff: true,
        clubIds: [1, 2, 3],
      };

      mockSecureStore.setItemAsync.mockResolvedValue();

      const { login } = useAuthStore.getState();
      await login(mockLoginResponse);

      const state = useAuthStore.getState();
      expect(state.user?.clubIds).toEqual([1, 2, 3]);
      expect(state.user?.staff).toBe(true);
    });
  });

  describe('Authentication Persistence', () => {
    it('should restore authentication state from secure storage', async () => {
      const mockStoredUser: LoginResponse = {
        token: 'stored-token',
        userId: 1,
        email: 'stored@example.com',
        fullName: 'Stored User',
        role: 'STUDENT',
        staff: false,
      };

      mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
        if (key === 'token') return 'stored-token';
        if (key === 'user') return JSON.stringify(mockStoredUser);
        return null;
      });

      const { initialize } = useAuthStore.getState();
      await initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('stored@example.com');
    });

    it('should handle missing stored credentials', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const { initialize } = useAuthStore.getState();
      await initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should handle corrupted stored data', async () => {
      mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
        if (key === 'token') return 'token';
        if (key === 'user') return 'invalid-json-{{{';
        return null;
      });

      const { initialize } = useAuthStore.getState();
      await initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    it('should complete full logout flow', async () => {
      // 1. Setup authenticated state
      const mockLoginResponse: LoginResponse = {
        token: 'token-to-clear',
        userId: 1,
        email: 'user@example.com',
        fullName: 'User',
        role: 'STUDENT',
        staff: false,
      };

      mockSecureStore.setItemAsync.mockResolvedValue();
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      const { login, logout } = useAuthStore.getState();
      await login(mockLoginResponse);

      // 2. Verify user is authenticated
      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);

      // 3. Execute logout
      await logout();

      // 4. Verify credentials were cleared
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('needsPasswordChange');

      // 5. Verify state was reset
      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('Role Normalization', () => {
    const testRoleMappings = [
      { input: 'MEMBER', expected: 'student' },
      { input: 'STUDENT', expected: 'student' },
      { input: 'CLUB_MANAGER', expected: 'club_leader' },
      { input: 'CLUB MANAGER', expected: 'club_leader' },
      { input: 'UNI_ADMIN', expected: 'uni_staff' },
      { input: 'UNIVERSITY_ADMIN', expected: 'uni_staff' },
      { input: 'UNIVERSITY_STAFF', expected: 'uni_staff' },
      { input: 'UNIVERSITY STAFF', expected: 'uni_staff' },
      { input: 'STAFF', expected: 'staff' },
    ];

    testRoleMappings.forEach(({ input, expected }) => {
      it(`should normalize role "${input}" to "${expected}"`, async () => {
        const mockLoginResponse: LoginResponse = {
          token: 'token',
          userId: 1,
          email: 'test@example.com',
          fullName: 'Test',
          role: input,
          staff: false,
        };

        mockSecureStore.setItemAsync.mockResolvedValue();

        const { login } = useAuthStore.getState();
        await login(mockLoginResponse);

        const state = useAuthStore.getState();
        expect(state.user?.role).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle SecureStore errors during login', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'token',
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test',
        role: 'STUDENT',
        staff: false,
      };

      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      const { login } = useAuthStore.getState();
      
      await expect(login(mockLoginResponse)).rejects.toThrow('Storage error');
    });
  });

  describe('Password Change Flow', () => {
    it('should detect when password change is needed', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'token',
        userId: 1,
        email: 'leader@example.com',
        fullName: 'Leader',
        role: 'CLUB_MANAGER',
        staff: false,
      };

      mockSecureStore.setItemAsync.mockResolvedValue();

      const { login } = useAuthStore.getState();
      await login(mockLoginResponse, '123');

      const state = useAuthStore.getState();
      expect(state.needsPasswordChange).toBe(true);
    });

    it('should not require password change for non-123 password', async () => {
      const mockLoginResponse: LoginResponse = {
        token: 'token',
        userId: 1,
        email: 'leader@example.com',
        fullName: 'Leader',
        role: 'CLUB_MANAGER',
        staff: false,
      };

      mockSecureStore.setItemAsync.mockResolvedValue();

      const { login } = useAuthStore.getState();
      await login(mockLoginResponse, 'secure-password');

      const state = useAuthStore.getState();
      expect(state.needsPasswordChange).toBe(false);
    });
  });
});
