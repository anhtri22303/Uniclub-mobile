import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentClubsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">Clubs</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View className="bg-white rounded-3xl p-8 shadow-lg mb-6">
          <View className="items-center">
            <View className="bg-blue-100 p-6 rounded-full mb-4">
              <Ionicons name="people" size={48} color="#3B82F6" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Student Clubs
            </Text>
            <Text className="text-gray-600 text-center">
              Discover and join clubs that match your interests and passions.
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
              Club browsing and joining features will be available soon!
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Future Features</Text>
          <View className="space-y-3">
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="search" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Browse All Clubs</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="add-circle" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Join Clubs</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="heart" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Favorite Clubs</Text>
            </View>
            
            <View className="bg-gray-100 rounded-xl p-4 flex-row items-center opacity-60">
              <Ionicons name="calendar" size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium ml-3">Club Events</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
