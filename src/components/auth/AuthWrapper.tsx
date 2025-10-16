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

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.replace('/login' as any);
      } else if (isAuthenticated && pathname === '/login') {
        // Redirect to role-specific page after successful authentication
        const redirectPath = getRoleRoute(user?.role);
        router.replace(redirectPath as any);
      }
    }
  }, [isAuthenticated, isLoading, user?.role, router, pathname]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  // Always render children to allow navigation to login screen
  return <>{children}</>;
}
