import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <ScrollView className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-2xl font-bold text-teal-600 mb-2">Welcome to UniClub!</Text>
          <Text className="text-gray-600 mb-4">
            Hello, {user?.fullName || 'User'}! You are logged in as {user?.role || 'member'}.
          </Text>
          
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-xl py-3 flex-row items-center justify-center shadow-md"
          >
            <Ionicons name="log-out" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-semibold text-gray-800 mb-4">Your Profile</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <Ionicons name="person" size={20} color="#0D9488" />
              <Text className="text-gray-700 ml-3">Name: {user?.fullName}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="mail" size={20} color="#0D9488" />
              <Text className="text-gray-700 ml-3">Email: {user?.email}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="shield" size={20} color="#0D9488" />
              <Text className="text-gray-700 ml-3">Role: {user?.role}</Text>
            </View>
            
            {user?.staff && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text className="text-gray-700 ml-3">Staff Member</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg">
          <Text className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="space-y-3">
            <TouchableOpacity className="bg-teal-500 rounded-xl py-4 flex-row items-center justify-center">
              <Ionicons name="people" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Join Clubs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-medium ml-2">View Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-purple-500 rounded-xl py-4 flex-row items-center justify-center">
              <Ionicons name="settings" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}