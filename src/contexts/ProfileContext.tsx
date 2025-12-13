import UserService, { UserProfile } from '@services/user.service';
import { useAuthStore } from '@stores/auth.store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  hasClub: boolean;
  userClubs: any[];
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoized refresh function
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const profileData = await UserService.fetchProfile();
      setProfile(profileData);
      // console.log('  Profile refreshed:', profileData);
    } catch (err) {
      console.error('  Failed to refresh profile:', err);
      setError(err as Error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Initial load and auto-refresh on user change
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Optional: Auto-refresh every 30 seconds when app is active
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      console.log(' Auto-refreshing profile...');
      refreshProfile();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshProfile]);

  // Derived states
  const hasClub = (profile?.clubs && profile.clubs.length > 0) || false;
  const userClubs = profile?.clubs || [];

  const value: ProfileContextType = {
    profile,
    isLoading,
    error,
    refreshProfile,
    hasClub,
    userClubs,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
