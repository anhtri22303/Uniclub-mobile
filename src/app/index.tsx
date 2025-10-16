import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // This will be handled by AuthWrapper, but having this ensures proper initial routing
    router.replace('/login' as any);
  }, []);

  return null;
}