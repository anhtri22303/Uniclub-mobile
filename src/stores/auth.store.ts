import { LoginResponse } from '@models/auth/auth.types';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AuthState {
  user: {
    userId: string | number;
    email: string;
    fullName: string;
    role: string;
    staff: boolean;
    clubIds?: number[];
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: AuthState['user']) => void;
  setLoading: (loading: boolean) => void;
  login: (loginResponse: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),

  login: async (loginResponse: LoginResponse) => {
    try {
      // Save token and user data to secure storage
      await SecureStore.setItemAsync('token', loginResponse.token);
      await SecureStore.setItemAsync('user', JSON.stringify(loginResponse));

      // Normalize role based on your backend response format
      const normalizeRole = (role?: string | null) => {
        if (!role) return null;
        const upper = String(role).toUpperCase();
        const map: Record<string, string> = {
          MEMBER: 'student',
          STUDENT: 'student',
          CLUB_MANAGER: 'club_leader',
          'CLUB MANAGER': 'club_leader',
          UNI_ADMIN: 'uni_staff',
          UNIVERSITY_ADMIN: 'uni_staff',
          UNIVERSITY_STAFF: 'uni_staff',
          'UNIVERSITY STAFF': 'uni_staff',
          ADMIN: 'admin',
          STAFF: 'staff',
        };
        return map[upper] || upper.toLowerCase();
      };

      const normalizedRole = normalizeRole(loginResponse.role);

      const user = {
        userId: loginResponse.userId,
        email: loginResponse.email,
        fullName: loginResponse.fullName || loginResponse.email.split('@')[0], // Fallback to email username
        role: normalizedRole || loginResponse.role,
        staff: loginResponse.staff || false,
        clubIds: loginResponse.clubIds,
      };

      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Check if user is already logged in
      const token = await SecureStore.getItemAsync('token');
      const userData = await SecureStore.getItemAsync('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData) as LoginResponse;
          
          // Normalize role
          const normalizeRole = (role?: string | null) => {
            if (!role) return null;
            const lower = String(role).toLowerCase();
            const map: Record<string, string> = {
              member: 'student',
              student: 'student',
              club_manager: 'club_leader',
              'club manager': 'club_leader',
              uni_admin: 'uni_staff',
              university_admin: 'uni_staff',
              university_staff: 'uni_staff',
              'university staff': 'uni_staff',
              admin: 'admin',
              staff: 'staff',
            };
            return map[lower] || lower;
          };

          const normalizedRole = normalizeRole(user.role);

          const normalizedUser = {
            userId: user.userId,
            email: user.email,
            fullName: user.fullName || user.email.split('@')[0], // Fallback to email username
            role: normalizedRole || user.role,
            staff: user.staff || false,
            clubIds: user.clubIds,
          };

          set({ user: normalizedUser, isAuthenticated: true });
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          // Clear invalid data
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
        }
      }
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
