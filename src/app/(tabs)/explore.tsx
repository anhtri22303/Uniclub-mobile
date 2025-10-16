import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <ScrollView className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-2xl font-bold text-teal-600 mb-2">Explore UniClub</Text>
          <Text className="text-gray-600">
            Discover clubs, events, and connect with your university community.
          </Text>
        </View>

        {/* Clubs Section */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="people" size={24} color="#0D9488" />
            <Text className="text-xl font-semibold text-gray-800 ml-3">Featured Clubs</Text>
          </View>
          
          <View className="space-y-3">
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="font-medium text-gray-800">Computer Science Club</Text>
              <Text className="text-gray-600 text-sm">Join fellow CS students for coding competitions and tech talks.</Text>
            </View>
            
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="font-medium text-gray-800">Photography Society</Text>
              <Text className="text-gray-600 text-sm">Capture moments and share your passion for photography.</Text>
            </View>
            
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="font-medium text-gray-800">Debate Club</Text>
              <Text className="text-gray-600 text-sm">Develop your public speaking and critical thinking skills.</Text>
            </View>
          </View>
        </View>

        {/* Events Section */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar" size={24} color="#0D9488" />
            <Text className="text-xl font-semibold text-gray-800 ml-3">Upcoming Events</Text>
          </View>
          
          <View className="space-y-3">
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="font-medium text-gray-800">Tech Talk: AI in Education</Text>
              <Text className="text-gray-600 text-sm">March 15, 2024 • 2:00 PM • Room 101</Text>
            </View>
            
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="font-medium text-gray-800">Photography Workshop</Text>
              <Text className="text-gray-600 text-sm">March 18, 2024 • 10:00 AM • Art Studio</Text>
            </View>
            
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="font-medium text-gray-800">Debate Tournament</Text>
              <Text className="text-gray-600 text-sm">March 22, 2024 • 1:00 PM • Auditorium</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="bg-white rounded-3xl p-6 shadow-lg">
          <View className="flex-row items-center mb-4">
            <Ionicons name="stats-chart" size={24} color="#0D9488" />
            <Text className="text-xl font-semibold text-gray-800 ml-3">Community Stats</Text>
          </View>
          
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-teal-600">50+</Text>
              <Text className="text-gray-600 text-sm">Active Clubs</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-2xl font-bold text-teal-600">200+</Text>
              <Text className="text-gray-600 text-sm">Members</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-2xl font-bold text-teal-600">15+</Text>
              <Text className="text-gray-600 text-sm">Events This Month</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}