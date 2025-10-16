import { useAuthStore } from '@stores/auth.store';
import { getRoleRoute } from '@utils/roleRouting';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        // Redirect to role-specific page after successful authentication
        const redirectPath = getRoleRoute(user?.role);
        router.replace(redirectPath);
      }
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
