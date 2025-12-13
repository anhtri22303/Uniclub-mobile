import { useProfile } from '@contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

/**
 * Hook to protect routes that require club membership
 * Automatically redirects to /student/clubs if user is not in a club
 * Shows a toast message to inform the user
 */
export const useClubMembershipGuard = () => {
  const router = useRouter();
  const { hasClub, isLoading, profile } = useProfile();

  useEffect(() => {
    // Wait for profile to load
    if (isLoading) return;

    // Check if user has club membership
    if (!hasClub) {
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'You need to join a club first',
        position: 'top',
      });
      router.replace('/student/clubs' as any);
    }
  }, [hasClub, isLoading, router, profile]);

  return { hasClub, isLoading };
};

/**
 * Hook to check club membership without redirecting
 * Useful for conditional rendering
 */
export const useClubMembership = () => {
  const { hasClub, isLoading, userClubs, profile } = useProfile();

  return {
    hasClub,
    isLoading,
    userClubs,
    clubCount: userClubs.length,
    firstClub: userClubs[0] || null,
  };
};
