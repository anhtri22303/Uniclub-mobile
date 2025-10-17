import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminPage() {
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
        <Text className="text-2xl font-bold text-gray-800">Admin Dashboard</Text>
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
            <View className="bg-red-100 p-6 rounded-full mb-4">
              <Ionicons name="shield-checkmark" size={48} color="#EF4444" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Hello Admin!
            </Text>
            <Text className="text-gray-600 text-center">
              Welcome to your admin dashboard. Manage the entire system and oversee all operations.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Admin Controls</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-red-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Manage All Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-blue-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="business" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Manage Staff</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-green-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="analytics" size={24} color="white" />
              <Text className="text-white font-medium ml-3">System Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-purple-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="document-text" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Generate Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-orange-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="settings" size={24} color="white" />
              <Text className="text-white font-medium ml-3">System Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-gray-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="server" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Server Management</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Navigation */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Quick Navigation</Text>
          <View className="space-y-3">
            <TouchableOpacity 
              onPress={() => router.push('/admin/users' as any)}
              className="bg-teal-500 rounded-xl p-4 flex-row items-center"
            >
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-medium ml-3">View All Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/admin/clubs' as any)}
              className="bg-blue-500 rounded-xl p-4 flex-row items-center"
            >
              <Ionicons name="business" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Manage Clubs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/profile' as any)}
              className="bg-purple-500 rounded-xl p-4 flex-row items-center"
            >
              <Ionicons name="person" size={24} color="white" />
              <Text className="text-white font-medium ml-3">View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
