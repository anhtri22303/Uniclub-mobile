import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../../global.css';

import AuthWrapper from '@components/auth/AuthWrapper';
import { useColorScheme } from '@hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('@assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthWrapper>
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="virtual-card" options={{ headerShown: false }} />
            <Stack.Screen name="student/clubs" options={{ headerShown: false }} />
            <Stack.Screen name="student/members" options={{ headerShown: false }} />
            <Stack.Screen name="student/events" options={{ headerShown: false }} />
            <Stack.Screen name="student/check-in" options={{ headerShown: false }} />
            <Stack.Screen name="student/scan-qr" options={{ headerShown: false }} />
            <Stack.Screen name="student/checkin/[code]" options={{ headerShown: false }} />
            <Stack.Screen name="student/gift" options={{ headerShown: false }} />
            <Stack.Screen name="student/wallet" options={{ headerShown: false }} />
            <Stack.Screen name="student/history" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader/members" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader/application" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader/events" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader/gift" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader/points" options={{ headerShown: false }} />
            <Stack.Screen name="club-leader/attendances" options={{ headerShown: false }} />
            <Stack.Screen name="uni-staff" options={{ headerShown: false }} />
            <Stack.Screen name="uni-staff/clubs" options={{ headerShown: false }} />
            <Stack.Screen name="uni-staff/policies" options={{ headerShown: false }} />
            <Stack.Screen name="uni-staff/club-requests" options={{ headerShown: false }} />
            <Stack.Screen name="uni-staff/event-requests" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="admin/users" options={{ headerShown: false }} />
            <Stack.Screen name="admin/clubs" options={{ headerShown: false }} />
            <Stack.Screen name="admin/events" options={{ headerShown: false }} />
            <Stack.Screen name="staff" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
      </Stack>
      </AuthWrapper>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
