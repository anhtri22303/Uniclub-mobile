import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { useAuthStore } from '@stores/auth.store';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StaffGiftScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="bg-teal-600 px-6 py-4">
        <Text className="text-white text-2xl font-bold">Staff Gift</Text>
        <Text className="text-teal-100 text-sm mt-1">
          Manage staff gift rewards
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          <View className="bg-white rounded-lg p-6 shadow-sm">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Hello
            </Text>
            <Text className="text-base text-gray-600">
              Staff Gift Page - Content coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Navigation */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
