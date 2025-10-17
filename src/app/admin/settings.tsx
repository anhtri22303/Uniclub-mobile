import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminSettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">System Settings</Text>
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center bg-red-500 px-4 py-2 rounded-xl"
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text className="text-white font-medium ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View className="bg-white rounded-3xl p-8 shadow-lg mb-6">
          <View className="items-center">
            <View className="bg-purple-100 p-6 rounded-full mb-4">
              <Ionicons name="settings" size={48} color="#A855F7" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              System Settings
            </Text>
            <Text className="text-gray-600 text-center">
              Configure and manage system-wide settings and preferences.
            </Text>
          </View>
        </View>

        {/* Settings Options */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Configuration</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="notifications" size={24} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-3">Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="lock-closed" size={24} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-3">Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="globe" size={24} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-3">Language & Region</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="server" size={24} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-3">Server Config</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={24} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-3">Permissions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={24} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-3">Analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6 border-2 border-red-200">
          <Text className="text-xl font-bold text-red-600 mb-4">Danger Zone</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-red-50 rounded-xl p-4 flex-row items-center border border-red-200">
              <Ionicons name="trash" size={24} color="#EF4444" />
              <Text className="text-red-600 font-medium ml-3">Clear All Cache</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-red-50 rounded-xl p-4 flex-row items-center border border-red-200">
              <Ionicons name="refresh" size={24} color="#EF4444" />
              <Text className="text-red-600 font-medium ml-3">Reset System</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
