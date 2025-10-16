import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">Student Dashboard</Text>
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
              <Ionicons name="school" size={48} color="#3B82F6" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Hello Student!
            </Text>
            <Text className="text-gray-600 text-center">
              Welcome to your student dashboard. Manage your clubs, events, and academic activities.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Quick Actions</Text>
          <View className="space-y-3">
            <TouchableOpacity className="bg-blue-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Join Clubs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-green-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="calendar" size={24} color="white" />
              <Text className="text-white font-medium ml-3">View Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-purple-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="card" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Student Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-orange-500 rounded-xl p-4 flex-row items-center">
              <Ionicons name="trophy" size={24} color="white" />
              <Text className="text-white font-medium ml-3">Achievements</Text>
            </TouchableOpacity>
          </View>
        </View>

         {/* Profile Button */}
         <TouchableOpacity 
           onPress={() => router.push('/profile')}
           className="bg-teal-500 rounded-xl p-4 flex-row items-center justify-center mb-6"
         >
           <Ionicons name="person" size={24} color="white" />
           <Text className="text-white font-medium ml-2">View Profile</Text>
         </TouchableOpacity>
       </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user} />
     </SafeAreaView>
   );
 }
