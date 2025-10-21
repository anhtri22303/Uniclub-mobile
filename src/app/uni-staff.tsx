import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UniStaffPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      
      {/* Sidebar */}
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">University Staff Dashboard</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View className="bg-white rounded-3xl p-8 shadow-lg mb-6">
          <View className="items-center">
            <View className="bg-indigo-100 p-6 rounded-full mb-4">
              <Ionicons name="business" size={48} color="#6366F1" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Hello University Staff!
            </Text>
            <Text className="text-gray-600 text-center">
              Welcome to your university staff dashboard. Supervise all clubs and manage student activities.
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">Personal Information</Text>
            <TouchableOpacity 
              onPress={() => router.push('/profile' as any)}
              className="bg-teal-500 rounded-lg px-4 py-2"
            >
              <Text className="text-white font-medium">Edit</Text>
            </TouchableOpacity>
          </View>
          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="bg-teal-100 p-2 rounded-lg mr-3">
                <Ionicons name="person" size={20} color="#14B8A6" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Name</Text>
                <Text className="text-gray-800 font-medium">
                  {user?.fullName || 'University Staff'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-teal-100 p-2 rounded-lg mr-3">
                <Ionicons name="mail" size={20} color="#14B8A6" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Email</Text>
                <Text className="text-gray-800 font-medium">
                  {user?.email || 'staff@uniclub.com'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-teal-100 p-2 rounded-lg mr-3">
                <Ionicons name="call" size={20} color="#14B8A6" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Phone</Text>
                <Text className="text-gray-800 font-medium">0901000002</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="bg-teal-100 p-2 rounded-lg mr-3">
                <Ionicons name="school" size={20} color="#14B8A6" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Major</Text>
                <Text className="text-gray-800 font-medium">Not provided</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Statistics */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Quick Statistics</Text>
          <View className="space-y-3">
            <View className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Ionicons name="people" size={24} color="white" />
                </View>
                <Text className="text-gray-700 font-medium">Total Users</Text>
              </View>
              <Text className="text-blue-600 font-bold text-xl">1,247</Text>
            </View>
            
            <View className="bg-green-50 rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-green-500 p-2 rounded-lg mr-3">
                  <Ionicons name="calendar" size={24} color="white" />
                </View>
                <Text className="text-gray-700 font-medium">Active Events</Text>
              </View>
              <Text className="text-green-600 font-bold text-xl">89</Text>
            </View>
            
            <View className="bg-purple-50 rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-purple-500 p-2 rounded-lg mr-3">
                  <Ionicons name="document-text" size={24} color="white" />
                </View>
                <Text className="text-gray-700 font-medium">Reports Generated</Text>
              </View>
              <Text className="text-purple-600 font-bold text-xl">156</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Staff Management</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-indigo-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Manage All Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-blue-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Approve Clubs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-green-500 rounded-xl p-4 flex-row items-center">
            <Ionicons name="calendar" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Approve Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-purple-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="document-text" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Generate Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-orange-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="settings" size={24} color="white" />
              <Text className="text-white font-medium ml-3">System Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
       </ScrollView>

       {/* Navigation Bar */}
       <NavigationBar role={user?.role} user={user || undefined} />
     </SafeAreaView>
   );
 }
