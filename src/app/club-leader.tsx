import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubLeaderPage() {
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
        <Text className="text-2xl font-bold text-gray-800">Club Leader Dashboard</Text>
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
              <Ionicons name="people-circle" size={48} color="#8B5CF6" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Hello Club Leader!
            </Text>
            <Text className="text-gray-600 text-center">
              Welcome to your club management dashboard. Lead your club activities and manage members.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Club Management</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-purple-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Manage Members</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-blue-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="calendar" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Create Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-green-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="analytics" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Club Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-orange-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="settings" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Club Settings</Text>
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

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
     </SafeAreaView>
   );
 }
