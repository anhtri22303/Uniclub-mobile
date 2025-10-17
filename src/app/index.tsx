import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  // AuthWrapper will handle the navigation
  // Just show a loading indicator while it determines where to go
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
      <ActivityIndicator size="large" color="#0D9488" />
    </View>
  );
}