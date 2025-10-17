import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentMembersPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">Members</Text>
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
            <View className="bg-green-100 p-6 rounded-full mb-4">
              <Ionicons name="person" size={48} color="#10B981" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Student Members
            </Text>
            <Text className="text-gray-600 text-center">
              Connect with fellow students and discover new friendships through clubs.
            </Text>
          </View>
        </View>

        {/* Coming Soon Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="items-center py-8">
            <View className="bg-orange-100 p-4 rounded-full mb-4">
              <Ionicons name="construct" size={32} color="#F97316" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Coming Soon
            </Text>
            <Text className="text-gray-600 text-center">
              Member discovery and networking features will be available soon!
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Future Features</Text>
          <View className="space-y-3">
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="people" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Find Members</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="chatbubbles" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Member Chat</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="share" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Share Contacts</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="star" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Member Profiles</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
