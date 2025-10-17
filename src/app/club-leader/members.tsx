import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubLeaderMembersPage() {
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
        <Text className="text-2xl font-bold text-gray-800">Club Members</Text>
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
            <View className="bg-blue-100 p-6 rounded-full mb-4">
              <Ionicons name="people" size={48} color="#3B82F6" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Club Members
            </Text>
            <Text className="text-gray-600 text-center">
              Manage your club members, view member details, and handle membership requests.
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
              Member management features will be available soon!
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Future Features</Text>
          <View className="space-y-3">
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="people" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">View All Members</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="person-add" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Add Members</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="checkmark-circle" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Approve Requests</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="mail" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Send Notifications</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
