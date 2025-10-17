import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StaffPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">Staff Dashboard</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View className="bg-white rounded-3xl p-8 shadow-lg mb-6">
          <View className="items-center">
            <View className="bg-teal-100 p-6 rounded-full mb-4">
              <Ionicons name="briefcase" size={48} color="#0D9488" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Hello Staff!
            </Text>
            <Text className="text-gray-600 text-center">
              Welcome to your staff dashboard. Manage your daily tasks and support operations.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Staff Tools</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-teal-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-medium ml-3">User Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-blue-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="document-text" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Process Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-green-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Approve Requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-purple-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="analytics" size={24} color="white" />
              <Text className="text-white font-medium ml-3">View Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Button */}
        <TouchableOpacity 
          onPress={() => router.push('/profile' as any)}
          className="bg-teal-500 rounded-xl p-4 flex-row items-center justify-center mb-6"
        >
          <Ionicons name="person" size={24} color="white" />
          <Text className="text-white font-medium ml-2">View Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
