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
  needsPasswordChange: boolean;
}

interface AuthActions {
  setUser: (user: AuthState['user']) => void;
  setLoading: (loading: boolean) => void;
  setNeedsPasswordChange: (needsPasswordChange: boolean) => void;
  login: (loginResponse: LoginResponse, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  needsPasswordChange: false,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),

  setNeedsPasswordChange: (needsPasswordChange) => set({ needsPasswordChange }),

  login: async (loginResponse: LoginResponse, password?: string) => {
    try {
      console.log('=== LOGIN RESPONSE ===');
      console.log('Raw login response:', JSON.stringify(loginResponse, null, 2));
      
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

      // Handle both clubId (singular) and clubIds (plural) from backend
      // Some accounts return clubId, others return clubIds
      let normalizedClubIds: number[] | undefined;
      if (loginResponse.clubIds) {
        // If clubIds exists (array), use it directly
        normalizedClubIds = loginResponse.clubIds;
      } else if (loginResponse.clubId !== undefined && loginResponse.clubId !== null) {
        // If clubId exists (single number), convert to array
        normalizedClubIds = [loginResponse.clubId];
      }

      const user = {
        userId: loginResponse.userId,
        email: loginResponse.email,
        fullName: loginResponse.fullName || loginResponse.email.split('@')[0], // Fallback to email username
        role: normalizedRole || loginResponse.role,
        staff: loginResponse.staff || false,
        clubIds: normalizedClubIds, // Normalized to always be an array or undefined
      };

      console.log('Processed user object:', JSON.stringify(user, null, 2));
      console.log('clubIds:', user.clubIds);
      console.log('staff:', user.staff);
      console.log('======================');

      // Check if password is "123" and role is club_leader
      const needsChange = password === '123' && normalizedRole === 'club_leader';
      if (needsChange) {
        await SecureStore.setItemAsync('needsPasswordChange', 'true');
        console.log('⚠️ Password change required for club leader with password "123"');
      } else {
        // Clear the flag if it was set before
        try {
          await SecureStore.deleteItemAsync('needsPasswordChange');
        } catch (e) {
          // Ignore if key doesn't exist
        }
      }

      set({ user, isAuthenticated: true, needsPasswordChange: needsChange });
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
      await SecureStore.deleteItemAsync('needsPasswordChange');
      
      set({ user: null, isAuthenticated: false, needsPasswordChange: false });
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
      const needsPasswordChangeFlag = await SecureStore.getItemAsync('needsPasswordChange');

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

          // Handle both clubId (singular) and clubIds (plural) from stored data
          let normalizedClubIds: number[] | undefined;
          if (user.clubIds) {
            normalizedClubIds = user.clubIds;
          } else if (user.clubId !== undefined && user.clubId !== null) {
            normalizedClubIds = [user.clubId];
          }

          const normalizedUser = {
            userId: user.userId,
            email: user.email,
            fullName: user.fullName || user.email.split('@')[0], // Fallback to email username
            role: normalizedRole || user.role,
            staff: user.staff || false,
            clubIds: normalizedClubIds, // Normalized to always be an array or undefined
          };

          set({ 
            user: normalizedUser, 
            isAuthenticated: true,
            needsPasswordChange: needsPasswordChangeFlag === 'true'
          });
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          // Clear invalid data
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
          await SecureStore.deleteItemAsync('needsPasswordChange');
        }
      }
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
