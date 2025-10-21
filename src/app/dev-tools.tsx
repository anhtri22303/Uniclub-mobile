import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevToolsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const clearStorage = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      Alert.alert('Success', 'Storage cleared! Please login again.');
      await logout();
      router.replace('/login' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear storage');
      console.error(error);
    }
  };

  const showUserData = () => {
    Alert.alert(
      'User Data',
      JSON.stringify(user, null, 2),
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-6">Dev Tools</Text>
      
      <View className="space-y-4">
        <TouchableOpacity
          onPress={showUserData}
          className="bg-blue-500 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            Show User Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearStorage}
          className="bg-red-500 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            Clear Storage & Logout
          </Text>
        </TouchableOpacity>

        <View className="mt-6 p-4 bg-gray-100 rounded-lg">
          <Text className="font-semibold mb-2">Current User Info:</Text>
          <Text className="text-sm">Email: {user?.email}</Text>
          <Text className="text-sm">Role: {user?.role}</Text>
          <Text className="text-sm">ClubIds: {JSON.stringify(user?.clubIds)}</Text>
          <Text className="text-sm">Staff: {String(user?.staff)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
