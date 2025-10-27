import { useAuthStore } from '@stores/auth.store';
import { getRoleRoute } from '@utils/roleRouting';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    // Mark as mounted after first render
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Only navigate after component is mounted and loading is complete
    if (!isLoading && isMounted) {
      // Use setTimeout to ensure navigation happens after render cycle
      const timeoutId = setTimeout(() => {
        if (!isAuthenticated && pathname !== '/login') {
          router.replace('/login' as any);
        } else if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
          // Redirect to role-specific page after successful authentication
          const redirectPath = getRoleRoute(user?.role);
          router.replace(redirectPath as any);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading, user?.role, router, pathname, isMounted]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  // Always render children to allow navigation to login screen
  // Add PasswordChangeBanner as fixed overlay at top for all authenticated pages
  // COMMENTED OUT: Hide PasswordChangeBanner for CLUB_LEADER role
  return (
    <View style={{ flex: 1 }}>
      {children}
      {/* {isAuthenticated && pathname !== '/login' && user?.role !== 'CLUB_LEADER' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <PasswordChangeBanner />
        </View>
      )} */}
    </View>
  );
}
